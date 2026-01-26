// Default placeholder artwork for audiobooks (used when book has no thumbnail)
// Design: Dark gradient background with orange headphones icon
// Using URL-encoded SVG data URI (works in React Native, unlike btoa)

const DEFAULT_SVG = `<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>
  <rect width="300" height="300" fill="url(#bg)"/>
  <g transform="translate(150, 130)" fill="none" stroke="#f97316" stroke-width="10" stroke-linecap="round">
    <path d="M-55 15 Q-55 -55 0 -55 Q55 -55 55 15"/>
    <rect x="-65" y="5" width="28" height="50" rx="10" fill="#f97316"/>
    <rect x="37" y="5" width="28" height="50" rx="10" fill="#f97316"/>
  </g>
  <g transform="translate(150, 210)" stroke="#f97316" stroke-width="4" fill="none" opacity="0.5">
    <line x1="-35" y1="-15" x2="-35" y2="15"/>
    <line x1="-17" y1="-25" x2="-17" y2="25"/>
    <line x1="0" y1="-30" x2="0" y2="30"/>
    <line x1="17" y1="-25" x2="17" y2="25"/>
    <line x1="35" y1="-15" x2="35" y2="15"/>
  </g>
</svg>`;

const SIMPLE_SVG = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="300" fill="#1a1a2e"/>
  <circle cx="150" cy="140" r="60" fill="none" stroke="#f97316" stroke-width="8"/>
  <circle cx="150" cy="140" r="25" fill="#f97316"/>
</svg>`;

export const DEFAULT_AUDIOBOOK_ARTWORK =
  'data:image/svg+xml,' + encodeURIComponent(DEFAULT_SVG);

// Alternative: Simple solid color placeholder (fastest loading)
export const SIMPLE_AUDIOBOOK_ARTWORK =
  'data:image/svg+xml,' + encodeURIComponent(SIMPLE_SVG);
