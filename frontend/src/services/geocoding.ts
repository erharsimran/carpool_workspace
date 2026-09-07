// src/services/geocoding.ts
import axios from 'axios';

export interface LocationSuggestion {
    id: string;
    displayName: string;
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
}

export const searchLocations = async (query: string): Promise<LocationSuggestion[]> => {
    if (!query || query.trim().length < 2) {
        return [];
    }

    try {
        // Biased toward Southern Ontario / Highway 401 corridor (Toronto coordinates)
        const response = await axios.get('https://photon.komoot.io/api/', {
            params: {
                q: query.trim(),
                lat: 43.6532,
                lon: -79.3832,
                limit: 5,
            },
            timeout: 4000,
        });

        if (!response.data?.features) {
            return [];
        }

        return response.data.features.map((feature: any, index: number) => {
            const props = feature.properties || {};
            const [lon, lat] = feature.geometry.coordinates;

            const parts = [
                props.name,
                props.city || props.town || props.village || props.county,
                props.state,
                props.country,
            ].filter(Boolean);

            return {
                id: `${props.osm_id || index}-${lat}-${lon}`,
                displayName: parts.join(', '),
                latitude: lat,
                longitude: lon,
                city: props.city || props.name,
                state: props.state,
            };
        });
    } catch (error) {
        console.warn('Geocoding search error:', error);
        return [];
    }
};