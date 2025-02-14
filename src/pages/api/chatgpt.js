export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { trailName } = req.body;

    const openAIKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!openAIKey) {
      return res.status(500).json({ error: 'OpenAI API key is missing' });
    }

    try {
      // Make the request to OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIKey}`, // Use the VITE_ environment variable here
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: `Based on the current weather, is ${trailName} rideable today?` },
          ],
        }),
      });

      // Check if the response is not OK
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch from OpenAI' });
      }

      // Parse the response
      const data = await response.json();
      const rideabilityResponse = data.choices[0]?.message?.content || 'No response available.';

      // Send the response back to the client
      return res.status(200).json({ response: rideabilityResponse });
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  } else {
    // Only allow POST method
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}
