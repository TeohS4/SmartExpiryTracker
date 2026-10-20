import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onHide: () => void;
}

export function Toast({ message, type = 'success', onHide }: ToastProps) {
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -140,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 70,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      hideToast();
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return { bg: '#0f172a', icon: 'check-circle' as const, iconColor: '#22c55e', border: '#334155' };
      case 'error':
        return { bg: '#1e1b4b', icon: 'exclamation-circle' as const, iconColor: '#ef4444', border: '#312e81' };
      case 'info':
      default:
        return { bg: '#0f172a', icon: 'info-circle' as const, iconColor: '#38bdf8', border: '#334155' };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: insets.top + 8,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hideToast}
        style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}
      >
        <View style={styles.contentRow}>
          <FontAwesome name={config.icon} size={18} color={config.iconColor} />
          <Text style={styles.text} numberOfLines={2}>
            {message}
          </Text>
        </View>
        <Text style={styles.dismissHint}>Tap to dismiss</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 480,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
    letterSpacing: -0.1,
  },
  dismissHint: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});