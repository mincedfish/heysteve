"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import trails from "../trails";

const createDefaultIcon = () => {
  return new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
};

const createActiveIcon = () => {
  return new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", // Example: Larger icon for active state
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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
  const [trailStatuses, setTrailStatuses] = useState({});
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);  // Track the currently active marker
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrailStatuses = async () => {
      const basePath = process.env.PUBLIC_URL || "/heysteve";
      const jsonUrl = `${basePath}/trailStatuses.json?t=${Date.now()}`; // Prevent caching

      console.log("Fetching trail statuses from:", jsonUrl);

      try {
        const response = await fetch(jsonUrl, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fetched trailStatuses:", data);
        setTrailStatuses(data);
      } catch (error) {
        console.error("Error fetching trailStatuses.json:", error);
        setError(error.message);
      }
    };

    fetchTrailStatuses();
  }, []);

  const determineRideability = (trailData) => {
    if (!trailData || !trailData.current) return "Unknown";

    const { rainfall, condition } = trailData.current;

    if (rainfall > 0.1) return "Not Rideable (Recent Rain)";
    if (condition && condition.toLowerCase().includes("muddy")) return "Not Rideable (Muddy)";
    return "Rideable";
  };

  const closeSidebar = () => {
    setSelectedTrail(null);
    if (activePopup) {
      activePopup.closePopup();
      setActivePopup(null);
    }
    if (activeMarker) {
      activeMarker.setIcon(createDefaultIcon()); // Revert to default icon when sidebar is closed
    }
  };

  if (error) {
    return <div>Error loading trail statuses: {error}</div>;
  }

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh" }}>
      {selectedTrail && (
        <div
          style={{
            width: "300px",
            padding: "15px",
            background: "#f4f4f4",
            overflowY: "auto",
            borderRight: "1px solid #ddd",
            transition: "transform 0.3s ease-in-out",
            position: "relative",
          }}
        >
          <button
            onClick={closeSidebar}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "red",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ✕
          </button>

          <h2>{selectedTrail.name}</h2>
          {selectedTrail.data ? (
            <>
              <p><strong>Last Updated:</strong> {selectedTrail.data.current?.lastChecked || "N/A"}</p>
              <p><strong>Temperature:</strong> {selectedTrail.data.current?.temperature || "N/A"}</p>
              <p><strong>Condition:</strong> {selectedTrail.data.current?.condition || "N/A"}</p>
              <p><strong>Wind:</strong> {selectedTrail.data.current?.wind || "N/A"}</p>
              <p><strong>Humidity:</strong> {selectedTrail.data.current?.humidity || "N/A"}</p>

              <p><strong>Rainfall in Last 24 Hours:</strong> {selectedTrail.data.history?.rainfall || "N/A"} in</p>

              <h3>Weather Forecast</h3>
              {selectedTrail.data.forecast ? (
                <ul style={{ paddingLeft: "15px", listStyle: "none" }}>
                  {selectedTrail.data.forecast.map((day, index) => {
                    const formattedDate = day.date.replace(/\s*\d{4}$/, ""); // Remove the year
                    return (
                      <li key={index} style={{ marginBottom: "10px" }}>
                        <strong>{formattedDate}:</strong> {day.condition}, {day.temperature}°F, Rainfall: {day.rainfall} in
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>No forecast available.</p>
              )}
            </>
          ) : (
            <p>Data not available</p>
          )}
          <button onClick={closeSidebar} style={{ marginTop: "10px" }}>Close</button>
        </div>
      )}

      <div style={{ flex: 1 }}>
        <MapContainer center={[37.9061, -122.5957]} zoom={9} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBoundsToMarkers />
          {trails.map((trail) => {
            const defaultIcon = createDefaultIcon();
            const activeIcon = createActiveIcon();  // Active icon for selected marker
            const trailData = trailStatuses[trail.name];
            const rideability = determineRideability(trailData);

            return (
              <Marker
                key={trail.name}
                position={[trail.lat, trail.lon]}
                icon={activeMarker && activeMarker.options.iconUrl === activeIcon.options.iconUrl ? activeIcon : defaultIcon} // Check if active marker
                eventHandlers={{
                  click: (e) => {
                    setActivePopup(e.target);
                    setActiveMarker(e.target);  // Set the clicked marker as active
                    e.target.setIcon(activeIcon); // Change the icon to active when clicked
                  },
                }}
              >
                <Popup>
                  <h3>{trail.name}</h3>
                  <p><strong>Rideability:</strong> {rideability}</p>
                  <button onClick={() => {
                    setSelectedTrail({ name: trail.name, data: trailData });
                    if (activePopup) activePopup.closePopup(); // Close any open popup when "More" is clicked
                  }}>
                    More
                  </button>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default TrailMap;
