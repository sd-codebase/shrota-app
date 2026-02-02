import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Genre, Language } from '../types';
import { fetchGenres, fetchLanguages } from '../services/api';
import { saveUserPreferences } from '../services/preferencesService';
import { PREFERENCES_CONFIG } from '../constants/preferences';

interface PreferencesModalProps {
  visible: boolean;
  onComplete: () => void;
  onClose?: () => void;
  initialGenreIds?: string[];
  initialLanguageIds?: string[];
  isEditing?: boolean;
  initialStep?: 'genres' | 'languages';
}

export function PreferencesModal({
  visible,
  onComplete,
  onClose,
  initialGenreIds = [],
  initialLanguageIds = [],
  isEditing = false,
  initialStep = 'genres',
}: PreferencesModalProps) {
  const { colors } = useTheme();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenreIds);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(initialLanguageIds);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'genres' | 'languages'>('genres');

  useEffect(() => {
    if (visible) {
      loadData();
      // Reset to initial values when opening
      setSelectedGenres(initialGenreIds);
      setSelectedLanguages(initialLanguageIds);
      setStep(initialStep);
    }
  }, [visible, initialGenreIds, initialLanguageIds, initialStep]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [genresData, languagesData] = await Promise.all([
        fetchGenres(),
        fetchLanguages(),
      ]);
      // Client-side safety filter: exclude adult genres
      const safeGenres = genresData.filter(g => !g.is_adult);
      setGenres(safeGenres);
      setLanguages(languagesData);
    } catch {
      // Ignore load errors
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((id) => id !== genreId);
      }
      return [...prev, genreId];
    });
  };

  const toggleLanguage = (languageId: string) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(languageId)) {
        return prev.filter((id) => id !== languageId);
      }
      return [...prev, languageId];
    });
  };

  const handleNext = () => {
    if (step === 'genres' && selectedGenres.length > 0) {
      if (isEditing) {
        // In editing mode, save directly from genres step
        handleSave();
      } else {
        setStep('languages');
      }
    }
  };

  const handleBack = () => {
    if (step === 'languages') {
      setStep('genres');
    }
  };

  const handleSave = async () => {
    if (selectedGenres.length === 0 || selectedLanguages.length === 0) {
      return;
    }

    try {
      setSaving(true);
      await saveUserPreferences(selectedGenres, selectedLanguages);
      onComplete();
    } catch {
      // Ignore save errors
    } finally {
      setSaving(false);
    }
  };

  const canProceed = step === 'genres'
    ? selectedGenres.length >= PREFERENCES_CONFIG.MIN_GENRES
    : selectedLanguages.length >= PREFERENCES_CONFIG.MIN_LANGUAGES;

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.brand.orange} />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: colors.text }]}>
                {step === 'genres'
                  ? isEditing ? 'Edit Your Genres' : 'Select Your Favorite Genres'
                  : isEditing ? 'Edit Your Languages' : 'Select Your Languages'}
              </Text>
              {isEditing && onClose && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {step === 'genres'
                ? `Select at least ${PREFERENCES_CONFIG.MIN_GENRES} genres you enjoy`
                : `Select at least ${PREFERENCES_CONFIG.MIN_LANGUAGES} language you prefer`}
            </Text>
            {/* Selection counter */}
            <Text style={[styles.counter, { color: colors.brand.orange }]}>
              {step === 'genres'
                ? `${selectedGenres.length} selected`
                : `${selectedLanguages.length} selected`}
            </Text>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {step === 'genres' ? (
              <View style={styles.optionsGrid}>
                {genres.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.id);
                  return (
                    <TouchableOpacity
                      key={genre.id}
                      style={[
                        styles.optionCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        isSelected && { borderColor: colors.brand.orange, backgroundColor: colors.brand.orange + '20' },
                      ]}
                      onPress={() => toggleGenre(genre.id)}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <View style={[styles.checkIcon, { backgroundColor: colors.brand.orange }]}>
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                      )}
                      <Text
                        style={[
                          styles.optionText,
                          { color: colors.text },
                          isSelected && { color: colors.brand.orange },
                        ]}
                      >
                        {genre.name}
                      </Text>
                      {genre.description && (
                        <Text
                          style={[styles.optionDescription, { color: colors.textSecondary }]}
                          numberOfLines={2}
                        >
                          {genre.description}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.optionsGrid}>
                {languages.map((language) => {
                  const isSelected = selectedLanguages.includes(language.id);
                  return (
                    <TouchableOpacity
                      key={language.id}
                      style={[
                        styles.optionCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        isSelected && { borderColor: colors.brand.orange, backgroundColor: colors.brand.orange + '20' },
                      ]}
                      onPress={() => toggleLanguage(language.id)}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <View style={[styles.checkIcon, { backgroundColor: colors.brand.orange }]}>
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                      )}
                      <Text
                        style={[
                          styles.optionText,
                          { color: colors.text },
                          isSelected && { color: colors.brand.orange },
                        ]}
                      >
                        {language.name}
                      </Text>
                      <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                        {language.code.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {step === 'languages' && !isEditing && (
              <TouchableOpacity
                style={[styles.backButton, { borderColor: colors.border }]}
                onPress={handleBack}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
                <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.nextButton,
                { backgroundColor: canProceed ? colors.brand.orange : colors.backgroundSecondary },
                (step === 'genres' || isEditing) && styles.fullWidthButton,
              ]}
              onPress={step === 'genres' ? handleNext : handleSave}
              disabled={!canProceed || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={[styles.nextButtonText, { color: canProceed ? '#fff' : colors.textSecondary }]}>
                    {step === 'genres'
                      ? (isEditing ? 'Save Changes' : 'Next')
                      : (isEditing ? 'Save Changes' : 'Get Started')}
                  </Text>
                  {step === 'genres' && canProceed && !isEditing && (
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Progress indicator - only show in onboarding mode */}
          {!isEditing && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressDot,
                  { backgroundColor: step === 'genres' ? colors.brand.orange : colors.border },
                ]}
              />
              <View
                style={[
                  styles.progressDot,
                  { backgroundColor: step === 'languages' ? colors.brand.orange : colors.border },
                ]}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
  },
  counter: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  content: {
    paddingHorizontal: 24,
    maxHeight: 400,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    position: 'relative',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  fullWidthButton: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
