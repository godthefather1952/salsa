/**
 * Shapes of salsa API responses that more than one app reads. The API returns
 * these, and the widget and the demo bank consume them.
 */
import type { AccountKind, TenantBranding, VehicleDetails } from './domain';

export interface WidgetSessionResponse {
  token: string;
  /** ISO timestamp. */
  expiresAt: string;
}

export interface WidgetMeResponse {
  bank: { name: string; branding: TenantBranding };
  customer: { displayName: string; firstName: string };
  taxYear: number;
  /** Latest posted date salsa has for this customer in the tax year, or null if none. */
  dataThrough: string | null;
  transactionCount: number;
  accounts: Array<{ id: string; kind: AccountKind; name: string; mask: string }>;
  /** Interest the bank's own loan records say was paid this tax year, per loan account. */
  loanInterest: Array<{
    accountId: string;
    accountName: string;
    kind: AccountKind;
    mask: string;
    interestCents: number;
    originatedOn: string | null;
    vehicle: VehicleDetails | null;
  }>;
  disclaimer: string;
}

export interface ApiErrorResponse {
  error: { code: string; message: string };
}
