import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBilling, type PlanOffer } from '../context/BillingContext';
import { RootStackParamList } from '../types';
import { getStorePlans, getSubscriptionStatus, type SubscriptionStatus } from '../services/paymentsApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Subscription'>;

const PERIOD_LABELS: Record<string, string> = {
  P1M: 'month',
  P3M: '3 months',
  P6M: '6 months',
  P1Y: 'year',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function SubscriptionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const billing = useBilling();
  const [offers, setOffers] = useState<PlanOffer[]>([]);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingPlanId, setPayingPlanId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [plans, current] = await Promise.all([getStorePlans(), getSubscriptionStatus()]);
      setStatus(current);
      setOffers(await billing.getPlanOffers(plans));
    } catch (e: any) {
      setError(e?.detail || e?.message || 'Could not load subscription plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSubscribe = async (offer: PlanOffer) => {
    if (payingPlanId) return;
    setPayingPlanId(offer.plan.id);
    try {
      const outcome = await billing.subscribe(offer);
      if (outcome.status === 'granted') {
        await load();
        Alert.alert('Subscribed!', 'You can now listen to every subscriber audiobook.', [
          { text: 'Start listening', onPress: () => navigation.goBack() },
        ]);
      } else if (outcome.status === 'pending') {
        Alert.alert('Payment pending', "We'll unlock your subscription as soon as Google Play confirms the payment.");
      } else if (outcome.status === 'failed') {
        Alert.alert('Subscription failed', outcome.message);
      }
    } finally {
      setPayingPlanId(null);
    }
  };

  const handleManage = () => {
    billing.manageSubscription(status?.play_product_id).catch(() =>
      Alert.alert('Could not open Google Play', 'Open Play Store → Profile → Payments & subscriptions.'),
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Subscription</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand.orange} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { borderColor: colors.brand.orange }]} onPress={load}>
            <Text style={{ color: colors.brand.orange, fontWeight: '600' }}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {status?.is_active ? (
            <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.brand.green }]}>
              <View style={styles.statusRow}>
                <Ionicons name="checkmark-circle" size={28} color={colors.brand.green} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusTitle, { color: colors.text }]}>
                    {status.plan_name ? `${status.plan_name} — active` : 'Subscription active'}
                  </Text>
                  {status.expires_at && (
                    <Text style={[styles.statusSub, { color: colors.textSecondary }]}>
                      {status.auto_renewing
                        ? `Renews on ${formatDate(status.expires_at)}`
                        : `Ends on ${formatDate(status.expires_at)} — auto-renew is off`}
                    </Text>
                  )}
                  {status.status === 'grace_period' && (
                    <Text style={[styles.statusSub, { color: colors.brand.red }]}>
                      Your last payment failed. Update your payment method in Google Play to keep listening.
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity style={[styles.manageButton, { borderColor: colors.border }]} onPress={handleManage}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>Manage in Google Play</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.intro, { color: colors.textSecondary }]}>
              Listen to every subscriber audiobook. Renews automatically through Google Play — cancel anytime
              in Play Store.
            </Text>
          )}

          {!status?.is_active &&
            (offers.length === 0 ? (
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                No subscription plans are available right now.
              </Text>
            ) : (
              offers.map((offer) => (
                <View key={offer.plan.id} style={[styles.planCard, { backgroundColor: colors.card }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, { color: colors.text }]}>{offer.plan.name}</Text>
                    <Text style={[styles.planMeta, { color: colors.textSecondary }]}>
                      {offer.displayPrice} / {PERIOD_LABELS[offer.plan.billing_period] ?? offer.plan.billing_period}
                    </Text>
                    {offer.plan.description ? (
                      <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                        {offer.plan.description}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.buyButton,
                      { backgroundColor: colors.brand.orange },
                      payingPlanId !== null && payingPlanId !== offer.plan.id && { opacity: 0.5 },
                    ]}
                    onPress={() => handleSubscribe(offer)}
                    disabled={payingPlanId !== null}
                  >
                    {payingPlanId === offer.plan.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.buyButtonText}>Subscribe</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backButton: { padding: 8, width: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { padding: 16, gap: 12 },
  intro: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  message: { fontSize: 15, textAlign: 'center', marginTop: 16 },
  retryButton: { marginTop: 16, borderWidth: 1, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  statusCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusTitle: { fontSize: 16, fontWeight: '700' },
  statusSub: { fontSize: 13, marginTop: 4 },
  manageButton: { borderWidth: 1, borderRadius: 20, paddingVertical: 10, alignItems: 'center' },
  planCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12 },
  planName: { fontSize: 17, fontWeight: '700' },
  planMeta: { fontSize: 15, marginTop: 4 },
  planDescription: { fontSize: 13, marginTop: 6 },
  buyButton: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, minWidth: 104, alignItems: 'center' },
  buyButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
