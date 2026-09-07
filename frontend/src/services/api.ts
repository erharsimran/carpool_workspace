// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL =
    Platform.OS === 'android'
        ? 'http://10.0.2.2:8000/api'
        : 'http://localhost:8000/api';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- TYPES & INTERFACES ---
export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    bio?: string;
    vehicle_make_model?: string;
    vehicle_color?: string;
    vehicle_plate?: string;
}

export interface TripStop {
    id: number;
    stop_name: string;
    stop_order: number;
    latitude?: number;
    longitude?: number;
    price_from_origin?: string | number | null;
}

export interface TripStopInput {
    stop_name: string;
    latitude: number;
    longitude: number;
    stop_order: number;
    price_from_origin?: number;
}

export interface Trip {
    id: number;
    origin_name: string;
    origin_coords?: Coordinates;
    destination_name: string;
    destination_coords?: Coordinates;
    departure_time: string;
    available_seats: number;
    price_per_seat: number;
    notes?: string;
    status?: 'scheduled' | 'cancelled' | 'completed';
    driver?: User;
    stops?: TripStop[];
}

export interface CreateTripInput {
    origin_name: string;
    origin_lat: number;
    origin_lng: number;
    destination_name: string;
    destination_lat: number;
    destination_lng: number;
    departure_time: string;
    available_seats: number;
    price_per_seat: number;
    notes?: string;
    stops?: TripStopInput[];
}

export interface CreateBookingPayload {
    trip_id: number;
    seats_booked: number;
    pickup_stop_id?: number | null;
    dropoff_stop_id?: number | null;
}

export interface Booking {
    id: number;
    trip_id: number;
    rider_id: number;
    seats_booked: number;
    total_price: string;
    status: 'confirmed' | 'cancelled' | 'completed';
    pickup_stop_id?: number | null;
    dropoff_stop_id?: number | null;
    created_at: string;
    trip?: Trip;
}

// --- API METHODS ---
export const api = {
    // Auth
    login: async (email: string, password: string) => {
        const res = await apiClient.post('/auth/login', { email, password });
        if (res.data.access_token) {
            await AsyncStorage.setItem('auth_token', res.data.access_token);
        }
        return res.data;
    },

    register: async (payload: {
        username: string;
        email: string;
        password: string;
        phone_number?: string;
    }) => {
        const res = await apiClient.post('/auth/register', payload);
        if (res.data.access_token) {
            await AsyncStorage.setItem('auth_token', res.data.access_token);
        }
        return res.data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('auth_token');
    },

    getMe: async (): Promise<User> => {
        const res = await apiClient.get<User>('/auth/me');
        return res.data;
    },

    // User Profile
    updateProfile: async (payload: Partial<User>): Promise<User> => {
        const res = await apiClient.put<User>('/auth/me', payload);
        return res.data;
    },

    // Trips
    searchTrips: async (params?: {
        origin_lat?: number;
        origin_lng?: number;
        dest_lat?: number;
        dest_lng?: number;
        radius_km?: number;
    }): Promise<Trip[]> => {
        const res = await apiClient.get<Trip[]>('/trips/search', { params });
        return res.data;
    },

    createTrip: async (payload: CreateTripInput): Promise<Trip> => {
        const res = await apiClient.post<Trip>('/trips/', payload);
        return res.data;
    },

    getMyPostedTrips: async (): Promise<Trip[]> => {
        const res = await apiClient.get<Trip[]>('/trips/my-posted');
        return res.data;
    },

    updateTrip: async (
        tripId: number,
        payload: { available_seats?: number; price_per_seat?: number; notes?: string }
    ): Promise<Trip> => {
        const res = await apiClient.put<Trip>(`/trips/${tripId}`, payload);
        return res.data;
    },

    cancelTrip: async (tripId: number): Promise<Trip> => {
        const res = await apiClient.post<Trip>(`/trips/${tripId}/cancel`);
        return res.data;
    },

    // Bookings
    getMyBookings: async (): Promise<Booking[]> => {
        const res = await apiClient.get<Booking[]>('/bookings/my');
        return res.data;
    },

    createBooking: async (payload: CreateBookingPayload): Promise<Booking> => {
        const response = await apiClient.post<Booking>('/bookings/', payload);
        return response.data;
    },

    cancelBooking: async (bookingId: number): Promise<Booking> => {
        const res = await apiClient.post<Booking>(`/bookings/${bookingId}/cancel`);
        return res.data;
    },
};