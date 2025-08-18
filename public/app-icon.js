/* 
StayBoost App Icon - A simplified exit-intent popup icon 
This is a data URL representation of the app icon
*/

const STAYBOOST_ICON_SVG = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="240" fill="url(#bgGradient)" stroke="#374151" stroke-width="8"/>
  <rect x="96" y="120" width="320" height="240" rx="16" fill="#374151" stroke="#1F2937" stroke-width="4"/>
  <rect x="96" y="120" width="320" height="40" rx="16" fill="#6B7280"/>
  <rect x="96" y="144" width="320" height="216" rx="0" fill="#F9FAFB"/>
  <circle cx="120" cy="140" r="6" fill="#EF4444"/>
  <circle cx="140" cy="140" r="6" fill="#F59E0B"/>
  <circle cx="160" cy="140" r="6" fill="#10B981"/>
  <path d="M 200 180 L 180 160 L 190 160 L 190 140 L 210 140 L 210 160 L 220 160 Z" fill="#4F46E5" stroke="#374151" stroke-width="2"/>
  <rect x="160" y="220" width="192" height="120" rx="12" fill="#FFFFFF" stroke="#4F46E5" stroke-width="3"/>
  <rect x="180" y="240" width="120" height="8" rx="4" fill="#374151"/>
  <rect x="180" y="255" width="152" height="6" rx="3" fill="#6B7280"/>
  <rect x="180" y="268" width="140" height="6" rx="3" fill="#6B7280"/>
  <rect x="180" y="290" width="60" height="24" rx="12" fill="#4F46E5"/>
  <rect x="250" y="290" width="60" height="24" rx="12" fill="#E5E7EB" stroke="#D1D5DB" stroke-width="1"/>
  <text x="360" y="200" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#059669">10%</text>
  <text x="340" y="215" font-family="Arial, sans-serif" font-size="12" fill="#059669">OFF</text>
</svg>
`;

module.exports = { STAYBOOST_ICON_SVG };
