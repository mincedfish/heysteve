import fs from 'fs';
import fetch from 'node-fetch';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const trails = [
  { name: "Mt. Tamalpais" },
  { name: "Ford Ord" },
  { name: "Rockville Hills Regional Park" },
  { name: "China Camp State Park" },
  { name: "Joaquin Miller Park" },
  { name: "Pacifica" },
  { name: "Tamarancho" },
  { name: "John Nicolas" },
  { name: "Soquel Demonstration Forest" },
  { name: "Briones" },
  { name: "Lime Ridge" },
  { name: "Crockett Hills Regional Park" },
];

const fetchRideability = async (trailName) => {
  const prompt = `Is the trail "${trailName}" rideable today considering recent rainfall and weather conditions?`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${trailName} (status: ${response.status})`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "No response available.";
  } catch (error) {
    console.error(`Error fetching rideability for ${trailName}:`, error);
    return "Error fetching data.";
  }
};

const generateTrailStatuses = async () => {
  const rideabilityData = {};

  for (const trail of trails) {
    console.log(`Fetching rideability for ${trail.name}...`);
    const rideability = await fetchRideability(trail.name);
    rideabilityData[trail.name] = { rideability };
  }

  fs.writeFileSync('trailStatuses.json', JSON.stringify(rideabilityData, null, 2));
  console.log('trailStatuses.json has been updated!');
};

generateTrailStatuses();
