"use client"

import { useEffect, useState, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import trails from "../trails"

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
  const [activeMarker, setActiveMarker] = useState(null)  // Track active marker
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [map, setMap] = useState(null)

  const fetchTrailStatuses = useCallback(async () => {
    setLoading(true)
    const basePath = process.env.PUBLIC_URL || "/heysteve"
    const jsonUrl = `${basePath}/trailStatuses.json?t=${Date.now()}`

    try {
      const response = await fetch(jsonUrl, {
        method: "GET",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate", Pragma: "no-cache", Expires: "0" },
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      setTrailStatuses(await response.json())
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrailStatuses()
    const intervalId = setInterval(fetchTrailStatuses, 5 * 60 * 1000)
    return () => clearInterval(intervalId)
  }, [fetchTrailStatuses])

  const getRideabilityInfo = (trailData) => {
    if (!trailData || !trailData.rideability) return { status: "Unknown", explanation: "" }
    const [status, ...explanationParts] = trailData.rideability.split("\n")
    return { status, explanation: explanationParts.join("\n").trim() }
  }

  const handleMarkerClick = (trail, marker) => {
    setSelectedTrail({ ...trail, data: trailStatuses[trail.name] })
    setActiveMarker(marker)
    marker.setIcon(activeIcon)  // Change icon to active marker
  }

  const closeSidebar = () => {
    setSelectedTrail(null)
    if (activeMarker) {
      activeMarker.setIcon(defaultIcon)  // Revert icon to default
      setActiveMarker(null)
    }
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

          {loading && <p>Loading trail data...</p>}

          {error && <p style={{ color: "red" }}>Error: {error}</p>}

          {selectedTrail.data ? (
            <>
              <h3>📍 Current Conditions</h3>
              <div style={{ marginBottom: "20px" }}>
                <p style={{ display: "flex", justifyContent: "space-between" }}><strong>📅 Last Updated:</strong> {selectedTrail.data.current?.lastChecked || "N/A"}</p>
                <p style={{ display: "flex", justifyContent: "space-between" }}><strong>🌡 Temperature:</strong> {selectedTrail.data.current?.temperature || "N/A"}°F</p>
                <p style={{ display: "flex", justifyContent: "space-between" }}><strong>🌤 Condition:</strong> {selectedTrail.data.current?.condition || "N/A"}</p>
                <p style={{ display: "flex", justifyContent: "space-between" }}><strong>💨 Wind:</strong> {selectedTrail.data.current?.wind || "N/A"}</p>
                <p style={{ display: "flex", justifyContent: "space-between" }}><strong>💧 Humidity:</strong> {selectedTrail.data.current?.humidity || "N/A"}</p>
                <p style={{ display: "flex", justifyContent: "space-between" }}><strong>🌧 Rainfall (24h):</strong> {selectedTrail.data.history?.rainfall || "N/A"} in</p>
              </div>

              <h3>🔮 Weather Forecast</h3>
              {selectedTrail.data.forecast ? (
                <div>
                  {selectedTrail.data.forecast.map((day, index) => (
                    <div key={index} style={{ marginBottom: "10px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
                      <p style={{ display: "flex", justifyContent: "space-between" }}><strong>📆 Date:</strong> {new Date(day.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                      <p style={{ display: "flex", justifyContent: "space-between" }}><strong>🌤 Condition:</strong> {day.condition}</p>
                      <p style={{ display: "flex", justifyContent: "space-between" }}><strong>🌡 Temperature:</strong> {day.temperature}°F</p>
                      <p style={{ display: "flex", justifyContent: "space-between" }}><strong>🌧 Rainfall:</strong> {day.rainfall} in</p>
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
              eventHandlers={{
                click: (e) => handleMarkerClick(trail, e.target)  // Change icon to active on click
              }}
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
