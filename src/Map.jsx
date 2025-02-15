import { useState, useEffect } from "react";

const Map = () => {
  const [trailData, setTrailData] = useState({});
  const [selectedTrail, setSelectedTrail] = useState(null);

  // Function to fetch the latest trail data
  const fetchTrailData = async () => {
    try {
      const response = await fetch(`/trailStatuses.json?t=${new Date().getTime()}`);
      const data = await response.json();
      console.log("Fetched trail data:", data); // Debugging
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
          <p><strong>Temperature:</strong> {selectedTrail.current.temperature}</p>
          <p><strong>Weather:</strong> {selectedTrail.current.condition}</p>
          <p><strong>Wind:</strong> {selectedTrail.current.wind}</p>
          <p><strong>Humidity:</strong> {selectedTrail.current.humidity}</p>
          <p><strong>Last Checked:</strong> {selectedTrail.current.lastChecked}</p>
        </div>
      )}
    </div>
  );
};

export default Map;
