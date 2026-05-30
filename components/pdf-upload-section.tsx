'use client'

import { useState, useRef } from 'react'
import {
  Upload,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  ShieldAlert,
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
import { getApiQuota, recordApiCall } from '@/lib/api-guard'
import type { Product } from '@/lib/products-data'

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
  products: Product[]
  categoryName: string
}

export function PdfUploadSection({ products, categoryName }: PdfUploadSectionProps) {
  const [apiKey, setApiKey] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState<ParsingStep | null>(null)
  const [error, setError] = useState('')
  const [matches, setMatches] = useState<MatchResult[]>([])
  const { setOverrides, overrides: existingOverrides } = usePriceOverrides()
  const [applied, setApplied] = useState(false)
  const [quota, setQuota] = useState(getApiQuota())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetAll = () => {
    setFile(null)
    setStep(null)
    setError('')
    setMatches([])
    setApplied(false)
    setApiKey('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    if (f.type && f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setError('Solo se aceptan archivos PDF.')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const q = getApiQuota()
    setQuota(q)
    if (!q.canProceed) {
      setError(`Limite de uso alcanzado. Vuelve en ${q.remainingHour === 0 ? '1 hora' : '24 horas'}.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setFile(f)
    setError('')
    setApplied(false)
    setMatches([])
    setStep(null)
  }

  const handleStartProcessing = async () => {
    if (!file || !apiKey.trim()) return

    const q = getApiQuota()
    if (!q.canProceed) {
      setError(`Limite de uso alcanzado. Vuelve en ${q.remainingHour === 0 ? '1 hora' : '24 horas'}.`)
      return
    }

    const key = apiKey.trim()

    try {
      setError('')
      const text = await extractTextFromPDF(file, setStep)

      if (!text.trim()) {
        throw new Error('El PDF no contiene texto extraible. Asegurate de que no sea una imagen escaneada.')
      }

      recordApiCall()
      setQuota(getApiQuota())
      const parsed = await parsePricesWithAI(text, key, setStep)
      setStep('done')

      const results: MatchResult[] = []
      for (const p of parsed) {
        const match = findBestMatch(p.description, products)
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
    const merged = { ...existingOverrides }
    for (const m of matches) {
      merged[m.productId] = {
        precioPesos: m.newPesos ?? m.originalPesos,
        precioReales: m.newReales ?? m.originalReales,
        precioPix: m.newPix ?? m.originalPix,
      }
    }
    setOverrides(merged)
    setApplied(true)
  }

  const hasChanges = matches.some((m) => m.changed)
  const needsKey = file && !apiKey && step === null
  const readyToProcess = file && apiKey.trim() && step === null

  return (
    <div className="space-y-4">
      <div className="border border-border/40 rounded-lg p-4 bg-secondary/20">
        <div className="flex items-start gap-3 mb-3">
          <Upload className="h-5 w-5 text-accent mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              {categoryName}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Subi un PDF con los precios de {categoryName.toLowerCase()}. La IA lo procesara y
              aplicara los cambios.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3 bg-background/40 rounded-lg px-3 py-2">
          <ShieldAlert className="h-3 w-3 shrink-0" />
          <span>
            Limite: {quota.remainingHour}/{quota.maxHour} por hora &middot; {quota.remainingDay}/{quota.maxDay} por dia
          </span>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            !quota.canProceed
              ? 'border-destructive/40 cursor-not-allowed opacity-50'
              : 'border-border/40 hover:border-accent/40'
          } ${step !== null ? 'pointer-events-none opacity-60' : ''}`}
          onClick={() => {
            if (quota.canProceed && step === null) fileInputRef.current?.click()
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          {file ? (
            <div className="flex items-center justify-center gap-2 text-sm text-foreground">
              <FileText className="h-4 w-4 text-accent" />
              {file.name}
              <button
                className="text-muted-foreground hover:text-foreground ml-1"
                onClick={(e) => { e.stopPropagation(); resetAll() }}
              >
                ×
              </button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              {quota.canProceed ? 'Hace clic para seleccionar un PDF' : 'Limite alcanzado'}
            </div>
          )}
        </div>

        {needsKey && (
          <div className="space-y-2 mt-3">
            <label className="text-xs font-medium text-muted-foreground">
              OpenAI API Key (no se guarda, solo para esta sesion)
            </label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 h-10 text-xs bg-secondary border-0"
                onKeyDown={(e) => e.key === 'Enter' && handleStartProcessing()}
              />
              <Button
                size="sm"
                onClick={handleStartProcessing}
                disabled={!apiKey.trim()}
              >
                Procesar
              </Button>
            </div>
          </div>
        )}

        {readyToProcess && (
          <div className="mt-3">
            <Button onClick={handleStartProcessing} className="w-full gap-2">
              Procesar PDF con IA
            </Button>
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
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-500 justify-center">
                <Check className="h-4 w-4" />
                Precios actualizados correctamente
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={resetAll}>
                Subir otro PDF
              </Button>
            </div>
          )}
        </div>
      )}

      {step === 'done' && matches.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            No se encontraron productos coincidentes en la lista actual.
          </p>
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={resetAll}>
            Intentar con otro PDF
          </Button>
        </div>
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
