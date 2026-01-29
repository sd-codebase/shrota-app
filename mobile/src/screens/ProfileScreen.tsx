import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MiniPlayer } from '../components/MiniPlayer';
import { PreferencesModal } from '../components/PreferencesModal';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList, ProfileStackParamList, Genre, Language } from '../types';
import { getUserPreferences, UserPreferences } from '../services/preferencesService';
import { fetchGenres, fetchLanguages } from '../services/api';
import { deactivateAccount } from '../services/authApi';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { currentBook } = usePlayer();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, token, logout } = useAuth();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferencesInitialStep, setPreferencesInitialStep] = useState<'genres' | 'languages'>('genres');

  const loadPreferences = useCallback(async () => {
    try {
      const [prefs, genresData, languagesData] = await Promise.all([
        getUserPreferences(),
        fetchGenres(),
        fetchLanguages(),
      ]);
      setPreferences(prefs);
      setGenres(genresData);
      setLanguages(languagesData);
    } catch (error) {
      console.log('Failed to load preferences:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPreferences();
    }, [loadPreferences])
  );

  const getLanguageNames = (languageIds: string[]) => {
    if (!languageIds || languageIds.length === 0) return 'Not set';
    return languageIds
      .map(id => languages.find(l => l.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const getGenreNames = (genreIds: string[]) => {
    if (!genreIds || genreIds.length === 0) return 'Not set';
    return genreIds
      .map(id => genres.find(g => g.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const handlePreferencesComplete = () => {
    setShowPreferencesModal(false);
    loadPreferences();
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
            navigation.reset({
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
              await deactivateAccount(token!);
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    // Parse YYYY-MM-DD format manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
            {user?.whatsapp_number && (
              <View style={styles.profileRow}>
                <Ionicons name="logo-whatsapp" size={18} color={colors.textSecondary} />
                <Text style={[styles.profileDetail, { color: colors.textSecondary }]}>
                  {user.whatsapp_number}
                </Text>
                {user.is_whatsapp_verified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.brand.green }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </View>
            )}
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
                  {preferences ? getLanguageNames(preferences.languageIds) : 'Not set'}
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
                  {preferences ? getGenreNames(preferences.genreIds) : 'Not set'}
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

        {/* About Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          ABOUT
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.brand.blue} />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Version</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  1.0.0
                </Text>
              </View>
            </View>
          </View>
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

        {/* Delete Account Button */}
        <TouchableOpacity
          style={[styles.deleteAccountButton, { backgroundColor: colors.brand.red }]}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={24} color="#fff" />
          <Text style={styles.deleteAccountText}>
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
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
