"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import trails from "../trails"; // ✅ Works with the default export

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
              {trailData ? (
                <>
                  <p><strong>Rideability:</strong> {trailData.status}</p>
                  <p><strong>Condition:</strong> {trailData.conditionDetails}</p>
                  <p><strong>Temperature:</strong> {trailData.temperature}</p>
                  <p><strong>Weather Conditions:</strong> {trailData.weatherConditions}</p>
                  <p><strong>Last Checked:</strong> {trailData.lastChecked}</p>
                  <p><strong>Notes:</strong> {trailData.notes}</p>
                </>
              ) : (
                <p>Data not available</p>
              )}
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

export default TrailMap
