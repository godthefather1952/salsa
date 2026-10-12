import type { TenantBranding } from '@salsa/core';

export interface DemoBank {
  slug: string;
  name: string;
  tagline: string;
  branding: TenantBranding;
  /**
   * The key the bank's server uses to call salsa. These two are test keys for
   * local demos only, which is why they can live in a public repo. Real keys
   * are generated per bank, shown once, and stored only as a hash.
   */
  apiKey: string;
}

/** Two fictional banks, so the demo can show the same widget in two brands. */
export const DEMO_BANKS = [
  {
    slug: 'tidewater',
    name: 'Tidewater Demo Bank',
    tagline: 'Banking for the coast since never. A fictional bank for demos.',
    branding: { primaryColor: '#0B6E6E', accentColor: '#F2A541', logoText: 'Tidewater' },
    apiKey: 'sk_test_tidewater_local_demo_only',
  },
  {
    slug: 'summit',
    name: 'Summit Demo Credit Union',
    tagline: 'Member-owned, entirely imaginary. A fictional credit union for demos.',
    branding: { primaryColor: '#3D2C8D', accentColor: '#2EC4B6', logoText: 'Summit CU' },
    apiKey: 'sk_test_summit_local_demo_only',
  },
] as const satisfies readonly DemoBank[];

export type DemoBankSlug = (typeof DEMO_BANKS)[number]['slug'];
