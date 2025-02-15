"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import trails from "../trails"

const createDefaultIcon = () => {
  return new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
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
  const [expandedTrail, setExpandedTrail] = useState(null) // Track which popup is expanded

  useEffect(() => {
    const fetchTrailStatuses = async () => {
      const basePath = process.env.PUBLIC_URL || "/heysteve"
      const jsonUrl = `${basePath}/trailStatuses.json`

      try {
        const response = await fetch(jsonUrl)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        setTrailStatuses(data)
      } catch (error) {
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
        const isExpanded = expandedTrail === trail.name

        return (
          <Marker key={trail.name} position={[trail.lat, trail.lon]} icon={defaultIcon}>
            <Popup>
              <h3>{trail.name}</h3>
              {trailData ? (
                <>
                  <p><strong>Temperature:</strong> {trailData.current?.temperature}</p>
                  <p><strong>Condition:</strong> {trailData.current?.condition}</p>
                  <p><strong>Wind:</strong> {trailData.current?.wind}</p>
                  <p><strong>Humidity:</strong> {trailData.current?.humidity}</p>

                  {!isExpanded && (
                    <button onClick={(e) => { e.preventDefault(); setExpandedTrail(trail.name); }}>
                      More
                    </button>
                  )}

                  {isExpanded && (
                    <>
                      <h4>History</h4>
                      <p><strong>Temp:</strong> {trailData.history?.temperature}</p>
                      <p><strong>Condition:</strong> {trailData.history?.condition}</p>
                      <p><strong>Rainfall:</strong> {trailData.history?.rainfall}</p>

                      <h4>Forecast</h4>
                      {trailData.forecast.map((day, index) => (
                        <p key={index}>
                          <strong>{day.date}:</strong> {day.temperature}, {day.condition}, Rainfall: {day.rainfall}
                        </p>
                      ))}

                      <button onClick={(e) => { e.preventDefault(); setExpandedTrail(null); }}>
                        Less
                      </button>
                    </>
                  )}
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
