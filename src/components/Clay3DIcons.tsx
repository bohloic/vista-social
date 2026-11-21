'use client';

import React from 'react';

// 3D Clay Purple Wallet with Gold Coin (from FinTrack Balance Card)
export function ClayWalletIcon({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="walletBody" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#9d84f8" />
          <stop offset="45%" stopColor="#7c5cfc" />
          <stop offset="100%" stopColor="#5534d4" />
        </radialGradient>
        <radialGradient id="walletFlap" cx="30%" cy="25%" r="65%">
          <stop offset="0%" stopColor="#b19bfd" />
          <stop offset="100%" stopColor="#6946e6" />
        </radialGradient>
        <radialGradient id="goldCoin" cx="35%" cy="25%" r="65%">
          <stop offset="0%" stopColor="#ffea79" />
          <stop offset="40%" stopColor="#f5b324" />
          <stop offset="100%" stopColor="#c77b05" />
        </radialGradient>
        <filter id="clayShadow" x="-10%" y="-10%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="2" dy="5" stdDeviation="3.5" floodColor="#352078" floodOpacity="0.25" />
        </filter>
      </defs>
      {/* Coin popping out */}
      <circle cx="44" cy="18" r="9" fill="url(#goldCoin)" filter="url(#clayShadow)" />
      <circle cx="44" cy="18" r="6.5" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.2" fill="none" />
      {/* Wallet Body */}
      <rect x="8" y="20" width="48" height="34" rx="10" fill="url(#walletBody)" filter="url(#clayShadow)" />
      {/* Wallet Highlight */}
      <rect x="10" y="22" width="44" height="14" rx="6" fill="#ffffff" fillOpacity="0.18" />
      {/* Clasp Flap */}
      <path d="M38 31H54C56.2 31 58 32.8 58 35V39C58 41.2 56.2 43 54 43H38C35.8 43 34 41.2 34 39V35C34 32.8 35.8 31 38 31Z" fill="url(#walletFlap)" />
      <circle cx="50" cy="37" r="2.8" fill="#ffea79" />
    </svg>
  );
}

// 3D Clay Green Money Sack with Rupee / Currency Symbol
export function ClayMoneyBagIcon({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bagBody" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="45%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </radialGradient>
        <linearGradient id="tieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <filter id="bagShadow" x="-10%" y="-10%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="2" dy="5" stdDeviation="3.5" floodColor="#064e3b" floodOpacity="0.25" />
        </filter>
      </defs>
      {/* Top ruffle */}
      <path d="M24 16C24 12 28 9 32 9C36 9 40 12 40 16C37 17 27 17 24 16Z" fill="#34d399" />
      {/* Tied cord */}
      <ellipse cx="32" cy="18" rx="8" ry="3.5" fill="url(#tieGrad)" />
      {/* Big plump sack body */}
      <ellipse cx="32" cy="38" rx="20" ry="18" fill="url(#bagBody)" filter="url(#bagShadow)" />
      {/* Highlight sheen */}
      <ellipse cx="27" cy="30" rx="9" ry="5" fill="#ffffff" fillOpacity="0.22" transform="rotate(-15 27 30)" />
      {/* Currency badge in center */}
      <text x="32" y="44" fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="system-ui, sans-serif" textAnchor="middle" opacity="0.9">⚡</text>
    </svg>
  );
}

// 3D Clay Red/Coral Shopping Bag
export function ClayShoppingBagIcon({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bagRed" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="40%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#be123c" />
        </radialGradient>
        <filter id="redShadow" x="-10%" y="-10%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="2" dy="5" stdDeviation="3.5" floodColor="#881337" floodOpacity="0.25" />
        </filter>
      </defs>
      {/* Handles */}
      <path d="M24 24V14C24 9.5 27.5 6 32 6C36.5 6 40 9.5 40 14V24" stroke="#f43f5e" strokeWidth="4.5" strokeLinecap="round" />
      {/* Bag Body */}
      <rect x="14" y="20" width="36" height="36" rx="9" fill="url(#bagRed)" filter="url(#redShadow)" />
      {/* Specular sheen */}
      <rect x="17" y="23" width="30" height="12" rx="5" fill="#ffffff" fillOpacity="0.2" />
    </svg>
  );
}

