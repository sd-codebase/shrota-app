import React, { createRef, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { NavigationContainer, NavigationContainerRef, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { OTPVerificationScreen } from '../screens/OTPVerificationScreen';
import { BooksScreen } from '../screens/BooksScreen';
import { BookDetailsScreen } from '../screens/BookDetailsScreen';
import { SectionListScreen } from '../screens/SectionListScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { DownloadsScreen } from '../screens/DownloadsScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AuthorDetailsScreen } from '../screens/AuthorDetailsScreen';
import { ArtistDetailsScreen } from '../screens/ArtistDetailsScreen';
import { PublicationDetailsScreen } from '../screens/PublicationDetailsScreen';
import { GenreDetailsScreen } from '../screens/GenreDetailsScreen';
import { RootStackParamList, MainTabParamList } from '../types';
import { useTheme } from '../context/ThemeContext';

// Navigation reference for use outside React components
export const navigationRef = createRef<NavigationContainerRef<RootStackParamList>>();

export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) {
  navigationRef.current?.navigate(name as any, params as any);
}

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Stack navigator for Home tab
const HomeStack = createNativeStackNavigator();
function HomeStackScreen() {
  const { colors } = useTheme();
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={BooksScreen} />
      <HomeStack.Screen name="BookDetails" component={BookDetailsScreen} />
      <HomeStack.Screen name="SectionList" component={SectionListScreen} />
      <HomeStack.Screen name="Explore" component={ExploreScreen} />
      <HomeStack.Screen name="AuthorDetails" component={AuthorDetailsScreen} />
      <HomeStack.Screen name="ArtistDetails" component={ArtistDetailsScreen} />
      <HomeStack.Screen name="PublicationDetails" component={PublicationDetailsScreen} />
      <HomeStack.Screen name="GenreDetails" component={GenreDetailsScreen} />
    </HomeStack.Navigator>
  );
}

// Stack navigator for Bookshelf tab
const BookshelfStack = createNativeStackNavigator();
function BookshelfStackScreen() {
  return (
    <BookshelfStack.Navigator screenOptions={{ headerShown: false }}>
      <BookshelfStack.Screen name="BookshelfMain" component={DownloadsScreen} />
      <BookshelfStack.Screen name="BookDetails" component={BookDetailsScreen} />
      <BookshelfStack.Screen name="Explore" component={ExploreScreen} />
      <BookshelfStack.Screen name="AuthorDetails" component={AuthorDetailsScreen} />
      <BookshelfStack.Screen name="ArtistDetails" component={ArtistDetailsScreen} />
      <BookshelfStack.Screen name="PublicationDetails" component={PublicationDetailsScreen} />
      <BookshelfStack.Screen name="GenreDetails" component={GenreDetailsScreen} />
    </BookshelfStack.Navigator>
  );
}

// Stack navigator for Search tab
const SearchStack = createNativeStackNavigator();
function SearchStackScreen() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="SearchMain" component={SearchScreen} />
      <SearchStack.Screen name="BookDetails" component={BookDetailsScreen} />
      <SearchStack.Screen name="Explore" component={ExploreScreen} />
      <SearchStack.Screen name="AuthorDetails" component={AuthorDetailsScreen} />
      <SearchStack.Screen name="ArtistDetails" component={ArtistDetailsScreen} />
      <SearchStack.Screen name="PublicationDetails" component={PublicationDetailsScreen} />
      <SearchStack.Screen name="GenreDetails" component={GenreDetailsScreen} />
    </SearchStack.Navigator>
  );
}

// Stack navigator for Profile tab
const ProfileStack = createNativeStackNavigator();
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

function MainTabNavigator() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.brand.orange,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Bookshelf"
        component={BookshelfStackScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons name={focused ? 'library' : 'library-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabIconContainer}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { colors } = useTheme();

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        {/* Auth Screens */}
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Register" component={RegisterScreen} />
        <RootStack.Screen name="OTPVerification" component={OTPVerificationScreen} />

        {/* Main App with Bottom Tabs */}
        <RootStack.Screen name="MainTabs" component={MainTabNavigator} />

        {/* Player as Modal - covers tabs */}
        <RootStack.Screen
          name="Player"
          component={PlayerScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            gestureEnabled: true,
            gestureDirection: 'vertical',
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
