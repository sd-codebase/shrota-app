import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { getWhatsAppStatus } from './authApi';
import { navigate } from '../navigation';

const REMINDER_KEY = '@shrota_whatsapp_reminder_last';
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

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
      if (elapsed < TWENTY_FOUR_HOURS) return;
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
          text: 'Change Number',
          onPress: () => {
            navigate('MainTabs', undefined);
          },
        },
        {
          text: 'Verify',
          onPress: () => {
            navigate('MainTabs', undefined);
          },
        },
        {
          text: 'Remind Me Later',
          style: 'cancel',
        },
      ],
    );
  } catch {
    // Silently fail — don't interrupt user experience
  }
}
