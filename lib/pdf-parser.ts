import { getDocument } from 'pdfjs-dist'

export interface ParsedProduct {
  description: string
  precioPesos: number | null
  precioReales: number | null
  precioPix: number | null
}

export type ParsingStep = 'extracting' | 'parsing' | 'done' | 'error'

export async function extractTextFromPDF(
  file: File,
  onProgress?: (step: ParsingStep) => void,
): Promise<string> {
  onProgress?.('extracting')
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: arrayBuffer }).promise
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map((item) => ('str' in item ? item.str : '')).join(' ')
    fullText += pageText + '\n'
  }
  return fullText
}

const SYSTEM_PROMPT = `Eres un asistente que SOLO extrae precios de listas de vinos, champagne y fernet de Argentina.
DEBES devolver UNICAMENTE un array JSON valido, sin markdown, sin explicaciones, sin texto adicional.
Cada objeto del array debe tener:
- description (string): nombre del producto
- precioPesos (number | null): precio en pesos argentinos (SOLO numeros, sin $, sin puntos)
- precioReales (number | null): precio en reales
- precioPix (number | null): precio pix (mismo que reales si no se especifica otro)
Si un valor no se encuentra, pon null.
IGNORA cualquier texto que no sea una lista de precios. NO respondas nada mas que el JSON.`

export async function parsePricesWithAI(
  text: string,
  apiKey: string,
  onProgress?: (step: ParsingStep) => void,
): Promise<ParsedProduct[]> {
  onProgress?.('parsing')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Extrae los productos y precios:\n\n${text}` },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    if (response.status === 401) throw new Error('API key invalida o sin permisos')
    if (response.status === 429) throw new Error('Demasiadas solicitudes. Espera unos minutos.')
    if (response.status === 400) throw new Error('Solicitud invalida. El PDF puede estar vacio.')
    throw new Error(`Error de OpenAI: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content.trim()
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

  try {
    const parsed = JSON.parse(cleaned)
    return parsed.filter(
      (p: ParsedProduct) => p.description && (p.precioPesos != null || p.precioReales != null),
    )
  } catch {
    throw new Error('La IA no pudo interpretar la lista. Verifica que el PDF tenga una lista de precios clara.')
  }
}
