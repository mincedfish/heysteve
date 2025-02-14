"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Trail locations
const trails = [
  { name: "Mt. Tamalpais", lat: 37.9061, lon: -122.5957 },
  { name: "Ford Ord", lat: 36.676, lon: -121.8223 },
  { name: "Rockville Hills Regional Park", lat: 38.2939, lon: -122.0328 },
  { name: "China Camp State Park", lat: 38.0258, lon: -122.4861 },
  { name: "Joaquin Miller Park", lat: 37.8297, lon: -122.2042 },
  { name: "Pacifica", lat: 37.6127, lon: -122.5065 },
  { name: "Tamarancho", lat: 38.0195, lon: -122.6347 },
  { name: "John Nicolas", lat: 37.2061, lon: -122.0376 },
  { name: "Soquel Demonstration Forest", lat: 37.082, lon: -121.8505 },
  { name: "Briones", lat: 37.9305, lon: -122.1512 },
  { name: "Lime Ridge", lat: 37.9692, lon: -122.0009 },
  { name: "Crockett Hills Regional Park", lat: 38.048, lon: -122.2905 },
];

// Create a default marker icon
const createDefaultIcon = () => {
  return new L.Icon({
    iconUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

// Component to fit bounds
function FitBoundsToMarkers() {
  const map = useMap();

  useEffect(() => {
    if (map) {
      const bounds = L.latLngBounds(trails.map((trail) => [trail.lat, trail.lon]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map]);

  return null;
}

const TrailMap = () => {
  const [trailData, setTrailData] = useState({});
  const [loading, setLoading] = useState({});

  const fetchWeatherAndChatGPT = async (trail) => {
    const { name, lat, lon } = trail;

    setLoading((prev) => ({ ...prev, [name]: true }));

    try {
      // Fetch weather data from Weatherbit
      const weatherResponse = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      const weatherData = await weatherResponse.json();

      // Check if weather data is available
      const weatherInfo = weatherData.data && weatherData.data[0];
      if (!weatherInfo) {
        throw new Error(`No weather data available for ${name}`);
      }

      // Prepare weather details for display
      const weatherDetails = `
        Temperature: ${weatherInfo.temp}°C
        Weather: ${weatherInfo.weather.description}
        Humidity: ${weatherInfo.rh}%
        Wind Speed: ${weatherInfo.wind_spd} m/s
      `;

      // Call ChatGPT API for rideability response
      const chatResponse = await fetch("/api/chatgpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `Based on the current weather (${weatherDetails}), is ${name} rideable today?`,
        }),
      });

      const chatData = await chatResponse.json();
      const rideabilityResponse = chatData.response || "No response available.";

      // Update the state with weather and ChatGPT response
      setTrailData((prevData) => ({
        ...prevData,
        [name]: {
          weatherDetails,
          rideabilityResponse,
        },
      }));
    } catch (error) {
      console.error(`Error fetching data for ${name}:`, error.message);
      setTrailData((prevData) => ({
        ...prevData,
        [name]: {
          error: error.message,
        },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [name]: false }));
    }
  };

  return (
    <MapContainer center={[37.9061, -122.5957]} zoom={9} style={{ height: "500px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBoundsToMarkers />

      {trails.map((trail) => {
        const defaultIcon = createDefaultIcon();
        const trailInfo = trailData[trail.name];
        const isLoading = loading[trail.name];

        return (
          <Marker
            key={trail.name}
            position={[trail.lat, trail.lon]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => {
                if (!trailInfo && !isLoading) {
                  fetchWeatherAndChatGPT(trail);
                }
              },
            }}
          >
            <Popup>
              <div>
                <h3>{trail.name}</h3>
                {isLoading ? (
                  <p>Loading weather and rideability status...</p>
                ) : trailInfo ? (
                  trailInfo.error ? (
                    <p>Error: {trailInfo.error}</p>
                  ) : (
                    <>
                      <p>
                        <strong>Weather Info:</strong>
                      </p>
                      <pre>{trailInfo.weatherDetails}</pre>
                      <p>
                        <strong>Rideability:</strong>
                      </p>
                      <p>{trailInfo.rideabilityResponse}</p>
                    </>
                  )
                ) : (
                  <p>Click to check if this trail is rideable today.</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default TrailMap;
