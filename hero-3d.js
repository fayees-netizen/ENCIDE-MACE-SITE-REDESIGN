import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/*
  Animated3DScene
  ----------------
  Vanilla Three.js/WebGL port of the reference React Three Fiber hero visual
  (Canvas + Scene + PostProcessing components, WebGPU/TSL in the source).
  Faithful to the reference's actual math, not just its general shape:
    - PerspectiveCamera (fov 45, z=5) with a plane sized to the visible
      frustum (like the reference's useAspect(300,300) * 0.6 scale) instead
      of a flat fullscreen ortho quad, so the plane can tilt in real 3D.
    - Mesh rotates toward the pointer (rotation.y/x lerp), matching the
      reference's meshRef rotation follow.
    - Fragment shader reproduces the reference's colorNode graph exactly:
      depth-driven pointer-parallax UV distortion (strength 0.045), a
      period-2 tiled dot grid masked by hash-based cell noise, a depth-vs-
      progress "flow" reveal band, and a luminance-only red map screen-
      blended with that mask (the reference outputs a red/black image, not
      the raw color texture).
    - UnrealBloomPass stands in for the reference's TSL bloom node.
  Only mounts into #hero3DCanvas inside #hero3DWrap — does not touch any
  other part of the Hero (nav, headline, copy, CTAs, stats, floating
  language chips, background, GSAP reveals all remain exactly as they were).
*/
(() => {
  const wrap = document.getElementById('hero3DWrap');
  const canvas = document.getElementById('hero3DCanvas');
  if (!wrap || !canvas) return;

  const TEXTURE_URL = 'https://i.postimg.cc/XYwvXN8D/img-4.png';
  const DEPTH_URL = 'https://i.postimg.cc/2SHKQh2q/raw-4.webp';

  // Matches the reference's WIDTH/HEIGHT = 300, 300 used for useAspect() and
  // the shader's internal "aspect" (300/300 = 1) — kept as named constants
  // rather than derived from the actual image files, exactly as the source does.
  const IMAGE_ASPECT = 300 / 300;
  const DISTORT_STRENGTH = 0.045;
  const PLANE_SCALE = 0.6;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = /* glsl */ `
    precision highp float;
    uniform sampler2D uColorMap;
    uniform sampler2D uDepthMap;
    uniform vec2 uPointer;
    uniform float uProgress;
    uniform float uOpacity;
    varying vec2 vUv;

    const float uAspect = ${IMAGE_ASPECT.toFixed(6)};
    const float uStrength = ${DISTORT_STRENGTH};

    /* stand-in for TSL's mx_cell_noise_float: hash of a cell coordinate */
    float hash21(vec2 p){
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main(){
      vec2 uv = vUv;

      /* pointer-reactive parallax, sampled through the depth map */
      float depthForPointer = texture2D(uDepthMap, uv).r;
      vec2 distortedUv = uv + depthForPointer * uPointer * uStrength;
      vec4 colorTex = texture2D(uColorMap, distortedUv);

      /* period-2 tiled dot grid (mod, not fract, so the period matches
         the reference's mod(tUv*tiling, 2.0) exactly) */
      vec2 tUv = vec2(uv.x * uAspect, uv.y);
      vec2 tiling = vec2(120.0);
      vec2 scaledUv = tUv * tiling;
      vec2 tiledUv = mod(scaledUv, 2.0) - 1.0;
      vec2 cellId = floor(scaledUv / 2.0);
      float brightness = hash21(cellId);

      float dist = length(tiledUv);
      float dotShape = smoothstep(0.5, 0.49, dist) * brightness;

      /* depth-vs-progress reveal band */
      float depth = texture2D(uDepthMap, uv).r;
      float flow = 1.0 - smoothstep(0.0, 0.02, abs(depth - uProgress));

      vec3 mask = vec3(dotShape * flow * 10.0, 0.0, 0.0);

      /* the reference does NOT screen the raw color texture — it converts
         the (already parallax-distorted) sample to luminance, tints it red,
         then screens that against the mask. This is what gives the
         reference its red/black look rather than a full-color image. */
      float lum = dot(colorTex.rgb, vec3(0.299, 0.587, 0.114));
      vec3 redMap = vec3(lum, 0.0, 0.0);

      vec3 finalColor = 1.0 - (1.0 - redMap) * (1.0 - mask);

      gl_FragColor = vec4(finalColor, colorTex.a * uOpacity);
    }
  `;

  let renderer, composer, scene, camera, mesh, bloomPass;
  let uniforms;
  let rafId = null;
  let isVisible = true;
  let ready = false;
  let disposed = false;
  let lastTime = 0;

  const pointerTarget = new THREE.Vector2(0, 0);
  const pointerCurrent = new THREE.Vector2(0, 0);

  function planeDimsAtZ0() {
    // Frustum size at the mesh's depth (z=0), camera at z=5 — mirrors the
    // reference's useAspect(WIDTH, HEIGHT) * 0.6 sizing so the plane is a
    // little smaller than the full view, leaving room for it to tilt.
    const dist = camera.position.z;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const height = 2 * Math.tan(vFov / 2) * dist;
    const width = height * camera.aspect;
    // Cover-fit a 1:1 image (IMAGE_ASPECT) into the (width x height) frustum.
    let planeW, planeH;
    if (camera.aspect > IMAGE_ASPECT) {
      planeW = width;
      planeH = width / IMAGE_ASPECT;
    } else {
      planeH = height;
      planeW = height * IMAGE_ASPECT;
    }
    return { w: Math.min(planeW, width) * PLANE_SCALE, h: Math.min(planeH, height) * PLANE_SCALE };
  }

  function init(colorTex, depthTex) {
    if (disposed) return;

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5);

    colorTex.colorSpace = THREE.SRGBColorSpace;
    colorTex.minFilter = THREE.LinearFilter;
    colorTex.magFilter = THREE.LinearFilter;
    depthTex.minFilter = THREE.LinearFilter;
    depthTex.magFilter = THREE.LinearFilter;

    uniforms = {
      uColorMap: { value: colorTex },
      uDepthMap: { value: depthTex },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uProgress: { value: 0.5 },
      uOpacity: { value: 0 },
    };

    const { w, h } = planeDimsAtZ0();
    const geometry = new THREE.PlaneGeometry(w, h);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.0, 0.5, 1.0);
    composer.addPass(bloomPass);

    resize();
    ready = true;

    if (reducedMotion) {
      uniforms.uOpacity.value = 1;
      uniforms.uProgress.value = 0.5;
      renderSafe();
    } else {
      startLoop();
    }
  }

  function resize() {
    if (!renderer) return;
    const w = Math.max(1, wrap.clientWidth);
    const h = Math.max(1, wrap.clientHeight);
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloomPass.resolution.set(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (mesh) {
      const dims = planeDimsAtZ0();
      mesh.geometry.dispose();
      mesh.geometry = new THREE.PlaneGeometry(dims.w, dims.h);
    }
  }

  function renderSafe() {
    try {
      composer.render();
    } catch (err) {
      /* If the source images can't be read cross-origin, fail quietly and
         stop the loop rather than spamming errors — the wrap's ambient
         gradient background remains as a graceful fallback. */
      console.warn('Hero 3D scene render error, stopping.', err);
      stopLoop();
    }
  }

  function startLoop() {
    if (rafId !== null) return;
    const tick = (t) => {
      rafId = requestAnimationFrame(tick);
      if (!isVisible || document.hidden) return;

      const delta = lastTime ? Math.min(0.1, (t - lastTime) / 1000) : 0.016;
      lastTime = t;
      const lerpT = Math.min(1, delta * 6);

      const progress = Math.sin(t * 0.0005) * 0.5 + 0.5;
      uniforms.uProgress.value = progress;

      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * lerpT;
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * lerpT;
      uniforms.uPointer.value.copy(pointerCurrent);

      if (mesh) {
        mesh.rotation.y += (pointerCurrent.x * 0.18 - mesh.rotation.y) * lerpT;
        mesh.rotation.x += (-pointerCurrent.y * 0.12 - mesh.rotation.x) * lerpT;
      }

      uniforms.uOpacity.value = THREE.MathUtils.lerp(uniforms.uOpacity.value, 1, 0.07);

      renderSafe();
    };
    rafId = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTime = 0;
  }

  /* Pointer tracking (mouse + touch), normalized to the wrap element, -1..1 */
  function updatePointerFromEvent(clientX, clientY) {
    const r = wrap.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * 2 - 1;
    const y = -(((clientY - r.top) / r.height) * 2 - 1);
    pointerTarget.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1));
  }
  if (!reducedMotion) {
    window.addEventListener('pointermove', (e) => updatePointerFromEvent(e.clientX, e.clientY), { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) updatePointerFromEvent(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
  }

  /* Pause rendering when off-screen or tab hidden, resume when back — keeps this light */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      isVisible = entry.isIntersecting;
      if (isVisible && ready && !reducedMotion) startLoop();
    });
  }, { threshold: 0.05 });
  io.observe(wrap);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ready && isVisible && !reducedMotion) startLoop();
  });

  let resizeTimer = null;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 80);
  });
  ro.observe(wrap);

  /* Load texture + depth map, then boot the scene. Fails quietly (leaving the
     ambient gradient background) if the assets can't be fetched. */
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  Promise.all([
    new Promise((res, rej) => loader.load(TEXTURE_URL, res, undefined, rej)),
    new Promise((res, rej) => loader.load(DEPTH_URL, res, undefined, rej)),
  ])
    .then(([colorTex, depthTex]) => init(colorTex, depthTex))
    .catch((err) => {
      console.warn('Hero 3D scene assets failed to load, falling back to ambient background.', err);
    });
})();
