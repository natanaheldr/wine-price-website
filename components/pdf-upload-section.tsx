'use client'

import { useState, useRef } from 'react'
import {
  Upload,
  FileText,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  extractTextFromPDF,
  parsePricesWithAI,
  type ParsedProduct,
  type ParsingStep,
} from '@/lib/pdf-parser'
import { usePriceOverrides } from '@/lib/price-overrides'
import type { Product } from '@/lib/products-data'

const API_KEY_STORAGE = 'lista-precios-openai-key'

interface MatchResult {
  productId: string
  originalDescription: string
  newDescription: string
  originalPesos: number
  newPesos: number | null
  originalReales: number
  newReales: number | null
  originalPix: number
  newPix: number | null
  changed: boolean
}

interface PdfUploadSectionProps {
  allProducts: Product[]
}

export function PdfUploadSection({ allProducts }: PdfUploadSectionProps) {
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiInput, setShowApiInput] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState<ParsingStep | null>(null)
  const [error, setError] = useState('')
  const [matches, setMatches] = useState<MatchResult[]>([])
  const { setOverrides } = usePriceOverrides()
  const [applied, setApplied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError('')
    setApplied(false)
    setMatches([])

    const storedKey = localStorage.getItem(API_KEY_STORAGE)
    if (!storedKey) {
      setShowApiInput(true)
      return
    }
    await processFile(f, storedKey)
  }

  const handleApiKeySubmit = async () => {
    if (!apiKeyInput.trim()) return
    localStorage.setItem(API_KEY_STORAGE, apiKeyInput.trim())
    setShowApiInput(false)
    setApiKeyInput('')
    if (file) {
      await processFile(file, apiKeyInput.trim())
    }
  }

  const processFile = async (f: File, key: string) => {
    try {
      setError('')
      const text = await extractTextFromPDF(f, setStep)
      const parsed = await parsePricesWithAI(text, key, setStep)
      setStep('done')

      const results: MatchResult[] = []
      for (const p of parsed) {
        const match = findBestMatch(p.description, allProducts)
        if (match) {
          results.push({
            productId: match.id,
            originalDescription: match.description,
            newDescription: p.description,
            originalPesos: match.precioPesos,
            newPesos: p.precioPesos,
            originalReales: match.precioReales,
            newReales: p.precioReales,
            originalPix: match.precioPix,
            newPix: p.precioPix,
            changed:
              (p.precioPesos != null && p.precioPesos !== match.precioPesos) ||
              (p.precioReales != null && p.precioReales !== match.precioReales) ||
              (p.precioPix != null && p.precioPix !== match.precioPix),
          })
        }
      }
      setMatches(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el PDF')
      setStep('error')
    }
  }

  const handleApply = () => {
    const overrides: Record<string, { precioPesos: number; precioReales: number; precioPix: number }> =
      {}
    for (const m of matches) {
      overrides[m.productId] = {
        precioPesos: m.newPesos ?? m.originalPesos,
        precioReales: m.newReales ?? m.originalReales,
        precioPix: m.newPix ?? m.originalPix,
      }
    }
    setOverrides(overrides)
    setApplied(true)
  }

  const hasChanges = matches.some((m) => m.changed)

  return (
    <div className="space-y-4">
      <div className="border border-border/40 rounded-lg p-4 bg-secondary/20">
        <div className="flex items-start gap-3 mb-3">
          <Upload className="h-5 w-5 text-accent mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Actualizar precios desde PDF
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Subi un PDF con la lista de precios actualizada. La IA lo procesara y
              aplicara los cambios.
            </p>
          </div>
        </div>

        {showApiInput && (
          <div className="space-y-2 mb-3">
            <label className="text-xs font-medium text-muted-foreground">
              OpenAI API Key
            </label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="flex-1 h-10 text-xs bg-secondary border-0"
                onKeyDown={(e) => e.key === 'Enter' && handleApiKeySubmit()}
              />
              <Button
                size="sm"
                onClick={handleApiKeySubmit}
                disabled={!apiKeyInput.trim()}
              >
                Guardar
              </Button>
            </div>
          </div>
        )}

        {!showApiInput && (
          <div
            className="border-2 border-dashed border-border/40 rounded-lg p-6 text-center cursor-pointer hover:border-accent/40 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                <FileText className="h-4 w-4 text-accent" />
                {file.name}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Hace clic para seleccionar un PDF
              </div>
            )}
          </div>
        )}

        {step === 'extracting' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            Extrayendo texto del PDF...
          </div>
        )}

        {step === 'parsing' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analizando con IA...
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive mt-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {matches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              Productos encontrados ({matches.length})
            </h4>
            <span className="text-xs text-muted-foreground">
              {matches.filter((m) => m.changed).length} con cambios
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 border border-border/40 rounded-lg p-1">
            {matches.map((m) => (
              <div
                key={m.productId}
                className={`flex items-center justify-between text-xs rounded px-3 py-2 ${
                  m.changed ? 'bg-accent/10' : 'bg-secondary/20'
                }`}
              >
                <div className="flex-1 min-w-0 mr-2">
                  <p className="truncate font-medium text-foreground">
                    {m.originalDescription}
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <span
                    className={
                      m.newPesos !== m.originalPesos
                        ? 'text-ars font-bold'
                        : 'text-muted-foreground'
                    }
                  >
                    ${m.newPesos?.toLocaleString('es-AR') ?? '-'}
                  </span>
                  <span
                    className={
                      m.newReales !== m.originalReales
                        ? 'text-brl font-bold'
                        : 'text-muted-foreground'
                    }
                  >
                    R${m.newReales?.toFixed(2) ?? '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {!applied ? (
            <Button
              onClick={handleApply}
              className="w-full gap-2"
              disabled={!hasChanges}
            >
              <Check className="h-4 w-4" />
              Aplicar {matches.filter((m) => m.changed).length} cambios
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-500 justify-center">
              <Check className="h-4 w-4" />
              Precios actualizados correctamente
            </div>
          )}
        </div>
      )}

      {step === 'done' && matches.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          No se encontraron productos coincidentes en la lista actual.
        </p>
      )}
    </div>
  )
}

function findBestMatch(description: string, products: Product[]): Product | null {
  const query = description.toLowerCase().trim()

  const exact = products.find((p) => p.description.toLowerCase() === query)
  if (exact) return exact

  const contains = products.find(
    (p) =>
      p.description.toLowerCase().includes(query) ||
      query.includes(p.description.toLowerCase()),
  )
  if (contains) return contains

  const queryWords = query.split(/\s+/).filter((w) => w.length > 2)
  let best: Product | null = null
  let bestScore = 0

  for (const p of products) {
    const prodWords = p.description.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
    let overlap = 0
    for (const w of queryWords) {
      if (prodWords.includes(w)) overlap++
    }
    const score = overlap / Math.max(queryWords.length, prodWords.length)
    if (score > bestScore) {
      bestScore = score
      best = p
    }
  }

  return bestScore > 0.3 ? best : null
}
