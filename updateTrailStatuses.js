import fs from "fs";
import fetch from "node-fetch";
import trails from "./trails.js"; // Import trails data

const API_KEY = process.env.WEATHERAPI;
const BASE_URL = "https://api.weatherapi.com/v1";

async function fetchWeatherData(lat, lon) {
  try {
    // Fetch current, historical (yesterday), and 3-day forecast weather
    const currentRes = await fetch(`${BASE_URL}/current.json?key=${API_KEY}&q=${lat},${lon}`);
    const historyRes = await fetch(`${BASE_URL}/history.json?key=${API_KEY}&q=${lat},${lon}&dt=${getYesterdayDate()}`);
    const forecastRes = await fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=3`);

    if (!currentRes.ok) throw new Error(`Current weather fetch failed (status: ${currentRes.status})`);
    if (!historyRes.ok) throw new Error(`Historical weather fetch failed (status: ${historyRes.status})`);
    if (!forecastRes.ok) throw new Error(`Forecast fetch failed (status: ${forecastRes.status})`);

    const [currentData, historyData, forecastData] = await Promise.all([
      currentRes.json(), historyRes.json(), forecastRes.json()
    ]);

    return { current: currentData, history: historyData, forecast: forecastData };
  } catch (error) {
    console.error("❌ Error fetching weather data:", error.message);
    return null;
  }
}

// Function to get yesterday’s date in YYYY-MM-DD format
function getYesterdayDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

// Determines trail rideability based on weather conditions
function determineRideability(weather) {
  if (!weather?.current) return { status: "Unknown", conditionDetails: "No data available" };

  const conditionText = weather.current.condition.text.toLowerCase();
  const tempF = weather.current.temp_f;
  const precipIn = weather.current.precip_in;

  if (precipIn > 0.1) return { status: "Not Rideable", conditionDetails: "Wet/Muddy" };
  if (conditionText.includes("snow") || conditionText.includes("storm")) return { status: "Not Rideable", conditionDetails: "Snow/Ice or Stormy" };
  if (tempF < 35) return { status: "Caution", conditionDetails: "Very Cold" };

  return { status: "Rideable", conditionDetails: "Dry or Minimal Moisture" };
}

async function updateTrailStatuses() {
  const trailStatuses = {};

  for (const trail of trails) {
    console.log(`📡 Fetching weather for ${trail.name}...`);
    const weatherData = await fetchWeatherData(trail.lat, trail.lon);
    if (!weatherData) {
      console.warn(`⚠️ Skipping ${trail.name}, failed to fetch data.`);
      continue;
    }

    const rideability = determineRideability(weatherData.current);

    trailStatuses[trail.name] = {
      status: rideability.status,
      conditionDetails: rideability.conditionDetails,
      current: {
        temperature: weatherData.current?.current?.temp_f
          ? `${weatherData.current.current.temp_f}°F (${weatherData.current.current.temp_c}°C)`
          : "N/A",
        condition: weatherData.current?.current?.condition?.text || "Unknown",
        wind: weatherData.current?.current?.wind_mph
          ? `${weatherData.current.current.wind_mph} mph (${weatherData.current.current.wind_kph} kph)`
          : "N/A",
        humidity: weatherData.current?.current?.humidity ? `${weatherData.current.current.humidity}%` : "N/A",
        lastChecked: new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
      },
      history: weatherData.history?.forecast?.forecastday?.[0]?.day
        ? {
            temperature: `${weatherData.history.forecast.forecastday[0].day.avgtemp_f}°F (${weatherData.history.forecast.forecastday[0].day.avgtemp_c}°C)`,
            condition: weatherData.history.forecast.forecastday[0].day.condition.text,
            rainfall: `${weatherData.history.forecast.forecastday[0].day.totalprecip_in} in (${weatherData.history.forecast.forecastday[0].day.totalprecip_mm} mm)`
          }
        : { temperature: "N/A", condition: "N/A", rainfall: "N/A" },
      forecast: weatherData.forecast?.forecast?.forecastday?.length
        ? weatherData.forecast.forecast.forecastday.map((day) => ({
            date: day.date,
            temperature: `${day.day.avgtemp_f}°F (${day.day.avgtemp_c}°C)`,
            condition: day.day.condition.text,
            rainfall: `${day.day.totalprecip_in} in (${day.day.totalprecip_mm} mm)`
          }))
        : []
    };
  }

  // Ensure public directory exists before writing file
  if (!fs.existsSync("public")) {
    fs.mkdirSync("public");
  }

  // Save the data in public/trailStatuses.json
  fs.writeFileSync("public/trailStatuses.json", JSON.stringify(trailStatuses, null, 2));
  console.log("✅ trailStatuses.json has been updated!");
}

updateTrailStatuses();
