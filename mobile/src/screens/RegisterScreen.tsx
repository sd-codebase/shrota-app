import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import { APP_LINKS } from '../constants/links';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Validate and parse date string in DD/MM/YYYY format
function parseDate(dateStr: string): { valid: boolean; date?: Date; error?: string } {
  if (!dateStr.trim()) {
    return { valid: true }; // Empty is valid (optional field)
  }

  // Remove any non-digit characters and reformat
  const digits = dateStr.replace(/\D/g, '');

  if (digits.length !== 8) {
    return { valid: false, error: 'Enter date as DD/MM/YYYY' };
  }

  const day = parseInt(digits.substring(0, 2), 10);
  const month = parseInt(digits.substring(2, 4), 10);
  const year = parseInt(digits.substring(4, 8), 10);

  // Basic validation
  if (month < 1 || month > 12) {
    return { valid: false, error: 'Invalid month (01-12)' };
  }

  if (day < 1 || day > 31) {
    return { valid: false, error: 'Invalid day (01-31)' };
  }

  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    return { valid: false, error: `Invalid year (1900-${currentYear})` };
  }

  // Create date and validate
  const date = new Date(year, month - 1, day);

  // Check if date is valid (handles cases like Feb 30)
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return { valid: false, error: 'Invalid date' };
  }

  // Check if date is not in the future
  if (date > new Date()) {
    return { valid: false, error: 'Birth date cannot be in the future' };
  }

  return { valid: true, date };
}

// Format date input as user types (DD/MM/YYYY)
function formatDateInput(text: string): string {
  const digits = text.replace(/\D/g, '');

  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return `${digits.substring(0, 2)}/${digits.substring(2)}`;
  } else {
    return `${digits.substring(0, 2)}/${digits.substring(2, 4)}/${digits.substring(4, 8)}`;
  }
}

export function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { register, sendOTP } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [birthDateText, setBirthDateText] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const hasAllContacts = email.trim() && whatsappNumber.trim();
  const hasBirthDate = birthDateText.trim().length === 10;
  const canRegister = hasAllContacts && hasBirthDate && termsAccepted;
  const otpType = 'email'; // Always verify email first
  const identifier = email.trim();

  const handleDateChange = (text: string) => {
    const formatted = formatDateInput(text);
    setBirthDateText(formatted);

    // Clear error while typing
    if (dateError) {
      setDateError(null);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!whatsappNumber.trim()) {
      Alert.alert('Error', 'Please enter your WhatsApp number');
      return;
    }

    if (whatsappNumber.trim().length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit WhatsApp number');
      return;
    }

    // Validate birth date (required)
    if (!birthDateText.trim()) {
      setDateError('Birth date is required');
      return;
    }
    const dateResult = parseDate(birthDateText);
    if (!dateResult.valid) {
      setDateError(dateResult.error || 'Invalid date');
      return;
    }
    if (!dateResult.date) {
      setDateError('Birth date is required');
      return;
    }

    if (!termsAccepted) {
      Alert.alert('Error', 'Please accept the Terms & Conditions and Privacy Policy');
      return;
    }

    setIsLoading(true);
    try {
      // Register user
      await register({
        name: name.trim(),
        email: email.trim() || undefined,
        whatsapp_number: whatsappNumber.trim() || undefined,
        birth_date: `${dateResult.date.getFullYear()}-${String(dateResult.date.getMonth() + 1).padStart(2, '0')}-${String(dateResult.date.getDate()).padStart(2, '0')}`,
      });

      // Send OTP
      await sendOTP({
        identifier: identifier.toLowerCase(),
        otp_type: otpType,
      });

      // Navigate to OTP verification
      navigation.navigate('OTPVerification', {
        identifier: identifier.toLowerCase(),
        otp_type: otpType,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join Shrota and start listening
            </Text>
          </View>

          <View style={styles.form}>
            {/* Name Input */}
            <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.inputBackground, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={24}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Your full name"
                placeholderTextColor={colors.placeholder}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Email Input */}
            <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.inputBackground, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={24}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="your@email.com"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* WhatsApp Input */}
            <Text style={[styles.label, { color: colors.text }]}>WhatsApp Number *</Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.inputBackground, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="logo-whatsapp"
                size={24}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="9876543210"
                placeholderTextColor={colors.placeholder}
                value={whatsappNumber}
                onChangeText={setWhatsappNumber}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              Enter 10-digit Indian number without country code
            </Text>

            {/* Birth Date Input */}
            <Text style={[styles.label, { color: colors.text }]}>Birth Date *</Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.inputBackground, borderColor: dateError ? colors.brand.red : colors.border },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={24}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={colors.placeholder}
                value={birthDateText}
                onChangeText={handleDateChange}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
            {dateError && (
              <Text style={[styles.errorText, { color: colors.brand.red }]}>{dateError}</Text>
            )}

            {/* Terms & Conditions Checkbox */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setTermsAccepted(!termsAccepted)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: termsAccepted ? colors.brand.orange : colors.textSecondary,
                    backgroundColor: termsAccepted ? colors.brand.orange : colors.inputBackground,
                  },
                ]}
              >
                {termsAccepted && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                I agree to the{' '}
                <Text
                  style={[styles.termsLink, { color: colors.brand.orange }]}
                  onPress={() => Linking.openURL(APP_LINKS.termsAndConditions)}
                >
                  Terms & Conditions
                </Text>
                {' '}and{' '}
                <Text
                  style={[styles.termsLink, { color: colors.brand.orange }]}
                  onPress={() => Linking.openURL(APP_LINKS.privacyPolicy)}
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: canRegister ? colors.brand.orange : colors.border },
              ]}
              onPress={handleRegister}
              disabled={isLoading || !canRegister}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginLink, { color: colors.brand.orange }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backButton: {
    marginTop: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  hintText: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '600',
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});
