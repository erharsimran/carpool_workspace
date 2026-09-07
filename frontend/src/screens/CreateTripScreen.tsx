// src/screens/CreateTripScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api, CreateTripInput, TripStopInput } from '../services/api';
import { searchLocations, LocationSuggestion } from '../services/geocoding';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';
import {
  colors,
  spacing,
  globalStyles,
  searchStyles,
  tripStyles,
  stopStyles,
} from '../styles/styles';

interface IntermediateStopState {
  id: string;
  name: string;
  coords: { latitude: number; longitude: number };
  price: string;
}

export const CreateTripScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useAlert();

  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [originSelected, setOriginSelected] = useState<LocationSuggestion | null>(null);
  const [destSelected, setDestSelected] = useState<LocationSuggestion | null>(null);

  const [stops, setStops] = useState<IntermediateStopState[]>([]);
  const [activeStopIndex, setActiveStopIndex] = useState<number | null>(null);

  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | 'stop' | null>(null);

  const getDefaultDateTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  const [departureDate, setDepartureDate] = useState<string>(getDefaultDateTime());
  const [seats, setSeats] = useState('3');
  const [price, setPrice] = useState('25');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if driver has added vehicle details
  const hasVehicleDetails = Boolean(
    user?.vehicle_make_model?.trim() && user?.vehicle_plate?.trim()
  );

  // If vehicle details are missing, show the registration requirement screen
  if (!hasVehicleDetails) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={[globalStyles.screenContainer, { justifyContent: 'center' }]}>
          <View style={[globalStyles.card, { alignItems: 'center', paddingVertical: spacing.xl }]}>
            <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🚗</Text>
            <Text style={[tripStyles.headerTitle, { textAlign: 'center', marginBottom: spacing.xs }]}>
              Vehicle Details Required
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.text.secondary,
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: spacing.lg,
                paddingHorizontal: spacing.sm,
              }}
            >
              To offer rides and ensure rider safety, OntarioRide requires all drivers to add their vehicle make, model, and license plate.
            </Text>
            <TouchableOpacity
              style={[globalStyles.primaryBtn, { width: '100%' }]}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={globalStyles.primaryBtnText}>Add Vehicle Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const handleLocationChange = async (text: string, field: 'origin' | 'destination') => {
    if (field === 'origin') {
      setOriginQuery(text);
      setOriginSelected(null);
    } else {
      setDestinationQuery(text);
      setDestSelected(null);
    }

    if (text.trim().length >= 2) {
      setActiveField(field);
      const results = await searchLocations(text);
      setSuggestions(results);
    } else {
      setSuggestions([]);
      setActiveField(null);
    }
  };

  const handleStopQueryChange = async (text: string, index: number) => {
    setActiveStopIndex(index);
    setActiveField('stop');

    const updated = [...stops];
    updated[index].name = text;
    setStops(updated);

    if (text.trim().length >= 2) {
      const results = await searchLocations(text);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectLocation = (item: LocationSuggestion) => {
    if (activeField === 'origin') {
      setOriginQuery(item.displayName);
      setOriginSelected(item);
    } else if (activeField === 'destination') {
      setDestinationQuery(item.displayName);
      setDestSelected(item);
    } else if (activeField === 'stop' && activeStopIndex !== null) {
      const updated = [...stops];
      updated[activeStopIndex] = {
        ...updated[activeStopIndex],
        name: item.displayName,
        coords: { latitude: item.latitude, longitude: item.longitude },
      };
      setStops(updated);
      setActiveStopIndex(null);
    }
    setSuggestions([]);
    setActiveField(null);
  };

  const addStopField = () => {
    setStops([
      ...stops,
      {
        id: Math.random().toString(),
        name: '',
        coords: { latitude: 43.6532, longitude: -79.3832 },
        price: '',
      },
    ]);
  };

  const removeStopField = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const handleCreateTrip = async () => {
    if (!originQuery.trim() || !destinationQuery.trim()) {
      showWarning('Please provide both pick-up and destination points.', 'Missing Route');
      return;
    }

    const seatCount = parseInt(seats, 10);
    const seatPrice = parseFloat(price);

    if (isNaN(seatCount) || seatCount < 1) {
      showWarning('Please specify at least 1 available seat.', 'Invalid Seats');
      return;
    }

    if (isNaN(seatPrice) || seatPrice < 0) {
      showWarning('Please specify a valid price per seat.', 'Invalid Price');
      return;
    }

    setIsSubmitting(true);
    try {
      let originLat = originSelected?.latitude;
      let originLng = originSelected?.longitude;
      if (!originLat || !originLng) {
        const fallbackOrigin = await searchLocations(originQuery.trim());
        if (fallbackOrigin.length > 0) {
          originLat = fallbackOrigin[0].latitude;
          originLng = fallbackOrigin[0].longitude;
        } else {
          originLat = 43.6532;
          originLng = -79.3832;
        }
      }

      let destLat = destSelected?.latitude;
      let destLng = destSelected?.longitude;
      if (!destLat || !destLng) {
        const fallbackDest = await searchLocations(destinationQuery.trim());
        if (fallbackDest.length > 0) {
          destLat = fallbackDest[0].latitude;
          destLng = fallbackDest[0].longitude;
        } else {
          destLat = 45.4215;
          destLng = -75.6972;
        }
      }

      const formattedStops: TripStopInput[] = stops
        .filter((s) => s.name.trim().length > 0)
        .map((s, index) => ({
          stop_name: s.name.trim(),
          latitude: s.coords.latitude,
          longitude: s.coords.longitude,
          stop_order: index + 1,
          price_from_origin: s.price ? parseFloat(s.price) : undefined,
        }));

      const payload: CreateTripInput = {
        origin_name: originSelected?.displayName || originQuery.trim(),
        origin_lat: originLat,
        origin_lng: originLng,
        destination_name: destSelected?.displayName || destinationQuery.trim(),
        destination_lat: destLat,
        destination_lng: destLng,
        departure_time: new Date(departureDate).toISOString(),
        available_seats: seatCount,
        price_per_seat: seatPrice,
        notes: notes.trim(),
        stops: formattedStops,
      };

      await api.createTrip(payload);
      showSuccess('Your trip and stops have been posted.', 'Ride Published');

      setOriginQuery('');
      setDestinationQuery('');
      setStops([]);
      navigation.navigate('Search');
    } catch (err: any) {
      const msg =
        err.response?.data?.detail?.[0]?.msg ||
        err.response?.data?.detail ||
        'Failed to create trip.';
      showError(typeof msg === 'string' ? msg : JSON.stringify(msg), 'Error Posting Ride');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[globalStyles.screenContainer, { paddingBottom: spacing.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={globalStyles.card}>
            <Text style={tripStyles.headerTitle}>Post a Ride with Stops</Text>

            <Text style={globalStyles.label}>Pick-Up Origin</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Origin address..."
              placeholderTextColor={colors.text.muted}
              value={originQuery}
              onChangeText={(t) => handleLocationChange(t, 'origin')}
            />

            {stops.map((stop, index) => (
              <View key={stop.id} style={stopStyles.stopCard}>
                <View style={stopStyles.stopCardHeader}>
                  <Text style={stopStyles.stopCardTitle}>Stop #{index + 1}</Text>
                  <TouchableOpacity onPress={() => removeStopField(index)}>
                    <Text style={stopStyles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[globalStyles.input, { marginBottom: 6 }]}
                  placeholder="Stop address or landmark..."
                  placeholderTextColor={colors.text.muted}
                  value={stop.name}
                  onChangeText={(t) => handleStopQueryChange(t, index)}
                />

                <TextInput
                  style={[globalStyles.input, { marginBottom: 0 }]}
                  placeholder="Fare from origin (Optional, $ CAD)"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="numeric"
                  value={stop.price}
                  onChangeText={(val) => {
                    const updated = [...stops];
                    updated[index].price = val;
                    setStops(updated);
                  }}
                />
              </View>
            ))}

            <TouchableOpacity style={stopStyles.addStopBtn} onPress={addStopField}>
              <Text style={stopStyles.addStopBtnText}>+ Add Waypoint Stop</Text>
            </TouchableOpacity>

            <Text style={globalStyles.label}>Final Destination</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Drop-off address..."
              placeholderTextColor={colors.text.muted}
              value={destinationQuery}
              onChangeText={(t) => handleLocationChange(t, 'destination')}
            />

            {suggestions.length > 0 && (
              <View style={searchStyles.suggestionBox}>
                {suggestions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={searchStyles.suggestionItem}
                    onPress={() => handleSelectLocation(item)}
                  >
                    <Text style={searchStyles.suggestionText} numberOfLines={1}>
                      📍 {item.displayName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={globalStyles.label}>Departure Date & Time</Text>
            {Platform.OS === 'web' ? (
              <input
                type="datetime-local"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                style={{
                  width: '100%',
                  height: 44,
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  padding: '0 16px',
                  fontSize: 14,
                  color: colors.text.primary,
                  marginBottom: spacing.md,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            ) : (
              <TextInput
                style={globalStyles.input}
                placeholder="YYYY-MM-DDTHH:MM"
                placeholderTextColor={colors.text.muted}
                value={departureDate}
                onChangeText={setDepartureDate}
              />
            )}

            <View style={tripStyles.row}>
              <View style={tripStyles.col}>
                <Text style={globalStyles.label}>Available Seats</Text>
                <TextInput
                  style={globalStyles.input}
                  keyboardType="numeric"
                  value={seats}
                  onChangeText={setSeats}
                />
              </View>
              <View style={tripStyles.col}>
                <Text style={globalStyles.label}>Base Price ($ CAD)</Text>
                <TextInput
                  style={globalStyles.input}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
            </View>

            <Text style={globalStyles.label}>Notes</Text>
            <TextInput
              style={[globalStyles.input, { height: 60 }]}
              placeholder="Luggage policies, music, pickup details..."
              placeholderTextColor={colors.text.muted}
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity
              style={[globalStyles.primaryBtn, isSubmitting && globalStyles.btnDisabled]}
              onPress={handleCreateTrip}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <Text style={globalStyles.primaryBtnText}>Publish Ride</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};