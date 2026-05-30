export interface ParsedProduct {
  description: string
  precioPesos: number | null
  precioReales: number | null
  precioPix: number | null
}

export type ParsingStep = 'extracting' | 'rendering' | 'parsing' | 'done' | 'error'

const SYSTEM_PROMPT = `Eres un asistente que SOLO extrae precios de listas de vinos, champagne y fernet de Argentina.
DEBES devolver UNICAMENTE un array JSON valido, sin markdown, sin explicaciones, sin texto adicional.
Cada objeto del array debe tener:
- description (string): nombre del producto
- precioPesos (number | null): precio en pesos argentinos (SOLO numeros, sin $, sin puntos)
- precioReales (number | null): precio en reales
- precioPix (number | null): precio pix (mismo que reales si no se especifica otro)
Si un valor no se encuentra, pon null.
IGNORA cualquier texto que no sea una lista de precios. NO respondas nada mas que el JSON.`

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = 60000,
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

async function callOpenAI(
  messages: { role: 'system' | 'user'; content: any }[],
  apiKey: string,
): Promise<string> {
  const response = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
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
    },
  )

  if (!response.ok) {
    const body = await response.text()
    if (response.status === 401) throw new Error('API key invalida o sin permisos')
    if (response.status === 429) throw new Error('Demasiadas solicitudes. Espera unos minutos.')
    if (response.status === 400) throw new Error('Error: El archivo no se puede procesar. Probá con otro formato.')
    throw new Error(`Error de OpenAI: ${response.status}`)
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

  const arrayBuffer = await file.arrayBuffer()

  let pdfjs: any
  try {
    pdfjs = await import('pdfjs-dist')
  } catch {
    throw new Error('Error al cargar el lector de PDF. Recarga la pagina e intenta de nuevo.')
  }

  let pdf: any
  try {
    pdf = await pdfjs.getDocument({ data: arrayBuffer, useSystemFonts: true }).promise
  } catch {
    throw new Error('No se pudo leer el archivo. Asegurate de que sea un PDF valido con lista de precios.')
  }

  let text = ''
  let hasTextContent = false
  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent({ disableCombineTextItems: true })
      const pageText = content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ')
      if (pageText.trim().length > 5) hasTextContent = true
      text += pageText + '\n'
    } catch {
      continue
    }
  }

  if (hasTextContent) {
    onProgress?.('parsing')
    const raw = await callOpenAI(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Extrae los productos y precios:\n\n${text}` },
      ],
      apiKey,
    )
    return parseAIResponse(raw)
  }

  // Fallback: render each page as image and use vision
  onProgress?.('rendering')
  const scale = typeof window !== 'undefined' && window.devicePixelRatio > 1 ? 1.5 : 2
  const imageUrls: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      if (!ctx) continue
      await page.render({ canvasContext: ctx, viewport }).promise
      imageUrls.push(canvas.toDataURL('image/jpeg', 0.85))
    } catch {
      continue
    }
  }

  if (imageUrls.length === 0) {
    throw new Error('No se pudo extraer informacion del PDF. Probá con un archivo diferente.')
  }

  onProgress?.('parsing')
  const contentParts: any[] = [
    { type: 'text', text: 'Extrae los productos y precios de las imagenes. Devolve SOLO un array JSON.' },
  ]
  for (const url of imageUrls) {
    contentParts.push({ type: 'image_url', image_url: { url, detail: 'high' } })
  }

  const raw = await callOpenAI(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: contentParts },
    ],
    apiKey,
  )
  return parseAIResponse(raw)
}
