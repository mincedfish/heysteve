"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const trails = [
  { name: "Mt. Tamalpais", lat: 37.9061, lon: -122.5957 },
  { name: "Ford Ord", lat: 36.676, lon: -121.8223 },
  { name: "Rockville Hills Regional Park", lat: 38.2939, lon: -122.0328 },
  { name: "China Camp State Park", lat: 38.0258, lon: -122.4861 },
  { name: "Joaquin Miller Park", lat: 37.8297, lon: -122.2042 },
  { name: "Pacifica", lat: 37.6127, lon: -122.5065 },
  { name: "Tamarancho", lat: 38.0195, lon: -122.6347 },
  { name: "John Nicolas", lat: 37.2061, lon: -122.0376 },
  { name: "Soquel Demonstration Forest", lat: 37.082, lon: -121.8505 },
  { name: "Briones", lat: 37.9305, lon: -122.1512 },
  { name: "Lime Ridge", lat: 37.9692, lon: -122.0009 },
  { name: "Crockett Hills Regional Park", lat: 38.048, lon: -122.2905 },
]

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

      console.log("Fetching trail statuses from:", jsonUrl) // Debugging line

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

  // Function to format the date in MM-DD-YYYY format (California time)
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const options = {
      weekday: 'short', // Abbreviated day name
      year: 'numeric',
      month: '2-digit', // Numeric month
      day: '2-digit',   // Numeric day
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Los_Angeles', // California timezone
      hour12: true,
    }

    // Format date in MM-DD-YYYY
    return new Intl.DateTimeFormat('en-US', options).format(date)
  }

  if (error) {
    return <div>Error loading trail statuses: {error}</div>
  }

  return (
    <MapContainer center={[37.9061, -122.5957]} zoom={9} style={{ height: "500px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBoundsToMarkers />
      {trails.map((trail) => {
        const defaultIcon = createDefaultIcon()

        // Access the trail data
        const trailData = trailStatuses[trail.name] || {}
        console.log(`Trail Data for ${trail.name}:`, trailData) // Debugging line

        const rideability = trailData.status || "Data not available"
        const conditionDetails = trailData.conditionDetails || "Condition details not available"
        const temperature = trailData.temperature || "Temperature data not available"
        const weatherConditions = trailData.weatherConditions || "Weather conditions not available"
        const lastChecked = trailData.lastChecked ? formatDate(trailData.lastChecked) : "Data not available"
        const notes = trailData.notes || "No additional notes"

        return (
          <Marker key={trail.name} position={[trail.lat, trail.lon]} icon={defaultIcon}>
            <Popup>
              <h3>{trail.name}</h3>
              <p><strong>Rideability:</strong> {rideability}</p>
              <p><strong>Condition:</strong> {conditionDetails}</p>
              <p><strong>Temperature:</strong> {temperature}</p>
              <p><strong>Weather Conditions:</strong> {weatherConditions}</p>
              <p><strong>Last Checked:</strong> {lastChecked}</p>
              <p><strong>Notes:</strong> {notes}</p>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

export default TrailMap
