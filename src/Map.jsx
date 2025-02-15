import { useState, useEffect } from "react";

const TRAIL_STATUSES_URL = "https://raw.githubusercontent.com/mincedfish/heysteve/main/public/trailStatuses.json";

const Map = () => {
  const [trailData, setTrailData] = useState({});
  const [selectedTrail, setSelectedTrail] = useState(null);

  // Function to fetch the latest trail data from GitHub
  const fetchTrailData = async () => {
    try {
      const response = await fetch(`${TRAIL_STATUSES_URL}?t=${new Date().getTime()}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      console.log("Fetched trail data:", data);
      setTrailData(data);
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
      {/* Map rendering here */}
      <div id="map">
        {/* Example clickable pin */}
        <button onClick={() => handlePinClick("Brushy Peak")}>Brushy Peak</button>
      </div>

      {/* Sidebar for displaying trail details */}
      {selectedTrail && (
        <div className="sidebar">
          <button className="close-btn" onClick={closeSidebar}>X</button>
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
