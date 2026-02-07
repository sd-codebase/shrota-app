import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { getWhatsAppStatus } from './authApi';
import { navigationRef } from '../navigation';

const REMINDER_KEY = '@shrota_whatsapp_reminder_last';
const REMINDER_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours

function navigateToProfile(action: 'verify-whatsapp' | 'change-whatsapp') {
  navigationRef.current?.navigate('MainTabs' as any, {
    screen: 'Profile',
    params: {
      screen: 'ProfileMain',
      params: { action },
    },
  });
}

/**
 * Check if we should show a WhatsApp verification reminder.
 * Shows an alert with 3 options if:
 * - 24 hours have passed since last reminder
 * - WhatsApp is not verified
 * - OTP has been sent
 */
export async function checkWhatsAppReminder(token: string | null): Promise<void> {
  if (!token) return;

  try {
    // Check 24h cooldown
    const lastReminder = await AsyncStorage.getItem(REMINDER_KEY);
    if (lastReminder) {
      const elapsed = Date.now() - parseInt(lastReminder, 10);
      if (elapsed < REMINDER_INTERVAL) return;
    }

    // Check current status from server
    const status = await getWhatsAppStatus(token);

    if (status.is_whatsapp_verified) return;
    if (!status.otp_sent) return;

    // Update timestamp before showing alert
    await AsyncStorage.setItem(REMINDER_KEY, Date.now().toString());

    // Show reminder alert
    Alert.alert(
      'Verify WhatsApp',
      'Please verify your WhatsApp number to complete your profile.',
      [
        {
          text: 'Remind Me Later',
          style: 'cancel',
        },
        {
          text: 'Change Number',
          style: 'destructive',
          onPress: () => navigateToProfile('change-whatsapp'),
        },
        {
          text: 'Verify',
          style: 'default',
          onPress: () => navigateToProfile('verify-whatsapp'),
        },
      ],
    );
  } catch {
    // Silently fail — don't interrupt user experience
  }
}
