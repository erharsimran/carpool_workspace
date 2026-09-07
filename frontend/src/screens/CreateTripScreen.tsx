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
import { api, CreateTripInput } from '../services/api';
import { searchLocations, LocationSuggestion } from '../services/geocoding';
import { useAlert } from '../context/AlertContext';
import {
  colors,
  spacing,
  globalStyles,
  searchStyles,
  tripStyles,
} from '../styles/styles';

export const CreateTripScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { showSuccess, showError, showWarning } = useAlert();

  // Route state
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [originSelected, setOriginSelected] = useState<LocationSuggestion | null>(null);
  const [destSelected, setDestSelected] = useState<LocationSuggestion | null>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);

  // Trip details state
  const [departureDate, setDepartureDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16) // Default tomorrow
  );
  const [seats, setSeats] = useState('3');
  const [price, setPrice] = useState('25');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSelectLocation = (item: LocationSuggestion) => {
    if (activeField === 'origin') {
      setOriginQuery(item.displayName);
      setOriginSelected(item);
    } else {
      setDestinationQuery(item.displayName);
      setDestSelected(item);
    }
    setSuggestions([]);
    setActiveField(null);
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
      const payload: CreateTripInput = {
        origin_name: originSelected?.displayName || originQuery.trim(),
        origin_coords: {
          latitude: originSelected?.latitude || 43.6532,
          longitude: originSelected?.longitude || -79.3832,
        },
        destination_name: destSelected?.displayName || destinationQuery.trim(),
        destination_coords: {
          latitude: destSelected?.latitude || 45.4215,
          longitude: destSelected?.longitude || -75.6972,
        },
        departure_time: new Date(departureDate).toISOString(),
        available_seats: seatCount,
        price_per_seat: seatPrice,
        notes: notes.trim(),
      };

      await api.createTrip(payload);
      showSuccess('Your trip has been posted successfully.', 'Ride Published');

      // Reset form
      setOriginQuery('');
      setDestinationQuery('');
      setOriginSelected(null);
      setDestSelected(null);
      setNotes('');

      // Navigate to Search or Bookings
      navigation.navigate('Search');
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to create trip.';
      showError(msg, 'Error Posting Ride');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[globalStyles.screenContainer, { paddingBottom: spacing.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={globalStyles.card}>
            <Text style={tripStyles.headerTitle}>Post a Ride in Ontario</Text>

            {/* Pick-Up */}
            <Text style={globalStyles.label}>Pick-Up Location</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="City, town, or address..."
              placeholderTextColor={colors.text.muted}
              value={originQuery}
              onChangeText={(t) => handleLocationChange(t, 'origin')}
            />

            {/* Drop-Off */}
            <Text style={globalStyles.label}>Destination Location</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Where are you heading..."
              placeholderTextColor={colors.text.muted}
              value={destinationQuery}
              onChangeText={(t) => handleLocationChange(t, 'destination')}
            />

            {/* Autocomplete suggestions */}
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

            {/* Departure */}
            <Text style={globalStyles.label}>Departure Date & Time (YYYY-MM-DDTHH:MM)</Text>
            <TextInput
              style={globalStyles.input}
              placeholder="2026-06-15T09:00"
              placeholderTextColor={colors.text.muted}
              value={departureDate}
              onChangeText={setDepartureDate}
            />

            {/* Seats & Price Row */}
            <View style={tripStyles.row}>
              <View style={tripStyles.col}>
                <Text style={globalStyles.label}>Available Seats</Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder="3"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="numeric"
                  value={seats}
                  onChangeText={setSeats}
                />
              </View>

              <View style={tripStyles.col}>
                <Text style={globalStyles.label}>Price / Seat ($ CAD)</Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder="25"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
            </View>

            {/* Notes */}
            <Text style={globalStyles.label}>Trip Notes & Luggage Policy</Text>
            <TextInput
              style={[globalStyles.input, { height: 75, textAlignVertical: 'top' }]}
              placeholder="e.g. Medium luggage allowed, pick-up near downtown station..."
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