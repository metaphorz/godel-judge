// Test script to verify Kimi and Qwen models work with OpenRouter
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file
const envPath = join(__dirname, '../../.env');
const envContent = readFileSync(envPath, 'utf8');
const OPENROUTER_API_KEY = envContent.match(/VITE_OPENROUTER_API_KEY=(.*)/)?.[1]?.trim();
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function testModel(modelId, modelName) {
  console.log(`\n=== Testing ${modelName} (${modelId}) ===`);

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
        model: modelId,
        messages: [
          {
            role: 'user',
            content: 'Please respond with a brief greeting to confirm you are working. Just say hello and identify yourself.'
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log(`✓ SUCCESS: ${modelName} is accessible`);
    console.log(`Response: ${content.substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.error(`✗ FAILED: ${modelName} - ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('Testing new models for Gödel Judge...\n');

  if (!OPENROUTER_API_KEY) {
    console.error('ERROR: VITE_OPENROUTER_API_KEY not found in .env file');
    process.exit(1);
  }

  const tests = [
    { id: 'moonshotai/kimi-k2-thinking', name: 'Kimi K2 Thinking' },
    { id: 'qwen/qwen3-vl-235b-a22b-thinking', name: 'Qwen3 VL 235B A22B Thinking' }
  ];

  let allPassed = true;
  for (const test of tests) {
    const passed = await testModel(test.id, test.name);
    allPassed = allPassed && passed;
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✓ All models accessible via OpenRouter');
  } else {
    console.log('✗ Some models failed - check errors above');
  }
}

runTests();
