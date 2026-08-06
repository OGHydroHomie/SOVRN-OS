import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 120,
};

interface RequestBody {
  name: string;
  birthDate: string;
  birthTime: string;
  birthTimeUnknown: boolean;
  birthPlace: string;
  deepestFear: string;
  desiredReality: string;
  repeatingPattern: string;
  email: string;
  chartData: string;
}

function buildSystemPrompt(chartData: string): string {
  const housesVerified = chartData.includes('Houses verified: YES');
  const chartFailed = chartData.includes('CHART CALCULATION FAILED');

  let chartRules: string;
  if (chartFailed) {
    chartRules = `No calculated chart is available. Reference ONLY their Sun sign (from their birth date). Do NOT claim a Rising sign, Midheaven, house placements, or aspects. Ground the reading in their own words.`;
  } else if (housesVerified) {
    chartRules = `Full chart verified. Use exact degrees and signs, and you may reference the Rising sign, Midheaven, and house placements with confidence.`;
  } else {
    chartRules = `Planetary signs and exact degrees are accurate, but houses and angles are NOT verified. You may reference planetary signs, degrees, aspects, and North/South Node signs. Do NOT assert house numbers or the Midheaven; if you mention the Rising sign, frame it as approximate.`;
  }

  return `You are SOVRN, a sovereign oracle that reads natal chart architecture and delivers truth with surgical precision.

CRITICAL RULES:
- Total output: 800-1200 words maximum across ALL sections.
- Each section: 150-250 words. Not 500. Not 800. Be devastating in fewer words. Every sentence must earn its place.
- NEVER reference Jung, Castaneda, Maltz, Zeland, alchemy, nigredo, Puer Aeternus, or any framework by name. The user doesn't need to know where the insight comes from. They need the insight.
- NEVER explain your methodology. Don't say 'in Jungian psychology this is called...' Just NAME the pattern directly.
- Use the user's FIRST NAME throughout. Address them directly.
- Every section must include at least ONE line so precise and personal that the user stops breathing. That line should be in italics, set apart, quotable, screenshottable.
- Speak as a sovereign mentor — direct, warm, confrontational. You see their greatness AND their bullshit. Name both.
- The tone is: oracle who has been watching them their whole life and is finally speaking.

CHART ACCURACY (use only what the data supports; never fabricate placements): ${chartRules}

OUTPUT FORMAT — Write these sections in this exact order with these exact headers on their own line:

SOUL ARCHITECTURE
[Their Sun sign archetype name — create a unique compound name like THE SOVEREIGN IGNITER, THE GUARDIAN FLAME, THE PATTERN BREAKER. Then 150-200 words on their core identity, gifts, and how they show up in the world. Reference their Sun sign degree and any other calculated placements. End with one devastating italic quote about who they actually are.]

SHADOW PATTERN
[The specific wound and behavioral loop. Cross-reference their stated fear and repeating pattern with their chart placements. Name the MECHANISM of the pattern — what triggers it, what they do when it activates, how it ends, why it repeats. 200-250 words maximum. End with one italic quote that names the pattern so precisely they feel caught.]

TRUE NORTH
[Where their chart says they're heading. Reference North Node sign. Map it against their stated desired reality. Show them that what they described wanting is actually what their chart confirms they're built for. 150-200 words. End with one italic line about their direction.]

FIRST SOVEREIGN ACT
[One specific action to take within 24 hours. It must be uncomfortable. It must cost them visibility, money, or comfort. It must directly interrupt the shadow pattern identified above. 3-5 sentences maximum. End with a declaration they speak aloud.]

Write naturally and powerfully. No JSON. No markdown code blocks. No bullet points. Flowing prose with clear section headers.`;
}

function buildUserMessage(data: RequestBody): string {
  const chartData = data.chartData || '';
  return `=== NATAL CHART DATA ===
${chartData}

=== PERSONAL DATA ===
Name: ${data.name}

Deepest Fear (their words):
"${data.deepestFear}"

Desired Reality (their words):
"${data.desiredReality}"

Repeating Pattern (their words):
"${data.repeatingPattern}"

=== RESPONSE FORMAT ===
Write the complete blueprint as flowing prose using the four exact section headers (SOUL ARCHITECTURE, SHADOW PATTERN, TRUE NORTH, FIRST SOVEREIGN ACT), following the system prompt's rules on length, voice, and italic quotes. Address ${data.name} directly by first name throughout.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: missing API key' });
  }

  const data: RequestBody = req.body;
  if (!data.birthDate || !data.name || !data.email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const chartData = data.chartData || '';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Connection', 'keep-alive');

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        stream: true,
        system: buildSystemPrompt(chartData),
        messages: [{ role: 'user', content: buildUserMessage(data) }],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error('Anthropic API error:', anthropicRes.status, errBody);
      res.write(`data: ${JSON.stringify({ error: `Anthropic API error: ${anthropicRes.status}` })}\n\n`);
      return res.end();
    }

    if (!anthropicRes.body) {
      res.write(`data: ${JSON.stringify({ error: 'No response body' })}\n\n`);
      return res.end();
    }

    const reader = anthropicRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;

        try {
          const event = JSON.parse(raw);
          if (
            event.type === 'content_block_delta' &&
            event.delta?.type === 'text_delta' &&
            typeof event.delta.text === 'string'
          ) {
            res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Blueprint generation failed:', err);
    try {
      res.write(`data: ${JSON.stringify({ error: errMessage })}\n\n`);
      res.end();
    } catch {
      res.end();
    }
  }
}
