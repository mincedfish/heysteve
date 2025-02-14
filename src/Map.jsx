import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TrailMap = () => {
  // Define trail locations
  const trails = [
    { name: 'Mt. Tamalpais', lat: 37.9061, lon: -122.5957 },
    { name: 'Ford Ord', lat: 36.6760, lon: -121.8223 },
    { name: 'Rockville Hills Regional Park', lat: 38.2939, lon: -122.0328 },
    { name: 'China Camp State Park', lat: 38.0258, lon: -122.4861 },
    { name: 'Joaquin Miller Park', lat: 37.8297, lon: -122.2042 },
    { name: 'Pacifica', lat: 37.6127, lon: -122.5065 },
    { name: 'Tamarancho', lat: 38.0195, lon: -122.6347 },
    { name: 'John Nicolas', lat: 37.2061, lon: -122.0376 },
    { name: 'Soquel Demonstration Forest', lat: 37.0820, lon: -121.8505 },
    { name: 'Briones', lat: 37.9305, lon: -122.1512 },
    { name: 'Lime Ridge', lat: 37.9692, lon: -122.0009 },
    { name: 'Crockett Hills Regional Park', lat: 38.0480, lon: -122.2905 }
  ];

  // Create a default marker icon
  const createDefaultIcon = () => {
    return new L.Icon({
      iconUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });
  };

  // Reference for the map container
  const mapRef = useRef();

  // Update map zoom level when trails are rendered
  useEffect(() => {
    if (mapRef.current) {
      const bounds = L.latLngBounds(
        trails.map((trail) => [trail.lat, trail.lon])
      );
      mapRef.current.fitBounds(bounds); // Adjust map bounds to show all markers
    }
  }, [trails]);

  return (
    <MapContainer
      center={[37.9061, -122.5957]}
      zoom={9}
      style={{ height: '500px', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {trails.map((trail) => {
        const defaultIcon = createDefaultIcon(); // Create the default icon for the marker

        return (
          <Marker key={trail.name} position={[trail.lat, trail.lon]} icon={defaultIcon}>
            <Popup>
              <div>
                <h3>{trail.name}</h3>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default TrailMap;
