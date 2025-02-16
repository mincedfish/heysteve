import fs from "fs";
import fetch from "node-fetch";
import trails from "./trails.js"; // Import trails data

const filePath = "public/trailStatuses.json";

// Ensure the file exists before writing to it
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify({}, null, 2)); // Create an empty JSON file
}

const API_KEY = process.env.WEATHERAPI;
const BASE_URL = "https://api.weatherapi.com/v1";

async function fetchWeatherData(lat, lon) {
  try {
    const currentRes = await fetch(`${BASE_URL}/current.json?key=${API_KEY}&q=${lat},${lon}`);
    const forecastRes = await fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=3`);

    const historyData = {};
    for (let i = 1; i <= 5; i++) {
      const date = getPastDate(i);
      const historyRes = await fetch(`${BASE_URL}/history.json?key=${API_KEY}&q=${lat},${lon}&dt=${date}`);
      if (historyRes.ok) {
        const data = await historyRes.json();
        const rainfallInches = data.forecast.forecastday[0]?.day?.totalprecip_in;
        const rainfallMm = data.forecast.forecastday[0]?.day?.totalprecip_mm;
        if (rainfallInches !== undefined && rainfallMm !== undefined) {
          historyData[date] = `${rainfallInches} in (${rainfallMm} mm)`;
        } else {
          console.warn(`⚠️ No rainfall data for ${date}`);
        }
      } else {
        console.warn(`⚠️ Failed to fetch history for ${date}`);
      }

      // Optional: Add a delay between API requests to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between requests
    }

    if (!currentRes.ok || !forecastRes.ok) {
      throw new Error("WeatherAPI request failed");
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    return { current: currentData, history: historyData, forecast: forecastData };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

function getPastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  // Use Intl.DateTimeFormat to format the date in Pacific Time
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  // Return the formatted date as YYYY-MM-DD
  return formattedDate.split('/').reverse().join('-'); // Converts MM/DD/YYYY to YYYY-MM-DD
}

async function updateTrailStatuses() {
  const trailStatuses = {};

  for (const trail of trails) {
    console.log(`Fetching weather for ${trail.name}...`);
    const weatherData = await fetchWeatherData(trail.lat, trail.lon);
    if (!weatherData) continue;

    trailStatuses[trail.name] = {
      current: {
        temperature: `${weatherData.current.current.temp_f}°F (${weatherData.current.current.temp_c}°C)`,
        condition: weatherData.current.current.condition.text,
        wind: `${weatherData.current.current.wind_mph} mph (${weatherData.current.current.wind_kph} kph)`,
        humidity: `${weatherData.current.current.humidity}%`,
        lastChecked: new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
      },
      history: {
        rainfall_last_5_days: weatherData.history
      },
      forecast: weatherData.forecast.forecast.forecastday.map((day) => ({
        date: day.date,
        temperature: `${day.day.avgtemp_f}°F (${day.day.avgtemp_c}°C)`,
        condition: day.day.condition.text,
        rainfall: `${day.day.totalprecip_in} in (${day.day.totalprecip_mm} mm)`
      }))
    };
  }

  fs.writeFileSync(filePath, JSON.stringify(trailStatuses, null, 2));
  console.log("✅ trailStatuses.json has been updated!");
}

updateTrailStatuses();
