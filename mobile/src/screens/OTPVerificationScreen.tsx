import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type OTPRouteProp = RouteProp<RootStackParamList, 'OTPVerification'>;

const OTP_LENGTH = 6;
const AUTO_SUBMIT_DELAY = 3000; // 3 seconds

export function OTPVerificationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OTPRouteProp>();
  const { colors, isDark } = useTheme();
  const { login, sendOTP } = useAuth();

  const { identifier, otp_type } = route.params;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const autoSubmitTimer = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Focus first input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Check if OTP is complete
  const isOtpComplete = otp.every((d) => d !== '');

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (isOtpComplete && !isLoading) {
      setIsAutoSubmitting(true);
      progressAnim.setValue(0);

      // Start progress animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: AUTO_SUBMIT_DELAY,
        useNativeDriver: false,
      }).start();

      // Set timer for auto-submit
      autoSubmitTimer.current = setTimeout(() => {
        handleVerify();
      }, AUTO_SUBMIT_DELAY);
    } else {
      // Cancel auto-submit if OTP changes
      if (autoSubmitTimer.current) {
        clearTimeout(autoSubmitTimer.current);
        autoSubmitTimer.current = null;
      }
      setIsAutoSubmitting(false);
      progressAnim.setValue(0);
    }

    return () => {
      if (autoSubmitTimer.current) {
        clearTimeout(autoSubmitTimer.current);
      }
    };
  }, [otp, isOtpComplete]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (i < OTP_LENGTH) {
          newOtp[i] = char;
        }
      });
      setOtp(newOtp);
      const lastFilledIndex = Math.min(pastedOtp.length - 1, OTP_LENGTH - 1);
      inputRefs.current[lastFilledIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== OTP_LENGTH) {
      Alert.alert('Error', 'Please enter complete OTP');
      return;
    }

    // Cancel auto-submit timer if manually verifying
    if (autoSubmitTimer.current) {
      clearTimeout(autoSubmitTimer.current);
      autoSubmitTimer.current = null;
    }
    setIsAutoSubmitting(false);

    setIsLoading(true);
    try {
      await login({
        identifier,
        otp: otpString,
        otp_type,
      });

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid OTP';
      Alert.alert('Error', message);
      // Clear OTP on error
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await sendOTP({ identifier, otp_type });
      setCountdown(60); // 60 seconds cooldown
      Alert.alert('Success', 'OTP has been resent');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to resend OTP';
      Alert.alert('Error', message);
    } finally {
      setIsResending(false);
    }
  };

  const maskedIdentifier = otp_type === 'email'
    ? identifier.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : identifier.replace(/(.{4})(.*)(.{2})/, '$1****$3');

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

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
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
              <Ionicons
                name={otp_type === 'email' ? 'mail' : 'logo-whatsapp'}
                size={48}
                color={colors.brand.orange}
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Verify OTP</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {maskedIdentifier}
              </Text>
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: digit ? colors.brand.orange : colors.border,
                    color: colors.text,
                  },
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value.replace(/[^0-9]/g, ''), index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                selectTextOnFocus
              />
            ))}
          </View>

          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.brand.orange }]}
              onPress={handleVerify}
              disabled={isLoading || !isOtpComplete}
            >
              {/* Progress bar overlay for auto-submit */}
              {isAutoSubmitting && (
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      width: progressWidth,
                    },
                  ]}
                />
              )}
              <View style={styles.buttonContent}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isAutoSubmitting ? 'Verifying...' : 'Verify & Continue'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: colors.textSecondary }]}>
              Didn't receive the code?{' '}
            </Text>
            {countdown > 0 ? (
              <Text style={[styles.countdown, { color: colors.textSecondary }]}>
                Resend in {countdown}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOTP} disabled={isResending}>
                {isResending ? (
                  <ActivityIndicator size="small" color={colors.brand.orange} />
                ) : (
                  <Text style={[styles.resendLink, { color: colors.brand.orange }]}>
                    Resend OTP
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 48,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  buttonContent: {
    zIndex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 16,
  },
  countdown: {
    fontSize: 16,
    fontWeight: '600',
  },
  resendLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});
