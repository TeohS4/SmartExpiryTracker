// components/Settings.tsx
import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface SettingsProps {
  isDarkMode: boolean;
  onToggleDarkMode: (value: boolean) => void;
  theme: {
    cardBg: string;
    cardBorder: string;
    textColor: string;
    subtitleColor: string;
    taglineColor: string;
    subCardBg: string;
  };
}

export function Settings({ isDarkMode, onToggleDarkMode, theme }: SettingsProps) {
  return (
    <View style={[styles.settingsCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      <Text style={[styles.settingsTitle, { color: theme.textColor }]}>App Preferences</Text>

      {/* Dark Mode Switch */}
      <View style={[styles.settingRow, { borderBottomColor: theme.cardBorder }]}>
        <View style={styles.settingTextGroup}>
          <FontAwesome name={isDarkMode ? 'moon-o' : 'sun-o'} size={18} color={theme.textColor} />
          <View>
            <Text style={[styles.settingLabel, { color: theme.textColor }]}>Dark Mode</Text>
            <Text style={[styles.settingSubtext, { color: theme.subtitleColor }]}>
              {isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}
            </Text>
          </View>
        </View>
        <Switch
          value={isDarkMode}
          onValueChange={onToggleDarkMode}
          trackColor={{ false: '#cbd5e1', true: '#38bdf8' }}
          thumbColor={isDarkMode ? '#0f172a' : '#ffffff'}
        />
      </View>

      {/* About Us Section */}
      <View style={styles.aboutSection}>
        <Text style={[styles.aboutTitle, { color: theme.textColor }]}>About Expiry Tracker</Text>
        <Text style={[styles.aboutDescription, { color: theme.subtitleColor }]}>
          Smart Expiry Tracker is a mobile app designed to reduce food waste using AI-powered receipt and label optical character recognition.
        </Text>

        <View style={[styles.developerBadge, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]}>
          <FontAwesome name="code" size={14} color={theme.taglineColor} />
          <Text style={[styles.developerText, { color: theme.textColor }]}>
            Developed by <Text style={{ fontFamily: 'Roboto_700Bold', color: theme.taglineColor }}>TeohWJ</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  settingsCard: {
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  settingsTitle: { fontSize: 20, fontFamily: 'Roboto_700Bold' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  settingTextGroup: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  settingLabel: { fontSize: 16, fontFamily: 'Roboto_700Bold' },
  settingSubtext: { fontSize: 12, fontFamily: 'Roboto_400Regular', marginTop: 2 },

  aboutSection: { gap: 10, marginTop: 4 },
  aboutTitle: { fontSize: 16, fontFamily: 'Roboto_700Bold' },
  aboutDescription: { fontSize: 13, fontFamily: 'Roboto_400Regular', lineHeight: 18 },
  developerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  developerText: { fontSize: 13, fontFamily: 'Roboto_500Medium' },
});