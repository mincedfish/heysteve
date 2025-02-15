"use client"

import { useEffect, useState, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import trails from "../trails" // Ensure this path is correct
import { useMediaQuery } from "react-responsive"

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

function FitBoundsToMarkers({ sidebarWidth, isMobile }) {
  const map = useMap()

  useEffect(() => {
    if (map) {
      const bounds = L.latLngBounds(trails.map((trail) => [trail.lat, trail.lon]))
      map.fitBounds(bounds, {
        paddingTopLeft: isMobile ? [0, 0] : [sidebarWidth, 50],
        paddingBottomRight: [50, 50],
      })
    }
  }, [map, sidebarWidth, isMobile])

  return null
}

const TrailMap = () => {
  const [trailStatuses, setTrailStatuses] = useState({})
  const [selectedTrail, setSelectedTrail] = useState(null)
  const [activeMarker, setActiveMarker] = useState(null)
  const [error, setError] = useState(null)
  const [map, setMap] = useState(null)
  const isMobile = useMediaQuery({ maxWidth: 768 })

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

  const getRideabilityInfo = (trailData) => {
    if (!trailData || !trailData.rideability) return { status: "Unknown", explanation: "" }

    const [status, ...explanationParts] = trailData.rideability.split("\n")
    const explanation = explanationParts.join("\n").trim()

    return { status, explanation }
  }

  const resetSidebar = () => {
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
      <div style={{ flex: 1 }}>
        <MapContainer
          center={[37.9061, -122.5957]}
          zoom={9}
          style={{ height: "100%", width: "100%" }}
          whenCreated={setMap}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBoundsToMarkers sidebarWidth={320} isMobile={isMobile} />
          {trails.map((trail) => (
            <Marker
              key={trail.name}
              position={[trail.lat, trail.lon]}
              icon={defaultIcon}
              eventHandlers={{ click: (e) => handleMarkerClick(trail, e.target) }}
            >
              <Popup>
                <h3>{trail.name}</h3>
                <p>
                  <strong>Send it?</strong> {getRideabilityInfo(trailStatuses[trail.name]).status}
                </p>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

export default TrailMap
