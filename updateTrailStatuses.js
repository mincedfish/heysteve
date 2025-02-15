const fetch = require("node-fetch");
const fs = require("fs");
const trails = require("./trails"); // ✅ Importing trails.js

async function fetchWeatherData(lat, lon) {
  const apiKey = process.env.WEATHERAPI;
  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch weather data (status: ${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
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
    const rideability = determineRideability(weatherData);

    trailStatuses[trail.name] = {
      status: rideability.status,
      conditionDetails: rideability.conditionDetails,
      temperature: `${weatherData?.current?.temp_f}°F (${weatherData?.current?.temp_c}°C)`,
      weatherConditions: weatherData?.current?.condition?.text || "Unknown",
      lastChecked: new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
      notes: "Automatically generated based on weather data."
    };
  }

  fs.writeFileSync("trailStatuses.json", JSON.stringify(trailStatuses, null, 2));
  console.log("✅ trailStatuses.json has been updated!");
}

updateTrailStatuses();
