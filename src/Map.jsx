import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const TRAIL_STATUSES_URL = "https://raw.githubusercontent.com/mincedfish/heysteve/main/public/trailStatuses.json";

const Map = () => {
  const [trailData, setTrailData] = useState({});
  const [selectedTrail, setSelectedTrail] = useState(null);

  // Fetch trail data
  useEffect(() => {
    const fetchTrailData = async () => {
      try {
        console.log("Fetching trail data...");
        const response = await fetch(`${TRAIL_STATUSES_URL}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log("Fetched trail data:", data);
        setTrailData(data);
      } catch (err) {
        console.error("Error fetching trail data:", err);
      }
    };

    fetchTrailData();
  }, []);

  // Handle pin click
  const handlePinClick = (trailName) => {
    if (trailData[trailName]) {
      setSelectedTrail(trailData[trailName]);
    } else {
      console.warn("Trail data not found:", trailName);
    }
  };

  return (
    <div>
      <h1>Map Loaded</h1>
      <MapContainer center={[37.7749, -122.4194]} zoom={10} style={{ height: "500px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {Object.keys(trailData).map((trailName) => {
          const trail = trailData[trailName];
          return (
            <Marker
              key={trailName}
              position={[trail.lat, trail.lon]}
              eventHandlers={{ click: () => handlePinClick(trailName) }}
            >
              <Popup>
                <strong>{trail.name}</strong>
                <br />
                Status: {trail.status}
                <br />
                Condition: {trail.conditionDetails}
              </Popup>
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
