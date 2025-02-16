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
    const forecastRes = await fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=3`) // Request 3-day forecast

    const historyData = {}
    // Fetch historical data for the last 5 days
    for (let i = 2; i <= 6; i++) {
      // Skip today (i=1)
      const date = getPastDate(i)
      const historyRes = await fetch(`${BASE_URL}/history.json?key=${API_KEY}&q=${lat},${lon}&dt=${date}`)

      if (historyRes.ok) {
        const data = await historyRes.json()
        console.log(`History response for ${date}:`, data)

        // Calculate total rainfall in the last 24 hours from hourly data
        const hourlyRainfall = data.forecast.forecastday[0]?.hour
        if (hourlyRainfall) {
          const totalRainfallInches = hourlyRainfall.reduce((total, hour) => total + (hour?.precip_in || 0), 0)
          const totalRainfallMm = totalRainfallInches * 25.4 // Convert inches to millimeters
          historyData[date] = `${totalRainfallInches.toFixed(2)} in (${totalRainfallMm.toFixed(2)} mm)`
        } else {
          console.warn(`⚠️ No hourly data for ${date}`)
        }
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
  const today = new Date().toDateString()
  const forecastDays = forecastData
    .filter((day) => {
      const forecastDate = new Date(day.date)
      return forecastDate.toDateString() !== today // Exclude today's forecast
    })
    .slice(0, 2) // Get the next 2 unique forecast days

  console.log(
    "Forecast data received:",
    forecastData.map((day) => day.date),
  )
  console.log(
    "Filtered and adjusted forecast days:",
    forecastDays.map((day) => adjustForecastDate(day.date)),
  )

  return forecastDays.map((day) => ({
    date: adjustForecastDate(day.date), // Adjust the forecast date for time zone
    temperature: `${day.day.avgtemp_f}°F (${day.day.avgtemp_c}°C)`,
    condition: day.day.condition.text,
    rainfall: calculateDailyRainfall(day.hour),
  }))
}

// Adjust forecast date to account for time zone offset
function adjustForecastDate(date) {
  const offset = getPacificOffset()
  const forecastDate = new Date(date)
  forecastDate.setHours(forecastDate.getHours() - offset) // Adjust for Pacific Time

  return forecastDate.toISOString().split("T")[0] // Return the adjusted date in YYYY-MM-DD format
}

// Calculate total rainfall for a day's forecast by summing the hourly values
function calculateDailyRainfall(hourlyData) {
  const totalRainfallInches = hourlyData.reduce((total, hour) => total + (hour?.precip_in || 0), 0)
  const totalRainfallMm = totalRainfallInches * 25.4 // Convert inches to millimeters
  return `${totalRainfallInches.toFixed(2)} in (${totalRainfallMm.toFixed(2)} mm)`
}

updateTrailStatuses()