// 3D Clay Gold Coins Stack
export function ClayCoinsStackIcon({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="goldTop" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </radialGradient>
        <linearGradient id="goldEdge" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
        <filter id="coinShadow" x="-10%" y="-10%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#713f12" floodOpacity="0.25" />
        </filter>
      </defs>
      {/* Coin 1 bottom */}
      <g filter="url(#coinShadow)">
        <rect x="22" y="44" width="28" height="8" rx="4" fill="url(#goldEdge)" />
        <ellipse cx="36" cy="44" rx="14" ry="5" fill="url(#goldTop)" />
      </g>
      {/* Coin 2 middle */}
      <g filter="url(#coinShadow)">
        <rect x="22" y="34" width="28" height="8" rx="4" fill="url(#goldEdge)" />
        <ellipse cx="36" cy="34" rx="14" ry="5" fill="url(#goldTop)" />
      </g>
      {/* Coin 3 top */}
      <g filter="url(#coinShadow)">
        <rect x="22" y="24" width="28" height="8" rx="4" fill="url(#goldEdge)" />
        <ellipse cx="36" cy="24" rx="14" ry="5" fill="url(#goldTop)" />
        <ellipse cx="36" cy="24" rx="11" ry="3.8" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1" fill="none" />
      </g>
      {/* Extra smaller coin on side */}
      <g filter="url(#coinShadow)">
        <rect x="10" y="42" width="16" height="6" rx="3" fill="url(#goldEdge)" />
        <ellipse cx="18" cy="42" rx="8" ry="3.5" fill="url(#goldTop)" />
      </g>
    </svg>
  );
}

// 3D Clay Piggy Bank (for Goals card)
export function ClayPiggyBankIcon({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="piggyPink" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="45%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </radialGradient>
        <filter id="piggyShadow" x="-10%" y="-10%" width="130%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="2" dy="5" stdDeviation="3.5" floodColor="#831843" floodOpacity="0.25" />
        </filter>
      </defs>
      {/* Piggy Body */}
      <ellipse cx="34" cy="36" rx="19" ry="16" fill="url(#piggyPink)" filter="url(#piggyShadow)" />
      {/* Snout */}
      <ellipse cx="15" cy="38" rx="6" ry="7" fill="#f472b6" />
      <circle cx="13" cy="37" r="1.3" fill="#831843" />
      <circle cx="16" cy="37" r="1.3" fill="#831843" />
      {/* Eye */}
      <circle cx="25" cy="30" r="2.2" fill="#1e1b4b" />
      <circle cx="24.2" cy="29.2" r="0.8" fill="#ffffff" />
      {/* Ear */}
      <path d="M28 22C28 16 34 16 36 21Z" fill="#f472b6" />
      {/* Coin slot */}
      <rect x="33" y="19" width="8" height="2" rx="1" fill="#831843" />
      {/* Coin dropping in */}
      <circle cx="37" cy="14" r="5" fill="#f59e0b" />
    </svg>
  );
}

// 3D Clay Potted Plant
export function ClayPottedPlantIcon({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="plantLeaf" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </radialGradient>
        <radialGradient id="plantPot" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="50%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#9a3412" />
        </radialGradient>
      </defs>
      {/* Leaves */}
      <ellipse cx="32" cy="18" rx="5" ry="12" fill="url(#plantLeaf)" />
      <ellipse cx="23" cy="22" rx="4.5" ry="10" fill="url(#plantLeaf)" transform="rotate(-25 23 22)" />
      <ellipse cx="41" cy="22" rx="4.5" ry="10" fill="url(#plantLeaf)" transform="rotate(25 41 22)" />
      {/* Pot */}
      <path d="M22 36L25 54H39L42 36H22Z" fill="url(#plantPot)" />
      <rect x="20" y="32" width="24" height="6" rx="3" fill="#fb923c" />
    </svg>
  );
}

// 3D Clay Lightbulb (Smart Tip)
export function ClayLightbulbIcon({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bulbGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#eab308" />
        </radialGradient>
      </defs>
      {/* Bulb body */}
      <path d="M20 25C20 18.37 25.37 13 32 13C38.63 13 44 18.37 44 25C44 29.5 41.5 33.5 38 36V42H26V36C22.5 33.5 20 29.5 20 25Z" fill="url(#bulbGrad)" />
      {/* Screw base */}
      <rect x="27" y="44" width="10" height="3" rx="1.5" fill="#94a3b8" />
      <rect x="28" y="48" width="8" height="3" rx="1.5" fill="#64748b" />
      {/* Highlight glow */}
      <circle cx="28" cy="21" r="3.5" fill="#ffffff" fillOpacity="0.5" />
    </svg>
  );
}

// 3D Clay Padlock (for Login Card)
export function ClayPadlockIcon({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="lockBody" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </radialGradient>
      </defs>
      {/* Shackle */}
      <path d="M24 28V19C24 14.58 27.58 11 32 11C36.42 11 40 14.58 40 19V28" stroke="#a78bfa" strokeWidth="5" strokeLinecap="round" />
      {/* Body */}
      <rect x="16" y="26" width="32" height="28" rx="8" fill="url(#lockBody)" />
      {/* Keyhole */}
      <circle cx="32" cy="38" r="3" fill="#ffffff" fillOpacity="0.9" />
      <path d="M31 39L30 45H34L33 39H31Z" fill="#ffffff" fillOpacity="0.9" />
    </svg>
  );
}
