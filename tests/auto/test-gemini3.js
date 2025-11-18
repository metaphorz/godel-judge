// Test Gemini 3 Pro Preview model
import { readFileSync } from 'fs';

// Read .env file manually
const envContent = readFileSync('.env', 'utf8');
const match = envContent.match(/VITE_OPENROUTER_API_KEY=(.+)/);
const OPENROUTER_API_KEY = match ? match[1].trim() : null;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function testGemini3() {
  console.log('Testing Gemini 3 Pro Preview...\n');

  if (!OPENROUTER_API_KEY) {
    console.error('❌ Error: VITE_OPENROUTER_API_KEY not found in environment');
    process.exit(1);
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Gödel Judge - Model Test'
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello from Gemini 3 Pro Preview!" and briefly describe what version you are.'
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response structure');
    }

    console.log('✅ Gemini 3 Pro Preview is working!\n');
    console.log('Response:');
    console.log(data.choices[0].message.content);
    console.log('\n✅ Test passed! Ready to update the model in App.jsx');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testGemini3();
