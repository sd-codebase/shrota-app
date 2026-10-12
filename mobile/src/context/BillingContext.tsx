import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef } from 'react';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  deepLinkToSubscriptions,
  ErrorCode,
  type Purchase,
} from 'expo-iap';
import { useAuth } from './AuthContext';
import { useFeatureFlags } from './FeatureFlagsContext';
import { verifyGooglePurchase, type StorePlan, type VerifyResult } from '../services/paymentsApi';

/**
 * Google Play Billing for the whole app.
 *
 * One purchase listener lives here, not in screens: Play can deliver a
 * purchase at any time — a UPI payment approved minutes later, or one left
 * unfinished last session — and each must still be verified on the server
 * (which unlocks and acknowledges it) and then finished on the device.
 */

const PACKAGE_NAME = 'com.shrota.app';

export type BuyOutcome =
  | { status: 'granted'; result: VerifyResult }
  | { status: 'pending' }
  | { status: 'cancelled' }
  | { status: 'failed'; message: string };

export interface PlanOffer {
  plan: StorePlan;
  /** Localised price from Play, e.g. "₹99.00". */
  displayPrice: string;
  offerToken: string;
}

interface BillingContextType {
  /** Localised Play price for a book product, or null if Play doesn't have it. */
  getBookPrice: (productId: string) => Promise<string | null>;
  getPlanOffers: (plans: StorePlan[]) => Promise<PlanOffer[]>;
  buyBook: (productId: string) => Promise<BuyOutcome>;
  subscribe: (offer: PlanOffer) => Promise<BuyOutcome>;
  /** Re-verify everything Play says this Google account owns. Returns how many unlocked. */
  restorePurchases: () => Promise<number>;
  manageSubscription: (productId?: string | null) => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

type Waiter = { resolve: (outcome: BuyOutcome) => void };

// expo-iap has two PurchaseError shapes (listener vs thrown); both carry these.
type StoreError = { code?: string | null; message?: string | null };

function describeError(error: StoreError): BuyOutcome {
  if (error.code === ErrorCode.UserCancelled) return { status: 'cancelled' };
  if (error.code === ErrorCode.AlreadyOwned) {
    return { status: 'failed', message: 'You already own this. Use "Restore purchases" in your Profile.' };
  }
  return { status: 'failed', message: error.message || 'The purchase could not be completed.' };
}

export function BillingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Users without in-app purchases switched on never talk to Play Billing.
  const paymentsEnabled = useFeatureFlags().isEnabled('payments');
  const connected = useRef<Promise<boolean> | null>(null);
  // Screens awaiting the result of a purchase they started, by product id.
  const waiters = useRef(new Map<string, Waiter>());

  const ensureConnected = useCallback(async () => {
    if (!connected.current) {
      connected.current = initConnection().then(
        () => true,
        (error) => {
          connected.current = null;
          throw error;
        },
      );
    }
    return connected.current;
  }, []);

  const settle = (productId: string, outcome: BuyOutcome) => {
    const waiter = waiters.current.get(productId);
    if (waiter) {
      waiters.current.delete(productId);
      waiter.resolve(outcome);
    }
  };

  /** Verify with our server, then finish it with Play. Safe to repeat. */
  const handlePurchase = useCallback(async (purchase: Purchase): Promise<VerifyResult | null> => {
    if (!purchase.purchaseToken) return null;
    if (purchase.purchaseState === 'pending') {
      settle(purchase.productId, { status: 'pending' });
      return null;
    }
    try {
      const result = await verifyGooglePurchase(purchase.productId, purchase.purchaseToken);
      if (result.granted) {
        // The server has already acknowledged it; this also clears it from
        // Play's unfinished queue. Never consume: books and subs are kept.
        await finishTransaction({ purchase, isConsumable: false }).catch(() => {});
        settle(purchase.productId, { status: 'granted', result });
      } else {
        settle(purchase.productId, { status: 'pending' });
      }
      return result;
    } catch (error: any) {
      settle(purchase.productId, {
        status: 'failed',
        message: error?.detail || error?.message || 'Could not confirm the purchase. Try "Restore purchases" in your Profile.',
      });
      return null;
    }
  }, []);

