import { useState, useEffect } from "react";
import trails from "./trails"; // ✅ Correct relative path

const TRAIL_STATUSES_URL = "https://raw.githubusercontent.com/mincedfish/heysteve/main/public/trailStatuses.json";

const Map = () => {
  const [trailData, setTrailData] = useState({});
  const [selectedTrail, setSelectedTrail] = useState(null);

  // Function to fetch trail statuses from GitHub
  const fetchTrailData = async () => {
    try {
      console.log("Fetching trail statuses...");
      const response = await fetch(`${TRAIL_STATUSES_URL}?t=${new Date().getTime()}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const statusData = await response.json();
      console.log("Fetched trail statuses:", statusData);

      // ✅ Merge static trails with statuses
      const mergedTrails = trails.map((trail) => ({
        ...trail,
        ...(statusData[trail.name] || {}), // Merge matching trail data
      }));

      // Convert array to object for easy access
      const trailDataObject = mergedTrails.reduce((acc, trail) => {
        acc[trail.name] = trail;
        return acc;
      }, {});

      setTrailData(trailDataObject);
    } catch (err) {
      console.error("Error fetching trail data:", err);
    }
  };

  useEffect(() => {
    fetchTrailData(); // Fetch on mount
  }, []);

  // Handle when a pin is clicked
  const handlePinClick = (trailName) => {
    if (trailData[trailName]) {
      setSelectedTrail(trailData[trailName]);
    } else {
      console.warn("Trail data not found:", trailName);
    }
  };

  // Handle closing the sidebar
  const closeSidebar = () => {
    setSelectedTrail(null);
  };

  return (
    <div>
      <h1>Map Loaded</h1>
      <div id="map">
        <p>Map should be here...</p>
        {trails.map((trail) => (
          <button key={trail.name} onClick={() => handlePinClick(trail.name)}>
            {trail.name}
          </button>
        ))}
      </div>

      {/* Debug: Show fetched trailData */}
      <pre>{JSON.stringify(trailData, null, 2)}</pre>

      {selectedTrail && (
        <div className="sidebar">
          <button className="close-btn" onClick={closeSidebar}>X</button>
          <h2>{selectedTrail.name}</h2>
          <p><strong>Status:</strong> {selectedTrail.status || "Unknown"}</p>
          <p><strong>Condition:</strong> {selectedTrail.conditionDetails || "Unknown"}</p>
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
