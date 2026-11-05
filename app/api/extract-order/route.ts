import { requireUser } from '@/lib/auth-server'
import { PRODUCT } from '@/lib/constants'

// Reads the conversation and returns an order draft.
// Provider chain: Neon AI Gateway (if configured) → Gemini API key →
// local heuristic fallback handled by the caller.

interface ChatMsg {
  sender: 'buyer' | 'seller'
  kind: string
  text?: string
}

const SYSTEM = `You are an order-extraction assistant for a chat-to-order app in Bangladesh.
Read the chat messages and extract order details. Buyers write in English or Bangla (Bengali).

Return ONLY a JSON object, no prose:
{
  "product": string,        // product being ordered
  "quantity": number,       // 1-20, default 1
  "unitPrice": number,      // per-unit price in BDT (taka). Exclude delivery fee.
  "deliveryFee": number,    // delivery/courier charge in BDT. 0 if not mentioned.
  "payment": "cod"|"bkash", // cash on delivery unless bKash/Nagad/Rocket is mentioned
  "address": string,        // delivery address, "" if not mentioned
  "confidence": number      // 0-1 how complete the details are
}
Rules:
- Convert Bangla numerals (০১২৩৪৫৬৭৮৯) and number words (এক, দুই, তিন, চার, পাঁচ) to digits.
- If a price appears near "delivery" or "ডেলিভারি" it is the delivery fee, not the unit price.
- If no product is named, use the shared product: "${PRODUCT.name}".
- If only one price is mentioned and nothing marks it as a fee, treat it as unitPrice.
- JSON only.`

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages } = (await request.json()) as { messages: ChatMsg[] }
  const transcript = (messages ?? [])
    .filter((m) => m.text || m.kind === 'product')
    .map((m) => `${m.sender}: ${m.kind === 'product' ? `[product card: ${PRODUCT.name} — ৳${PRODUCT.price}]` : m.text}`)
    .join('\n')
    .slice(0, 12_000)

  if (!transcript.trim()) {
    return Response.json({ error: 'Nothing to analyse' }, { status: 400 })
  }

  const draft = await callLlm(transcript)
  if (!draft) return Response.json({ error: 'AI unavailable' }, { status: 503 })
  return Response.json(draft)
}

async function callLlm(transcript: string) {
  const gw = process.env.NEON_AI_GATEWAY_BASE_URL && process.env.NEON_AI_GATEWAY_TOKEN
  if (gw) {
    const res = await fetch(`${process.env.NEON_AI_GATEWAY_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.NEON_AI_GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gemini-3-flash',
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: transcript },
        ],
        response_format: { type: 'json_object' },
      }),
    })
    if (res.ok) {
      const data = await res.json()
      const parsed = safeParse(data?.choices?.[0]?.message?.content)
      if (parsed) return parsed
    }
  }

  if (process.env.GEMINI_API_KEY) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ parts: [{ text: transcript }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
        }),
      },
    )
    if (res.ok) {
      const data = await res.json()
      const parsed = safeParse(data?.candidates?.[0]?.content?.parts?.[0]?.text)
      if (parsed) return parsed
    }
  }

  return null
}

function safeParse(text: unknown) {
  if (typeof text !== 'string' || !text.trim()) return null
  try {
    const d = JSON.parse(text)
    if (!d || typeof d !== 'object') return null
    return {
      product: String(d.product || PRODUCT.name),
      quantity: clampInt(d.quantity, 1, 20, 1),
      unitPrice: num(d.unitPrice, PRODUCT.price),
      deliveryFee: num(d.deliveryFee, 0),
      payment: d.payment === 'bkash' ? 'bkash' : 'cod',
      address: String(d.address ?? ''),
      confidence: num(d.confidence, 0.5),
    }
  } catch {
    return null
  }
}

const num = (v: unknown, fallback: number) =>
  Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : fallback
const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}
