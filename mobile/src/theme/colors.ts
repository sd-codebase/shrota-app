/**
 * Color palette for Shrota mobile app
 * Colors extracted from website's globals.css to ensure exact match
 */

// Brand colors (same for both themes)
export const brand = {
  orange: '#F97316',        // Primary action (buttons, accents)
  orangeLight: '#FB923C',   // Hover states
  blue: '#1E40AF',          // Secondary brand / deep blue
  blueLight: '#3B82F6',     // Hover states / lighter blue
  green: '#22C55E',         // Success states
  red: '#EF4444',           // Error states
};

// Dark theme colors (matches website exactly)
export const dark = {
  background: '#0A0A0A',          // Primary background (--color-black)
  backgroundSecondary: '#101010', // Footer, secondary sections (--color-dark)
  card: '#1A1A1A',                // Cards, elevated surfaces (--color-dark-light)
  text: '#FFFFFF',                // Primary text (--color-white)
  textSecondary: '#A3A3A3',       // Secondary text (--color-gray)
  border: 'rgba(255,255,255,0.05)', // Subtle borders
  inputBackground: '#1A1A1A',     // Input fields background
  placeholder: '#666666',         // Placeholder text
};

// Light theme colors (designed to complement dark theme)
export const light = {
  background: '#FFFFFF',          // Primary background
  backgroundSecondary: '#F5F5F5', // Secondary sections
  card: '#FAFAFA',                // Cards, elevated surfaces
  text: '#0A0A0A',                // Primary text (inverted from dark)
  textSecondary: '#6B7280',       // Secondary text
  border: 'rgba(0,0,0,0.08)',     // Subtle borders
  inputBackground: '#F5F5F5',     // Input fields background
  placeholder: '#9CA3AF',         // Placeholder text
};

// Combined colors object
export const colors = {
  brand,
  dark,
  light,
};

// Theme type
export type ThemeMode = 'light' | 'dark';

// Theme colors type (structure of dark or light object)
export type ThemeColors = typeof dark;

export default colors;
