export default async function handler(req, res) {
  // Permite chamadas do próprio app (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave de API não configurada' });
  }

  try {
    const { messages, system, hasImage } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: system || `Você é especialista em segurança digital focado em golpes no Brasil. Analise o conteúdo e responda APENAS em JSON válido, sem markdown, sem texto fora do JSON.

Formato obrigatório:
{"riskLevel":"ALTO"|"MÉDIO"|"BAIXO","riskPercent":0-100,"headline":"frase curta máx 55 chars","explanation":"explicação simples 2-3 frases em linguagem leiga","signals":["sinal 1","sinal 2","sinal 3"],"action":"orientação prática e direta do que fazer agora"}

Detecte: urgência, pedido de PIX, pedido de segredo, pressão psicológica, links suspeitos, ofertas boas demais, pedido de dados bancários, falsa identidade de banco/governo. Responda sempre em português do Brasil.`,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
