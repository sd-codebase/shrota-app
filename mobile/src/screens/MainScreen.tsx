import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ENVIRONMENTS, Environment } from '../config';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function MainScreen() {
  const navigation = useNavigation<NavigationProp>();

  const handleEnvironmentPress = (environment: Environment) => {
    navigation.navigate('Books', { environment });
  };

  const handleDownloadsPress = () => {
    navigation.navigate('Downloads');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />

      <View style={styles.header}>
        <Ionicons name="headset" size={64} color="#6c5ce7" />
        <Text style={styles.title}>Shrota</Text>
        <Text style={styles.subtitle}>Audiobook Player</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: ENVIRONMENTS.staging.color }]}
          onPress={() => handleEnvironmentPress('staging')}
          activeOpacity={0.8}
        >
          <Ionicons name="flask" size={28} color="#fff" />
          <Text style={styles.buttonText}>{ENVIRONMENTS.staging.label}</Text>
          <Text style={styles.buttonSubtext}>Testing environment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: ENVIRONMENTS.production.color }]}
          onPress={() => handleEnvironmentPress('production')}
          activeOpacity={0.8}
        >
          <Ionicons name="globe" size={28} color="#fff" />
          <Text style={styles.buttonText}>{ENVIRONMENTS.production.label}</Text>
          <Text style={styles.buttonSubtext}>Live content</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.downloadsButton]}
          onPress={handleDownloadsPress}
          activeOpacity={0.8}
        >
          <Ionicons name="download" size={28} color="#fff" />
          <Text style={styles.buttonText}>Downloads</Text>
          <Text style={styles.buttonSubtext}>Offline audiobooks</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginTop: 8,
  },
  buttonsContainer: {
    flex: 1.5,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 16,
  },
  downloadsButton: {
    backgroundColor: '#6c5ce7',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  buttonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
