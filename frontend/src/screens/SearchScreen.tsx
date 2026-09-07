// src/screens/SearchScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api, Trip } from '../services/api';
import { searchLocations, LocationSuggestion } from '../services/geocoding';
import { useAlert } from '../context/AlertContext';
import {
  colors,
  spacing,
  globalStyles,
  heroStyles,
  searchStyles,
  searchFormStyles,
  routeListStyles,
  bookingModalStyles,
} from '../styles/styles';

const POPULAR_ROUTES = [
  { origin: 'Cambridge', destination: 'Burlington' },
  { origin: 'Burlington', destination: 'Cambridge' },
  { origin: 'Cambridge', destination: 'Hamilton' },
  { origin: 'Brampton', destination: 'Cambridge' },
  { origin: 'Hamilton', destination: 'Cambridge' },
  { origin: 'Toronto', destination: 'Cambridge' },
  { origin: 'Waterloo', destination: 'Toronto' },
];

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { showSuccess, showError } = useAlert();

  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [departingDate, setDepartingDate] = useState('');

  const [originSelected, setOriginSelected] = useState<LocationSuggestion | null>(null);
  const [destSelected, setDestSelected] = useState<LocationSuggestion | null>(null);

  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

  const loadTrips = useCallback(async () => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await api.searchTrips({
        origin_lat: originSelected?.latitude,
        origin_lng: originSelected?.longitude,
        dest_lat: destSelected?.latitude,
        dest_lng: destSelected?.longitude,
      });
      setTrips(results);
    } catch (err: any) {
      showError(err.message || 'Failed to search trips.');
    } finally {
      setIsSearching(false);
    }
  }, [originSelected, destSelected, showError]);

  const handleLocationQueryChange = async (text: string, field: 'origin' | 'destination') => {
    if (field === 'origin') {
      setOriginQuery(text);
      setOriginSelected(null);
    } else {
      setDestinationQuery(text);
      setDestSelected(null);
    }

    if (text.trim().length >= 2) {
      setActiveField(field);
      const res = await searchLocations(text);
      setSuggestions(res);
    } else {
      setSuggestions([]);
      setActiveField(null);
    }
  };

  const handleSelectSuggestion = (item: LocationSuggestion) => {
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

  const handleSwapRoute = () => {
    const tempText = originQuery;
    const tempItem = originSelected;

    setOriginQuery(destinationQuery);
    setOriginSelected(destSelected);

    setDestinationQuery(tempText);
    setDestSelected(tempItem);
  };

  const handleSelectPopularRoute = (route: { origin: string; destination: string }) => {
    setOriginQuery(route.origin);
    setDestinationQuery(route.destination);
    setOriginSelected(null);
    setDestSelected(null);
    loadTrips();
  };

  const handleConfirmBooking = async () => {
    if (!selectedTrip) return;
    setIsBooking(true);
    try {
      await api.createBooking(selectedTrip.id, seatsToBook);
      showSuccess(`Successfully booked ${seatsToBook} seat(s).`, 'Ride Booked');
      setSelectedTrip(null);
      setSeatsToBook(1);
      loadTrips();
    } catch (err: any) {
      showError(err.response?.data?.detail || 'Booking failed.', 'Error');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView
        contentContainerStyle={[globalStyles.screenContainer, { paddingBottom: spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={heroStyles.bannerCard}>
          <View style={heroStyles.textContainer}>
            <Text style={heroStyles.title}>Find your ride</Text>
            <Text style={heroStyles.subtitle}>Get a ride with a verified driver</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Post')}>
              <Text style={heroStyles.linkText}>How it works</Text>
            </TouchableOpacity>
          </View>

          <View style={heroStyles.iconCircle}>
            <Text style={heroStyles.iconEmoji}>🚗</Text>
          </View>
        </View>

        <View style={searchFormStyles.inputContainer}>
          <View style={searchFormStyles.inputField}>
            <Text style={searchFormStyles.fieldIcon}>📍</Text>
            <TextInput
              style={searchFormStyles.inputText}
              placeholder="Pick-up location"
              placeholderTextColor={colors.text.muted}
              value={originQuery}
              onChangeText={(t) => handleLocationQueryChange(t, 'origin')}
            />
            {originQuery.length > 0 && (
              <TouchableOpacity
                style={searchFormStyles.clearBtn}
                onPress={() => setOriginQuery('')}
              >
                <Text style={searchFormStyles.clearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={searchFormStyles.swapBtn} onPress={handleSwapRoute}>
            <Text style={searchFormStyles.swapText}>⇅</Text>
          </TouchableOpacity>

          <View style={searchFormStyles.inputField}>
            <Text style={searchFormStyles.fieldIcon}>📍</Text>
            <TextInput
              style={searchFormStyles.inputText}
              placeholder="Drop-off location"
              placeholderTextColor={colors.text.muted}
              value={destinationQuery}
              onChangeText={(t) => handleLocationQueryChange(t, 'destination')}
            />
            {destinationQuery.length > 0 && (
              <TouchableOpacity
                style={searchFormStyles.clearBtn}
                onPress={() => setDestinationQuery('')}
              >
                <Text style={searchFormStyles.clearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={searchFormStyles.inputField}>
            <Text style={searchFormStyles.fieldIcon}>📅</Text>
            <TextInput
              style={searchFormStyles.inputText}
              placeholder="Departing (optional)"
              placeholderTextColor={colors.text.muted}
              value={departingDate}
              onChangeText={setDepartingDate}
            />
          </View>

          {suggestions.length > 0 && (
            <View style={searchStyles.suggestionBox}>
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={searchStyles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                >
                  <Text style={searchStyles.suggestionText} numberOfLines={1}>
                    📍 {item.displayName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[searchFormStyles.darkSearchBtn, isSearching && globalStyles.btnDisabled]}
            onPress={loadTrips}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={searchFormStyles.darkSearchBtnText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {!hasSearched ? (
          <View style={{ marginTop: spacing.md }}>
            {POPULAR_ROUTES.map((route, index) => (
              <TouchableOpacity
                key={index}
                style={routeListStyles.itemRow}
                onPress={() => handleSelectPopularRoute(route)}
              >
                <Text style={routeListStyles.itemText}>
                  {route.origin} to {route.destination}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={{ marginTop: spacing.md }}>
            {trips.length === 0 && !isSearching ? (
              <View style={searchStyles.emptyState}>
                <Text style={searchStyles.emptyTitle}>No rides found</Text>
                <Text style={searchStyles.emptySubtitle}>
                  Try selecting another date or broad location.
                </Text>
              </View>
            ) : (
              trips.map((item) => (
                <View key={item.id} style={globalStyles.card}>
                  <View style={searchStyles.tripHeader}>
                    <View style={searchStyles.routeBox}>
                      <Text style={searchStyles.originText} numberOfLines={1}>
                        {item.origin_name}
                      </Text>
                      <Text style={searchStyles.routeArrow}>↓</Text>
                      <Text style={searchStyles.destinationText} numberOfLines={1}>
                        {item.destination_name}
                      </Text>
                    </View>
                    <View>
                      <Text style={searchStyles.priceAmount}>${item.price_per_seat}</Text>
                      <Text style={searchStyles.priceUnit}>per seat</Text>
                    </View>
                  </View>

                  <View style={searchStyles.metaRow}>
                    <Text style={searchStyles.metaText}>
                      🕒{' '}
                      {new Date(item.departure_time).toLocaleString('en-CA', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Text style={searchStyles.metaText}>
                      💺 {item.available_seats} seat
                      {item.available_seats !== 1 ? 's' : ''} left
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      globalStyles.primaryBtn,
                      item.available_seats < 1 && globalStyles.btnDisabled,
                      { marginTop: spacing.sm },
                    ]}
                    disabled={item.available_seats < 1}
                    onPress={() => {
                      setSelectedTrip(item);
                      setSeatsToBook(1);
                    }}
                  >
                    <Text style={globalStyles.primaryBtnText}>
                      {item.available_seats < 1 ? 'Trip Full' : 'Book Seat'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {selectedTrip && (
        <View style={bookingModalStyles.backdrop}>
          <View style={[globalStyles.card, bookingModalStyles.modalCard]}>
            <Text style={bookingModalStyles.modalTitle}>Confirm Booking</Text>
            <Text style={bookingModalStyles.modalRoute}>
              {selectedTrip.origin_name} ➔ {selectedTrip.destination_name}
            </Text>
            <Text style={bookingModalStyles.modalMeta}>
              {new Date(selectedTrip.departure_time).toLocaleString('en-CA', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </Text>

            <Text style={globalStyles.label}>Seats</Text>
            <View style={bookingModalStyles.counterRow}>
              <TouchableOpacity
                style={bookingModalStyles.counterBtn}
                onPress={() => setSeatsToBook((p) => Math.max(1, p - 1))}
              >
                <Text style={bookingModalStyles.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={bookingModalStyles.counterValue}>{seatsToBook}</Text>
              <TouchableOpacity
                style={bookingModalStyles.counterBtn}
                onPress={() =>
                  setSeatsToBook((p) =>
                    Math.min(selectedTrip.available_seats, p + 1)
                  )
                }
              >
                <Text style={bookingModalStyles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={bookingModalStyles.fareRow}>
              <Text style={bookingModalStyles.fareLabel}>Total:</Text>
              <Text style={bookingModalStyles.fareAmount}>
                ${seatsToBook * selectedTrip.price_per_seat} CAD
              </Text>
            </View>

            <View style={bookingModalStyles.buttonRow}>
              <TouchableOpacity
                style={[globalStyles.outlineBtn, { flex: 1, marginRight: spacing.sm }]}
                onPress={() => setSelectedTrip(null)}
                disabled={isBooking}
              >
                <Text style={globalStyles.outlineBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.primaryBtn, { flex: 1 }]}
                onPress={handleConfirmBooking}
                disabled={isBooking}
              >
                {isBooking ? (
                  <ActivityIndicator color={colors.text.inverse} />
                ) : (
                  <Text style={globalStyles.primaryBtnText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};