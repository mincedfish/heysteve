import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import trails from "./trails";

const TRAIL_STATUSES_URL = "https://raw.githubusercontent.com/mincedfish/heysteve/main/public/trailStatuses.json";

const Map = () => {
  const [trailData, setTrailData] = useState({});
  const [selectedTrail, setSelectedTrail] = useState(null);

  useEffect(() => {
    console.log("Fetching trail data...");
    fetch(`${TRAIL_STATUSES_URL}?t=${new Date().getTime()}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched trail data:", data);
        setTrailData(data);
      })
      .catch((err) => console.error("Error fetching trail data:", err));
  }, []);

  // Handle clicking a pin
  const handlePinClick = (trailName) => {
    console.log(`Clicked: ${trailName}`);
    if (trailData[trailName]) {
      setSelectedTrail(trailData[trailName]);
    } else {
      console.warn("Trail data not found:", trailName);
    }
  };

  return (
    <div>
      <h1>Map Loaded</h1>
      <MapContainer center={[37.8, -122.4]} zoom={8} style={{ height: "500px", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {trails.map((trail, index) => {
          if (!trail.lat || !trail.lon) {
            console.error(`Missing coordinates for: ${trail.name}`);
            return null;
          }
          return (
            <Marker
              key={index}
              position={[trail.lat, trail.lon]}
              eventHandlers={{
                click: () => handlePinClick(trail.name),
              }}
            >
              <Popup>{trail.name}</Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {selectedTrail && (
        <div className="sidebar">
          <button className="close-btn" onClick={() => setSelectedTrail(null)}>X</button>
          <h2>{selectedTrail.name}</h2>
          <p><strong>Status:</strong> {selectedTrail.status}</p>
          <p><strong>Condition:</strong> {selectedTrail.conditionDetails}</p>
          <p><strong>Temperature:</strong> {selectedTrail.current?.temperature || "N/A"}</p>
          <p><strong>Weather:</strong> {selectedTrail.current?.condition || "N/A"}</p>
          <p><strong>Wind:</strong> {selectedTrail.current?.wind || "N/A"}</p>
          <p><strong>Humidity:</strong> {selectedTrail.current?.humidity || "N/A"}</p>
          <p><strong>Last Checked:</strong> {selectedTrail.current?.lastChecked || "N/A"}</p>
        </div>
      )}
    </div>
  );
};

export default Map;
