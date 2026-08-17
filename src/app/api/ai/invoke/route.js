import { requireSession, json, readJson } from '@/lib/api-helpers';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

export async function POST(req) {
  const { response } = await requireSession();
  if (response) return response;

  const body = await readJson(req);
  const prompt = body?.prompt;
  if (!prompt) return json({ error: 'prompt es requerido' }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({ error: 'GEMINI_API_KEY no está configurada en el servidor.' }, { status: 500 });
  }

  const wantsJson = !!body.response_json_schema;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        ...(wantsJson
          ? {
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: body.response_json_schema,
              },
            }
          : {}),
      }),
    }
  );

  if (!geminiRes.ok) {
    const errText = await geminiRes.text().catch(() => '');
    console.error('Gemini API error:', geminiRes.status, errText);
    return json({ error: 'Error al generar contenido con IA.' }, { status: 502 });
  }

  const data = await geminiRes.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

  if (wantsJson) {
    try {
      return json(JSON.parse(text));
    } catch {
      console.error('Gemini devolvió JSON inválido:', text);
      return json({ error: 'La IA devolvió un formato inválido.' }, { status: 502 });
    }
  }

  return json({ text });
}
