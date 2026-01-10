import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MiniPlayer } from '../components/MiniPlayer';
import { usePlayer } from '../context/PlayerContext';
import { useDownload } from '../context/DownloadContext';
import { formatBytes } from '../services/downloadService';
import { DownloadedBook, RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DownloadsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { playBook, currentBook } = usePlayer();
  const { downloads, refreshDownloads, deleteDownload } = useDownload();

  useFocusEffect(
    useCallback(() => {
      refreshDownloads();
    }, [])
  );

  // Sort downloads by downloadedAt descending
  const sortedDownloads = [...downloads].sort((a, b) => b.downloadedAt - a.downloadedAt);

  const handlePlay = async (book: DownloadedBook) => {
    await playBook(book);
  };

  const handleDelete = (book: DownloadedBook) => {
    Alert.alert(
      'Delete Download',
      `Are you sure you want to remove "${book.title}" from your downloads?`,
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
  };

  const handleMiniPlayerPress = () => {
    if (currentBook) {
      navigation.navigate('Player', { book: currentBook });
    }
  };

  const renderItem = ({ item }: { item: DownloadedBook }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handlePlay(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.itemAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemDuration}>{formatDuration(item.duration)}</Text>
          <Text style={styles.itemSize}>{formatBytes(item.totalSize)}</Text>
        </View>
        <Text style={styles.itemDate}>Downloaded {formatDate(item.downloadedAt)}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
      >
        <Ionicons name="trash-outline" size={22} color="#ff6b6b" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="download-outline" size={64} color="#444" />
      <Text style={styles.emptyTitle}>No Downloads Yet</Text>
      <Text style={styles.emptyText}>
        Download audiobooks to listen offline. Open a book and tap the download icon.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Downloads</Text>
        <Text style={styles.headerSubtitle}>
          {sortedDownloads.length} {sortedDownloads.length === 1 ? 'audiobook' : 'audiobooks'}
        </Text>
      </View>

      <FlatList
        data={sortedDownloads}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          sortedDownloads.length === 0 && styles.emptyListContent,
          currentBook && styles.listContentWithPlayer,
        ]}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      <MiniPlayer onPress={handleMiniPlayerPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyListContent: {
    flex: 1,
  },
  listContentWithPlayer: {
    paddingBottom: 100,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#2a2a3e',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  itemAuthor: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  itemDuration: {
    fontSize: 12,
    color: '#666',
  },
  itemSize: {
    fontSize: 12,
    color: '#666',
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    justifyContent: 'center',
    paddingLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
});
