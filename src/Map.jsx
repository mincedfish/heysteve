import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const createDefaultIcon = () => {
  return new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

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

  const fetchWeatherAndChatGPT = async (trail) => {
    const { name, lat, lon } = trail;

    try {
      // Fetch weather data from Weatherbit
      const weatherResponse = await fetch(
        `https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lon}&key=${process.env.REACT_APP_WEATHER_API_KEY}`
      );
      const weatherData = await weatherResponse.json();
      const weatherInfo = weatherData.data[0];

      const weatherDetails = `
        Temperature: ${weatherInfo.temp}°C
        Weather: ${weatherInfo.weather.description}
        Humidity: ${weatherInfo.rh}%
        Wind Speed: ${weatherInfo.wind_spd} m/s
      `;

      // Fetch response from ChatGPT API
      const chatResponse = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "text-davinci-003",
          prompt: `Based on the current weather (${weatherDetails}), is ${name} rideable today?`,
          max_tokens: 100,
        }),
      });

      const chatData = await chatResponse.json();
      const rideabilityResponse = chatData.choices[0]?.text.trim() || "No response available.";

      // Update trail data with weather and ChatGPT response
      setTrailData((prevData) => ({
        ...prevData,
        [name]: {
          weatherDetails,
          rideabilityResponse,
        },
      }));
    } catch (error) {
      console.error(`Error fetching data for ${name}:`, error);
    }
  };

  return (
    <MapContainer center={[37.9061, -122.5957]} zoom={9} style={{ height: "500px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBoundsToMarkers />

      {trails.map((trail) => {
        const defaultIcon = createDefaultIcon();
        const trailInfo = trailData[trail.name];

        return (
          <Marker
            key={trail.name}
            position={[trail.lat, trail.lon]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => fetchWeatherAndChatGPT(trail),
            }}
          >
            <Popup>
              <div>
                <h3>{trail.name}</h3>
                {trailInfo ? (
                  <>
                    <p><strong>Weather Info:</strong></p>
                    <pre>{trailInfo.weatherDetails}</pre>
                    <p><strong>Rideability:</strong></p>
                    <p>{trailInfo.rideabilityResponse}</p>
                  </>
                ) : (
                  <p>Loading weather and rideability status...</p>
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
