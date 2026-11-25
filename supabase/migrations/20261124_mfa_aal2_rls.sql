-- ============================================================================
-- Migration: 20261124_mfa_aal2_rls.sql
-- Purpose : Enforce Authenticator Assurance Level 2 (AAL2) via RESTRICTIVE RLS
--           policies on sensitive tables whenever a user has enrolled and
--           verified at least one MFA factor in auth.mfa_factors.
-- ============================================================================

-- 1. Social Accounts (OAuth tokens & connected social profiles)
DROP POLICY IF EXISTS "mfa_enforce_aal2_social_accounts" ON public.social_accounts;
CREATE POLICY "mfa_enforce_aal2_social_accounts"
  ON public.social_accounts
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM auth.mfa_factors
      WHERE auth.mfa_factors.user_id = auth.uid()
        AND auth.mfa_factors.status = 'verified'
    )
    OR ((SELECT auth.jwt()->>'aal') = 'aal2')
  );

-- 2. Workspace Members (Team RBAC & role assignments)
DROP POLICY IF EXISTS "mfa_enforce_aal2_workspace_members" ON public.workspace_members;
CREATE POLICY "mfa_enforce_aal2_workspace_members"
  ON public.workspace_members
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM auth.mfa_factors
      WHERE auth.mfa_factors.user_id = auth.uid()
        AND auth.mfa_factors.status = 'verified'
    )
    OR ((SELECT auth.jwt()->>'aal') = 'aal2')
  );

-- 3. Subscriptions (Active SaaS billing plans)
DROP POLICY IF EXISTS "mfa_enforce_aal2_subscriptions" ON public.subscriptions;
CREATE POLICY "mfa_enforce_aal2_subscriptions"
  ON public.subscriptions
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM auth.mfa_factors
      WHERE auth.mfa_factors.user_id = auth.uid()
        AND auth.mfa_factors.status = 'verified'
    )
    OR ((SELECT auth.jwt()->>'aal') = 'aal2')
  );

-- 4. Mobile Money Transactions (Financial audit trail)
DROP POLICY IF EXISTS "mfa_enforce_aal2_mobile_money_transactions" ON public.mobile_money_transactions;
CREATE POLICY "mfa_enforce_aal2_mobile_money_transactions"
  ON public.mobile_money_transactions
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM auth.mfa_factors
      WHERE auth.mfa_factors.user_id = auth.uid()
        AND auth.mfa_factors.status = 'verified'
    )
    OR ((SELECT auth.jwt()->>'aal') = 'aal2')
  );
