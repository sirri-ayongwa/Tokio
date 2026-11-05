import type { Lang } from './types'

export async function translateMessage(text: string, source: Lang): Promise<string | null> {
  const target = source === 'bn' ? 'English' : 'Bengali (Bangla)'
  const prompt = `Translate the following chat message into ${target}. Preserve its meaning, tone, names, numbers, prices, and product names. Return only the translated message, with no quotation marks or explanation.\n\n${text}`

  try {
    if (process.env.NEON_AI_GATEWAY_BASE_URL && process.env.NEON_AI_GATEWAY_TOKEN) {
      const response = await fetch(`${process.env.NEON_AI_GATEWAY_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${process.env.NEON_AI_GATEWAY_TOKEN}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'gemini-3-flash',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        const translated = data?.choices?.[0]?.message?.content?.trim()
        if (translated) return translated
      }
    }

    if (process.env.GEMINI_API_KEY) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 },
          }),
        },
      )
      if (response.ok) {
        const data = await response.json()
        const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (translated) return translated
      }
    }
  } catch {
    // Sending the original message is better than blocking chat if translation is unavailable.
  }
  return null
}
