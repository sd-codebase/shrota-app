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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import { SUPPORT_CONTACT } from '../constants/links';

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
  const isWhatsApp = otp_type === 'whatsapp';

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
    // Strip non-digits and get clean value
    const digits = value.replace(/[^0-9]/g, '');

    if (digits.length > 1) {
      // Handle paste / autofill — always fill from box 0
      const newOtp = Array(OTP_LENGTH).fill('');
      for (let i = 0; i < Math.min(digits.length, OTP_LENGTH); i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      const lastFilledIndex = Math.min(digits.length, OTP_LENGTH) - 1;
      inputRefs.current[lastFilledIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digits;
    setOtp(newOtp);

    // Auto-focus next input
    if (digits && index < OTP_LENGTH - 1) {
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

  const maskedIdentifier = isWhatsApp
    ? `+XX ${identifier.slice(0, 2)}****${identifier.slice(-2)}`
    : identifier.replace(/(.{2})(.*)(@.*)/, '$1***$3');

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
                  name={isWhatsApp ? 'logo-whatsapp' : 'mail'}
                  size={48}
                  color={isWhatsApp ? '#25D366' : colors.brand.orange}
                />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Verify OTP</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {isWhatsApp
                  ? `Enter the 6-digit code sent to your WhatsApp\n`
                  : `Enter the 6-digit code sent to\n`}
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
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  selectTextOnFocus
                  autoComplete={index === 0 ? 'sms-otp' : 'off'}
                  textContentType={index === 0 ? 'oneTimeCode' : 'none'}
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

            {/* Always Visible Support Contact */}
            <View style={styles.supportContainer}>
              <Text style={[styles.supportText, { color: colors.textSecondary }]}>
                Need help? Contact us
              </Text>
              <View style={styles.supportButtonsRow}>
                <TouchableOpacity
                  style={[styles.supportBtn, { backgroundColor: colors.card }]}
                  onPress={() => Linking.openURL(SUPPORT_CONTACT.whatsappUrl)}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.supportBtn, { backgroundColor: colors.card }]}
                  onPress={() => Linking.openURL(`tel:${SUPPORT_CONTACT.phone}`)}
                >
                  <Ionicons name="call" size={20} color={colors.brand.blue} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.supportBtn, { backgroundColor: colors.card }]}
                  onPress={() => Linking.openURL(`mailto:${SUPPORT_CONTACT.email}?subject=Shrota App Support - OTP Issue`)}
                >
                  <Ionicons name="mail" size={20} color={colors.brand.orange} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Help Instructions */}
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
                    {isWhatsApp ? (
                      <>
                        {/* WhatsApp Instructions */}
                        <View style={styles.languageSection}>
                          <Text style={[styles.languageTitle, { color: colors.brand.orange }]}>
                            English
                          </Text>
                          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                            Didn't receive OTP on WhatsApp?{'\n'}
                            Please check the following:
                          </Text>
                          <Text style={[styles.instructionText, { color: colors.textSecondary, marginTop: 8 }]}>
                            1. Make sure WhatsApp is installed and active.{'\n'}
                            2. Check if the number you entered is correct.{'\n'}
                            3. Check your WhatsApp messages from Shrota.{'\n'}
                            4. Wait a few seconds - the message may be delayed.{'\n'}
                            5. Try "Resend OTP" if you don't receive it.
                          </Text>
                        </View>

                        <View style={styles.languageSection}>
                          <Text style={[styles.languageTitle, { color: colors.brand.orange }]}>
                            हिंदी
                          </Text>
                          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                            WhatsApp पर OTP नहीं मिला?{'\n'}
                            कृपया निम्नलिखित जांचें:
                          </Text>
                          <Text style={[styles.instructionText, { color: colors.textSecondary, marginTop: 8 }]}>
                            1. सुनिश्चित करें कि WhatsApp इंस्टॉल और एक्टिव है।{'\n'}
                            2. जांचें कि आपने सही नंबर दर्ज किया है।{'\n'}
                            3. Shrota से WhatsApp संदेश जांचें।{'\n'}
                            4. कुछ सेकंड इंतज़ार करें।{'\n'}
                            5. "Resend OTP" दबाएं अगर मैसेज नहीं आए।
                          </Text>
                        </View>

                        <View style={styles.languageSection}>
                          <Text style={[styles.languageTitle, { color: colors.brand.orange }]}>
                            मराठी
                          </Text>
                          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                            WhatsApp वर OTP आला नाही?{'\n'}
                            कृपया खालील तपासा:
                          </Text>
                          <Text style={[styles.instructionText, { color: colors.textSecondary, marginTop: 8 }]}>
                            1. WhatsApp इन्स्टॉल आणि अॅक्टिव्ह आहे का ते तपासा.{'\n'}
                            2. तुम्ही योग्य नंबर टाकला आहे का ते तपासा.{'\n'}
                            3. Shrota कडून WhatsApp संदेश तपासा.{'\n'}
                            4. काही सेकंद प्रतीक्षा करा.{'\n'}
                            5. संदेश आला नाही तर "Resend OTP" दाबा.
                          </Text>
                        </View>
                      </>
                    ) : (
                      <>
                        {/* Email Instructions */}
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

                        <View style={styles.languageSection}>
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
                      </>
                    )}

                    {/* Support Contact Section */}
                    <View style={[styles.supportSection, { borderTopColor: colors.border }]}>
                      <Text style={[styles.supportTitle, { color: colors.textSecondary }]}>
                        Still having trouble? Contact support:
                      </Text>
                      <View style={styles.supportButtons}>
                        <TouchableOpacity
                          style={[styles.supportButton, { backgroundColor: colors.backgroundSecondary }]}
                          onPress={() => Linking.openURL(SUPPORT_CONTACT.whatsappUrl)}
                        >
                          <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.supportButton, { backgroundColor: colors.backgroundSecondary }]}
                          onPress={() => Linking.openURL(`tel:${SUPPORT_CONTACT.phone}`)}
                        >
                          <Ionicons name="call" size={20} color={colors.brand.blue} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.supportButton, { backgroundColor: colors.backgroundSecondary }]}
                          onPress={() => Linking.openURL(`mailto:${SUPPORT_CONTACT.email}?subject=Shrota App Support - OTP Issue`)}
                        >
                          <Ionicons name="mail" size={20} color={colors.brand.orange} />
                        </TouchableOpacity>
                      </View>
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
    width: 44,
    height: 48,
    borderRadius: 10,
    borderWidth: 2,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  button: {
    height: 46,
    borderRadius: 10,
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
  supportSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  supportButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  supportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  supportText: {
    fontSize: 14,
    marginBottom: 12,
  },
  supportButtonsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  supportBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
