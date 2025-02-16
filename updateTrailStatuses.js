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

    const historyResPromises = [];
    for (let i = 1; i <= 5; i++) {
      historyResPromises.push(fetch(`${BASE_URL}/history.json?key=${API_KEY}&q=${lat},${lon}&dt=${getPastDate(i)}`));
    }

    const historyResponses = await Promise.all(historyResPromises);
    if (!currentRes.ok || !forecastRes.ok || historyResponses.some(res => !res.ok)) {
      throw new Error("WeatherAPI request failed");
    }

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();
    const historyData = await Promise.all(historyResponses.map(res => res.json()));

    return { current: currentData, history: historyData, forecast: forecastData };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

function getPastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}

function determineRideability(weather) {
  if (!weather) return { status: "Unknown", conditionDetails: "No data available" };

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
    console.log(`Fetching weather for ${trail.name}...`);
    const weatherData = await fetchWeatherData(trail.lat, trail.lon);
    if (!weatherData) continue;

    const rideability = determineRideability(weatherData.current);

    trailStatuses[trail.name] = {
      current: {
        temperature: `${weatherData.current.current.temp_f}°F (${weatherData.current.current.temp_c}°C)`,
        condition: weatherData.current.current.condition.text,
        wind: `${weatherData.current.current.wind_mph} mph (${weatherData.current.current.wind_kph} kph)`,
        humidity: `${weatherData.current.current.humidity}%`,
        lastChecked: new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
      },
      history: {
        pastRainfall: weatherData.history.map((day, index) => ({
          date: getPastDate(index + 1),
          rainfall: `${day.forecast.forecastday[0].day.totalprecip_in} in (${day.forecast.forecastday[0].day.totalprecip_mm} mm)`
        }))
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
