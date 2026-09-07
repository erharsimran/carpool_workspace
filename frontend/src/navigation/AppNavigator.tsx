// src/navigation/AppNavigator.tsx
import React from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { CreateTripScreen } from '../screens/CreateTripScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors, globalStyles, headerStyles } from '../styles/styles';

const Tab = createBottomTabNavigator();

const AppHeader: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const initials =
    user?.first_name && user?.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
      : (user?.username?.slice(0, 2) || 'ON').toUpperCase();

  return (
    <SafeAreaView style={{ backgroundColor: colors.surface }}>
      <View style={headerStyles.container}>
        <View style={headerStyles.leftSpacer} />

        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Text style={headerStyles.logoText}>OntarioRide</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={headerStyles.profileAvatarBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={headerStyles.profileAvatarText}>{initials}</Text>
          <View style={headerStyles.verifiedBadge}>
            <Text style={headerStyles.verifiedBadgeText}>✓</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={[
          globalStyles.safeArea,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => <AppHeader />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === 'web' ? 64 : 60,
          paddingBottom: Platform.OS === 'web' ? 10 : 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused }) => {
          let icon = '•';
          if (route.name === 'Search') icon = '🔍';
          if (route.name === 'Post') icon = '➕';
          if (route.name === 'Trips') icon = '📍';

          return (
            <Text
              style={{
                fontSize: 18,
                opacity: focused ? 1 : 0.6,
              }}
            >
              {icon}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Post" component={CreateTripScreen} />
      <Tab.Screen name="Trips" component={BookingsScreen} />

      {/* Hidden from bottom bar, accessed exclusively via top-right avatar */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
};