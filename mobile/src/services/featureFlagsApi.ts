import { apiClient } from './apiClient';

/** Features an admin can switch on for everyone or for chosen users. */
export type FeatureFlagKey = 'payments';

export interface FeatureFlagsResponse {
  flags: Partial<Record<FeatureFlagKey, boolean>>;
}

export const getFeatureFlags = () => apiClient.get<FeatureFlagsResponse>('/v1/feature-flags');
