/**
 * IEEE SWEBOK v4 Chapter 01 (Performance Efficiency <1.5s) & Chapter 02 (Separation of Concerns)
 * Pure Client-Side Interactive Vector Watch Rendering Engine (SVG / Canvas).
 * Visually renders materials, bezels, dials, hands, movements, straps, and custom engravings.
 */

import React, { useId } from 'react';
import {
  CaseMaterial,
  BezelType,
  DialColor,
  HandsStyle,
  StrapMaterial,
  MovementType,
} from '../../../shared/types.js';

interface WatchRendererProps {
  caseMaterial?: CaseMaterial;
  caseDiameterMm?: number;
  bezel?: BezelType;
  dialColor?: DialColor;
  hands?: HandsStyle;
  strap?: StrapMaterial;
  movement?: MovementType;
  engraving?: string;
  viewMode?: 'front' | 'caseback';
  size?: number; // Size in pixels
}

export const WatchRenderer: React.FC<WatchRendererProps> = ({
  caseMaterial = 'Stainless Steel',
  caseDiameterMm = 40,
  bezel = 'Smooth Polished',
  dialColor = 'Midnight Obsidian',
  hands = 'Dauphine',
  strap = 'Horween Calfskin',
  movement = 'Automatic',
  engraving = '',
  viewMode = 'front',
  size = 400,
}) => {
  const uid = useId().replace(/:/g, '');

  // Case material color palettes
  const getMaterialPalette = () => {
    switch (caseMaterial) {
      case 'Rose Gold':
        return {
          primary: '#e0a38b',
          highlight: '#fad8cd',
          shadow: '#8f4f3a',
          accent: '#b86b53',
        };
      case 'Yellow Gold':
        return {
          primary: '#d4af37',
          highlight: '#fae69e',
          shadow: '#806313',
          accent: '#aa821d',
        };
      case 'Titanium':
        return {
          primary: '#6b7280',
          highlight: '#9ca3af',
          shadow: '#374151',
          accent: '#4b5563',
        };
      case 'Ceramic':
        return {
          primary: '#1c1f24',
          highlight: '#374151',
          shadow: '#0b0d10',
          accent: '#111317',
        };
      case 'Stainless Steel':
      default:
        return {
          primary: '#cbd5e1',
          highlight: '#f8fafc',
          shadow: '#64748b',
          accent: '#94a3b8',
        };
    }
  };

  // Dial color palettes
  const getDialPalette = () => {
    switch (dialColor) {
      case 'Sunburst Royal Blue':
        return { bg1: '#1e3a8a', bg2: '#0f172a', text: '#e2e8f0', marker: '#f1f5f9' };
      case 'Emerald Forest':
        return { bg1: '#064e3b', bg2: '#022c22', text: '#e2e8f0', marker: '#f1f5f9' };
      case 'Champagne Gold':
        return { bg1: '#fef3c7', bg2: '#d97706', text: '#78350f', marker: '#92400e' };
      case 'Silver Guilloche':
        return { bg1: '#f1f5f9', bg2: '#cbd5e1', text: '#1e293b', marker: '#334155' };
      case 'Skeleton Open-Heart':
        return { bg1: '#111827', bg2: '#030712', text: '#cbd5e1', marker: '#e2e8f0' };
      case 'Midnight Obsidian':
      default:
        return { bg1: '#0f172a', bg2: '#020617', text: '#e2e8f0', marker: '#f8fafc' };
    }
  };

  // Strap styling
  const getStrapPalette = () => {
    switch (strap) {
      case 'Alligator Leather':
        return { color: '#3b2219', texture: 'leather', secondary: '#24140e' };
      case 'Horween Calfskin':
        return { color: '#78350f', texture: 'smooth', secondary: '#451a03' };
      case 'Stainless Steel Oyster':
        return { color: '#94a3b8', texture: 'metal', secondary: '#64748b' };
      case 'Milanese Mesh':
        return { color: '#cbd5e1', texture: 'mesh', secondary: '#94a3b8' };
      case 'Vulcanized Rubber':
      default:
        return { color: '#18181b', texture: 'rubber', secondary: '#27272a' };
    }
  };

  const mat = getMaterialPalette();
  const dial = getDialPalette();
  const st = getStrapPalette();

  // Diameter scale factor (relative to 40mm)
  const diameterScale = (caseDiameterMm / 40) * 0.95;

  return (
    <div className="relative flex items-center justify-center p-4">
      <svg
        width={size}
        height={size}
        viewBox="0 0 500 500"
        className="drop-shadow-2xl transition-all duration-500 select-none"
      >
        <defs>
          {/* Gradients for Luxury Case Material */}
          <linearGradient id={`caseGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={mat.highlight} />
            <stop offset="40%" stopColor={mat.primary} />
            <stop offset="70%" stopColor={mat.shadow} />
            <stop offset="100%" stopColor={mat.accent} />
          </linearGradient>

          <radialGradient id={`dialGrad-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={dial.bg1} />
            <stop offset="90%" stopColor={dial.bg2} />
          </radialGradient>

          <radialGradient id={`casebackGrad-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={mat.highlight} />
            <stop offset="60%" stopColor={mat.primary} />
            <stop offset="100%" stopColor={mat.shadow} />
          </radialGradient>

          {/* Strap Pattern */}
          <pattern id={`strapPattern-${uid}`} width="20" height="20" patternUnits="userSpaceOnUse">
            {st.texture === 'leather' && (
              <path d="M0 10 L20 10 M10 0 L10 20" stroke={st.secondary} strokeWidth="1.5" opacity="0.3" />
            )}
            {st.texture === 'mesh' && (
              <path d="M0 0 L20 20 M20 0 L0 20" stroke={st.secondary} strokeWidth="1" opacity="0.5" />
            )}
          </pattern>

          {/* Sapphire Glass Glare Filter */}
          <linearGradient id={`glassGlare-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="65%" stopColor="#38bdf8" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* 1. Strap (Top & Bottom) */}
        <g id="strap">
          {/* Top Strap */}
          <path
            d="M190 20 L310 20 L300 170 L200 170 Z"
            fill={st.color}
            stroke={st.secondary}
            strokeWidth="3"
          />
          <path
            d="M190 20 L310 20 L300 170 L200 170 Z"
            fill={`url(#strapPattern-${uid})`}
          />
          {/* Top Strap Stitches */}
          {st.texture === 'leather' && (
            <>
              <line x1="205" y1="30" x2="212" y2="160" stroke="#d4af37" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="295" y1="30" x2="288" y2="160" stroke="#d4af37" strokeWidth="1.5" strokeDasharray="4 3" />
            </>
          )}

          {/* Bottom Strap */}
          <path
            d="M200 330 L300 330 L310 480 L190 480 Z"
            fill={st.color}
            stroke={st.secondary}
            strokeWidth="3"
          />
          <path
            d="M200 330 L300 330 L310 480 L190 480 Z"
            fill={`url(#strapPattern-${uid})`}
          />
          {st.texture === 'leather' && (
            <>
              <line x1="212" y1="340" x2="205" y2="470" stroke="#d4af37" strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="288" y1="340" x2="295" y2="470" stroke="#d4af37" strokeWidth="1.5" strokeDasharray="4 3" />
            </>
          )}

          {/* Metal Oyster Link Dividers if Stainless Steel */}
          {st.texture === 'metal' && (
            <>
              <line x1="195" y1="60" x2="305" y2="60" stroke="#475569" strokeWidth="2" />
              <line x1="198" y1="110" x2="302" y2="110" stroke="#475569" strokeWidth="2" />
              <line x1="202" y1="380" x2="298" y2="380" stroke="#475569" strokeWidth="2" />
              <line x1="198" y1="430" x2="302" y2="430" stroke="#475569" strokeWidth="2" />
            </>
          )}
        </g>

        {/* 2. Case Lugs */}
        <g id="lugs" fill={`url(#caseGrad-${uid})`} stroke={mat.shadow} strokeWidth="2">
          {/* Top-Left Lug */}
          <path d="M190 140 L195 210 L160 215 L170 145 Z" />
          {/* Top-Right Lug */}
          <path d="M310 140 L305 210 L340 215 L330 145 Z" />
          {/* Bottom-Left Lug */}
          <path d="M160 285 L195 290 L190 360 L170 355 Z" />
          {/* Bottom-Right Lug */}
          <path d="M340 285 L305 290 L310 360 L330 355 Z" />
        </g>

        {/* 3. Crown & Chronograph Pushers */}
        <g id="crown">
          {/* Main Crown */}
          <rect
            x="385"
            y="238"
            width="22"
            height="24"
            rx="3"
            fill={`url(#caseGrad-${uid})`}
            stroke={mat.shadow}
            strokeWidth="1.5"
          />
          <line x1="392" y1="240" x2="392" y2="260" stroke={mat.shadow} strokeWidth="1" />
          <line x1="398" y1="240" x2="398" y2="260" stroke={mat.shadow} strokeWidth="1" />
          <line x1="403" y1="240" x2="403" y2="260" stroke={mat.shadow} strokeWidth="1" />

          {/* Chrono Pushers if Tachymeter Bezel */}
          {bezel === 'Ceramic Tachymeter' && (
            <>
              <rect x="375" y="200" width="16" height="14" rx="2" fill={`url(#caseGrad-${uid})`} stroke={mat.shadow} />
              <rect x="375" y="286" width="16" height="14" rx="2" fill={`url(#caseGrad-${uid})`} stroke={mat.shadow} />
            </>
          )}
        </g>

        {/* Scaled Watch Head Group */}
        <g id="watch-head" transform={`scale(${diameterScale})`} transform-origin="250 250">
          {/* 4. Outer Case Body */}
          <circle
            cx="250"
            cy="250"
            r="140"
            fill={`url(#caseGrad-${uid})`}
            stroke={mat.shadow}
            strokeWidth="3"
          />

          {viewMode === 'caseback' ? (
            /* --- CASEBACK VIEW (Transparent Sapphire Exhibition or Solid Engraved) --- */
            <g id="caseback-content">
              <circle cx="250" cy="250" r="115" fill={`url(#casebackGrad-${uid})`} stroke={mat.shadow} strokeWidth="3" />
              
              {/* Exhibition Sapphire Window */}
              <circle cx="250" cy="250" r="90" fill="#0f172a" stroke={mat.accent} strokeWidth="2" />
              
              {/* Visible Mechanical Calibre Gears & Rotor */}
              <g transform="translate(250, 250)">
                {/* Winding Rotor (half circle) */}
                <path
                  d="M -70 0 A 70 70 0 0 1 70 0 Z"
                  fill="url(#caseGrad)"
                  stroke="#c5a059"
                  strokeWidth="2"
                  className="animate-slow-gear"
                />
                <circle cx="0" cy="0" r="18" fill="#c5a059" />
                <circle cx="0" cy="0" r="8" fill="#e11d48" /> {/* Ruby Jewel Bearing */}

                {/* Balance Wheel */}
                <circle cx="-35" cy="25" r="22" fill="none" stroke="#eab308" strokeWidth="2.5" className="animate-balance-wheel" />
                <line x1="-35" y1="5" x2="-35" y2="45" stroke="#eab308" strokeWidth="2" className="animate-balance-wheel" />
              </g>

              {/* Caseback Technical Inscriptions */}
              <path
                id={`casebackTextPath-${uid}`}
                d="M 160 250 A 90 90 0 1 1 340 250"
                fill="none"
              />
              <text fill={mat.shadow} fontSize="9" fontWeight="600" letterSpacing="2">
                <textPath href={`#casebackTextPath-${uid}`} startOffset="50%" textAnchor="middle">
                  AETHEL & KRONOS • SWISS CALIBRE • 300M WR
                </textPath>
              </text>

              {/* Custom Engraving on Caseback */}
              {engraving && (
                <g>
                  <rect x="180" y="275" width="140" height="24" rx="4" fill="#000000" fillOpacity="0.4" />
                  <text
                    x="250"
                    y="291"
                    textAnchor="middle"
                    fill="#fef08a"
                    fontFamily="serif"
                    fontSize="11"
                    fontWeight="bold"
                    letterSpacing="1"
                  >
                    {engraving.toUpperCase()}
                  </text>
                </g>
              )}
            </g>
          ) : (
            /* --- FRONT DIAL VIEW --- */
            <>
              {/* 5. Bezel */}
              <g id="bezel">
                {bezel === 'Fluted Luxury' && (
                  <circle
                    cx="250"
                    cy="250"
                    r="132"
                    fill="none"
                    stroke={`url(#caseGrad-${uid})`}
                    strokeWidth="12"
                    strokeDasharray="4 3"
                  />
                )}

                {bezel === 'Ceramic Tachymeter' && (
                  <>
                    <circle cx="250" cy="250" r="132" fill="none" stroke="#18181b" strokeWidth="16" />
                    {/* Tachymeter Text Sample */}
                    <text x="250" y="126" textAnchor="middle" fill="#f8fafc" fontSize="8" fontWeight="bold">TACHYMETRE 500</text>
                    <text x="370" y="253" textAnchor="middle" fill="#f8fafc" fontSize="8" fontWeight="bold">120</text>
                    <text x="250" y="380" textAnchor="middle" fill="#f8fafc" fontSize="8" fontWeight="bold">240</text>
                    <text x="130" y="253" textAnchor="middle" fill="#f8fafc" fontSize="8" fontWeight="bold">60</text>
                  </>
                )}

                {bezel === 'Diver 60-Min Unidirectional' && (
                  <>
                    <circle cx="250" cy="250" r="132" fill="none" stroke="#0f172a" strokeWidth="16" />
                    <circle cx="250" cy="122" r="5" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="315" y="160" fill="#ffffff" fontSize="9" fontWeight="bold">15</text>
                    <text x="325" y="310" fill="#ffffff" fontSize="9" fontWeight="bold">30</text>
                    <text x="180" y="310" fill="#ffffff" fontSize="9" fontWeight="bold">45</text>
                  </>
                )}

                {bezel === 'Smooth Polished' && (
                  <circle
                    cx="250"
                    cy="250"
                    r="130"
                    fill="none"
                    stroke={`url(#caseGrad-${uid})`}
                    strokeWidth="10"
                  />
                )}
              </g>

              {/* 6. Watch Dial Interior */}
              <g id="dial-interior">
                <circle
                  cx="250"
                  cy="250"
                  r="115"
                  fill={`url(#dialGrad-${uid})`}
                  stroke={mat.accent}
                  strokeWidth="1.5"
                />

                {/* Guilloché pattern for Silver Guilloche dial */}
                {dialColor === 'Silver Guilloche' && (
                  <circle
                    cx="250"
                    cy="250"
                    r="85"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.6"
                  />
                )}

                {/* Skeleton Open-Heart Mechanical Complication */}
                {(dialColor === 'Skeleton Open-Heart' || movement === 'Tourbillon') && (
                  <g id="open-heart" transform="translate(250, 285)">
                    <circle cx="0" cy="0" r="32" fill="#0b0f19" stroke="#c5a059" strokeWidth="2" />
                    {/* Tourbillon Bridge */}
                    <line x1="-30" y1="0" x2="30" y2="0" stroke="#cbd5e1" strokeWidth="3" />
                    {/* Oscillating Balance Wheel */}
                    <circle
                      cx="0"
                      cy="0"
                      r="22"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="2.5"
                      className="animate-balance-wheel"
                    />
                    <circle cx="0" cy="0" r="4" fill="#e11d48" /> {/* Synthetic Ruby */}
                  </g>
                )}

                {/* Hour Markers (12, 3, 6, 9 and Baton indices) */}
                <g id="indices" stroke={dial.marker} strokeWidth="3" strokeLinecap="round">
                  {/* 12 o'clock double index */}
                  <line x1="247" y1="145" x2="247" y2="162" />
                  <line x1="253" y1="145" x2="253" y2="162" />
                  {/* 3 o'clock */}
                  <line x1="338" y1="250" x2="355" y2="250" />
                  {/* 6 o'clock */}
                  <line x1="250" y1="338" x2="250" y2="355" />
                  {/* 9 o'clock */}
                  <line x1="145" y1="250" x2="162" y2="250" />
                  {/* Minor Hour Markers */}
                  {[30, 60, 120, 150, 210, 240, 300, 330].map((deg) => (
                    <line
                      key={deg}
                      x1="250"
                      y1="148"
                      x2="250"
                      y2="158"
                      strokeWidth="2"
                      stroke={dial.marker}
                      transform={`rotate(${deg} 250 250)`}
                    />
                  ))}
                </g>

                {/* Brand & Movement Typography */}
                <text
                  x="250"
                  y="200"
                  textAnchor="middle"
                  fill={dial.text}
                  fontFamily="Cinzel, serif"
                  fontSize="10"
                  fontWeight="bold"
                  letterSpacing="2"
                >
                  AETHEL & KRONOS
                </text>
                <text
                  x="250"
                  y="212"
                  textAnchor="middle"
                  fill="#c5a059"
                  fontFamily="Inter, sans-serif"
                  fontSize="7"
                  letterSpacing="1.5"
                >
                  GENÈVE
                </text>

                <text
                  x="250"
                  y="312"
                  textAnchor="middle"
                  fill={dial.text}
                  fontFamily="Inter, sans-serif"
                  fontSize="6.5"
                  letterSpacing="1"
                  opacity="0.8"
                >
                  {movement.toUpperCase()} • CHRONOMETER
                </text>

                {/* Custom Dial Engraving preview if on front */}
                {engraving && viewMode === 'front' && (
                  <text
                    x="250"
                    y="226"
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontFamily="serif"
                    fontSize="7.5"
                    letterSpacing="1"
                    fontStyle="italic"
                  >
                    "{engraving}"
                  </text>
                )}

                {/* 7. Watch Hands */}
                <g id="hands" transform="translate(250, 250)">
                  {/* Hour Hand (pointing toward ~10:10) */}
                  <g transform="rotate(-60)">
                    {hands === 'Dauphine' && (
                      <polygon points="-5,0 0,-50 5,0 0,10" fill="#f1f5f9" stroke="#64748b" strokeWidth="1" />
                    )}
                    {hands === 'Baton Luminous' && (
                      <rect x="-3" y="-55" width="6" height="55" rx="2" fill="#f8fafc" stroke="#334155" strokeWidth="1" />
                    )}
                    {hands === 'Blued Steel Leaf' && (
                      <path d="M 0 0 C -6 -25 -5 -40 0 -55 C 5 -40 6 -25 0 0 Z" fill="#1e40af" />
                    )}
                    {hands === 'Breguet Classic' && (
                      <>
                        <line x1="0" y1="0" x2="0" y2="-52" stroke="#1e293b" strokeWidth="2" />
                        <circle cx="0" cy="-42" r="5" fill="none" stroke="#1e293b" strokeWidth="1.5" />
                      </>
                    )}
                  </g>

                  {/* Minute Hand (pointing toward ~10:10) */}
                  <g transform="rotate(50)">
                    {hands === 'Dauphine' && (
                      <polygon points="-4,0 0,-80 4,0 0,12" fill="#f1f5f9" stroke="#64748b" strokeWidth="1" />
                    )}
                    {hands === 'Baton Luminous' && (
                      <rect x="-2.5" y="-82" width="5" height="82" rx="2" fill="#f8fafc" stroke="#334155" strokeWidth="1" />
                    )}
                    {hands === 'Blued Steel Leaf' && (
                      <path d="M 0 0 C -5 -35 -4 -65 0 -85 C 4 -65 5 -35 0 0 Z" fill="#1e40af" />
                    )}
                    {hands === 'Breguet Classic' && (
                      <>
                        <line x1="0" y1="0" x2="0" y2="-80" stroke="#1e293b" strokeWidth="2" />
                        <circle cx="0" cy="-68" r="6" fill="none" stroke="#1e293b" strokeWidth="1.5" />
                      </>
                    )}
                  </g>

                  {/* Sweeping Second Hand (with smooth ticking rotation) */}
                  <g className="animate-second-hand">
                    <line x1="0" y1="18" x2="0" y2="-95" stroke="#ef4444" strokeWidth="1.5" />
                    <circle cx="0" cy="-70" r="3" fill="#ef4444" />
                  </g>

                  {/* Center Pin & Cap */}
                  <circle cx="0" cy="0" r="5" fill="#f8fafc" stroke="#475569" strokeWidth="1" />
                  <circle cx="0" cy="0" r="2" fill="#dc2626" />
                </g>

                {/* 8. Anti-Reflective Sapphire Crystal Glare */}
                <circle
                  cx="250"
                  cy="250"
                  r="115"
                  fill={`url(#glassGlare-${uid})`}
                  pointerEvents="none"
                />
              </g>
            </>
          )}
        </g>
      </svg>
    </div>
  );
};
