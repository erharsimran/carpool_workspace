import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { colors, radius, spacing } from '../styles/styles';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertState {
  type: AlertType;
  message: string;
  title?: string;
}

interface AlertContextType {
  showAlert: (type: AlertType, message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<AlertState | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  const hideAlert = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setAlert(null);
    });
  }, [fadeAnim, slideAnim]);

  const showAlert = useCallback(
    (type: AlertType, message: string, title?: string) => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      setAlert({ type, message, title });

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      hideTimerRef.current = setTimeout(() => {
        hideAlert();
      }, 4000);
    },
    [fadeAnim, slideAnim, hideAlert]
  );

  const showSuccess = useCallback(
    (message: string, title: string = 'Success') => showAlert('success', message, title),
    [showAlert]
  );

  const showError = useCallback(
    (message: string, title: string = 'Error') => showAlert('error', message, title),
    [showAlert]
  );

  const showWarning = useCallback(
    (message: string, title: string = 'Notice') => showAlert('warning', message, title),
    [showAlert]
  );

  const getVariant = (type: AlertType) => {
    switch (type) {
      case 'success':
        return {
          bg: colors.status.successBg,
          border: colors.status.success,
          text: '#065F46',
          icon: '✓',
        };
      case 'error':
        return {
          bg: colors.status.dangerBg,
          border: colors.status.danger,
          text: '#991B1B',
          icon: '✕',
        };
      case 'warning':
        return {
          bg: colors.status.warningBg,
          border: colors.status.warning,
          text: '#92400E',
          icon: '⚠',
        };
      case 'info':
      default:
        return {
          bg: colors.status.infoBg,
          border: colors.status.info,
          text: '#1E40AF',
          icon: 'ℹ',
        };
    }
  };

  const theme = alert ? getVariant(alert.type) : null;

  return (
    <AlertContext.Provider
      value={{ showAlert, showSuccess, showError, showWarning, hideAlert }}
    >
      {children}

      {alert && theme && (
        <Animated.View
          style={[
            styles.floatingWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.banner,
              { backgroundColor: theme.bg, borderColor: theme.border },
            ]}
          >
            <View style={[styles.badge, { backgroundColor: theme.border }]}>
              <Text style={styles.badgeIcon}>{theme.icon}</Text>
            </View>

            <View style={styles.content}>
              {alert.title ? (
                <Text style={[styles.title, { color: theme.text }]}>
                  {alert.title}
                </Text>
              ) : null}
              <Text style={[styles.message, { color: theme.text }]}>
                {alert.message}
              </Text>
            </View>

            <TouchableOpacity onPress={hideAlert} style={styles.closeBtn}>
              <Text style={[styles.closeText, { color: theme.text }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 52,
    left: spacing.md,
    right: spacing.md,
    zIndex: 999999,
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)' }
      : {
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
        }),
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  badgeIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 17,
  },
  closeBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  closeText: {
    fontSize: 13,
    fontWeight: '700',
  },
});