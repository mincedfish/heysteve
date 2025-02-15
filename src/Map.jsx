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

  if (error) {
    return <div>Error loading trail statuses: {error}</div>
  }

  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar for Trail Details */}
      <div style={{ width: "300px", padding: "10px", background: "#f4f4f4", overflowY: "auto", borderRight: "1px solid #ddd" }}>
        {selectedTrail ? (
          <div>
            <h2>{selectedTrail.name}</h2>
            <p><strong>Rideability:</strong> {selectedTrail.data?.status || "N/A"}</p>
            <p><strong>Condition:</strong> {selectedTrail.data?.conditionDetails || "N/A"}</p>
            <p><strong>Temperature:</strong> {selectedTrail.data?.temperature || "N/A"}</p>
            <p><strong>Weather Conditions:</strong> {selectedTrail.data?.weatherConditions || "N/A"}</p>
            <p><strong>Last Checked:</strong> {selectedTrail.data?.lastChecked || "N/A"}</p>
            <p><strong>Notes:</strong> {selectedTrail.data?.notes || "N/A"}</p>
            <h3>Weather Forecast</h3>
            {selectedTrail.data?.forecast ? (
              <ul>
                {selectedTrail.data.forecast.map((day, index) => (
                  <li key={index}>
                    <strong>{day.date}:</strong> {day.condition}, {day.temperature}, Rainfall: {day.rainfall}
                  </li>
                ))}
              </ul>
            ) : <p>No forecast available.</p>}
            <button onClick={() => setSelectedTrail(null)}>Close</button>
          </div>
        ) : (
          <p>Select a trail for details</p>
        )}
      </div>

      {/* Map Section */}
      <MapContainer center={[37.9061, -122.5957]} zoom={9} style={{ height: "500px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBoundsToMarkers />
        {trails.map((trail) => {
          const defaultIcon = createDefaultIcon()
          const trailData = trailStatuses[trail.name]

          return (
            <Marker key={trail.name} position={[trail.lat, trail.lon]} icon={defaultIcon}>
              <Popup>
                <h3>{trail.name}</h3>
                <p><strong>Rideability:</strong> {trailData?.status || "N/A"}</p>
                <p><strong>Condition:</strong> {trailData?.conditionDetails || "N/A"}</p>
                <button onClick={() => {
                  setSelectedTrail({ name: trail.name, data: trailData })
                }}>More</button>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export default TrailMap
