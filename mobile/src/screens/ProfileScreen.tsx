import React, { useState, useEffect, useCallback } from 'react';
import * as Application from 'expo-application';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, CompositeNavigationProp, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MiniPlayer } from '../components/MiniPlayer';
import { PreferencesModal } from '../components/PreferencesModal';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList, ProfileStackParamList, Genre, Language, UpdateProfilePayload } from '../types';
import { getUserPreferences, UserPreferences } from '../services/preferencesService';
import { fetchGenres, fetchLanguages } from '../services/api';
import { deactivateAccount, updateProfile, verifyWhatsAppOTP, sendChangeWhatsAppOTP, verifyChangeWhatsApp } from '../services/authApi';
import { APP_LINKS, SOCIAL_LINKS, SUPPORT_CONTACT } from '../constants/links';
import { CountryCodePicker } from '../components/CountryCodePicker';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<ProfileStackParamList, 'ProfileMain'>>();
  const { currentBook } = usePlayer();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, token, logout, refreshUser } = useAuth();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferencesInitialStep, setPreferencesInitialStep] = useState<'genres' | 'languages'>('genres');

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    address: '',
    village_landmark: '',
    tahsil_city: '',
    district: '',
    state: '',
    pin_code: '',
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [pinCodeError, setPinCodeError] = useState('');

  // WhatsApp verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [editingWhatsApp, setEditingWhatsApp] = useState(false);
  const [whatsappInput, setWhatsappInput] = useState('');
  const [whatsappCountryCode, setWhatsappCountryCode] = useState(user?.country_code || '91');
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);

  // Handle action param from reminder alert navigation
  useFocusEffect(
    useCallback(() => {
      const action = route.params?.action;
      if (!action) return;

      if (action === 'verify-whatsapp') {
        setWhatsappInput(user?.whatsapp_number || '');
        setWhatsappCountryCode(user?.country_code || '91');
        handleSendVerifyOtp();
      } else if (action === 'change-whatsapp') {
        setWhatsappInput('');
        setWhatsappCountryCode(user?.country_code || '91');
        setEditingWhatsApp(true);
      }

      // Clear the param so it doesn't re-trigger
      navigation.setParams({ action: undefined } as any);
    }, [route.params?.action])
  );

  const loadPreferences = useCallback(async () => {
    try {
      setLoadingPreferences(true);
      const [prefs, genresData, languagesData] = await Promise.all([
        getUserPreferences(),
        fetchGenres(),
        fetchLanguages(),
      ]);
      setPreferences(prefs);
      setGenres(genresData);
      setLanguages(languagesData);
    } catch {
      // Ignore load errors
    } finally {
      setLoadingPreferences(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPreferences();
    }, [loadPreferences])
  );

  const getLanguageNames = (languageIds: string[]) => {
    if (!languageIds || languageIds.length === 0) return 'Not set';
    const names = languageIds
      .map(id => languages.find(l => l.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    return names || 'Not set';
  };

  const getGenreNames = (genreIds: string[]) => {
    if (!genreIds || genreIds.length === 0) return 'Not set';
    const names = genreIds
      .map(id => genres.find(g => g.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    return names || 'Not set';
  };

  const handlePreferencesComplete = () => {
    setShowPreferencesModal(false);
    loadPreferences();
  };

  const openAddressModal = () => {
    setAddressForm({
      address: user?.address || '',
      village_landmark: user?.village_landmark || '',
      tahsil_city: user?.tahsil_city || '',
      district: user?.district || '',
      state: user?.state || '',
      pin_code: user?.pin_code || '',
    });
    setPinCodeError('');
    setShowAddressModal(true);
  };

  const validatePinCode = (pinCode: string): boolean => {
    if (pinCode === '') return true;
    return /^\d{6}$/.test(pinCode);
  };

  const handleSaveAddress = async () => {
    if (addressForm.pin_code && !validatePinCode(addressForm.pin_code)) {
      setPinCodeError('Pin code must be exactly 6 digits');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'You must be logged in to update your address.');
      return;
    }

    setSavingAddress(true);
    try {
      const payload: UpdateProfilePayload = {};
      if (addressForm.address !== (user?.address || '')) payload.address = addressForm.address || undefined;
      if (addressForm.village_landmark !== (user?.village_landmark || '')) payload.village_landmark = addressForm.village_landmark || undefined;
      if (addressForm.tahsil_city !== (user?.tahsil_city || '')) payload.tahsil_city = addressForm.tahsil_city || undefined;
      if (addressForm.district !== (user?.district || '')) payload.district = addressForm.district || undefined;
      if (addressForm.state !== (user?.state || '')) payload.state = addressForm.state || undefined;
      if (addressForm.pin_code !== (user?.pin_code || '')) payload.pin_code = addressForm.pin_code || undefined;

      if (Object.keys(payload).length === 0) {
        setShowAddressModal(false);
        return;
      }

      await updateProfile(token, payload);
      await refreshUser();
      setShowAddressModal(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save address. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSendVerifyOtp = async () => {
    const number = whatsappInput || user?.whatsapp_number;
    const cc = whatsappCountryCode || user?.country_code || '91';
    if (!number || number.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit WhatsApp number');
      return;
    }
    if (!token) return;

    setSendingOtp(true);
    try {
      await sendChangeWhatsAppOTP(token, {
        whatsapp_number: number,
        country_code: cc,
      });
      setOtpInput('');
      setShowOtpModal(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      Alert.alert('Error', message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpInput.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit OTP');
      return;
    }
    if (!token) return;

    const number = whatsappInput || user?.whatsapp_number || '';
    const cc = whatsappCountryCode || user?.country_code || '91';

    setVerifyingOtp(true);
    try {
      await verifyChangeWhatsApp(token, {
        whatsapp_number: number,
        country_code: cc,
        otp: otpInput,
      });
      await refreshUser();
      setShowOtpModal(false);
      setEditingWhatsApp(false);
      setOtpInput('');
      Alert.alert('Success', 'WhatsApp number verified successfully!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to verify OTP';
      Alert.alert('Error', message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSaveWhatsApp = async () => {
    if (whatsappInput.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit WhatsApp number');
      return;
    }
    if (!token) return;

    // Send OTP to the new number for verification
    await handleSendVerifyOtp();
  };

  const getFormattedAddress = () => {
    const parts = [
      user?.address,
      user?.village_landmark,
      user?.tahsil_city,
      user?.district,
      user?.state,
      user?.pin_code,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const handleMiniPlayerPress = () => {
    if (currentBook) {
      navigation.navigate('Player', { book: currentBook });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            (navigation as any).reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? You will not be able to login again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!token) {
                Alert.alert('Error', 'You must be logged in to delete your account.');
                return;
              }
              await deactivateAccount(token);
              await logout();
              (navigation as any).reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : 'Failed to delete account. Please try again.';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    // Parse YYYY-MM-DD format manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dd = String(day).padStart(2, '0');
    const mmm = months[month - 1];
    return `${dd} ${mmm} ${year}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          currentBook && styles.scrollContentWithPlayer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.brand.orange }]}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {user?.name || 'User'}
          </Text>

          <View style={styles.profileDetails}>
            {user?.email && (
              <View style={styles.profileRow}>
                <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.profileDetail, { color: colors.textSecondary }]}>
                  {user.email}
                </Text>
                {user.is_email_verified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.brand.green }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </View>
            )}
            {/* WhatsApp Number */}
            <View style={styles.profileRow}>
              <Ionicons name="logo-whatsapp" size={18} color={colors.textSecondary} />
              {editingWhatsApp ? (
                <View style={{ flex: 1, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <CountryCodePicker
                      value={whatsappCountryCode}
                      onChange={setWhatsappCountryCode}
                    />
                    <TextInput
                      style={[
                        styles.profileDetail,
                        {
                          color: colors.text,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.brand.orange,
                          flex: 1,
                          paddingVertical: 2,
                        },
                      ]}
                      value={whatsappInput}
                      onChangeText={(text) => setWhatsappInput(text.replace(/\D/g, '').slice(0, 10))}
                      keyboardType="number-pad"
                      placeholder="WhatsApp number"
                      placeholderTextColor={colors.placeholder}
                      maxLength={10}
                      autoFocus
                    />
                    <TouchableOpacity onPress={handleSaveWhatsApp} disabled={savingWhatsApp || sendingOtp}>
                      {savingWhatsApp || sendingOtp ? (
                        <ActivityIndicator size="small" color={colors.brand.orange} />
                      ) : (
                        <Ionicons name="checkmark-circle" size={24} color={colors.brand.green} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingWhatsApp(false)}>
                      <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={[styles.profileDetail, { color: colors.textSecondary }]}>
                    {user?.whatsapp_number || 'Not set'}
                  </Text>
                  {user?.is_whatsapp_verified ? (
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          setWhatsappInput('');
                          setWhatsappCountryCode(user.country_code || '91');
                          setEditingWhatsApp(true);
                        }}
                      >
                        <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <View style={[styles.verifiedBadge, { backgroundColor: colors.brand.green }]}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    </>
                  ) : user?.whatsapp_number ? (
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          setWhatsappInput(user.whatsapp_number || '');
                          setWhatsappCountryCode(user.country_code || '91');
                          handleSendVerifyOtp();
                        }}
                        disabled={sendingOtp}
                        style={[styles.verifyButton, { backgroundColor: colors.brand.orange }]}
                      >
                        {sendingOtp ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.verifyButtonText}>Verify Now</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setWhatsappInput(user.whatsapp_number || '');
                          setWhatsappCountryCode(user.country_code || '91');
                          setEditingWhatsApp(true);
                        }}
                      >
                        <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </>
                  ) : null}
                </>
              )}
            </View>

            {user?.birth_date && (
              <View style={styles.profileRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.profileDetail, { color: colors.textSecondary }]}>
                  {formatDate(user.birth_date)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Address Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          ADDRESS
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.preferenceRow}
            onPress={openAddressModal}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="location-outline" size={20} color={colors.brand.orange} />
              </View>
              <View style={styles.preferenceInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {getFormattedAddress() ? 'Edit Address' : 'Add Address'}
                </Text>
                <Text
                  style={[styles.settingDescription, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {getFormattedAddress() || 'Tap to add your address'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          PREFERENCES
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.preferenceRow}
            onPress={() => {
              setPreferencesInitialStep('languages');
              setShowPreferencesModal(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={{ width: 20, height: 20, position: 'relative' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.brand.orange, position: 'absolute', top: -1, left: 0 }}>अ</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.brand.orange, position: 'absolute', bottom: -1, right: 0 }}>A</Text>
                </View>
              </View>
              <View style={styles.preferenceInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Languages
                </Text>
                <Text
                  style={[styles.settingDescription, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {loadingPreferences ? 'Loading...' : (preferences ? getLanguageNames(preferences.languageIds) : 'Not set')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.preferenceRow}
            onPress={() => {
              setPreferencesInitialStep('genres');
              setShowPreferencesModal(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="library-outline" size={20} color={colors.brand.blue} />
              </View>
              <View style={styles.preferenceInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Favorite Genres
                </Text>
                <Text
                  style={[styles.settingDescription, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {loadingPreferences ? 'Loading...' : (preferences ? getGenreNames(preferences.genreIds) : 'Not set')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          APPEARANCE
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons
                  name={isDark ? 'moon' : 'sunny'}
                  size={20}
                  color={colors.brand.orange}
                />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Dark Mode
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.brand.orange }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Support Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          SUPPORT
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => openLink(SUPPORT_CONTACT.whatsappUrl)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>WhatsApp Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => openLink(`tel:${SUPPORT_CONTACT.phone}`)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="call" size={20} color={colors.brand.blue} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Call Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => openLink(`mailto:${SUPPORT_CONTACT.email}?subject=Shrota App Support`)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="mail" size={20} color={colors.brand.orange} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Email Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Links Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          LINKS
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => openLink(APP_LINKS.website)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="globe-outline" size={20} color={colors.brand.blue} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Website</Text>
            </View>
            <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => openLink(APP_LINKS.privacyPolicy)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.brand.green} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => openLink(APP_LINKS.termsAndConditions)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="document-text-outline" size={20} color={colors.brand.blue} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Terms & Conditions</Text>
            </View>
            <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => openLink(APP_LINKS.contact)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="mail-outline" size={20} color={colors.brand.orange} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Contact</Text>
            </View>
            <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => openLink(APP_LINKS.vulnerabilityDisclosure)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="shield-outline" size={20} color="#9333EA" />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Vulnerability Disclosure</Text>
            </View>
            <Ionicons name="open-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Connect With Us Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          CONNECT WITH US
        </Text>
        <View style={styles.socialContainer}>
          {SOCIAL_LINKS.map((link) => (
            <TouchableOpacity
              key={link.key}
              style={[styles.socialButton, { backgroundColor: colors.card }]}
              onPress={() => openLink(link.url)}
              activeOpacity={0.7}
            >
              <Ionicons name={link.icon as any} size={24} color={link.color} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.card }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color={colors.brand.red} />
          <Text style={[styles.logoutText, { color: colors.brand.red }]}>
            Logout
          </Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={[styles.appVersionText, { color: colors.textSecondary }]}>
          App Version: {Application.nativeApplicationVersion || '1.0.0'}
        </Text>

        {/* Delete Account Link */}
        <TouchableOpacity
          style={styles.deleteAccountLink}
          onPress={handleDeleteAccount}
        >
          <Text style={[styles.deleteAccountLinkText, { color: colors.textSecondary }]}>
            Delete My Account
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <MiniPlayer onPress={handleMiniPlayerPress} />

      <PreferencesModal
        visible={showPreferencesModal}
        onComplete={handlePreferencesComplete}
        onClose={() => setShowPreferencesModal(false)}
        initialGenreIds={preferences?.genreIds || []}
        initialLanguageIds={preferences?.languageIds || []}
        isEditing={true}
        initialStep={preferencesInitialStep}
      />

      {/* Address Edit Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Address</Text>
              <TouchableOpacity
                onPress={() => setShowAddressModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Address</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.textArea,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                  ]}
                  value={addressForm.address}
                  onChangeText={(text) => setAddressForm((prev) => ({ ...prev, address: text }))}
                  placeholder="Enter your address"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Village / Landmark</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                  ]}
                  value={addressForm.village_landmark}
                  onChangeText={(text) => setAddressForm((prev) => ({ ...prev, village_landmark: text }))}
                  placeholder="Enter village or landmark"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={200}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tahsil / City</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                  ]}
                  value={addressForm.tahsil_city}
                  onChangeText={(text) => setAddressForm((prev) => ({ ...prev, tahsil_city: text }))}
                  placeholder="Enter tahsil or city"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>District</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                  ]}
                  value={addressForm.district}
                  onChangeText={(text) => setAddressForm((prev) => ({ ...prev, district: text }))}
                  placeholder="Enter district"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>State</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                  ]}
                  value={addressForm.state}
                  onChangeText={(text) => setAddressForm((prev) => ({ ...prev, state: text }))}
                  placeholder="Enter state"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Pin Code</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                    pinCodeError ? { borderColor: colors.brand.red } : {},
                  ]}
                  value={addressForm.pin_code}
                  onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9]/g, '');
                    setAddressForm((prev) => ({ ...prev, pin_code: numericText }));
                    if (pinCodeError) setPinCodeError('');
                  }}
                  placeholder="Enter 6-digit pin code"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={6}
                />
                {pinCodeError ? (
                  <Text style={[styles.errorText, { color: colors.brand.red }]}>{pinCodeError}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: colors.brand.orange },
                  savingAddress && { opacity: 0.7 },
                ]}
                onPress={handleSaveAddress}
                disabled={savingAddress}
              >
                {savingAddress ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Address</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* WhatsApp OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOtpModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Verify WhatsApp</Text>
              <TouchableOpacity
                onPress={() => setShowOtpModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 16 }]}>
              Enter the 6-digit OTP sent to your WhatsApp number
            </Text>

            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                  fontSize: 24,
                  letterSpacing: 8,
                  textAlign: 'center',
                },
              ]}
              value={otpInput}
              onChangeText={(text) => setOtpInput(text.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor={colors.textSecondary}
              autoFocus
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: otpInput.length === 6 ? colors.brand.orange : colors.border },
                verifyingOtp && { opacity: 0.7 },
              ]}
              onPress={handleVerifyOtp}
              disabled={verifyingOtp || otpInput.length !== 6}
            >
              {verifyingOtp ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  scrollContentWithPlayer: {
    paddingBottom: 160,
  },
  profileCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  profileDetails: {
    width: '100%',
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileDetail: {
    fontSize: 15,
    flex: 1,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  appVersionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  deleteAccountLink: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  deleteAccountLinkText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalScroll: {
    flexGrow: 0,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
