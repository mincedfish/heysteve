import fs from "fs";
import fetch from "node-fetch";
import trails from "./trails.js"; // Import trails data

const API_KEY = process.env.WEATHERAPI;
const BASE_URL = "https://api.weatherapi.com/v1";

async function fetchWeatherData(lat, lon) {
  try {
    // Fetch current weather
    const currentRes = await fetch(`${BASE_URL}/current.json?key=${API_KEY}&q=${lat},${lon}`);
    const historyRes = await fetch(`${BASE_URL}/history.json?key=${API_KEY}&q=${lat},${lon}&dt=${getYesterdayDate()}`);
    const forecastRes = await fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=3`);

    if (!currentRes.ok || !historyRes.ok || !forecastRes.ok) {
      throw new Error("WeatherAPI request failed");
    }

    const currentData = await currentRes.json();
    const historyData = await historyRes.json();
    const forecastData = await forecastRes.json();

    return { current: currentData, history: historyData, forecast: forecastData };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

function getYesterdayDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
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
        temperature: `${weatherData.history.forecast.forecastday[0].day.avgtemp_f}°F (${weatherData.history.forecast.forecastday[0].day.avgtemp_c}°C)`,
        condition: weatherData.history.forecast.forecastday[0].day.condition.text,
        rainfall: `${weatherData.history.forecast.forecastday[0].day.totalprecip_in} in (${weatherData.history.forecast.forecastday[0].day.totalprecip_mm} mm)`
      },
      forecast: weatherData.forecast.forecast.forecastday.map((day) => ({
        date: day.date,
        temperature: `${day.day.avgtemp_f}°F (${day.day.avgtemp_c}°C)`,
        condition: day.day.condition.text,
        rainfall: `${day.day.totalprecip_in} in (${day.day.totalprecip_mm} mm)`
      }))
    };
  }

  // Save the data in public/trailStatuses.json
  fs.writeFileSync("public/trailStatuses.json", JSON.stringify(trailStatuses, null, 2));
  console.log("✅ trailStatuses.json has been updated!");
}

updateTrailStatuses();
