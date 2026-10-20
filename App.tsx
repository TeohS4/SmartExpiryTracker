import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, LayoutChangeEvent, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { ExpiryForm } from './components/ExpiryForm';
import { Dashboard } from './components/Dashboard';
import { IngredientScanner } from './components/IngredientScanner';
import { Settings } from './components/Settings';
import { Toast } from './components/Toast';
import {
  useFonts,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold
} from '@expo-google-fonts/roboto';
import * as SplashScreen from 'expo-splash-screen';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

if ((Text as any).defaultProps) {
  (Text as any).defaultProps.style = [{ fontFamily: 'Roboto_400Regular' }, (Text as any).defaultProps.style];
} else {
  (Text as any).defaultProps = {
    style: { fontFamily: 'Roboto_400Regular' },
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'form' | 'ingredients' | 'settings'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const [navWidth, setNavWidth] = useState(0);

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });
  //To save state
  const [ingredientImageUri, setIngredientImageUri] = useState<string | null>(null);
  const [ingredientSummary, setIngredientSummary] = useState<string | null>(null);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const switchTab = (tab: 'dashboard' | 'form' | 'ingredients' | 'settings') => {
    if (tab === activeTab) return;
    setActiveTab(tab);

    const tabIndices = { dashboard: 0, form: 1, ingredients: 2, settings: 3 };
    const targetValue = tabIndices[tab];

    Animated.spring(slideAnim, {
      toValue: targetValue,
      tension: 68,
      friction: 10,
      useNativeDriver: false,
    }).start();
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleItemAdded = () => {
    setRefreshKey((prev) => prev + 1);
    switchTab('dashboard');
    showToast('Item tracked successfully');
  };

  const onNavLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setNavWidth(width - 12);
  };

  const buttonWidth = navWidth ? navWidth / 4 : 0;
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, buttonWidth, buttonWidth * 2, buttonWidth * 3],
  });

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f8fafc',
    headerBg: isDarkMode ? '#1e293b' : '#EAF5EE',
    headerBorder: isDarkMode ? '#334155' : '#DCEBE0',
    titleColor: isDarkMode ? '#f8fafc' : '#243B35',
    subtitleColor: isDarkMode ? '#94a3b8' : '#64786D',
    taglineColor: isDarkMode ? '#38bdf8' : '#43816D',
    iconBtnBg: isDarkMode ? '#334155' : '#F7FCF8',
    iconBtnBorder: isDarkMode ? '#475569' : '#D5E6DA',
    iconBtnColor: isDarkMode ? '#38bdf8' : '#167D70',
    navBg: isDarkMode ? '#1e293b' : '#ffffff',
    navBorder: isDarkMode ? '#334155' : '#e2e8f0',
    pillBg: isDarkMode ? '#38bdf8' : '#0f172a',
    cardBg: isDarkMode ? '#1e293b' : '#ffffff',
    cardBorder: isDarkMode ? '#334155' : '#e2e8f0',
    subCardBg: isDarkMode ? '#0f172a' : '#f1f5f9',
    textColor: isDarkMode ? '#f8fafc' : '#0f172a',
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}

        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }]}>
          <View style={styles.headerTop}>
            <View style={styles.brandContainer}>
              <View style={[styles.logoBadge, { backgroundColor: isDarkMode ? '#334155' : '#D5EBDD' }]}>
                <FontAwesome name="shield" size={16} color={theme.iconBtnColor} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.titleColor }]}>Smart Expiry Tracker</Text>
                <Text style={[styles.headerSubtitle, { color: theme.subtitleColor }]}>
                  Upload Images and Track Expiry Date for your products
                </Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.iconBtnBg, borderColor: theme.iconBtnBorder }]} activeOpacity={0.7}>
              <FontAwesome name="bell-o" size={16} color={theme.iconBtnColor} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.headerTagline, { color: theme.taglineColor }]}>SMARTER TRACKING, LESS WASTE</Text>
        </View>

        {/* Active Tab Screen Content */}
        <View style={styles.content}>
          {activeTab === 'dashboard' ? (
            <Dashboard refreshKey={refreshKey} showToast={showToast} theme={theme} />
          ) : activeTab === 'form' ? (
            <ExpiryForm onItemAdded={handleItemAdded} showToast={showToast} theme={theme} />
          ) : activeTab === 'ingredients' ? (
            <IngredientScanner
              showToast={showToast}
              theme={theme}
              imageUri={ingredientImageUri}
              setImageUri={setIngredientImageUri}
              summary={ingredientSummary}
              setSummary={setIngredientSummary}
            />
          ) : (
            <Settings isDarkMode={isDarkMode} onToggleDarkMode={setIsDarkMode} theme={theme} />
          )}
        </View>

        {/* Navigation Bar */}
        <View style={[styles.navContainer, { backgroundColor: theme.navBg, borderColor: theme.navBorder }]} onLayout={onNavLayout}>
          {buttonWidth > 0 && (
            <Animated.View
              style={[
                styles.slidingPill,
                {
                  width: buttonWidth,
                  backgroundColor: theme.pillBg,
                  transform: [{ translateX }],
                },
              ]}
            />
          )}

          <TouchableOpacity style={styles.navButton} onPress={() => switchTab('dashboard')} activeOpacity={0.9}>
            <View style={styles.navItemContent}>
              <FontAwesome name="dashboard" size={14} color={activeTab === 'dashboard' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.navText, activeTab === 'dashboard' && styles.activeNavText]}>Items</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => switchTab('form')} activeOpacity={0.9}>
            <View style={styles.navItemContent}>
              <FontAwesome name="plus-circle" size={14} color={activeTab === 'form' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.navText, activeTab === 'form' && styles.activeNavText]}>Add</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => switchTab('ingredients')} activeOpacity={0.9}>
            <View style={styles.navItemContent}>
              <FontAwesome name="leaf" size={14} color={activeTab === 'ingredients' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.navText, activeTab === 'ingredients' && styles.activeNavText]}>Scan</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => switchTab('settings')} activeOpacity={0.9}>
            <View style={styles.navItemContent}>
              <FontAwesome name="cog" size={14} color={activeTab === 'settings' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.navText, activeTab === 'settings' && styles.activeNavText]}>Settings</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Roboto_500Medium',
    marginTop: 1,
  },
  headerTagline: {
    fontSize: 9,
    fontFamily: 'Roboto_700Bold',
    letterSpacing: 1.2,
    marginTop: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { flex: 1, padding: 16, paddingBottom: 90 },

  navContainer: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    right: 12,
    borderRadius: 30,
    flexDirection: 'row',
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
  },
  slidingPill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 6,
    borderRadius: 24,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  navItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 12,
    fontFamily: 'Roboto_500Medium',
    color: '#64748b',
  },
  activeNavText: {
    color: '#ffffff',
  },
});