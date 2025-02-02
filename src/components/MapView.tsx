import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const MapView: React.FC = () => {
    const [locations, setLocations] = useState<{ name: string; lat: number; lng: number }[]>([]);
    const { token } = useAuth();
    const navigate = useNavigate();
    const mapRef = useRef<L.Map | null>(null); // Use a ref to store the map instance
    const mapContainerRef = useRef<HTMLDivElement | null>(null); // Ref for the container
    const isMounted = useRef(true); // Flag to track if the component is mounted

    useEffect(() => {
        // Set the mounted flag to true on mount
        isMounted.current = true;

        const fetchHistory = async () => {
            try {
                const response = await axios.get<{ data: any[] }>(
                    'http://localhost:5000/api/passport/user-history-map',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!isMounted.current) return; // Prevent state updates if unmounted

                // Extract geocoded locations
                const geocodedLocations = response.data.data.map((entry) => ({
                    name: entry.Airport_Name_with_location,
                    lat: entry.coordinates.lat,
                    lng: entry.coordinates.lng,
                }));

                // Filter out invalid coordinates
                const validLocations = geocodedLocations.filter(
                    (loc) => loc.lat !== 0 && loc.lng !== 0
                );

                setLocations(validLocations);
            } catch (error: any) {
                console.error('Error fetching passport history for map:', error);
            }
        };

        fetchHistory();

        // Cleanup function to set the mounted flag to false
        return () => {
            isMounted.current = false;
        };
    }, [token]);

    useEffect(() => {
        if (locations.length === 0 || !mapContainerRef.current) return;

        if (mapRef.current) {
            // If map already initialized, update markers
            mapRef.current.eachLayer((layer) => {
                if (layer instanceof L.Marker || layer instanceof L.Popup) {
                    mapRef.current!.removeLayer(layer);
                }
            });

            locations.forEach((location) => {
                L.marker([location.lat, location.lng], {
                    icon: L.icon({
                        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                    }),
                })
                    .addTo(mapRef.current!)
                    .bindPopup(location.name);
            });

            return;
        }

        // Initialize the map
        const map = L.map(mapContainerRef.current).setView([20, 0], 2); // Centered at [lat, lng], zoom level 2
        mapRef.current = map; // Store the map in the ref

        // Add a tile layer (e.g., OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
        }).addTo(map);

        // Add red markers for each location
        locations.forEach((location) => {
            L.marker([location.lat, location.lng], {
                icon: L.icon({
                    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                }),
            })
                .addTo(map)
                .bindPopup(location.name);
        });
    }, [locations]);

    useEffect(() => {
        // Cleanup function to destroy the map instance on unmount
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    return (
        <div className="p-4">
            <button
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mb-4"
                onClick={() => navigate('/history')}
            >
                Back to History
            </button>
            <h2 className="mb-4">Travel History Map</h2>
            <div id="map" style={{ height: '500px', width: '100%' }} ref={mapContainerRef}></div>
        </div>
    );
};

export default MapView;