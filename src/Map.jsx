"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import trails from "../trails"

const createDefaultIcon = () => {
  return new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  })
}

function FitBoundsToMarkers() {
  const map = useMap()

  useEffect(() => {
    if (map) {
      const bounds = L.latLngBounds(trails.map((trail) => [trail.lat, trail.lon]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map])

  return null
}

const TrailMap = () => {
  const [trailStatuses, setTrailStatuses] = useState({})
  const [selectedTrail, setSelectedTrail] = useState(null)
  const [activePopup, setActivePopup] = useState(null) // Track open popup
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTrailStatuses = async () => {
      const basePath = process.env.PUBLIC_URL || "/heysteve"
      const jsonUrl = `${basePath}/trailStatuses.json`

      console.log("Fetching trail statuses from:", jsonUrl)

      try {
        const response = await fetch(jsonUrl)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log("Fetched trailStatuses:", data)
        setTrailStatuses(data)
      } catch (error) {
        console.error("Error fetching trailStatuses.json:", error)
        setError(error.message)
      }
    }

    fetchTrailStatuses()
  }, [])

  // Function to close sidebar and active popup
  const closeSidebar = () => {
    setSelectedTrail(null) // Remove sidebar
    if (activePopup) {
      activePopup.closePopup() // Close the currently open popup
      setActivePopup(null) // Clear active popup reference
    }
  }

  if (error) {
    return <div>Error loading trail statuses: {error}</div>
  }

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh" }}>
      {/* Sidebar only renders when a trail is selected */}
      {selectedTrail && (
        <div
          style={{
            width: "300px",
            padding: "15px",
            background: "#f4f4f4",
            overflowY: "auto",
            borderRight: "1px solid #ddd",
            transition: "transform 0.3s ease-in-out",
            position: "relative"
          }}
        >
          {/* Close button (X) */}
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
              fontSize: "16px"
            }}
          >
            ✕
          </button>

          <h2>{selectedTrail.name}</h2>
          {selectedTrail.data ? (
            <>
              <p><strong>Temperature:</strong> {selectedTrail.data.current?.temperature || "N/A"}</p>
              <p><strong>Condition:</strong> {selectedTrail.data.current?.condition || "N/A"}</p>
              <p><strong>Wind:</strong> {selectedTrail.data.current?.wind || "N/A"}</p>
              <p><strong>Humidity:</strong> {selectedTrail.data.current?.humidity || "N/A"}</p>
              <p><strong>Last Checked:</strong> {selectedTrail.data.current?.lastChecked || "N/A"}</p>

              <h3>Weather History</h3>
              <p><strong>Temperature:</strong> {selectedTrail.data.history?.temperature || "N/A"}</p>
              <p><strong>Condition:</strong> {selectedTrail.data.history?.condition || "N/A"}</p>
              <p><strong>Rainfall:</strong> {selectedTrail.data.history?.rainfall || "N/A"}</p>

              <h3>Weather Forecast</h3>
              {selectedTrail.data.forecast ? (
                <ul>
                  {selectedTrail.data.forecast.map((day, index) => (
                    <li key={index}>
                      <strong>{day.date}:</strong> {day.condition}, {day.temperature}, Rainfall: {day.rainfall}
                    </li>
                  ))}
                </ul>
              ) : <p>No forecast available.</p>}
            </>
          ) : (
            <p>Data not available</p>
          )}
          <button onClick={closeSidebar} style={{ marginTop: "10px" }}>Close</button>
        </div>
      )}

      {/* Map Section */}
      <div style={{ flex: 1 }}>
        <MapContainer center={[37.9061, -122.5957]} zoom={9} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBoundsToMarkers />
          {trails.map((trail) => {
            const defaultIcon = createDefaultIcon()
            const trailData = trailStatuses[trail.name] // Ensure key matches exactly

            return (
              <Marker key={trail.name} position={[trail.lat, trail.lon]} icon={defaultIcon}
                eventHandlers={{
                  click: (e) => setActivePopup(e.target) // Track which popup is open
                }}
              >
                <Popup>
                  <h3>{trail.name}</h3>
                  {trailData ? (
                    <>
                      <p><strong>Temperature:</strong> {trailData.current?.temperature || "N/A"}</p>
                      <p><strong>Condition:</strong> {trailData.current?.condition || "N/A"}</p>
                      <button onClick={() => {
                        setSelectedTrail({ name: trail.name, data: trailData })
                        if (activePopup) activePopup.closePopup() // Close the previous popup
                      }}>
                        More
                      </button>
                    </>
                  ) : (
                    <p>Data not available</p>
                  )}
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}

export default TrailMap
