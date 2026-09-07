import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  stopStyles,
} from '../styles/styles';

const RECENT_SEARCHES_KEY = '@ontarioride_recent_searches';

interface RecentSearchItem {
  id: string;
  originName: string;
  destName: string;
  originCoords?: { latitude: number; longitude: number } | null;
  destCoords?: { latitude: number; longitude: number } | null;
}

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { showSuccess, showError, showWarning } = useAlert();

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

  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);

  // Booking Modal State
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [selectedPickupStopId, setSelectedPickupStopId] = useState<number | null>(null);
  const [selectedDropoffStopId, setSelectedDropoffStopId] = useState<number | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (err) {
        console.warn('Failed to load recent searches:', err);
      }
    };
    loadRecentSearches();
  }, []);

  const saveSearch = async (
    origName: string,
    dstName: string,
    origCoords?: { latitude: number; longitude: number } | null,
    dstCoords?: { latitude: number; longitude: number } | null
  ) => {
    if (!origName.trim() && !dstName.trim()) return;

    try {
      const newItem: RecentSearchItem = {
        id: `${origName}-${dstName}-${Date.now()}`,
        originName: origName.trim(),
        destName: dstName.trim(),
        originCoords: origCoords || null,
        destCoords: dstCoords || null,
      };

      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      const list: RecentSearchItem[] = stored ? JSON.parse(stored) : [];

      const filtered = list.filter(
        (item) =>
          !(
            item.originName.toLowerCase() === origName.trim().toLowerCase() &&
            item.destName.toLowerCase() === dstName.trim().toLowerCase()
          )
      );

      const updated = [newItem, ...filtered].slice(0, 5);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save recent search:', err);
    }
  };

  const handleClearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (err) {
      console.warn('Failed to clear recent searches:', err);
    }
  };

  const executeSearch = useCallback(
    async (
      overrideOrigin?: { lat?: number; lng?: number; name?: string },
      overrideDest?: { lat?: number; lng?: number; name?: string }
    ) => {
      setIsSearching(true);
      setHasSearched(true);

      const origLat = overrideOrigin ? overrideOrigin.lat : originSelected?.latitude;
      const origLng = overrideOrigin ? overrideOrigin.lng : originSelected?.longitude;
      const destLat = overrideDest ? overrideDest.lat : destSelected?.latitude;
      const destLng = overrideDest ? overrideDest.lng : destSelected?.longitude;

      const origName = overrideOrigin?.name ?? originQuery;
      const dstName = overrideDest?.name ?? destinationQuery;

      try {
        const results = await api.searchTrips({
          origin_lat: origLat,
          origin_lng: origLng,
          dest_lat: destLat,
          dest_lng: destLng,
          date: departingDate ? departingDate : undefined,
        });
        setTrips(results);

        if (origName || dstName) {
          saveSearch(
            origName,
            dstName,
            origLat && origLng ? { latitude: origLat, longitude: origLng } : null,
            destLat && destLng ? { latitude: destLat, longitude: destLng } : null
          );
        }
      } catch (err: any) {
        showError(err.message || 'Failed to search trips.');
      } finally {
        setIsSearching(false);
      }
    },
    [originSelected, destSelected, originQuery, destinationQuery, departingDate, showError]
  );

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

  const handleSelectRecentSearch = (item: RecentSearchItem) => {
    setOriginQuery(item.originName);
    setDestinationQuery(item.destName);

    const origCoords = item.originCoords
      ? { latitude: item.originCoords.latitude, longitude: item.originCoords.longitude, displayName: item.originName, id: 0 }
      : null;
    const dstCoords = item.destCoords
      ? { latitude: item.destCoords.latitude, longitude: item.destCoords.longitude, displayName: item.destName, id: 0 }
      : null;

    setOriginSelected(origCoords as any);
    setDestSelected(dstCoords as any);

    executeSearch(
      { lat: item.originCoords?.latitude, lng: item.originCoords?.longitude, name: item.originName },
      { lat: item.destCoords?.latitude, lng: item.destCoords?.longitude, name: item.destName }
    );
  };

  const openBookingModal = (trip: Trip) => {
    setSelectedTrip(trip);
    setSeatsToBook(1);
    setSelectedPickupStopId(null);
    setSelectedDropoffStopId(null);
  };

  const validateStopOrder = (): boolean => {
    if (!selectedTrip || !selectedTrip.stops) return true;

    if (selectedPickupStopId !== null && selectedDropoffStopId !== null) {
      if (selectedPickupStopId === selectedDropoffStopId) {
        showWarning('Pick-up and drop-off cannot be the same stop.', 'Invalid Route');
        return false;
      }
      const pStop = selectedTrip.stops.find((s) => s.id === selectedPickupStopId);
      const dStop = selectedTrip.stops.find((s) => s.id === selectedDropoffStopId);
      if (pStop && dStop && pStop.stop_order >= dStop.stop_order) {
        showWarning('Drop-off stop must occur after pick-up stop along the route.', 'Invalid Order');
        return false;
      }
    }
    return true;
  };

  const handleConfirmBooking = async () => {
    if (!selectedTrip) return;
    if (!validateStopOrder()) return;

    setIsBooking(true);
    try {
      await api.createBooking({
        trip_id: selectedTrip.id,
        seats_booked: seatsToBook,
        pickup_stop_id: selectedPickupStopId,
        dropoff_stop_id: selectedDropoffStopId,
      });
      showSuccess(`Successfully booked ${seatsToBook} seat(s).`, 'Ride Booked');
      setSelectedTrip(null);
      executeSearch();
    } catch (err: any) {
      showError(err.response?.data?.detail || 'Booking failed.', 'Error');
    } finally {
      setIsBooking(false);
    }
  };

  const calculateEffectivePrice = (): number => {
    if (!selectedTrip) return 0;
    if (selectedPickupStopId) {
      const stop = selectedTrip.stops?.find((s) => s.id === selectedPickupStopId);
      if (stop && stop.price_from_origin) {
        return Number(stop.price_from_origin);
      }
    }
    return Number(selectedTrip.price_per_seat);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView
        contentContainerStyle={[globalStyles.screenContainer, { paddingBottom: spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={heroStyles.bannerCard}>
          <View style={heroStyles.textContainer}>
            <Text style={heroStyles.title}>Find your ride</Text>
            <Text style={heroStyles.subtitle}>Select verified pickup and drop-off points</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Post')}>
              <Text style={heroStyles.linkText}>Offer a ride with stops</Text>
            </TouchableOpacity>
          </View>
          <View style={heroStyles.iconCircle}>
            <Text style={heroStyles.iconEmoji}>🚗</Text>
          </View>
        </View>

        {/* Input Fields */}
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
                onPress={() => {
                  setOriginQuery('');
                  setOriginSelected(null);
                }}
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
                onPress={() => {
                  setDestinationQuery('');
                  setDestSelected(null);
                }}
              >
                <Text style={searchFormStyles.clearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Date Picker Input */}
          <View style={searchFormStyles.inputField}>
            <Text style={searchFormStyles.fieldIcon}>📅</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                min={todayStr}
                value={departingDate}
                onChange={(e) => setDepartingDate(e.target.value)}
                style={{
                  flex: 1,
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontSize: 14,
                  color: departingDate ? colors.text.primary : colors.text.muted,
                  fontFamily: 'inherit',
                  padding: '0 8px',
                  cursor: 'pointer',
                }}
              />
            ) : (
              <TextInput
                style={searchFormStyles.inputText}
                placeholder="Departing date (YYYY-MM-DD)"
                placeholderTextColor={colors.text.muted}
                value={departingDate}
                onChangeText={setDepartingDate}
              />
            )}
            {departingDate.length > 0 && (
              <TouchableOpacity
                style={searchFormStyles.clearBtn}
                onPress={() => setDepartingDate('')}
              >
                <Text style={searchFormStyles.clearText}>✕</Text>
              </TouchableOpacity>
            )}
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
            onPress={() => executeSearch()}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={searchFormStyles.darkSearchBtnText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* State Before Search: Only User's Last 5 Searches */}
        {!hasSearched ? (
          <View style={{ marginTop: spacing.sm }}>
            {recentSearches.length > 0 ? (
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: spacing.xs,
                  }}
                >
                  <Text style={[searchStyles.headerTitle, { fontSize: 14, marginBottom: 0 }]}>
                    Recent Searches ({recentSearches.length})
                  </Text>
                  <TouchableOpacity onPress={handleClearRecentSearches}>
                    <Text style={{ fontSize: 12, color: colors.status.danger, fontWeight: '600' }}>
                      Clear All
                    </Text>
                  </TouchableOpacity>
                </View>

                {recentSearches.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={routeListStyles.itemRow}
                    onPress={() => handleSelectRecentSearch(item)}
                  >
                    <Text style={routeListStyles.itemText}>
                      🕒 {item.originName || 'Anywhere'} ➔ {item.destName || 'Anywhere'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={[searchStyles.emptyState, { paddingVertical: spacing.lg }]}>
                <Text style={searchStyles.emptyTitle}>No recent searches</Text>
                <Text style={searchStyles.emptySubtitle}>
                  Enter a pickup and drop-off location above to find available rides.
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Search Results */
          <View style={{ marginTop: spacing.md }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.sm,
              }}
            >
              <Text style={[searchStyles.headerTitle, { marginBottom: 0 }]}>Available Rides</Text>
              <TouchableOpacity onPress={() => setHasSearched(false)}>
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                  Back to Recent Searches
                </Text>
              </TouchableOpacity>
            </View>

            {trips.length === 0 && !isSearching ? (
              <View style={searchStyles.emptyState}>
                <Text style={searchStyles.emptyTitle}>No rides found</Text>
                <Text style={searchStyles.emptySubtitle}>
                  Try searching a different location or check back later.
                </Text>
              </View>
            ) : (
              trips.map((item) => {
                const departureDate = new Date(item.departure_time);
                const hasStops = Boolean(item.stops && item.stops.length > 0);
                const isFull = item.available_seats < 1;

                return (
                  <View key={item.id} style={globalStyles.card}>
                    <View style={searchStyles.tripHeader}>
                      <View style={searchStyles.routeBox}>
                        <Text style={searchStyles.originText} numberOfLines={1}>
                          {item.origin_name}
                        </Text>
                        {hasStops ? (
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.primary,
                              fontWeight: '700',
                              marginVertical: 2,
                            }}
                          >
                            + {item.stops!.length} intermediate stop{item.stops!.length !== 1 ? 's' : ''}
                          </Text>
                        ) : null}
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
                        {departureDate.toLocaleString('en-CA', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                      <Text style={searchStyles.metaText}>
                        💺 {item.available_seats} seat{item.available_seats !== 1 ? 's' : ''} left
                      </Text>
                    </View>

                    {item.driver && (
                      <Text style={searchStyles.driverInfo}>
                        Driver: {item.driver.first_name || item.driver.username}
                        {item.driver.vehicle_make_model ? ` • ${item.driver.vehicle_make_model}` : ''}
                      </Text>
                    )}

                    <TouchableOpacity
                      style={[
                        globalStyles.primaryBtn,
                        isFull && globalStyles.btnDisabled,
                        { marginTop: spacing.sm },
                      ]}
                      disabled={isFull}
                      onPress={() => openBookingModal(item)}
                    >
                      <Text style={globalStyles.primaryBtnText}>
                        {isFull ? 'Trip Full' : 'Book Seat'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Booking Modal Overlay */}
      {selectedTrip && (
        <View style={bookingModalStyles.backdrop}>
          <View style={[globalStyles.card, bookingModalStyles.modalCard]}>
            <Text style={bookingModalStyles.modalTitle}>Select Pick-up & Drop-off</Text>

            <Text style={stopStyles.selectLabel}>1. Pick-Up Location:</Text>
            <View style={stopStyles.optionPillGroup}>
              <TouchableOpacity
                style={[
                  stopStyles.optionPill,
                  selectedPickupStopId === null && stopStyles.optionPillActive,
                ]}
                onPress={() => setSelectedPickupStopId(null)}
              >
                <Text
                  style={[
                    stopStyles.optionPillText,
                    selectedPickupStopId === null && stopStyles.optionPillTextActive,
                  ]}
                  numberOfLines={1}
                >
                  Origin: {selectedTrip.origin_name.split(',')[0]}
                </Text>
              </TouchableOpacity>

              {selectedTrip.stops?.map((stop) => (
                <TouchableOpacity
                  key={stop.id}
                  style={[
                    stopStyles.optionPill,
                    selectedPickupStopId === stop.id && stopStyles.optionPillActive,
                  ]}
                  onPress={() => setSelectedPickupStopId(stop.id)}
                >
                  <Text
                    style={[
                      stopStyles.optionPillText,
                      selectedPickupStopId === stop.id && stopStyles.optionPillTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    📍 {stop.stop_name.split(',')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={stopStyles.selectLabel}>2. Drop-Off Location:</Text>
            <View style={stopStyles.optionPillGroup}>
              {selectedTrip.stops?.map((stop) => (
                <TouchableOpacity
                  key={stop.id}
                  style={[
                    stopStyles.optionPill,
                    selectedDropoffStopId === stop.id && stopStyles.optionPillActive,
                  ]}
                  onPress={() => setSelectedDropoffStopId(stop.id)}
                >
                  <Text
                    style={[
                      stopStyles.optionPillText,
                      selectedDropoffStopId === stop.id && stopStyles.optionPillTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    📍 {stop.stop_name.split(',')[0]}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[
                  stopStyles.optionPill,
                  selectedDropoffStopId === null && stopStyles.optionPillActive,
                ]}
                onPress={() => setSelectedDropoffStopId(null)}
              >
                <Text
                  style={[
                    stopStyles.optionPillText,
                    selectedDropoffStopId === null && stopStyles.optionPillTextActive,
                  ]}
                  numberOfLines={1}
                >
                  Destination: {selectedTrip.destination_name.split(',')[0]}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={stopStyles.selectLabel}>Seats</Text>
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
                  setSeatsToBook((p) => Math.min(selectedTrip.available_seats, p + 1))
                }
              >
                <Text style={bookingModalStyles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={bookingModalStyles.fareRow}>
              <Text style={bookingModalStyles.fareLabel}>Total Price:</Text>
              <Text style={bookingModalStyles.fareAmount}>
                ${seatsToBook * calculateEffectivePrice()} CAD
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