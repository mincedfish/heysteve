process.env.TZ = "America/Los_Angeles"

import fs from "fs"
import fetch from "node-fetch"
import trails from "./trails.js" // Import trails data

const filePath = "public/trailStatuses.json"

// Ensure the file exists before writing to it
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify({}, null, 2)) // Create an empty JSON file
}

const API_KEY = process.env.WEATHERAPI
const BASE_URL = "https://api.weatherapi.com/v1"

async function fetchWeatherData(lat, lon) {
  try {
    const currentRes = await fetch(`${BASE_URL}/current.json?key=${API_KEY}&q=${lat},${lon}`)
    const forecastRes = await fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=4`) // Request 4-day forecast

    const historyData = {}
    const today = new Date().toISOString().split("T")[0]

    // Fetch historical data for the last 6 days
    for (let i = 1; i <= 6; i++) {
      const date = getPastDate(i)

      // Skip if the date matches today
      if (date === today) {
        console.log(`Skipping today's date: ${date}`)
        continue
      }

      const historyRes = await fetch(`${BASE_URL}/history.json?key=${API_KEY}&q=${lat},${lon}&dt=${date}`)

      if (historyRes.ok) {
        const data = await historyRes.json()
        console.log(`History response for ${date}:`, data)

        // Calculate total rainfall for the day
        const totalRainfallMm = data.forecast.forecastday[0]?.day?.totalprecip_mm || 0
        const totalRainfallInches = data.forecast.forecastday[0]?.day?.totalprecip_in || 0
        historyData[date] = `${totalRainfallInches.toFixed(2)} in (${totalRainfallMm.toFixed(2)} mm)`
      } else {
        console.warn(`⚠️ Failed to fetch history for ${date}`)
      }

      // Optional: Add a delay between API requests to avoid hitting rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000)) // 1 second delay between requests
    }

    if (!currentRes.ok || !forecastRes.ok) {
      throw new Error("WeatherAPI request failed")
    }

    const currentData = await currentRes.json()
    const forecastData = await forecastRes.json()

    return { current: currentData, history: historyData, forecast: forecastData }
  } catch (error) {
    console.error("Error fetching weather data:", error)
    return null
  }
}

// Adjust for Pacific Time zone by subtracting the offset
function getPastDate(daysAgo) {
  const offset = getPacificOffset() // Get the Pacific Time offset (in hours)
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(date.getHours() - offset) // Adjust date for Pacific Time Zone
  return date.toISOString().split("T")[0] // Return date in YYYY-MM-DD format
}

function getPacificOffset() {
  const now = new Date()
  const pacificTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }))
  return (now.getTime() - pacificTime.getTime()) / (1000 * 60 * 60)
}

async function updateTrailStatuses() {
  const trailStatuses = {}

  for (const trail of trails) {
    console.log(`Fetching weather for ${trail.name}...`)
    const weatherData = await fetchWeatherData(trail.lat, trail.lon)
    if (!weatherData) continue

    trailStatuses[trail.name] = {
      current: {
        temperature: `${weatherData.current.current.temp_f}°F (${weatherData.current.current.temp_c}°C)`,
        condition: weatherData.current.current.condition.text,
        wind: `${weatherData.current.current.wind_mph} mph (${weatherData.current.current.wind_kph} kph)`,
        humidity: `${weatherData.current.current.humidity}%`,
        lastChecked: new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
      },
      history: {
        rainfall_last_5_days: weatherData.history,
      },
      forecast: getUniqueForecastDays(weatherData.forecast.forecast.forecastday),
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(trailStatuses, null, 2))
  console.log("✅ trailStatuses.json has been updated!")
}

// Ensure we get unique future dates for forecast
function getUniqueForecastDays(forecastData) {
  const now = new Date()
  const pacificNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }))
  const today = pacificNow.toISOString().split("T")[0]

  console.log("Current date and time (Pacific):", pacificNow.toISOString())
  console.log("Today's date:", today)
  console.log("Forecast data received:", JSON.stringify(forecastData, null, 2))

  // Filter out today's date and take the next 2 days
  const nextTwoDays = forecastData.filter((day) => day.date > today).slice(0, 2)

  console.log(
    "Selected forecast days:",
    nextTwoDays.map((day) => ({
      date: day.date,
      dateTime: new Date(day.date_epoch * 1000).toISOString(),
    })),
  )

  const result = nextTwoDays.map((day) => ({
    date: day.date,
    temperature: `${day.day.avgtemp_f}°F (${day.day.avgtemp_c}°C)`,
    condition: day.day.condition.text,
    rainfall: calculateDailyRainfall(day.hour),
  }))

  console.log("Final forecast result:", JSON.stringify(result, null, 2))

  return result
}

// Calculate total rainfall for a day's forecast by summing the hourly values
function calculateDailyRainfall(hourlyData) {
  const totalRainfallInches = hourlyData.reduce((total, hour) => total + (hour?.precip_in || 0), 0)
  const totalRainfallMm = totalRainfallInches * 25.4 // Convert inches to millimeters
  return `${totalRainfallInches.toFixed(2)} in (${totalRainfallMm.toFixed(2)} mm)`
}

updateTrailStatuses()

