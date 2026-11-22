'use client';

import React, { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number; // size in px, default 40
  className?: string;
  alt?: string;
}

const GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-violet-500 to-pink-500',
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-cyan-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
];

export function Avatar({ src, name, size = 40, className = '', alt }: AvatarProps) {
  const [error, setError] = useState(false);

  // Compute initials from user/customer name
  const initials = (name || 'Pulse')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'PS';

  // Deterministic gradient selection
  const charCode = (name || 'P').charCodeAt(0);
  const gradient = GRADIENTS[charCode % GRADIENTS.length];

  if (!src || error) {
    return (
      <div
        className={`inline-flex items-center justify-center font-bold text-white uppercase rounded-full select-none bg-gradient-to-tr shrink-0 ${gradient} ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(10, Math.floor(size * 0.38)) }}
        title={name}
        aria-label={alt || name}
      >
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || name}
      onError={() => setError(true)}
      className={`rounded-full object-cover shrink-0 ${className}`}
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}
