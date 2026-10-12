import { apiClient } from './apiClient';

/**
 * Server side of in-app purchases. Google Play takes the payment; the
 * server checks every purchase token with Google before unlocking anything.
 */

export type BookAccessType = 'free' | 'subscriber_only' | 'prime_only';

export interface BookAccess {
  book_id: string;
  access_type: BookAccessType;
  prime_price?: number | null;
  can_listen: boolean;
  has_purchased?: boolean | null;
  subscription_active?: boolean | null;
  /** Google Play product for buying this book (Prime books on sale only). */
  play_product_id?: string | null;
}

export interface StorePlan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  billing_period: 'P1M' | 'P3M' | 'P6M' | 'P1Y';
  play_product_id: string;
  play_base_plan_id: string;
}

export interface SubscriptionStatus {
  is_active: boolean;
  plan_name?: string | null;
  status?: string | null;
  expires_at?: string | null;
  auto_renewing?: boolean | null;
  play_product_id?: string | null;
}

export interface VerifyResult {
  kind: 'book' | 'subscription';
  status: string;
  /** False while a payment is still pending (e.g. UPI not yet approved). */
  granted: boolean;
  book_id?: string | null;
  expires_at?: string | null;
}

export const getBookAccess = (bookId: string) =>
  apiClient.get<BookAccess>(`/v1/payments/access/${bookId}`);

export const getStorePlans = () => apiClient.get<StorePlan[]>('/v1/payments/plans');

export const getSubscriptionStatus = () =>
  apiClient.get<SubscriptionStatus>('/v1/payments/subscription');

export const verifyGooglePurchase = (productId: string, purchaseToken: string) =>
  apiClient.post<VerifyResult>('/v1/payments/google/verify', {
    product_id: productId,
    purchase_token: purchaseToken,
  });
