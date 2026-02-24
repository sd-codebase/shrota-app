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
  Image,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import { SUPPORT_CONTACT } from '../constants/links';
import { CountryCodePicker, DEFAULT_COUNTRY_CODE } from '../components/CountryCodePicker';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type LoginMode = 'whatsapp' | 'email';

export function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { sendOTP } = useAuth();

  const [loginMode, setLoginMode] = useState<LoginMode>('whatsapp');
  const [identifier, setIdentifier] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    if (loginMode === 'whatsapp') {
      if (!identifier.trim() || identifier.trim().length !== 10) {
        Alert.alert('Error', 'Please enter a valid 10-digit WhatsApp number');
        return;
      }

      setIsLoading(true);
      try {
        await sendOTP({
          identifier: identifier.trim(),
          otp_type: 'whatsapp',
        });

        navigation.navigate('OTPVerification', {
          identifier: identifier.trim(),
          otp_type: 'whatsapp',
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to send OTP';
        Alert.alert('Error', message);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!identifier.trim()) {
        Alert.alert('Error', 'Please enter your email');
        return;
      }

      setIsLoading(true);
      try {
        await sendOTP({
          identifier: identifier.trim().toLowerCase(),
          otp_type: 'email',
        });

        navigation.navigate('OTPVerification', {
          identifier: identifier.trim().toLowerCase(),
          otp_type: 'email',
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to send OTP';
        Alert.alert('Error', message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const switchMode = () => {
    setIdentifier('');
    setLoginMode(loginMode === 'whatsapp' ? 'email' : 'whatsapp');
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
          <View style={styles.content}>
            <View style={styles.header}>
              <Image
                source={require('../../assets/shrota-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={[styles.title, { color: colors.text }]}>Welcome to Shrota</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {loginMode === 'whatsapp'
                  ? 'Sign in with your WhatsApp number'
                  : 'Sign in with your email'}
              </Text>
            </View>

            <View style={styles.form}>
              {loginMode === 'whatsapp' ? (
                <View style={styles.phoneRow}>
                  <CountryCodePicker
                    value={countryCode}
                    onChange={setCountryCode}
                  />
                  <View
                    style={[
                      styles.inputContainer,
                      styles.phoneInput,
                      { backgroundColor: colors.inputBackground, borderColor: colors.border },
                    ]}
                  >
                    <Ionicons
                      name="logo-whatsapp"
                      size={24}
                      color="#25D366"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="WhatsApp number"
                      placeholderTextColor={colors.placeholder}
                      value={identifier}
                      onChangeText={(text) => setIdentifier(text.replace(/\D/g, '').slice(0, 10))}
                      keyboardType="number-pad"
                      maxLength={10}
                    />
                  </View>
                </View>
              ) : (
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
                    placeholder="Email"
                    placeholderTextColor={colors.placeholder}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.brand.orange }]}
                onPress={handleSendOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.switchModeContainer} onPress={switchMode}>
                <Text style={[styles.switchModeText, { color: colors.brand.orange }]}>
                  {loginMode === 'whatsapp'
                    ? 'Use Email to login'
                    : 'Use WhatsApp to login'}
                </Text>
              </TouchableOpacity>

              <View style={styles.registerContainer}>
                <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={[styles.registerLink, { color: colors.brand.orange }]}>
                    Register
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Support Contact Section */}
              <View style={styles.supportContainer}>
                <Text style={[styles.supportText, { color: colors.textSecondary }]}>
                  Need help? Contact us
                </Text>
                <View style={styles.supportButtons}>
                  <TouchableOpacity
                    style={[styles.supportButton, { backgroundColor: colors.card }]}
                    onPress={() => Linking.openURL(SUPPORT_CONTACT.whatsappUrl)}
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.supportButton, { backgroundColor: colors.card }]}
                    onPress={() => Linking.openURL(`tel:${SUPPORT_CONTACT.phone}`)}
                  >
                    <Ionicons name="call" size={20} color={colors.brand.blue} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.supportButton, { backgroundColor: colors.card }]}
                    onPress={() => Linking.openURL(`mailto:${SUPPORT_CONTACT.email}?subject=Shrota App Support`)}
                  >
                    <Ionicons name="mail" size={20} color={colors.brand.orange} />
                  </TouchableOpacity>
                </View>
              </View>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  button: {
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchModeContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  switchModeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 16,
  },
  registerLink: {
    fontSize: 16,
    fontWeight: '600',
  },
  supportContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  supportText: {
    fontSize: 14,
    marginBottom: 12,
  },
  supportButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  supportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
