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
  ScrollView,
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

  const { identifier } = route.params;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);

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
        otp_type: 'email',
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
      await sendOTP({ identifier, otp_type: 'email' });
      setCountdown(60); // 60 seconds cooldown
      Alert.alert('Success', 'OTP has been resent');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to resend OTP';
      Alert.alert('Error', message);
    } finally {
      setIsResending(false);
    }
  };

  const maskedIdentifier = identifier.replace(/(.{2})(.*)(@.*)/, '$1***$3');

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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                  name="mail"
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

            {/* Email OTP Instructions */}
            <View style={styles.instructionsContainer}>
                <TouchableOpacity
                  style={styles.instructionsHeader}
                  onPress={() => setInstructionsExpanded(!instructionsExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.instructionsHeaderText, { color: colors.textSecondary }]}>
                    Need help finding OTP?
                  </Text>
                  <Ionicons
                    name={instructionsExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {instructionsExpanded && (
                  <View style={[styles.instructionsContent, { backgroundColor: colors.card }]}>
                    {/* English Instructions */}
                    <View style={styles.languageSection}>
                      <Text style={[styles.languageTitle, { color: colors.brand.orange }]}>
                        English
                      </Text>
                      <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                        Didn't receive OTP in Inbox?{'\n'}
                        Please check your Spam / Junk / Promotions folder.
                      </Text>
                      <Text style={[styles.instructionText, { color: colors.textSecondary, marginTop: 8 }]}>
                        Steps:{'\n'}
                        1. Open your Email app or website.{'\n'}
                        2. Go to Spam / Junk / Promotions.{'\n'}
                        3. Find the email with subject "Shrota Verification Code".{'\n'}
                        4. Open it and copy the OTP.{'\n'}
                        5. Enter the OTP in the app to continue.
                      </Text>
                      <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                        Tip: Mark the email as "Not Spam" to receive future emails in Inbox.
                      </Text>
                    </View>

                    {/* Hindi Instructions */}
                    <View style={styles.languageSection}>
                      <Text style={[styles.languageTitle, { color: colors.brand.orange }]}>
                        हिंदी
                      </Text>
                      <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                        इनबॉक्स में OTP नहीं मिला?{'\n'}
                        कृपया Spam / Junk / Promotions फोल्डर जांचें।
                      </Text>
                      <Text style={[styles.instructionText, { color: colors.textSecondary, marginTop: 8 }]}>
                        कदम:{'\n'}
                        1. अपना ईमेल खोलें।{'\n'}
                        2. Spam / Junk / Promotions फोल्डर में जाएँ।{'\n'}
                        3. "Shrota Verification Code" विषय वाला मेल ढूंढें।{'\n'}
                        4. OTP कॉपी करें।{'\n'}
                        5. ऐप में OTP डालकर आगे बढ़ें।
                      </Text>
                      <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                        सलाह: मेल को "Not Spam" मार्क करें ताकि आगे मेल इनबॉक्स में आए।
                      </Text>
                    </View>

                    {/* Marathi Instructions */}
                    <View style={[styles.languageSection, { marginBottom: 0 }]}>
                      <Text style={[styles.languageTitle, { color: colors.brand.orange }]}>
                        मराठी
                      </Text>
                      <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                        इनबॉक्समध्ये OTP दिसत नाही?{'\n'}
                        कृपया Spam / Junk / Promotions फोल्डर तपासा.
                      </Text>
                      <Text style={[styles.instructionText, { color: colors.textSecondary, marginTop: 8 }]}>
                        स्टेप्स:{'\n'}
                        1. तुमचे ईमेल उघडा.{'\n'}
                        2. Spam / Junk / Promotions मध्ये जा.{'\n'}
                        3. "Shrota Verification Code" असा विषय असलेला मेल शोधा.{'\n'}
                        4. OTP कॉपी करा.{'\n'}
                        5. अॅपमध्ये OTP टाकून पुढे जा.
                      </Text>
                      <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                        टीप: मेलला "Not Spam" करा म्हणजे पुढील मेल इनबॉक्समध्ये मिळतील.
                      </Text>
                    </View>
                  </View>
                )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  instructionsContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  instructionsHeaderText: {
    fontSize: 14,
    marginRight: 4,
  },
  instructionsContent: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  languageSection: {
    marginBottom: 20,
  },
  languageTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  tipText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
