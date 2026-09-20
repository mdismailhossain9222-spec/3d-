import React from 'react';

const Logo = () => {
  return (
    <svg
      viewBox="0 0 540 100"
      className="h-8 w-auto text-white"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <g id="mark" fill="currentColor">
          <rect x="0" y="0" width="100" height="24" />
          <rect x="0" y="76" width="100" height="24" />
          <rect x="25" y="0" width="20" height="100" />
          <rect x="55" y="0" width="20" height="100" />
        </g>
        <g id="wordmark" fill="currentColor" stroke="none">
          <rect x="0" y="0" width="20" height="100" />
          <path
            transform="translate(42,0)"
            fill="none"
            stroke="currentColor"
            strokeWidth="20"
            strokeLinecap="butt"
            strokeLinejoin="miter"
            d="M 52 24 C 52 16 43 10 32 10 C 21 10 10 19 10 32 C 10 41 19 46 32 50 C 45 54 54 59 54 68 C 54 81 43 90 32 90 C 21 90 12 84 12 76"
          />
          <path
            transform="translate(128,0)"
            d="M 0 0 L 20 0 L 40 62 L 60 0 L 80 0 L 80 100 L 60 100 L 60 22 L 40 84 L 20 22 L 20 100 L 0 100 Z"
          />
          <g
            transform="translate(230,0)"
            fill="none"
            stroke="currentColor"
            strokeWidth="20"
            strokeLinejoin="miter"
            strokeLinecap="butt"
          >
            <path d="M 10.8 100 L 40.8 26.4 L 70.8 100" />
            <path d="M 22.2 72 H 59.4" />
          </g>
          <rect x="334" y="0" width="20" height="100" />
          <path
            transform="translate(376,0)"
            fill="none"
            stroke="currentColor"
            strokeWidth="20"
            strokeLinejoin="miter"
            strokeLinecap="butt"
            d="M 10 0 V 90 H 80"
          />
        </g>
      </defs>
      <g fill="currentColor">
        <use href="#mark" />
        <use href="#wordmark" x="140" />
      </g>
    </svg>
  );
};

export default Logo;
