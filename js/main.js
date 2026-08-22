/*
 * ENCIDE MACE — core site script.
 * Depends on: js/team-data.js (must load first, defines window.TEAM_DATA),
 * GSAP + ScrollTrigger (loaded via CDN <script> tags in index.html).
 */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Nav scroll state */
  const nav = document.getElementById('site-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  /* Mobile menu */
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  menuBtn.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('hidden') === false;
    menuBtn.setAttribute('aria-expanded', open);
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));

  /* Active nav link on scroll */
  const sections = ['home', 'about', 'events', 'team', 'testimonials', 'contact'].map(id => document.getElementById(id)).filter(Boolean);
  const navLinks = document.querySelectorAll('.nav-link');
  const dockLinks = document.querySelectorAll('.dock-item');
  const setActive = () => {
    let current = sections[0].id;
    sections.forEach(sec => {
      if (window.scrollY + 140 >= sec.offsetTop) current = sec.id;
    });
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
    dockLinks.forEach(l => {
      const isActive = l.getAttribute('href') === '#' + current;
      l.classList.toggle('active', isActive);
      if (isActive) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', setActive);
  setActive();

  /* Login modal */
  const loginModal = document.getElementById('loginModal');
  const loginTrigger = document.getElementById('loginTrigger');
  const loginTriggerMobile = document.getElementById('loginTriggerMobile');
  const loginModalClose = document.getElementById('loginModalClose');
  const loginModalOverlay = document.getElementById('loginModalOverlay');
  const loginEmail = document.getElementById('login-email');
  let loginLastFocused = null;

  function openLoginModal() {
    loginLastFocused = document.activeElement;
    loginModal.classList.remove('hidden');
    loginModal.classList.add('open');
    if (loginEmail) loginEmail.focus();
    document.addEventListener('keydown', onLoginModalKeydown);
  }
  function closeLoginModal() {
    loginModal.classList.remove('open');
    loginModal.classList.add('hidden');
    document.removeEventListener('keydown', onLoginModalKeydown);
    if (loginLastFocused) loginLastFocused.focus();
  }
  function onLoginModalKeydown(e) {
    if (e.key === 'Escape') closeLoginModal();
  }

  [loginTrigger, loginTriggerMobile].forEach(btn => {
    if (btn) btn.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      menuBtn.setAttribute('aria-expanded', 'false');
      openLoginModal();
    });
  });
  if (loginModalClose) loginModalClose.addEventListener('click', closeLoginModal);
  if (loginModalOverlay) loginModalOverlay.addEventListener('click', closeLoginModal);

  const loginPasswordToggle = document.getElementById('loginPasswordToggle');
  const loginPasswordInput = document.getElementById('login-password');
  if (loginPasswordToggle && loginPasswordInput) {
    loginPasswordToggle.addEventListener('click', () => {
      const isPw = loginPasswordInput.type === 'password';
      loginPasswordInput.type = isPw ? 'text' : 'password';
      loginPasswordToggle.setAttribute('aria-label', isPw ? 'Hide password' : 'Show password');
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', (e) => e.preventDefault());

  const loginSignupLink = document.getElementById('loginSignupLink');
  if (loginSignupLink) loginSignupLink.addEventListener('click', closeLoginModal);

  /* FAQ accordion */
  document.querySelectorAll('.faq-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });

  /* Dock magnify-on-hover (macOS style) + keyboard access */
  if (!reduced) {
    dockLinks.forEach(item => {
      item.addEventListener('mousemove', (e) => {
        const r = item.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        item.style.transform = `translateY(${-4 * (1 - Math.abs(dx))}px) scale(${1 + 0.12 * (1 - Math.abs(dx))})`;
      });
      item.addEventListener('mouseleave', () => { item.style.transform = ''; });
    });
  }

  /* ---------- GSAP cinematic scroll-animation system ---------- */
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const revealEls = document.querySelectorAll('.reveal');

  function initGenericSectionReveals() {
    /* Generic reveal: fade + slide, staggered by section, replaces the old IO-based .reveal system.
       Runs after dynamic content (team cards, testimonial slides) has been injected. */
    document.querySelectorAll('main section, footer').forEach(section => {
      const items = section.querySelectorAll('.reveal:not([data-gsap-done])');
      if (!items.length) return;
      items.forEach(el => el.setAttribute('data-gsap-done', '1'));
      gsap.fromTo(items,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: section, start: 'top 82%' }
        }
      );
    });
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }

  if (reduced || !hasGsap) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    gsap.registerPlugin(ScrollTrigger);

    /* Hero content is NOT part of the generic .reveal system (it's above the fold and
       animates on load, not on scroll) — no exclusion bookkeeping needed here. */
    initGenericSectionReveals();

    /* Hero: staggered entrance on load (not scroll-gated) */
    gsap.fromTo(['.encide-wordmark--sm', '#heroHeadline', '#heroPara', '#heroCtas', '#heroStats'],
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.15 }
    );
    /* Headline: word-by-word reveal */
    gsap.fromTo('#heroHeadline .word-reveal',
      { opacity: 0, y: '0.6em' },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.12, delay: 0.55 }
    );
    gsap.fromTo('#heroVisual',
      { opacity: 0, y: 30, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out', delay: 0.4 }
    );

    /* Hero background parallax on scroll (in addition to mousemove) */
    gsap.to('#heroMesh', {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: true }
    });

    /* About: image collage subtle parallax */
    gsap.to('#about .grid.grid-cols-3', {
      yPercent: -6,
      ease: 'none',
      scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    /* Events + Team + Testimonials: card scale-in stagger (layered on top of generic reveal) */
    gsap.from('#events .glass.rounded-2xl', {
      opacity: 0, scale: 0.96, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '#events', start: 'top 80%' }
    });

    /* Footer: cinematic entrance */
    gsap.from('footer .grid > div', {
      opacity: 0, y: 24, duration: 0.8, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: 'footer', start: 'top 88%' }
    });
  }

  /* Hero parallax mesh (mouse) + language chip drift */
  const mesh = document.getElementById('heroMesh');
  const heroVisual = document.getElementById('heroVisual');
  if (heroVisual) heroVisual.style.perspective = '1000px';
  if (!reduced) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      mesh.style.backgroundPosition = `${x}px ${y}px`;
    });
  }

  /* Magnetic buttons */
  if (!reduced) {
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0,0)'; });
    });
  }

  /* Animated counters */
  const counters = document.querySelectorAll('.counter');
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const dur = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(step);
    };
    if (reduced) { el.textContent = target; } else { requestAnimationFrame(step); }
  };
  const cIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { animateCounter(entry.target); cIo.unobserve(entry.target); }
    });
  }, { threshold: 0.6 });
  counters.forEach(c => cIo.observe(c));

  /* Countdown to event */
  const target = new Date('2026-07-20T23:59:59').getTime();
  const cd = document.getElementById('countdown');
  function updateCountdown() {
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) {
      cd.querySelectorAll('[data-cd]').forEach(el => el.textContent = '00');
      const label = cd.parentElement.querySelector('p.font-mono');
      if (label) label.textContent = 'Registration closed';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    cd.querySelector('[data-cd="days"]').textContent = String(d).padStart(2, '0');
    cd.querySelector('[data-cd="hours"]').textContent = String(h).padStart(2, '0');
    cd.querySelector('[data-cd="minutes"]').textContent = String(m).padStart(2, '0');
    cd.querySelector('[data-cd="seconds"]').textContent = String(s).padStart(2, '0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ---------- More events: horizontal auto-scrolling marquee ---------- */
  const moreEvents = [
    { tag: 'HACKATHON', title: 'CodeStorm 24hr', date: 'Fri Aug 14 2026', meta: '40+ Participants', desc: 'A 24-hour build sprint — form a team, pick a problem statement, ship a working prototype by sunrise.' },
    { tag: 'WORKSHOP', title: 'Git & GitHub Bootcamp', date: 'Sat Aug 22 2026', meta: '25+ Participants', desc: 'Hands-on session covering branching, pull requests, and real collaboration workflows used in industry.' },
    { tag: 'PANEL', title: 'Alumni Career Panel', date: 'Wed Sep 3 2026', meta: '60+ Participants', desc: 'ENCIDE alumni working across product, ML, and backend roles share how they broke into the industry.' },
  ];

  function eventCardHTML(ev, hidden) {
    return `
      <div class="event-card"${hidden ? ' aria-hidden="true"' : ''}>
        <div class="glass card-hover rounded-2xl p-6 h-full flex flex-col">
          <span class="text-[11px] font-semibold px-2.5 py-1 rounded-full self-start" style="background:var(--gold); color:#FFFFFF">${ev.tag}</span>
          <h4 class="font-display text-lg font-medium mt-4 leading-snug">${ev.title}</h4>
          <p class="mt-2 text-sm leading-relaxed flex-1" style="color:var(--text-2)">${ev.desc}</p>
          <div class="flex flex-col gap-1.5 mt-5 pt-5 border-t text-xs" style="border-color:var(--border); color:var(--text-3)">
            <span class="flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>${ev.date}</span>
            <span class="flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2"><circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6M17 8a3 3 0 100-6M22 20c0-2.6-2-4.8-4.7-5.6"/></svg>${ev.meta}</span>
          </div>
        </div>
      </div>
    `;
  }

  const eventsMarqueeTrack = document.getElementById('eventsMarqueeTrack');
  if (eventsMarqueeTrack) {
    // Duplicate the set so translateX(-50%) loops seamlessly; the copy is aria-hidden since it repeats content.
    eventsMarqueeTrack.innerHTML = moreEvents.map(ev => eventCardHTML(ev, false)).join('') + moreEvents.map(ev => eventCardHTML(ev, true)).join('');
    if (reduced) {
      eventsMarqueeTrack.style.animation = 'none';
    }
  }
  const eventsMarqueeWrap = document.getElementById('eventsMarqueeWrap');
  if (eventsMarqueeWrap && eventsMarqueeTrack && !reduced) {
    const eventsIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        eventsMarqueeTrack.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
      });
    }, { threshold: 0.05 });
    eventsIo.observe(eventsMarqueeWrap);
  }

  /* Team data + render (avatars as initials, since real photos aren't available here) */
  const socialIcons = {
    linkedin: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 10v7M7 7v.01M11 17v-4.5a2.5 2.5 0 015 0V17M11 10v7"/></svg>',
    github: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 00-1.3-3.2 4.2 4.2 0 00-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 00-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 00-.1 3.2A4.6 4.6 0 004 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></svg>',
    x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.4l8.2-9.3L1 2h7.2l5 6.6L18.9 2zm-1.2 18h1.7L6.4 3.9H4.6L17.7 20z"/></svg>'
  };
  /* Every member gets the same 3 social links (LinkedIn, GitHub, X) — order fixed via socialOrder below. */
  const socialOrder = ['linkedin', 'github', 'x'];
  /* Distinct gradient per role, all built from the site's own red/gold spectrum (same 135deg
     diagonal treatment as .btn-primary) so every role reads as part of the same brand rather
     than an unrelated rainbow of hues. */
  /* All roles now share the exact same gradient as Faculty Advisor, so every
     team card (badge, avatar ring, and dot) looks identical regardless of role. */
  const roleColors = {
    'Faculty Advisor': ['#7A1F2B', '#EB3945'],
    'Director':        ['#7A1F2B', '#EB3945'],
    'Secretary':       ['#7A1F2B', '#EB3945'],
    'Co-Director':     ['#7A1F2B', '#EB3945'],
    'Treasurer':       ['#7A1F2B', '#EB3945'],
  };
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
  }
  function roleBadgeStyle(role) {
    const [from, to] = roleColors[role] || roleColors['Faculty Advisor'];
    const [r1, g1, b1] = hexToRgb(from), [r2, g2, b2] = hexToRgb(to);
    return `background:linear-gradient(135deg, rgba(${r1},${g1},${b1},0.14), rgba(${r2},${g2},${b2},0.06)); border-color:rgba(${r2},${g2},${b2},0.35); color:${to};`;
  }
  function roleDotStyle(role) {
    const [from, to] = roleColors[role] || roleColors['Faculty Advisor'];
    return `background:linear-gradient(135deg, ${from}, ${to}); box-shadow:0 0 8px ${to};`;
  }
  function roleRingStyle(role) {
    const [from, to] = roleColors[role] || roleColors['Faculty Advisor'];
    return `background:conic-gradient(from 200deg, ${from}, ${to} 45%, ${from});`;
  }

  const team = window.TEAM_DATA || [];
  const grid = document.getElementById('teamGrid');
  team.forEach((m, i) => {
    const initials = m.name.replace('Prof. ', '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const card = document.createElement('div');
    card.className = 'glass card-hover team-card rounded-2xl p-8 text-center reveal' + (i % 3 === 1 ? ' reveal-delay-1' : i % 3 === 2 ? ' reveal-delay-2' : '');
    const socialHtml = socialOrder
      .map((key) => `<a href="${(m.social && m.social[key]) || '#'}" class="icon-btn" aria-label="${m.name} on ${key.charAt(0).toUpperCase() + key.slice(1)}">${socialIcons[key]}</a>`)
      .join('');
    const avatarHtml = m.img
      ? `<div class="team-avatar-ring" style="${roleRingStyle(m.role)}"><img src="${m.img}" alt="${m.name}"></div>`
      : `<div class="team-avatar-ring" style="${roleRingStyle(m.role)}"><div class="team-avatar-fallback font-display text-xl font-semibold" style="background:linear-gradient(150deg, rgba(235,57,69,0.22), rgba(217,45,58,0.1)); color:var(--gold-soft)">${initials}</div></div>`;
    card.innerHTML = `
      ${avatarHtml}
      <p class="font-display font-medium text-lg">${m.name}</p>
      <span class="team-role-badge" style="${roleBadgeStyle(m.role)}"><span class="badge-dot" style="${roleDotStyle(m.role)}"></span>${m.role}</span>
      <div class="team-divider"></div>
      <p class="text-sm leading-relaxed" style="color:var(--text-2)">${m.bio}</p>
      <div class="social-row">${socialHtml}</div>
    `;
    grid.appendChild(card);
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in'); io2.unobserve(entry.target); } });
    }, { threshold: 0.15 });
    if (reduced) card.classList.add('in'); else io2.observe(card);
  });

  /* Demo form handlers (no backend) */
  const contactForm = document.getElementById('contactForm');
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
  });
  const newsletterForm = document.getElementById('newsletterForm');
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    newsletterForm.querySelector('button').textContent = 'Subscribed ✓';
  });

  /* ---------- Testimonials: animated infinite-scroll columns ---------- */
  const testimonials = [
    { name: 'Amrita Suresh', role: 'Director, ENCIDE', quote: '<span class="font-display">ENCIDE</span> turned late-night debugging sessions into some of my favorite college memories. The peer-learning culture here is unmatched.', img: 'https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=160&h=160&fit=crop&crop=faces&auto=format&q=80' },
    { name: 'Rahul Menon', role: 'Alumnus, Class of 2024', quote: 'The hackathons I joined through <span class="font-display">ENCIDE</span> gave me my first real product to show in interviews. It genuinely shaped my career path.', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces&auto=format&q=80' },
    { name: 'Fathima Noor', role: 'Workshop Participant', quote: 'I walked into my first Git workshop knowing nothing. Six months later I was mentoring juniors at the same event.', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&h=160&fit=crop&crop=faces&auto=format&q=80' },
    { name: 'Aravind Krishnan', role: 'Hackathon Participant', quote: 'The UI/UX Challenge pushed me to think beyond code. Great mentors, better teammates, and a genuinely fun weekend.', img: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=160&h=160&fit=crop&crop=faces&auto=format&q=80' },
    { name: 'Sneha Varghese', role: 'Current Member', quote: "What sets <span class=\"font-display\">ENCIDE</span> apart is how approachable everyone is — seniors, mentors, even the faculty advisor. Nobody makes you feel behind.", img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces&auto=format&q=80' },
    { name: 'Vishnu Prasad', role: 'Alumnus, Class of 2023', quote: 'Four years later I still lean on the network I built at <span class="font-display">ENCIDE</span> — half my referrals came from people I met at club events.', img: 'https://images.unsplash.com/photo-1531891437562-4301cf35b7e5?w=160&h=160&fit=crop&crop=faces&auto=format&q=80' },
  ];

  function testiCardHTML(t, hidden) {
    return `
      <div class="testi-card"${hidden ? ' aria-hidden="true"' : ''}>
        <blockquote class="glass card-hover rounded-2xl p-7 h-full flex flex-col m-0">
          <div class="quote-mark mb-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7c-2.8 0-5 2.2-5 5v5h5v-5H4.5C4.5 9.8 5.6 8.5 7 8.5V7zm10 0c-2.8 0-5 2.2-5 5v5h5v-5h-2.5c0-2.2 1.1-3.5 2.5-3.5V7z"/></svg>
          </div>
          <p class="leading-relaxed flex-1" style="color:var(--text-2)">"${t.quote}"</p>
          <footer class="flex items-center gap-3 mt-6 pt-6 border-t" style="border-color:var(--border)">
            <img src="${t.img}" alt="" class="w-11 h-11 rounded-full object-cover" style="border:1px solid rgba(235,57,69,0.3)" loading="lazy">
            <div>
              <cite class="font-medium text-sm not-italic block">${t.name}</cite>
              <p class="text-xs mt-0.5 font-mono" style="color:var(--gold-soft)">${t.role}</p>
            </div>
          </footer>
        </blockquote>
      </div>
    `;
  }

  /* Round-robin the same testimonial data across 3 columns — no duplicated/hardcoded entries */
  const testiCols = [[], [], []];
  testimonials.forEach((t, i) => testiCols[i % 3].push(t));

  const testiColEls = [
    document.getElementById('testiCol0'),
    document.getElementById('testiCol1'),
    document.getElementById('testiCol2'),
  ];
  const testiSpeeds = [34, 40, 30]; // seconds per loop, varied per column for a natural feel

  testiColEls.forEach((el, i) => {
    if (!el) return;
    const items = testiCols[i];
    if (!items.length) return;
    // Render the set twice back-to-back so translateY(-50%) loops seamlessly;
    // the second copy is aria-hidden since it's a visual duplicate, not new content.
    el.innerHTML = items.map(t => testiCardHTML(t, false)).join('') + items.map(t => testiCardHTML(t, true)).join('');
    if (reduced) {
      el.style.animation = 'none';
    } else {
      el.style.animationDuration = `${testiSpeeds[i]}s`;
    }
  });

  /* Also pause the marquee whenever the section scrolls out of view, to save cycles */
  const testiColumnsWrap = document.getElementById('testiColumnsWrap');
  if (testiColumnsWrap && !reduced) {
    const testiIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        testiColEls.forEach(el => {
          if (!el) return;
          el.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
        });
      });
    }, { threshold: 0.05 });
    testiIo.observe(testiColumnsWrap);
  }

  /* Now that team cards + testimonial columns exist, run the GSAP reveal pass on this newly injected content */
  if (!reduced && hasGsap) {
    initGenericSectionReveals();
    ScrollTrigger.refresh();
  }
})();
