/*
 * Team roster data for the ENCIDE MACE site.
 * Kept in its own file (rather than inline in main.js) to keep main.js
 * readable and diffs on the actual app logic small.
 *
 * Photos live in assets/team/ as real image files (not embedded base64) —
 * keeps the repo lightweight and diffs clean.
 *
 * Exposes `window.TEAM_DATA` which js/main.js consumes to render the
 * #teamGrid section.
 */
window.TEAM_DATA = [
  {
    name: 'Prof. Eldo P Elias',
    role: 'Faculty Advisor',
    bio: 'A dedicated educator whose guidance keeps the club grounded and always moving in the right direction.',
    img: 'assets/team/eldo-p-elias.jpg',
    social: { linkedin: '#', github: '#', x: '#' }
  },
  {
    name: 'Amrita Suresh',
    role: 'Director',
    bio: 'A CSE(DS) student who leads with vision, bringing structure and purpose to everything <span class="font-display">ENCIDE</span> does.',
    img: 'assets/team/amrita-suresh.jpg',
    social: { linkedin: '#', github: '#', x: '#' }
  },
  {
    name: 'Jassim Mohammed Salim',
    role: 'Secretary',
    bio: 'An ECE student who keeps the gears turning behind the scenes — organized, reliable, and detail-oriented.',
    img: 'assets/team/jassim-mohammed-salim.jpg',
    social: { linkedin: '#', github: '#', x: '#' }
  },
  {
    name: 'Haritheerth M',
    role: 'Co-Director',
    bio: 'An ECE student who thrives on collaboration and ensures every initiative is executed with precision.',
    img: 'assets/team/haritheerth-m.jpg',
    social: { linkedin: '#', github: '#', x: '#' }
  },
  {
    name: 'Dhia Shams',
    role: 'Co-Director',
    bio: 'A CSE student who blends creativity with execution, helping shape the culture and direction of the club.',
    img: 'assets/team/dhia-shams.jpg',
    social: { linkedin: '#', github: '#', x: '#' }
  },
  {
    name: 'Ryan Nelson',
    role: 'Treasurer',
    bio: "An ECE student who manages the club's finances with care, ensuring every rupee goes toward meaningful impact.",
    img: 'assets/team/ryan-nelson.jpg',
    social: { linkedin: '#', github: '#', x: '#' }
  }
];
