const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function callOpenRouter(modelId, userPrompt) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not found. Please check your .env file.')
  }

  console.log(`[OpenRouter] Calling model: ${modelId}`)

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Gödel Judge'
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    })

    console.log(`[OpenRouter] Response status for ${modelId}: ${response.status}`)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error(`[OpenRouter] Error for ${modelId}:`, error)
      throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    console.log(`[OpenRouter] Successfully received data for ${modelId}`)

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error(`[OpenRouter] Invalid response structure for ${modelId}:`, data)
      throw new Error('Invalid response from OpenRouter API')
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error(`[OpenRouter] Exception for ${modelId}:`, error)
    throw error
  }
}
