'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { canAccessRoute, normalizeRole, ROLE_LABELS, UserRole } from '@/lib/permissions';
import { ShieldAlert } from 'lucide-react';

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;

    // 1. Instant check from localStorage cache to avoid flashing forbidden pages
    try {
      const cached = localStorage.getItem('pulsesocial_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.role) {
          const r = normalizeRole(parsed.role);
          if (active) setRole(r);
          if (!canAccessRoute(r, pathname)) {
            router.replace(`/?restricted=1&from=${encodeURIComponent(pathname)}`);
            return;
          }
        }
      }
    } catch {
      // ignore
    }

    // 2. Authoritative verification against /api/auth/me
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.authenticated && data?.user) {
          const r = normalizeRole(data.user.role);
          setRole(r);
          try {
            localStorage.setItem('pulsesocial_user', JSON.stringify(data.user));
          } catch {
            // ignore
          }
          if (!canAccessRoute(r, pathname)) {
            router.replace(`/?restricted=1&from=${encodeURIComponent(pathname)}`);
            return;
          }
        }
        setChecked(true);
      })
      .catch(() => {
        if (active) setChecked(true);
      });

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (role && !canAccessRoute(role, pathname)) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-sm">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-extrabold text-slate-900">
          Accès réservé — Rôle actuel : {ROLE_LABELS[role]}
        </h2>
        <p className="text-xs text-slate-600 max-w-md">
          Votre profil ne dispose pas des autorisations nécessaires pour consulter cette section. Redirection vers votre tableau de bord...
        </p>
      </div>
    );
  }

  if (!checked && !role && pathname !== '/') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full border-3 border-[#7C3AED] border-t-transparent animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Vérification des habilitations...</span>
      </div>
    );
  }

  return <>{children}</>;
}
