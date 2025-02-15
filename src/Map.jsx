"use client"

import { useEffect, useState, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import trails from "../trails" // Ensure this path is correct

// Define colored icons
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
    const jsonUrl = `${basePath}/trailStatuses.json?t=${Date.now()}`

    console.log("Fetching trail statuses from:", jsonUrl)

    try {
      const response = await fetch(jsonUrl, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

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
  }, [])

  useEffect(() => {
    fetchTrailStatuses()
    const intervalId = setInterval(fetchTrailStatuses, 5 * 60 * 1000)
    return () => clearInterval(intervalId)
  }, [fetchTrailStatuses])

  useEffect(() => {
    if (map) {
      map.invalidateSize()
    }
  }, [map])

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

  if (error) {
    return <div>Error loading trail statuses: {error}</div>
  }

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh" }}>
      {selectedTrail && (
        <div
          style={{
            width: "300px",
            padding: "20px",
            background: "linear-gradient(135deg, #fffae3, #f8e1a1)",
            overflowY: "auto",
            borderRight: "2px solid #ddd",
            transition: "transform 0.3s ease-in-out",
            position: "relative",
            fontFamily: "Arial, sans-serif",
            color: "#333",
            boxShadow: "4px 0 10px rgba(0, 0, 0, 0.1)",
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

          <h2 style={{ color: "#2c3e50", fontWeight: "bold" }}>🚵 {selectedTrail.name}</h2>
          {selectedTrail.data ? (
            <>
              <h3>🌤️ Current Conditions</h3>
              <p><strong>📅 Last Updated:</strong> {selectedTrail.data.current?.lastChecked || "N/A"}</p>
              <p><strong>🌡️ Temperature:</strong> {selectedTrail.data.current?.temperature || "N/A"}°F</p>
              <p><strong>💨 Wind:</strong> {selectedTrail.data.current?.wind || "N/A"}</p>
              <p><strong>💧 Humidity:</strong> {selectedTrail.data.current?.humidity || "N/A"}</p>
              <p><strong>🌧️ Rainfall (24h):</strong> {selectedTrail.data.history?.rainfall || "N/A"} in</p>

              <h3>🔮 Weather Forecast</h3>
              {selectedTrail.data.forecast?.map((day, index) => (
                <div key={index} style={{ marginBottom: "10px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
                  <p><strong>📅 {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</strong></p>
                  <p>🌤️ {day.condition}</p>
                  <p>🌡️ {day.temperature}°F</p>
                  <p>🌧️ {day.rainfall} in</p>
                </div>
              )) || <p>No forecast available.</p>}
            </>
          ) : <p>Data not available</p>}
        </div>
      )}

      <div style={{ flex: 1 }}>
        <MapContainer center={[37.9061, -122.5957]} zoom={9} style={{ height: "100%", width: "100%" }} whenCreated={setMap}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBoundsToMarkers />
        </MapContainer>
      </div>
    </div>
  )
}

export default TrailMap
