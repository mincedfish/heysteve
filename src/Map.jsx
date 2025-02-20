"use client"

import { useEffect, useState, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import trails from "../trails"

// Helper function to parse and format the date and time correctly
const parseDateTime = (dateString) => {
  // Check if the dateString contains a comma (e.g., "2/15/2025, 4:59:19 PM")
  if (dateString.includes(',')) {
    const [datePart, timePart] = dateString.split(',') // Extract the date and time parts
    const [month, day, year] = datePart.split('/') // Split into month, day, year
    const formattedDate = `${year}-${month}-${day} ${timePart.trim()}` // Format to "YYYY-MM-DD HH:MM:SS"
    return new Date(formattedDate)
  }
  // For forecast dates already in "YYYY-MM-DD" format
  return new Date(dateString)
}

// Helper function to format the date for the forecast section
const formatForecastDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number)
  const date = new Date(year, month - 1, day) // JS months are 0-based
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}


const createIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })
}

const defaultIcon = createIcon("blue")
const activeIcon = createIcon("red")

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
  const [activeMarker, setActiveMarker] = useState(null)
  const [error, setError] = useState(null)
  const [map, setMap] = useState(null)

  const fetchTrailStatuses = useCallback(async () => {
    const basePath = process.env.PUBLIC_URL || "/heysteve"
    const timestamp = new Date().getTime()
    const jsonUrl = `${basePath}/trailStatuses.json?t=${timestamp}`

    try {
      const response = await fetch(jsonUrl, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0"
        }
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setTrailStatuses(data)
    } catch (error) {
      setError(error.message)
    }
  }, [])

  useEffect(() => {
    console.log("Fetching trail statuses...")
    fetchTrailStatuses()
    const intervalId = setInterval(() => {
      console.log("Fetching trail statuses...")
      fetchTrailStatuses()
    }, 5 * 60 * 1000) // Fetch every 5 minutes
    return () => clearInterval(intervalId)
  }, [fetchTrailStatuses])

  const getRideabilityInfo = (trailData) => {
    if (!trailData || !trailData.rideability) return { status: "Unknown", explanation: "" }
    const [status, ...explanationParts] = trailData.rideability.split("\n")
    return { status, explanation: explanationParts.join("\n").trim() }
  }

  const closeSidebar = () => {
    setSelectedTrail(null)
    if (activeMarker) {
      activeMarker.setIcon(defaultIcon)
      setActiveMarker(null)
    }
  }

  const handleMarkerClick = (trail, marker) => {
    if (activeMarker && activeMarker !== marker) {
      activeMarker.setIcon(defaultIcon)
    }
    marker.setIcon(activeIcon)
    setActiveMarker(marker)
    setSelectedTrail({ ...trail, data: trailStatuses[trail.name] })
  }

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh" }}>
      {selectedTrail && (
        <div
          style={{
            width: "320px",
            padding: "20px",
            background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
            fontFamily: "Arial, sans-serif",
            borderRight: "1px solid #ddd",
            overflowY: "auto",
            boxShadow: "2px 0 10px rgba(0, 0, 0, 0.1)",
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
              background: "#ff4d4d",
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

          <h2 style={{ color: "#333" }}>🚵 {selectedTrail.name}</h2>
          {selectedTrail.data ? (
            <>
              <h3>📍 Current Conditions</h3>
              <p><strong>📅 Last Updated:</strong> {parseDateTime(selectedTrail.data.current?.lastChecked).toLocaleString()}</p>
              <p><strong>🌡 Temperature:</strong> {selectedTrail.data.current?.temperature || "N/A"}</p>
              <p><strong>🌤 Condition:</strong> {selectedTrail.data.current?.condition || "N/A"}</p>
              <p><strong>💨 Wind:</strong> {selectedTrail.data.current?.wind || "N/A"}</p>
              <p><strong>💧 Humidity:</strong> {selectedTrail.data.current?.humidity || "N/A"}</p>

              <div style={{ marginTop: "30px" }}></div> {/* Space between sections */}

              <h3>🌧 Recent Rainfall </h3>
              {selectedTrail.data.history?.rainfall_last_5_days ? (
                <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                  {Object.entries(selectedTrail.data.history.rainfall_last_5_days).map(([date, rainfall], index) => (
                    <li key={index}>
                      <strong>{formatForecastDate(date)}:</strong> {rainfall}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No historic rainfall data available.</p>
              )}

              <div style={{ marginTop: "30px" }}></div> {/* Space between sections */}

              <h3>🔮 Weather Forecast</h3>
              {selectedTrail.data.forecast ? (
                <div>
                  {selectedTrail.data.forecast.map((day, index) => (
                    <div key={index} style={{ marginBottom: "10px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
                      <p><strong>📆 Date:</strong> {formatForecastDate(day.date)}</p>
                      <p><strong>🌤 Condition:</strong> {day.condition}</p>
                      <p><strong>🌡 Temperature:</strong> {day.temperature}</p>
                      <p><strong>🌧 Rainfall:</strong> {day.rainfall}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No forecast available.</p>
              )}
            </>
          ) : (
            <p>Data not available</p>
          )}
        </div>
      )}

      <div style={{ flex: 1 }}>
        <MapContainer center={[37.9061, -122.5957]} zoom={9} style={{ height: "100%", width: "100%" }} whenCreated={setMap}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBoundsToMarkers />
          {trails.map((trail) => (
            <Marker
              key={trail.name}
              position={[trail.lat, trail.lon]}
              icon={defaultIcon}
              eventHandlers={{ click: (e) => handleMarkerClick(trail, e.target) }}
            >
              <Popup>
                <h3>🚵 {trail.name}</h3>
                <p><strong>Send it?</strong> {trailStatuses[trail.name]?.rideability || "Unknown"}</p>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

export default TrailMap