  useEffect(() => {
    if (!user || !paymentsEnabled) return;
    let active = true;
    const updated = purchaseUpdatedListener((purchase) => {
      if (active) handlePurchase(purchase);
    });
    const failed = purchaseErrorListener((error) => {
      const outcome = describeError(error);
      if (error.productId) {
        settle(error.productId, outcome);
      } else {
        // No product on the error: fail whatever is waiting.
        for (const id of Array.from(waiters.current.keys())) settle(id, outcome);
      }
    });

    // Pick up purchases left unfinished (app killed mid-purchase, pending UPI).
    ensureConnected()
      .then(() => getAvailablePurchases())
      .then((purchases) => purchases.forEach((p) => handlePurchase(p)))
      .catch((error) => console.log('[Billing] startup check skipped:', error?.message));

    return () => {
      active = false;
      updated.remove();
      failed.remove();
    };
  }, [user?.id, paymentsEnabled, ensureConnected, handlePurchase]);

  useEffect(() => () => {
    endConnection().catch(() => {});
  }, []);

  const startPurchase = async (productId: string, launch: () => Promise<unknown>): Promise<BuyOutcome> => {
    if (!user) return { status: 'failed', message: 'Please sign in first.' };
    await ensureConnected();
    const outcome = new Promise<BuyOutcome>((resolve) => waiters.current.set(productId, { resolve }));
    try {
      await launch();
    } catch (error: any) {
      settle(productId, describeError(error));
    }
    return outcome;
  };

  // Binds the purchase to this Shrota account; the server rejects tokens
  // whose account id doesn't match the signed-in user.
  const accountId = () => (user ? user.id.replace(/-/g, '') : undefined);

  const value: BillingContextType = {
    getBookPrice: async (productId) => {
      await ensureConnected();
      const products = await fetchProducts({ skus: [productId], type: 'in-app' });
      const product = products?.find((p) => p.id === productId);
      return product?.displayPrice ?? null;
    },

    getPlanOffers: async (plans) => {
      if (plans.length === 0) return [];
      await ensureConnected();
      const products = (await fetchProducts({ skus: plans.map((p) => p.play_product_id), type: 'subs' })) ?? [];
      const offers: PlanOffer[] = [];
      for (const plan of plans) {
        const product = products.find((p) => p.id === plan.play_product_id);
        const offer = product?.subscriptionOffers?.find(
          (o) => o.basePlanIdAndroid === plan.play_base_plan_id && o.offerTokenAndroid,
        );
        if (offer?.offerTokenAndroid) {
          offers.push({ plan, displayPrice: offer.displayPrice, offerToken: offer.offerTokenAndroid });
        }
      }
      return offers;
    },

    buyBook: (productId) =>
      startPurchase(productId, () =>
        requestPurchase({
          request: { google: { skus: [productId], obfuscatedAccountId: accountId() } },
          type: 'in-app',
        }),
      ),

    subscribe: (offer) =>
      startPurchase(offer.plan.play_product_id, () =>
        requestPurchase({
          request: {
            google: {
              skus: [offer.plan.play_product_id],
              subscriptionOffers: [{ sku: offer.plan.play_product_id, offerToken: offer.offerToken }],
              obfuscatedAccountId: accountId(),
            },
          },
          type: 'subs',
        }),
      ),

    restorePurchases: async () => {
      await ensureConnected();
      const purchases = await getAvailablePurchases();
      let unlocked = 0;
      for (const purchase of purchases) {
        const result = await handlePurchase(purchase);
        if (result?.granted) unlocked += 1;
      }
      return unlocked;
    },

    manageSubscription: async (productId) => {
      await deepLinkToSubscriptions({
        packageNameAndroid: PACKAGE_NAME,
        skuAndroid: productId ?? undefined,
      });
    },
  };

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
}
