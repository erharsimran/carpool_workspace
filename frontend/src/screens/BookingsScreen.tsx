// src/screens/BookingsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { api, Booking } from '../services/api';
import { useAlert } from '../context/AlertContext';
import {
  colors,
  spacing,
  globalStyles,
  searchStyles,
  bookingStyles,
} from '../styles/styles';

export const BookingsScreen: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const { showSuccess, showError, showWarning } = useAlert();

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getMyBookings();
      setBookings(data || []);
    } catch (err: any) {
      showError(err.message || 'Failed to retrieve bookings.');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCancelBooking = (booking: Booking) => {
    if (!booking.trip?.departure_time) {
      showError('Departure time unavailable for this booking.');
      return;
    }

    const departureTime = new Date(booking.trip.departure_time).getTime();
    const hoursRemaining = (departureTime - Date.now()) / (1000 * 60 * 60);

    // Only lock if departure is in the future but less than 5 hours away
    if (hoursRemaining >= 0 && hoursRemaining < 5) {
      showWarning(
        'Cancellations are locked within 5 hours of departure per policy.',
        'Cancellation Locked'
      );
      return;
    }

    const confirmMsg = `Cancel your reservation for ${booking.trip.origin_name || 'ride'} to ${booking.trip.destination_name || 'destination'}? Seats will be returned to the trip.`;

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        proceedCancel(booking.id);
      }
      return;
    }

    Alert.alert('Cancel Booking', confirmMsg, [
      { text: 'Keep Booking', style: 'cancel' },
      {
        text: 'Cancel Ride',
        style: 'destructive',
        onPress: () => proceedCancel(booking.id),
      },
    ]);
  };

  const proceedCancel = async (bookingId: number) => {
    setCancellingId(bookingId);
    try {
      await api.cancelBooking(bookingId);
      showSuccess('Your reservation has been cancelled.', 'Cancelled');
      await loadBookings();
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Unable to cancel booking.';
      showError(msg, 'Error');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusTheme = (rawStatus: string = '') => {
    const status = rawStatus.toLowerCase();
    switch (status) {
      case 'confirmed':
      case 'booked':
      case 'active':
        return {
          badgeStyle: bookingStyles.badgeConfirmed,
          textColor: '#065F46',
        };
      case 'cancelled':
        return {
          badgeStyle: bookingStyles.badgeCancelled,
          textColor: '#991B1B',
        };
      case 'completed':
        return {
          badgeStyle: bookingStyles.badgeCompleted,
          textColor: colors.primaryDark,
        };
      default:
        return {
          badgeStyle: undefined,
          textColor: colors.text.secondary,
        };
    }
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <View style={globalStyles.screenContainer}>
        <Text style={searchStyles.headerTitle}>My Booked Rides</Text>

        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          refreshing={isLoading}
          onRefresh={loadBookings}
          ListEmptyComponent={
            !isLoading ? (
              <View style={searchStyles.emptyState}>
                <Text style={searchStyles.emptyTitle}>No bookings found</Text>
                <Text style={searchStyles.emptySubtitle}>
                  You haven't reserved any rides across Ontario yet.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const rawStatus = (item.status || '').toLowerCase();
            const isCancelled = rawStatus === 'cancelled';
            const isCompleted = rawStatus === 'completed';
            const canAttemptCancel = !isCancelled && !isCompleted;

            const departureDate = item.trip?.departure_time
              ? new Date(item.trip.departure_time)
              : null;

            const now = Date.now();
            const departureTime = departureDate ? departureDate.getTime() : 0;
            const hoursRemaining = (departureTime - now) / (1000 * 60 * 60);

            // True only if departure is upcoming AND within 5 hours
            const isWithinLockWindow =
              departureTime > now && hoursRemaining < 5 && canAttemptCancel;

            const { badgeStyle, textColor } = getStatusTheme(item.status);

            return (
              <View style={globalStyles.card}>
                <View style={bookingStyles.headerRow}>
                  <View style={[bookingStyles.statusBadge, badgeStyle]}>
                    <Text
                      style={[
                        bookingStyles.statusBadgeText,
                        { color: textColor },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                  <Text style={searchStyles.priceAmount}>${item.total_price} CAD</Text>
                </View>

                {/* Route */}
                <View style={[searchStyles.routeBox, { marginVertical: spacing.xs }]}>
                  <Text style={searchStyles.originText} numberOfLines={1}>
                    {item.trip?.origin_name || 'Origin not specified'}
                  </Text>
                  <Text style={searchStyles.routeArrow}>↓</Text>
                  <Text style={searchStyles.destinationText} numberOfLines={1}>
                    {item.trip?.destination_name || 'Destination not specified'}
                  </Text>
                </View>

                {/* Trip & Reservation Details */}
                <View style={bookingStyles.detailRow}>
                  <Text style={bookingStyles.detailLabel}>Departure</Text>
                  <Text style={bookingStyles.detailValue}>
                    {departureDate
                      ? departureDate.toLocaleString('en-CA', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : 'Date not set'}
                  </Text>
                </View>

                <View style={bookingStyles.detailRow}>
                  <Text style={bookingStyles.detailLabel}>Reserved Seats</Text>
                  <Text style={bookingStyles.detailValue}>
                    {item.seats_booked} seat{item.seats_booked !== 1 ? 's' : ''}
                  </Text>
                </View>

                {item.trip?.driver && (
                  <View style={bookingStyles.detailRow}>
                    <Text style={bookingStyles.detailLabel}>Driver</Text>
                    <Text style={bookingStyles.detailValue}>
                      {item.trip.driver.first_name || item.trip.driver.username}
                      {item.trip.driver.vehicle_make_model
                        ? ` (${item.trip.driver.vehicle_make_model})`
                        : ''}
                    </Text>
                  </View>
                )}

                {/* Lock Window Notice */}
                {isWithinLockWindow && (
                  <View style={bookingStyles.lockNotice}>
                    <Text style={bookingStyles.lockNoticeText}>
                      Departure is in under 5 hours. Cancellation is locked.
                    </Text>
                  </View>
                )}

                {/* Cancel Action Button */}
                {canAttemptCancel && (
                  <TouchableOpacity
                    style={[
                      bookingStyles.cancelBtn,
                      (isWithinLockWindow || cancellingId === item.id) &&
                        globalStyles.btnDisabled,
                    ]}
                    onPress={() => handleCancelBooking(item)}
                    disabled={isWithinLockWindow || cancellingId === item.id}
                  >
                    {cancellingId === item.id ? (
                      <ActivityIndicator color={colors.status.danger} />
                    ) : (
                      <Text style={bookingStyles.cancelBtnText}>
                        {isWithinLockWindow ? 'Cancellation Locked' : 'Cancel Reservation'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
};