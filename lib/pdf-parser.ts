export interface ParsedProduct {
  description: string
  precioPesos: number | null
  precioReales: number | null
  precioPix: number | null
}

export type ParsingStep = 'extracting' | 'rendering' | 'parsing' | 'done' | 'error'

function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', 0.85)
}

async function renderPageAsBase64(page: any, scale = 2): Promise<string> {
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport }).promise
  return canvasToBase64(canvas)
}

function getSystemPrompt() {
  return `Eres un asistente que SOLO extrae precios de listas de vinos, champagne y fernet de Argentina.
DEBES devolver UNICAMENTE un array JSON valido, sin markdown, sin explicaciones, sin texto adicional.
Cada objeto del array debe tener:
- description (string): nombre del producto
- precioPesos (number | null): precio en pesos argentinos (SOLO numeros, sin $, sin puntos)
- precioReales (number | null): precio en reales
- precioPix (number | null): precio pix (mismo que reales si no se especifica otro)
Si un valor no se encuentra, pon null.
IGNORA cualquier texto que no sea una lista de precios. NO respondas nada mas que el JSON.`
}

async function callOpenAI(
  messages: { role: 'system' | 'user'; content: any }[],
  apiKey: string,
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.1,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    if (response.status === 401) throw new Error('API key invalida o sin permisos')
    if (response.status === 429) throw new Error('Demasiadas solicitudes. Espera unos minutos.')
    if (response.status === 400) throw new Error('Error: El archivo no se puede procesar. Probá con otro formato.')
    throw new Error(`Error de OpenAI: ${response.status} - ${body.slice(0, 200)}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

function parseAIResponse(content: string): ParsedProduct[] {
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  try {
    const parsed = JSON.parse(cleaned)
    return parsed.filter(
      (p: ParsedProduct) => p.description && (p.precioPesos != null || p.precioReales != null),
    )
  } catch {
    throw new Error('La IA no pudo interpretar la lista. Verifica que el PDF tenga precios visibles.')
  }
}

export async function extractAndParsePDF(
  file: File,
  apiKey: string,
  onProgress?: (step: ParsingStep) => void,
): Promise<ParsedProduct[]> {
  onProgress?.('extracting')
  const pdfjs = await import('pdfjs-dist')

  const arrayBuffer = await file.arrayBuffer()
  let pdf
  try {
    pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  } catch {
    throw new Error('No se pudo abrir el PDF. Asegurate de que sea un archivo valido.')
  }

  let text = ''
  let textPages = 0
  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items.map((item) => ('str' in item ? item.str : '')).join(' ')
      if (pageText.trim().length > 10) textPages++
      text += pageText + '\n'
    } catch {
      // skip unreadable pages
    }
  }

  const hasExtractableText = text.trim().length > 20

  if (hasExtractableText) {
    onProgress?.('parsing')
    const raw = await callOpenAI(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: `Extrae los productos y precios:\n\n${text}` },
      ],
      apiKey,
    )
    return parseAIResponse(raw)
  }

  // Fallback: render pages as images and use vision
  onProgress?.('rendering')
  const imageUrls: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i)
      const url = await renderPageAsBase64(page)
      imageUrls.push(url)
    } catch {
      // skip unrenderable pages
    }
  }

  if (imageUrls.length === 0) {
    throw new Error('El PDF no tiene texto ni imagenes procesables.')
  }

  onProgress?.('parsing')
  const contentParts: any[] = [
    { type: 'text', text: 'Extrae los productos y precios de estas imagenes. Devolve SOLO un array JSON.' },
  ]
  for (const url of imageUrls) {
    contentParts.push({ type: 'image_url', image_url: { url, detail: 'high' } })
  }

  const raw = await callOpenAI(
    [
      { role: 'system', content: getSystemPrompt() },
      { role: 'user', content: contentParts },
    ],
    apiKey,
  )
  return parseAIResponse(raw)
}
