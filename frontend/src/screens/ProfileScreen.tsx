import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { api, Trip } from '../services/api';
import {
  colors,
  spacing,
  globalStyles,
  searchStyles,
  tripStyles,
  profileStyles,
} from '../styles/styles';

export const ProfileScreen: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { showSuccess, showError } = useAlert();

  const [activeTab, setActiveTab] = useState<'details' | 'rides'>('details');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [postedTrips, setPostedTrips] = useState<Trip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);
  const [cancellingTripId, setCancellingTripId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setPhoneNumber(user.phone_number || '');
      setBio(user.bio || '');
      setVehicleModel(user.vehicle_make_model || '');
      setVehicleColor(user.vehicle_color || '');
      setVehiclePlate(user.vehicle_plate || '');
    }
  }, [user]);

  const loadPostedTrips = useCallback(async () => {
    setIsLoadingTrips(true);
    try {
      const data = await api.getMyPostedTrips();
      setPostedTrips(data);
    } catch (err: any) {
      showError(err.message || 'Failed to fetch posted trips.');
    } finally {
      setIsLoadingTrips(false);
    }
  }, [showError]);

  useEffect(() => {
    if (activeTab === 'rides') {
      loadPostedTrips();
    }
  }, [activeTab, loadPostedTrips]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.trim(),
        bio: bio.trim(),
        vehicle_make_model: vehicleModel.trim(),
        vehicle_color: vehicleColor.trim(),
        vehicle_plate: vehiclePlate.trim(),
      });
      await refreshUser();
      showSuccess('Your profile details have been updated.', 'Profile Saved');
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Unable to update profile.';
      showError(msg, 'Update Failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelTrip = (trip: Trip) => {
    const confirmMessage = `Cancel the trip from ${trip.origin_name} to ${trip.destination_name}? All passenger reservations will be cancelled.`;
    
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        proceedCancel(trip.id);
      }
      return;
    }

    Alert.alert('Cancel Posted Ride', confirmMessage, [
      { text: 'Keep Ride', style: 'cancel' },
      {
        text: 'Cancel Ride',
        style: 'destructive',
        onPress: () => proceedCancel(trip.id),
      },
    ]);
  };

  const proceedCancel = async (tripId: number) => {
    setCancellingTripId(tripId);
    try {
      await api.cancelTrip(tripId);
      showSuccess('Posted trip has been cancelled.', 'Trip Cancelled');
      loadPostedTrips();
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Unable to cancel trip.';
      showError(msg, 'Error');
    } finally {
      setCancellingTripId(null);
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        logout();
      }
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const initials =
    user?.first_name && user?.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
      : (user?.username?.slice(0, 2) || 'ON').toUpperCase();

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView
        contentContainerStyle={[globalStyles.screenContainer, { paddingBottom: spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={profileStyles.avatarCircle}>
          <Text style={profileStyles.avatarText}>{initials}</Text>
        </View>
        <Text style={profileStyles.userName}>
          {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
        </Text>
        <Text style={profileStyles.userEmail}>{user?.email}</Text>

        <View style={profileStyles.tabRow}>
          <TouchableOpacity
            style={[
              profileStyles.tabBtn,
              activeTab === 'details' && profileStyles.tabBtnActive,
            ]}
            onPress={() => setActiveTab('details')}
          >
            <Text
              style={[
                profileStyles.tabBtnText,
                activeTab === 'details' && profileStyles.tabBtnTextActive,
              ]}
            >
              Profile & Vehicle
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              profileStyles.tabBtn,
              activeTab === 'rides' && profileStyles.tabBtnActive,
            ]}
            onPress={() => setActiveTab('rides')}
          >
            <Text
              style={[
                profileStyles.tabBtnText,
                activeTab === 'rides' && profileStyles.tabBtnTextActive,
              ]}
            >
              My Posted Rides
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'details' && (
          <View style={globalStyles.card}>
            <Text style={profileStyles.sectionHeading}>Personal Details</Text>

            <View style={tripStyles.row}>
              <View style={tripStyles.col}>
                <Text style={globalStyles.label}>First Name</Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder="First name"
                  placeholderTextColor={colors.text.muted}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={tripStyles.col}>
                <Text style={globalStyles.label}>Last Name</Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder="Last name"
                  placeholderTextColor={colors.text.muted}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <Text style={globalStyles.label}>Phone Number</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={colors.text.muted}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />

            <Text style={globalStyles.label}>About You / Bio</Text>
            <TextInput
              style={[globalStyles.input, { height: 60, textAlignVertical: 'top' }]}
              placeholder="Commuter preferences, luggage policies..."
              placeholderTextColor={colors.text.muted}
              multiline
              value={bio}
              onChangeText={setBio}
            />

            <Text style={profileStyles.sectionHeading}>Driver & Vehicle Information</Text>

            <Text style={globalStyles.label}>Vehicle Make & Model</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="e.g. Honda Civic, Toyota RAV4"
              placeholderTextColor={colors.text.muted}
              value={vehicleModel}
              onChangeText={setVehicleModel}
            />

            <View style={tripStyles.row}>
              <View style={tripStyles.col}>
                <Text style={globalStyles.label}>Vehicle Color</Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder="e.g. Silver, Black"
                  placeholderTextColor={colors.text.muted}
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                />
              </View>
              <View style={tripStyles.col}>
                <Text style={globalStyles.label}>License Plate</Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder="e.g. ABCD 123"
                  placeholderTextColor={colors.text.muted}
                  autoCapitalize="characters"
                  value={vehiclePlate}
                  onChangeText={setVehiclePlate}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[globalStyles.primaryBtn, isSaving && globalStyles.btnDisabled]}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <Text style={globalStyles.primaryBtnText}>Save Profile Updates</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'rides' && (
          <View>
            {isLoadingTrips ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xl }} />
            ) : postedTrips.length === 0 ? (
              <View style={searchStyles.emptyState}>
                <Text style={searchStyles.emptyTitle}>No posted rides</Text>
                <Text style={searchStyles.emptySubtitle}>
                  You haven't posted any trips yet. Use the "Post" tab to offer rides.
                </Text>
              </View>
            ) : (
              postedTrips.map((trip) => {
                const departureDate = new Date(trip.departure_time);
                const isCancelled = trip.status === 'cancelled';

                return (
                  <View key={trip.id} style={globalStyles.card}>
                    <View style={searchStyles.tripHeader}>
                      <View style={searchStyles.routeBox}>
                        <Text style={searchStyles.originText} numberOfLines={1}>
                          {trip.origin_name}
                        </Text>
                        <Text style={searchStyles.routeArrow}>↓</Text>
                        <Text style={searchStyles.destinationText} numberOfLines={1}>
                          {trip.destination_name}
                        </Text>
                      </View>
                      <View>
                        <Text style={searchStyles.priceAmount}>${trip.price_per_seat}</Text>
                        <Text style={searchStyles.priceUnit}>per seat</Text>
                      </View>
                    </View>

                    <View style={searchStyles.metaRow}>
                      <Text style={searchStyles.metaText}>
                        🕒 {departureDate.toLocaleString('en-CA', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                      <Text style={searchStyles.metaText}>
                        Status: <Text style={{ fontWeight: '700' }}>{trip.status}</Text>
                      </Text>
                    </View>

                    <Text style={searchStyles.metaText}>
                      Seats available: {trip.available_seats}
                    </Text>

                    {!isCancelled && (
                      <TouchableOpacity
                        style={[
                          profileStyles.dangerOutlineBtn,
                          cancellingTripId === trip.id && globalStyles.btnDisabled,
                        ]}
                        onPress={() => handleCancelTrip(trip)}
                        disabled={cancellingTripId === trip.id}
                      >
                        {cancellingTripId === trip.id ? (
                          <ActivityIndicator color={colors.status.danger} />
                        ) : (
                          <Text style={profileStyles.dangerOutlineBtnText}>Cancel This Ride</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        <TouchableOpacity style={profileStyles.logoutBtn} onPress={handleSignOut}>
          <Text style={profileStyles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};