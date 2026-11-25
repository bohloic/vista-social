export type UserRole = 'super_admin' | 'admin' | 'manager' | 'editor' | 'client';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super-Admin',
  admin: 'Admin PME',
  manager: 'Manager',
  editor: 'Éditeur',
  client: 'Client (Lecture seule)',
};

export const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-800 border-purple-300',
  admin: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  manager: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  editor: 'bg-amber-100 text-amber-800 border-amber-300',
  client: 'bg-slate-100 text-slate-700 border-slate-300',
};

/**
 * Single Source of Truth for Allowed UI Routes per Role
 */
export const ROLE_ALLOWED_ROUTES: Record<UserRole, string[]> = {
  super_admin: [
    '/',
    '/chat',
    '/publish',
    '/inbox',
    '/crm',
    '/analytics',
    '/listening',
    '/reviews',
    '/pulse-pages',
    '/billing',
    '/settings',
  ],
  admin: [
    '/',
    '/chat',
    '/publish',
    '/inbox',
    '/crm',
    '/analytics',
    '/listening',
    '/reviews',
    '/pulse-pages',
    '/billing',
    '/settings',
  ],
  manager: [
    '/',
    '/chat',
    '/publish',
    '/inbox',
    '/crm',
    '/analytics',
    '/listening',
    '/reviews',
    '/pulse-pages',
    '/billing',
    '/settings',
  ],
  editor: [
    '/',
    '/chat',
    '/publish',
    '/analytics',
    '/listening',
    '/pulse-pages',
    '/settings',
  ],
  client: [
    '/',
    '/publish',
    '/analytics',
    '/reviews',
    '/pulse-pages',
    '/settings',
  ],
};

export interface RoleCapabilitySet {
  canPromoteSuperAdmin: boolean;
  canManageTeam: boolean;
  canManageSocialAccounts: boolean;
  canManageManualTokens: boolean;
  canTestInfrastructure: boolean;
  canSubscribeOrPayBilling: boolean;
  canViewBillingReadOnly: boolean;
  canPublishDirectly: boolean;
  canCreateDrafts: boolean;
  canApproveOrRejectPosts: boolean;
  canManageCrm: boolean;
  canReplyInbox: boolean;
  canReplyReviews: boolean;
  canViewFinancialKpis: boolean;
  requiresMfa: boolean;
}

export const ROLE_CAPABILITIES: Record<UserRole, RoleCapabilitySet> = {
  super_admin: {
    canPromoteSuperAdmin: true,
    canManageTeam: true,
    canManageSocialAccounts: true,
    canManageManualTokens: true,
    canTestInfrastructure: true,
    canSubscribeOrPayBilling: true,
    canViewBillingReadOnly: true,
    canPublishDirectly: true,
    canCreateDrafts: true,
    canApproveOrRejectPosts: true,
    canManageCrm: true,
    canReplyInbox: true,
    canReplyReviews: true,
    canViewFinancialKpis: true,
    requiresMfa: true,
  },
  admin: {
    canPromoteSuperAdmin: false,
    canManageTeam: true,
    canManageSocialAccounts: true,
    canManageManualTokens: true,
    canTestInfrastructure: true,
    canSubscribeOrPayBilling: true,
    canViewBillingReadOnly: true,
    canPublishDirectly: true,
    canCreateDrafts: true,
    canApproveOrRejectPosts: true,
    canManageCrm: true,
    canReplyInbox: true,
    canReplyReviews: true,
    canViewFinancialKpis: true,
    requiresMfa: true,
  },
  manager: {
    canPromoteSuperAdmin: false,
    canManageTeam: false,
    canManageSocialAccounts: false,
    canManageManualTokens: false,
    canTestInfrastructure: false,
    canSubscribeOrPayBilling: false,
    canViewBillingReadOnly: true,
    canPublishDirectly: true,
    canCreateDrafts: true,
    canApproveOrRejectPosts: true,
    canManageCrm: true,
    canReplyInbox: true,
    canReplyReviews: true,
    canViewFinancialKpis: true,
    requiresMfa: false,
  },
  editor: {
    canPromoteSuperAdmin: false,
    canManageTeam: false,
    canManageSocialAccounts: false,
    canManageManualTokens: false,
    canTestInfrastructure: false,
    canSubscribeOrPayBilling: false,
    canViewBillingReadOnly: false,
    canPublishDirectly: false,
    canCreateDrafts: true,
    canApproveOrRejectPosts: false,
    canManageCrm: false,
    canReplyInbox: false,
    canReplyReviews: false,
    canViewFinancialKpis: false,
    requiresMfa: false,
  },
  client: {
    canPromoteSuperAdmin: false,
    canManageTeam: false,
    canManageSocialAccounts: false,
    canManageManualTokens: false,
    canTestInfrastructure: false,
    canSubscribeOrPayBilling: false,
    canViewBillingReadOnly: false,
    canPublishDirectly: false,
    canCreateDrafts: false,
    canApproveOrRejectPosts: true,
    canManageCrm: false,
    canReplyInbox: false,
    canReplyReviews: false,
    canViewFinancialKpis: false,
    requiresMfa: false,
  },
};

export function normalizeRole(role?: string | null): UserRole {
  if (
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'manager' ||
    role === 'editor' ||
    role === 'client'
  ) {
    return role;
  }
  return 'client';
}

export function canAccessRoute(role: string | undefined | null, pathname: string): boolean {
  const normalized = normalizeRole(role);
  const allowed = ROLE_ALLOWED_ROUTES[normalized];
  const cleanPath = pathname.split('?')[0];
  if (cleanPath === '/') return true;
  return allowed.some((route) => route !== '/' && (cleanPath === route || cleanPath.startsWith(`${route}/`)));
}

export function getRoleCapabilities(role: string | undefined | null): RoleCapabilitySet {
  return ROLE_CAPABILITIES[normalizeRole(role)];
}
