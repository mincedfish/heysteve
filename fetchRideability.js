const fetch = require('node-fetch');
const fs = require('fs');

// Example function to fetch rideability data (You should replace with a real API call)
async function fetchRideability(trail) {
  try {
    const response = await fetch(`https://api.example.com/weather?trail=${trail}`);
    if (response.ok) {
      const data = await response.json();
      // Example: Create a detailed response based on fetched data
      return {
        trailName: trail,
        status: data.status,
        conditionDetails: data.condition,  // E.g., "Dry", "Wet", "Mud"
        temperature: data.temperature,      // E.g., 75°F
        humidity: data.humidity,            // E.g., 60%
        weatherConditions: data.weather,    // E.g., "Clear skies"
        lastChecked: new Date().toISOString(), // Timestamp of when the check was made
        notes: data.notes || "No additional information" // Optional additional info
      };
    } else {
      throw new Error(`Failed to fetch data for ${trail} (status: ${response.status})`);
    }
  } catch (error) {
    console.error(error);
    return {
      trailName: trail,
      status: "Error",
      conditionDetails: "Unable to fetch data",
      lastChecked: new Date().toISOString(),
      notes: error.message
    };
  }
}

async function generateTrailStatuses() {
  const trails = [
    "Mt. Tamalpais",
    "Ford Ord",
    "Rockville Hills Regional Park",
    "China Camp State Park",
    "Joaquin Miller Park",
    "Pacifica",
    "Tamarancho",
    "John Nicolas",
    "Soquel Demonstration Forest",
    "Briones",
    "Lime Ridge",
    "Crockett Hills Regional Park"
  ];

  const trailStatuses = [];
  for (const trail of trails) {
    const rideabilityData = await fetchRideability(trail);
    trailStatuses.push(rideabilityData);
  }

  // Save to trailStatuses.json
  fs.writeFileSync('trailStatuses.json', JSON.stringify(trailStatuses, null, 2));
  console.log('trailStatuses.json has been updated!');
}

generateTrailStatuses();
