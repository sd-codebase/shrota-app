import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import { usePlayer, PLAYBACK_SPEEDS, PlaybackSpeed } from '../context/PlayerContext';
import { useDownload } from '../context/DownloadContext';
import { RootStackParamList } from '../types';
import { formatBytes } from '../services/downloadService';

type PlayerScreenProps = NativeStackScreenProps<RootStackParamList, 'Player'>;

const { width } = Dimensions.get('window');
const ARTWORK_SIZE = width - 120;

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PlayerScreen({ navigation, route }: PlayerScreenProps) {
  const { book } = route.params;
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
  // Playable chapters count for navigation
  const playableChaptersCount = currentBook?.chapters.length ?? 0;
  const hasNextChapter = currentBook && currentChapterIndex < playableChaptersCount - 1;
  const hasPrevChapter = currentBook && currentChapterIndex > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-down" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleDownload}
            style={styles.headerButton}
            disabled={bookIsDownloading}
          >
            {bookIsDownloading ? (
              <View style={styles.downloadProgress}>
                <Text style={styles.downloadProgressText}>
                  {Math.round(downloadProgress?.progress || 0)}%
                </Text>
              </View>
            ) : (
              <Ionicons
                name={bookIsDownloaded ? 'checkmark-circle' : 'download-outline'}
                size={24}
                color={bookIsDownloaded ? '#00b894' : '#fff'}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowChapterList(true)}
            style={styles.headerButton}
          >
            <Ionicons name="list" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Image
          source={{ uri: book.thumbnail }}
          style={styles.artwork}
          defaultSource={require('../../assets/icon.png')}
        />

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={styles.author}>{book.author}</Text>
          {currentChapter && (
            <Text style={styles.chapter}>
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
            minimumTrackTintColor="#6c5ce7"
            maximumTrackTintColor="#2a2a3e"
            thumbTintColor="#6c5ce7"
            onSlidingComplete={seekTo}
          />
          <View style={styles.timeContainer}>
            <Text style={styles.time}>{formatTime(position)}</Text>
            <Text style={styles.time}>{formatTime(duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={previousChapter}
            style={[styles.chapterButton, !hasPrevChapter && styles.disabledButton]}
            disabled={!hasPrevChapter}
          >
            <Ionicons name="play-skip-back" size={24} color={hasPrevChapter ? "#fff" : "#444"} />
          </TouchableOpacity>

          <TouchableOpacity onPress={skipBackward} style={styles.skipButton}>
            <Ionicons name="play-back" size={28} color="#fff" />
            <Text style={styles.skipText}>15</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={togglePlayPause}
            style={styles.playButton}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={36}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={skipForward} style={styles.skipButton}>
            <Ionicons name="play-forward" size={28} color="#fff" />
            <Text style={styles.skipText}>15</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={nextChapter}
            style={[styles.chapterButton, !hasNextChapter && styles.disabledButton]}
            disabled={!hasNextChapter}
          >
            <Ionicons name="play-skip-forward" size={24} color={hasNextChapter ? "#fff" : "#444"} />
          </TouchableOpacity>
        </View>

        {playableChaptersCount > 1 && (
          <Text style={styles.chapterIndicator}>
            Chapter {currentChapterIndex + 1} of {playableChaptersCount}
          </Text>
        )}

        {/* Speed Button */}
        <TouchableOpacity
          style={styles.speedButton}
          onPress={() => setShowSpeedPicker(true)}
        >
          <Text style={styles.speedButtonText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
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
          <View style={styles.speedPickerContent}>
            <Text style={styles.speedPickerTitle}>Playback Speed</Text>
            <View style={styles.speedOptions}>
              {PLAYBACK_SPEEDS.map((speed) => (
                <TouchableOpacity
                  key={speed}
                  style={[
                    styles.speedOption,
                    playbackSpeed === speed && styles.speedOptionActive,
                  ]}
                  onPress={() => {
                    setPlaybackSpeed(speed);
                    setShowSpeedPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.speedOptionText,
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

      {/* Chapter List Modal */}
      <Modal
        visible={showChapterList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChapterList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chapters</Text>
              <TouchableOpacity onPress={() => setShowChapterList(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.chapterList}>
              {book.chapters.map((chapter, index) => {
                const isPlayable = chapter.isPublished && chapter.audioUrl;
                const isCurrentlyPlaying = currentBook?.chapters[currentChapterIndex]?.id === chapter.id;
                return (
                  <TouchableOpacity
                    key={chapter.id}
                    style={[
                      styles.chapterItem,
                      isCurrentlyPlaying && styles.activeChapter,
                      !isPlayable && styles.disabledChapter,
                    ]}
                    onPress={() => {
                      if (isPlayable) {
                        // Find the index in playable chapters
                        const playableIndex = currentBook?.chapters.findIndex(ch => ch.id === chapter.id) ?? -1;
                        if (playableIndex >= 0) {
                          playChapter(playableIndex);
                          setShowChapterList(false);
                        }
                      }
                    }}
                    disabled={!isPlayable}
                  >
                    <Text style={[styles.chapterNumber, !isPlayable && styles.disabledText]}>
                      {index + 1}
                    </Text>
                    <View style={styles.chapterTitleContainer}>
                      <Text
                        style={[
                          styles.chapterTitle,
                          isCurrentlyPlaying && styles.activeChapterText,
                          !isPlayable && styles.disabledText,
                        ]}
                        numberOfLines={1}
                      >
                        {chapter.title}
                      </Text>
                      {!chapter.isPublished && (
                        <Text style={styles.comingSoonBadge}>Coming Soon</Text>
                      )}
                    </View>
                    {isCurrentlyPlaying && isPlayable && (
                      <Ionicons name="volume-high" size={18} color="#6c5ce7" />
                    )}
                    {!isPlayable && (
                      <Ionicons name="lock-closed" size={16} color="#666" />
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
    backgroundColor: '#0f0f1a',
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
    color: '#888',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadProgress: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6c5ce7',
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
    backgroundColor: '#2a2a3e',
  },
  info: {
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  author: {
    fontSize: 16,
    color: '#888',
    marginTop: 6,
  },
  chapter: {
    fontSize: 14,
    color: '#6c5ce7',
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
    color: '#888',
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
  },
  skipText: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterIndicator: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
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
    borderBottomColor: '#2a2a3e',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  chapterList: {
    paddingHorizontal: 20,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
    gap: 12,
  },
  activeChapter: {
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  chapterNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2a2a3e',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 28,
    fontSize: 12,
    color: '#888',
  },
  chapterTitleContainer: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 16,
    color: '#fff',
  },
  activeChapterText: {
    color: '#6c5ce7',
    fontWeight: '600',
  },
  disabledChapter: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#666',
  },
  comingSoonBadge: {
    fontSize: 11,
    color: '#f39c12',
    fontWeight: '600',
    marginTop: 2,
  },
  // Speed Button & Picker
  speedButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a3e',
  },
  speedButtonText: {
    color: '#6c5ce7',
    fontSize: 16,
    fontWeight: '600',
  },
  speedPickerContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 40,
    alignItems: 'center',
  },
  speedPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
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
    backgroundColor: '#2a2a3e',
    minWidth: 60,
    alignItems: 'center',
  },
  speedOptionActive: {
    backgroundColor: '#6c5ce7',
  },
  speedOptionText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  speedOptionTextActive: {
    color: '#fff',
  },
});
