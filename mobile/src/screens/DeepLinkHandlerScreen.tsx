import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { usePlayer } from '../context/PlayerContext';
import { fetchBookById } from '../services/api';
import { Analytics } from '../services/analytics';

type DeepLinkHandlerScreenProps = NativeStackScreenProps<RootStackParamList, 'DeepLinkHandler'>;

export function DeepLinkHandlerScreen({ navigation, route }: DeepLinkHandlerScreenProps) {
  const { bookId } = route.params;
  const { colors } = useTheme();
  const { playBook } = usePlayer();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        // Fetch book data
        const book = await fetchBookById(bookId);

        // Track book viewed via deeplink
        Analytics.trackBookViewed(bookId, 'deeplink');

        // Reset navigation to MainTabs first (establish navigation state)
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          })
        );

        // Small delay to ensure navigation state is set
        await new Promise(resolve => setTimeout(resolve, 100));

        // Play the book
        await playBook(book);

        // Navigate to Player screen
        navigation.navigate('Player', { book });
      } catch (err) {
        console.error('Failed to handle deep link:', err);
        setError('Unable to load this audiobook. It may have been removed or is not available.');

        // Fallback: navigate to main app after a delay
        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            })
          );
        }, 2000);
      }
    };

    handleDeepLink();
  }, [bookId, navigation, playBook]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {error ? (
          <>
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>
              Redirecting to home...
            </Text>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.brand.orange} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading audiobook...
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
