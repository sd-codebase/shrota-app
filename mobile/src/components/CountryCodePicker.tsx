import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export interface CountryCode {
  code: string;
  name: string;
  dial: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: 'IN', name: 'India', dial: '91' },
  { code: 'US', name: 'United States', dial: '1' },
  { code: 'GB', name: 'United Kingdom', dial: '44' },
  { code: 'AE', name: 'UAE', dial: '971' },
  { code: 'SA', name: 'Saudi Arabia', dial: '966' },
  { code: 'CA', name: 'Canada', dial: '1' },
  { code: 'AU', name: 'Australia', dial: '61' },
  { code: 'NP', name: 'Nepal', dial: '977' },
  { code: 'BD', name: 'Bangladesh', dial: '880' },
  { code: 'LK', name: 'Sri Lanka', dial: '94' },
  { code: 'PK', name: 'Pakistan', dial: '92' },
  { code: 'SG', name: 'Singapore', dial: '65' },
  { code: 'MY', name: 'Malaysia', dial: '60' },
  { code: 'DE', name: 'Germany', dial: '49' },
  { code: 'FR', name: 'France', dial: '33' },
  { code: 'KE', name: 'Kenya', dial: '254' },
  { code: 'ZA', name: 'South Africa', dial: '27' },
  { code: 'NG', name: 'Nigeria', dial: '234' },
];

export const DEFAULT_COUNTRY_CODE = '91';

interface CountryCodePickerProps {
  value: string;
  onChange: (code: string) => void;
}

export function CountryCodePicker({ value, onChange }: CountryCodePickerProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  const selected = COUNTRY_CODES.find(c => c.dial === value) || COUNTRY_CODES[0];

  const handleSelect = (item: CountryCode) => {
    onChange(item.dial);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.picker,
          { backgroundColor: colors.inputBackground, borderColor: colors.border },
        ]}
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.pickerText, { color: colors.text }]}>+{value}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Country</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryRow,
                    item.dial === value && { backgroundColor: colors.card },
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[styles.countryName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.countryDial, { color: colors.textSecondary }]}>
                    +{item.dial}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 4,
  },
  pickerText: {
    fontSize: 15,
    fontWeight: '600',
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
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  countryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  countryName: {
    fontSize: 16,
  },
  countryDial: {
    fontSize: 15,
    fontWeight: '600',
  },
});
