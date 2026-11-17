import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { foundationApi } from '../../foundation/api/foundationApi';
import { useFoundation } from '../../foundation/hooks/useFoundation';
import type { Context, Invitation, Membership } from '../../foundation/models/foundation';
import { organizationsApi } from '../../organizations/api/organizationsApi';
import type { Organization } from '../../organizations/models/organization';
import { isOpenInvitation, partnerStage, type PartnerStage } from '../models/partnerStage';

interface PartnerState {
  stage: PartnerStage;
  loading: boolean;
  error: unknown;
  busy: boolean;
  membership: Membership | null;
  isOwner: boolean;
  context: Context | null;
  invitations: Invitation[];
  openInvitations: Invitation[];
  applications: Organization[];
  reload: () => void;
  mutate: (action: () => Promise<unknown>) => Promise<boolean>;
}

interface PartnerData {
  context: Context;
  invitations: Invitation[];
  applications: Organization[];
}

const PartnerContext = createContext<PartnerState | null>(null);
const empty: PartnerData = {
  context: { memberships: [], driverId: null, driverStatus: null },
  invitations: [],
  applications: [],
};

/** Loads the partner onboarding facts once for every partner route. */
export function PartnerProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const verified = auth.user?.emailVerified === true;
  const userId = auth.user?.accountId;
  const load = useCallback(
    async (signal: AbortSignal): Promise<PartnerData> => {
      if (!verified || !userId) return empty;
      const [context, invitations, applications] = await Promise.all([
        foundationApi.context(signal),
        foundationApi.invitations(undefined, signal),
        organizationsApi.search(1, '', '', signal),
      ]);
      return { context, invitations, applications: applications.items };
    },
    [verified, userId],
  );
  const state = useFoundation(load);
  const data = state.data ?? empty;
  const membership = data.context.memberships.find((item) => item.isActive) ?? null;
  const value = useMemo<PartnerState>(
    () => ({
      stage: partnerStage({
        emailVerified: verified,
        membership,
        driverId: data.context.driverId,
        applications: data.applications,
      }),
      loading: verified && state.loading,
      error: state.error,
      busy: state.busy,
      membership,
      isOwner: membership?.role === 'OrganizationOwner',
      context: state.data?.context ?? null,
      invitations: data.invitations,
      openInvitations: data.invitations.filter((item) => isOpenInvitation(item)),
      applications: data.applications,
      reload: state.reload,
      mutate: state.mutate,
    }),
    [verified, membership, data, state],
  );
  return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>;
}

export function usePartner() {
  const value = useContext(PartnerContext);
  if (!value) throw new Error('usePartner must be used inside PartnerProvider.');
  return value;
}
