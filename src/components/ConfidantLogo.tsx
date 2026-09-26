import React from 'react';

interface ConfidantLogoProps {
  className?: string;
  size?: number;
}

export const ConfidantLogo: React.FC<ConfidantLogoProps> = ({ className = '', size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.25)]`}
    >
      <defs>
        {/* Metallic Gold/Brass Gradient */}
        <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3e5ab" /> {/* Light shimmer */}
          <stop offset="30%" stopColor="#d4af37" /> {/* Classic gold */}
          <stop offset="70%" stopColor="#aa771c" /> {/* Deep bronze/shadow */}
          <stop offset="100%" stopColor="#e5c158" /> {/* Highlight */}
        </linearGradient>

        {/* Soft Inner Shadow/Glow effect */}
        <filter id="goldGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Main Overlapping Monogram Key Path */}
      {/* 
        This custom SVG represents:
        1. The top circular pad-lock loop arch (x: 60, y: 35, r: 24)
        2. Elegant interlocking circles (monograms C & O)
        3. The vertical solid key shaft with luxury rounded outline (width: 8)
        4. Key bit / teeth detailing on the right side
      */}
      <g filter="url(#goldGlow)">
        {/* Top Outer Buckle / Arch (Padlock style) */}
        <path
          d="M 38 48 C 38 24, 82 24, 82 48"
          stroke="url(#goldMetallic)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Outer Circular Ring (Symmetrical lock body) */}
        <circle
          cx="60"
          cy="48"
          r="18"
          stroke="url(#goldMetallic)"
          strokeWidth="5"
          fill="none"
        />

        {/* Interlocking Monogram Monolith links */}
        <path
          d="M 50 48 C 50 40, 70 40, 70 48 C 70 56, 50 56, 50 48 Z"
          stroke="url(#goldMetallic)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Vertical Key Shaft */}
        <path
          d="M 60 62 L 60 102"
          stroke="url(#goldMetallic)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Key teeth / bit on the right side (Double luxury step teeth) */}
        <path
          d="M 60 78 L 74 78 L 74 86 L 60 86"
          fill="url(#goldMetallic)"
        />
        <path
          d="M 60 90 L 71 90 L 71 96 L 60 96"
          fill="url(#goldMetallic)"
        />

        {/* Central decorative ring link accent */}
        <circle
          cx="60"
          cy="62"
          r="6"
          stroke="url(#goldMetallic)"
          strokeWidth="3.5"
          fill="#0c0d0e"
        />
      </g>
    </svg>
  );
};
