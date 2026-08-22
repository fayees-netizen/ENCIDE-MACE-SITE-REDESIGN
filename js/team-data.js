/*
 * Team roster data for the ENCIDE MACE site.
 * Kept in its own file (rather than inline in main.js) because each member's
 * `img` field is a large base64-encoded JPEG data URI — separating it keeps
 * main.js readable and makes diffs on the actual app logic much smaller.
 *
 * Exposes `window.TEAM_DATA` which js/main.js consumes to render the
 * #teamGrid section.
 */
window.TEAM_DATA = [
  {
    name: 'Prof. Eldo P Elias',
    role: 'Faculty Advisor',
    bio: 'A dedicated educator whose guidance keeps the club grounded and always moving in the right direction.',
    img: 'data:image/jpeg;base64,REPLACE_WITH_FACULTY_ADVISOR_PHOTO_BASE64',
    social: { linkedin: '#', github: '#', x: '#' }
  },
  {
    name: 'Amrita Suresh',
    role: 'Director',
    bio: 'A CSE(DS) student who leads with vision, bringing structure and purpose to everything <span class="font-display">ENCIDE</span> does.',
    img: 'data:image/jpeg;base64,REPLACE_WITH_DIRECTOR_PHOTO_BASE64',
    social: { linkedin: '#', github: '#', x: '#' }
  },
  {
    name: 'Jassim Mohammed Salim',
    role: 'Secretary',
    bio: 'An ECE student who keeps the gears turning behind the scenes — organized, reliable, and detail-oriented.',
    img: 'data:image/jpeg;base64,REPLACE_WITH_SECRETARY_PHOTO_BASE64',
    social: { linkedin: '#', github: '#', x: '#' }
  },
  {
    name: 'Haritheerth M',
    role: 'Co-Director',
    bio: 'An ECE student who thrives on collaboration and ensures every initiative is executed with precision.',
    img: 'data:image/jpeg;base64,REPLACE_WITH_CODIRECTOR1_PHOTO_BASE64',
    social: { linkedin: '#', github: '#', x: '#' }
  },
  {
    name: 'Dhia Shams',
    role: 'Co-Director',
    bio: 'A CSE student who blends creativity with execution, helping shape the culture and direction of the club.',
    img: 'data:image/jpeg;base64,REPLACE_WITH_CODIRECTOR2_PHOTO_BASE64',
    social: { linkedin: '#', github: '#', x: '#' }
  },
  {
    name: 'Ryan Nelson',
    role: 'Treasurer',
    bio: "An ECE student who manages the club's finances with care, ensuring every rupee goes toward meaningful impact.",
    img: 'data:image/jpeg;base64,REPLACE_WITH_TREASURER_PHOTO_BASE64',
    social: { linkedin: '#', github: '#', x: '#' }
  }
];
