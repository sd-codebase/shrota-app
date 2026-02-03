import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { usePlayer, PLAYBACK_SPEEDS } from '../context/PlayerContext';
import { useDownload } from '../context/DownloadContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import { formatBytes } from '../services/downloadService';
import { formatPlaybackTime } from '../utils/formatters';
import { getLikeStatus, likeBook, unlikeBook } from '../services/userActivityApi';
import { DEFAULT_AUDIOBOOK_ARTWORK } from '../constants/placeholders';
import { shareBook } from '../utils/share';
import { DOWNLOAD_FEATURE_ENABLED } from '../config';

type PlayerScreenProps = NativeStackScreenProps<RootStackParamList, 'Player'>;

const { width } = Dimensions.get('window');
const ARTWORK_SIZE = width - 120;

export function PlayerScreen({ navigation, route }: PlayerScreenProps) {
  const { book } = route.params;
  const { colors, isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    currentBook,
    currentChapterIndex,
    isPlaying,
    position,
    duration,
    playbackSpeed,
    togglePlayPause,
    seekTo,
    skipForward,
    skipBackward,
    nextChapter,
    previousChapter,
    playChapter,
    setPlaybackSpeed,
  } = usePlayer();

  const [showChapterList, setShowChapterList] = useState(false);
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number>(0);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const SLEEP_TIMER_OPTIONS = [5, 10, 15, 30, 45, 60];

  const {
    isDownloaded,
    isDownloading,
    getDownloadProgress,
    downloadBook,
    deleteDownload,
  } = useDownload();

  const bookIsDownloaded = isDownloaded(book.id);
  const bookIsDownloading = isDownloading(book.id);
  const downloadProgress = getDownloadProgress(book.id);

  // Fetch like status on mount
  useEffect(() => {
    if (isAuthenticated) {
      getLikeStatus(book.id)
        .then((status) => setIsLiked(status.is_liked))
        .catch((err) => console.log('Failed to fetch like status:', err));
    }
  }, [book.id, isAuthenticated]);

  // Sleep timer countdown
  useEffect(() => {
    if (!sleepTimerMinutes || !isPlaying) return;

    sleepTimerRef.current = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev <= 1) {
          // Timer finished - pause playback
          togglePlayPause();
          setSleepTimerMinutes(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
      }
    };
  }, [sleepTimerMinutes, isPlaying]);

  const handleSetSleepTimer = (minutes: number) => {
    setSleepTimerMinutes(minutes);
    setSleepTimerRemaining(minutes * 60);
    setShowSleepTimer(false);
  };

  const handleCancelSleepTimer = () => {
    setSleepTimerMinutes(null);
    setSleepTimerRemaining(0);
    setShowSleepTimer(false);
  };

  const formatSleepTimerRemaining = () => {
    const mins = Math.floor(sleepTimerRemaining / 60);
    const secs = sleepTimerRemaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLikeToggle = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please login to like books');
      return;
    }

    setIsLikeLoading(true);
    try {
      if (isLiked) {
        await unlikeBook(book.id);
        setIsLiked(false);
      } else {
        await likeBook(book.id);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Like toggle failed:', error);
    } finally {
      setIsLikeLoading(false);
    }
  }, [book.id, isLiked, isAuthenticated]);

  const handleDownload = async () => {
    if (bookIsDownloaded) {
      Alert.alert(
        'Delete Download',
        `Remove "${book.title}" from downloads?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteDownload(book.id);
            },
          },
        ]
      );
    } else if (!bookIsDownloading) {
      try {
        await downloadBook(book);
        Alert.alert('Success', 'Book downloaded for offline listening');
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Download failed');
      }
    }
  };

  const currentChapter = currentBook?.chapters[currentChapterIndex];
  const playableChaptersCount = currentBook?.chapters.length ?? 0;
  const hasNextChapter = currentBook && currentChapterIndex < playableChaptersCount - 1;
  const hasPrevChapter = currentBook && currentChapterIndex > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-down" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>Now Playing</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => shareBook({ book })}
            style={styles.headerButton}
          >
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLikeToggle}
            style={styles.headerButton}
            disabled={isLikeLoading}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? colors.brand.red : colors.text}
            />
          </TouchableOpacity>
          {DOWNLOAD_FEATURE_ENABLED && (
            <TouchableOpacity
              onPress={handleDownload}
              style={styles.headerButton}
              disabled={bookIsDownloading}
            >
              {bookIsDownloading ? (
                <View style={[styles.downloadProgress, { backgroundColor: colors.brand.orange }]}>
                  <Text style={styles.downloadProgressText}>
                    {Math.round(downloadProgress?.progress || 0)}%
                  </Text>
                </View>
              ) : (
                <Ionicons
                  name={bookIsDownloaded ? 'checkmark-circle' : 'download-outline'}
                  size={24}
                  color={bookIsDownloaded ? colors.brand.green : colors.text}
                />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setShowChapterList(true)}
            style={styles.headerButton}
          >
            <Ionicons name="list" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Image
          source={{ uri: currentChapter?.thumbnail || book.thumbnail || DEFAULT_AUDIOBOOK_ARTWORK }}
          style={[styles.artwork, { backgroundColor: colors.backgroundSecondary }]}
          placeholder={require('../../assets/icon.png')}
          priority="high"
          cachePolicy="memory-disk"
          contentFit="cover"
        />

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={[styles.author, { color: colors.textSecondary }]}>{book.author}</Text>
          {currentChapter && (
            <Text style={[styles.chapter, { color: colors.brand.orange }]}>
              Chapter {currentChapterIndex + 1}: {currentChapter.title}
            </Text>
          )}
        </View>

        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            value={position}
            minimumValue={0}
            maximumValue={duration || 1}
            minimumTrackTintColor={colors.brand.orange}
            maximumTrackTintColor={isDark ? '#4A4A4A' : '#D1D5DB'}
            thumbTintColor={colors.brand.orange}
            onSlidingComplete={seekTo}
          />
          <View style={styles.timeContainer}>
            <Text style={[styles.time, { color: colors.textSecondary }]}>{formatPlaybackTime(position)}</Text>
            <Text style={[styles.time, { color: colors.textSecondary }]}>{formatPlaybackTime(duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={previousChapter}
            style={[styles.chapterButton, !hasPrevChapter && styles.disabledButton]}
            disabled={!hasPrevChapter}
          >
            <Ionicons
              name="play-skip-back"
              size={24}
              color={hasPrevChapter ? colors.text : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={skipBackward} style={styles.skipButton}>
            <View style={styles.skipIconContainer}>
              <MaterialCommunityIcons name="restore" size={44} color={colors.text} />
              <Text style={[styles.skipNumber, { color: colors.text, marginLeft: 6 }]}>15</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={togglePlayPause}
            style={[styles.playButton, { backgroundColor: colors.brand.orange }]}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={36}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={skipForward} style={styles.skipButton}>
            <View style={styles.skipIconContainer}>
              <MaterialCommunityIcons
                name="restore"
                size={44}
                color={colors.text}
                style={styles.skipForwardIcon}
              />
              <Text style={[styles.skipNumber, { color: colors.text, marginRight: 6 }]}>15</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={nextChapter}
            style={[styles.chapterButton, !hasNextChapter && styles.disabledButton]}
            disabled={!hasNextChapter}
          >
            <Ionicons
              name="play-skip-forward"
              size={24}
              color={hasNextChapter ? colors.text : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {playableChaptersCount > 1 && (
          <Text style={[styles.chapterIndicator, { color: colors.textSecondary }]}>
            Chapter {currentChapterIndex + 1} of {playableChaptersCount}
          </Text>
        )}

        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[styles.bottomButton, { backgroundColor: colors.card }]}
            onPress={() => setShowSpeedPicker(true)}
          >
            <Ionicons name="speedometer-outline" size={18} color={colors.text} />
            <Text style={[styles.bottomButtonText, { color: colors.text }]}>
              {playbackSpeed}x
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomButton, { backgroundColor: colors.card }]}
            onPress={() => setShowSleepTimer(true)}
          >
            <Ionicons name="moon-outline" size={18} color={sleepTimerMinutes ? colors.brand.orange : colors.text} />
            <Text style={[styles.bottomButtonText, { color: sleepTimerMinutes ? colors.brand.orange : colors.text }]}>
              {sleepTimerMinutes ? formatSleepTimerRemaining() : 'Sleep'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Speed Picker Modal */}
      <Modal
        visible={showSpeedPicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSpeedPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSpeedPicker(false)}
        >
          <View style={[styles.speedPickerContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.speedPickerTitle, { color: colors.text }]}>Playback Speed</Text>
            <View style={styles.speedOptions}>
              {PLAYBACK_SPEEDS.map((speed) => (
                <TouchableOpacity
                  key={speed}
                  style={[
                    styles.speedOption,
                    { backgroundColor: colors.backgroundSecondary },
                    playbackSpeed === speed && { backgroundColor: colors.brand.orange },
                  ]}
                  onPress={() => {
                    setPlaybackSpeed(speed);
                    setShowSpeedPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.speedOptionText,
                      { color: colors.textSecondary },
                      playbackSpeed === speed && styles.speedOptionTextActive,
                    ]}
                  >
                    {speed}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sleep Timer Modal */}
      <Modal
        visible={showSleepTimer}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSleepTimer(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSleepTimer(false)}
        >
          <View style={[styles.speedPickerContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.speedPickerTitle, { color: colors.text }]}>Sleep Timer</Text>
            {sleepTimerMinutes && (
              <Text style={[styles.timerActiveText, { color: colors.brand.orange }]}>
                Timer active: {formatSleepTimerRemaining()} remaining
              </Text>
            )}
            <View style={styles.speedOptions}>
              {SLEEP_TIMER_OPTIONS.map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.speedOption,
                    { backgroundColor: colors.backgroundSecondary },
                    sleepTimerMinutes === mins && { backgroundColor: colors.brand.orange },
                  ]}
                  onPress={() => handleSetSleepTimer(mins)}
                >
                  <Text
                    style={[
                      styles.speedOptionText,
                      { color: colors.textSecondary },
                      sleepTimerMinutes === mins && styles.speedOptionTextActive,
                    ]}
                  >
                    {mins}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {sleepTimerMinutes && (
              <TouchableOpacity
                style={[styles.cancelTimerButton, { borderColor: colors.textSecondary }]}
                onPress={handleCancelSleepTimer}
              >
                <Text style={[styles.cancelTimerText, { color: colors.textSecondary }]}>
                  Cancel Timer
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Chapter List Modal */}
      <Modal
        visible={showChapterList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChapterList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Chapters</Text>
              <TouchableOpacity onPress={() => setShowChapterList(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.chapterList}
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            >
              {book.chapters.map((chapter, index) => {
                const isPlayable = chapter.isPublished && chapter.audioUrl;
                const isCurrentlyPlaying = currentBook?.chapters[currentChapterIndex]?.id === chapter.id;
                return (
                  <TouchableOpacity
                    key={chapter.id}
                    style={[
                      styles.chapterItem,
                      { borderBottomColor: colors.border },
                      isCurrentlyPlaying && { backgroundColor: `${colors.brand.orange}15` },
                      !isPlayable && styles.disabledChapter,
                    ]}
                    onPress={() => {
                      if (isPlayable) {
                        const playableIndex = currentBook?.chapters.findIndex(ch => ch.id === chapter.id) ?? -1;
                        if (playableIndex >= 0) {
                          playChapter(playableIndex);
                          setShowChapterList(false);
                        }
                      }
                    }}
                    disabled={!isPlayable}
                  >
                    <Text
                      style={[
                        styles.chapterNumber,
                        { backgroundColor: colors.backgroundSecondary, color: colors.textSecondary },
                        !isPlayable && { color: colors.textSecondary },
                      ]}
                    >
                      {index + 1}
                    </Text>
                    <View style={styles.chapterTitleContainer}>
                      <Text
                        style={[
                          styles.chapterTitle,
                          { color: colors.text },
                          isCurrentlyPlaying && { color: colors.brand.orange, fontWeight: '600' },
                          !isPlayable && { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {chapter.title}
                      </Text>
                      {!chapter.isPublished && (
                        <Text style={[styles.comingSoonBadge, { color: colors.brand.orangeLight }]}>
                          Coming Soon
                        </Text>
                      )}
                    </View>
                    {isCurrentlyPlaying && isPlayable && (
                      <Ionicons name="volume-high" size={18} color={colors.brand.orange} />
                    )}
                    {!isPlayable && (
                      <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadProgress: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadProgressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 20,
  },
  info: {
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  author: {
    fontSize: 16,
    marginTop: 6,
  },
  chapter: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  chapterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
  },
  skipIconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipNumber: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '700',
  },
  skipForwardIcon: {
    transform: [{ scaleX: -1 }],
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterIndicator: {
    marginTop: 20,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  chapterList: {
    paddingHorizontal: 20,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  chapterNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 28,
    fontSize: 12,
  },
  chapterTitleContainer: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 16,
  },
  disabledChapter: {
    opacity: 0.6,
  },
  comingSoonBadge: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 16,
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  bottomButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  speedPickerContent: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 40,
    marginTop: 'auto',
    marginBottom: 'auto',
    alignItems: 'center',
  },
  speedPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  speedOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  speedOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  speedOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  speedOptionTextActive: {
    color: '#fff',
  },
  timerActiveText: {
    fontSize: 14,
    marginBottom: 12,
  },
  cancelTimerButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  cancelTimerText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
