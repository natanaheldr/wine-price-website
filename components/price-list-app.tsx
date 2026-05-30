'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Wine, Sparkles, Coffee, Settings, AlertCircle, Eye, EyeOff, ExternalLink, Lock, UnlockKeyhole, History } from 'lucide-react'
import { vinosData, champagneData, fernetData } from '@/lib/products-data'
import { CartProvider } from '@/lib/cart-context'
import { PriceOverridesProvider } from '@/lib/price-overrides'
import { PdfUploadSection } from '@/components/pdf-upload-section'
import { ThemeToggle } from '@/components/theme-toggle'
import { ProductTable } from '@/components/product-table'
import { CartSheet } from '@/components/cart-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Category = 'vinos' | 'champagne' | 'fernet'

const categories: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'vinos', label: 'Vinos', icon: <Wine className="h-3.5 w-3.5" /> },
  { id: 'champagne', label: 'Champagne', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: 'fernet', label: 'Fernet', icon: <Coffee className="h-3.5 w-3.5" /> },
]

const WHATSAPP_NUMBER = '5493754404433'
const ADMIN_PIN = '147258369'
const CAMBIO_STORAGE_KEY = 'lista-precios-cambio'
const AUDIT_LOG_KEY = 'lista-precios-audit'
const SESSION_TIMEOUT_MS = 10 * 60 * 1000
const MAX_PIN_ATTEMPTS = 5
const PIN_LOCKOUT_MS = 30 * 1000

function logAuditEntry(action: string, detail: string) {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY)
    const log = raw ? JSON.parse(raw) : []
    log.push({ t: Date.now(), action, detail })
    if (log.length > 50) log.splice(0, log.length - 50)
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(log))
  } catch {}
}

export function PriceListApp() {
  const [activeCategory, setActiveCategory] = useState<Category>('vinos')
  const [cambio, setCambio] = useState(280)
  const [cambioStr, setCambioStr] = useState('280')
  const [showSettings, setShowSettings] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(0)
  const [lockCountdown, setLockCountdown] = useState(0)
  const [cambioUnlocked, setCambioUnlocked] = useState(false)
  const [pdfUnlocked, setPdfUnlocked] = useState(false)
  const [reAuthMode, setReAuthMode] = useState<'cambio' | 'pdf' | null>(null)
  const lastActivity = useRef(Date.now())
  const lockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sessionLocked = isAuthenticated && Date.now() - lastActivity.current > SESSION_TIMEOUT_MS

  const resetSessionTimer = useCallback(() => {
    lastActivity.current = Date.now()
  }, [])

  const lockSession = useCallback(() => {
    setIsAuthenticated(false)
    setCambioUnlocked(false)
    setPdfUnlocked(false)
    setReAuthMode(null)
    setPinInput('')
    setPinError(false)
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem(CAMBIO_STORAGE_KEY)
    if (saved) {
      const value = parseFloat(saved)
      if (!isNaN(value)) {
        setCambio(value)
        setCambioStr(saved)
      }
    }
  }, [])

  useEffect(() => {
    if (lockedUntil > Date.now()) {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000)
      setLockCountdown(remaining)
      countdownTimerRef.current = setInterval(() => {
        const r = Math.ceil((lockedUntil - Date.now()) / 1000)
        if (r <= 0) {
          setLockCountdown(0)
          setLockedUntil(0)
          setAttemptCount(0)
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
        } else {
          setLockCountdown(r)
        }
      }, 1000)
      return () => { if (countdownTimerRef.current) clearInterval(countdownTimerRef.current) }
    }
  }, [lockedUntil])

  const handleCambioChange = (raw: string) => {
    resetSessionTimer()
    setCambioStr(raw)
    const parsed = parseFloat(raw)
    if (!isNaN(parsed) && parsed > 0) {
      const oldCambio = cambio
      setCambio(parsed)
      localStorage.setItem(CAMBIO_STORAGE_KEY, parsed.toString())
      logAuditEntry('cambio', `${oldCambio} -> ${parsed}`)
    }
  }

  const getProducts = () => {
    switch (activeCategory) {
      case 'vinos':
        return vinosData
      case 'champagne':
        return champagneData
      case 'fernet':
        return fernetData
    }
  }

  const handleOpenSettings = () => {
    setShowSettings(true)
    setPinInput('')
    setPinError(false)
    setShowPin(false)
    setAttemptCount(0)
    setReAuthMode(null)
    resetSessionTimer()
  }

  const handleCloseSettings = () => {
    setShowSettings(false)
    setPinInput('')
    setPinError(false)
    setShowPin(false)
    setAttemptCount(0)
    setReAuthMode(null)
    lockSession()
  }

  const verifyPin = (pin: string, mode: 'login' | 're-auth'): boolean => {
    if (Date.now() < lockedUntil) return false
    if (pin === ADMIN_PIN) {
      setPinError(false)
      setAttemptCount(0)
      resetSessionTimer()
      if (mode === 'login') {
        setIsAuthenticated(true)
      }
      return true
    }
    const newCount = attemptCount + 1
    setAttemptCount(newCount)
    setPinError(true)
    setPinInput('')
    setShowPin(false)
    if (newCount >= MAX_PIN_ATTEMPTS) {
      const lockUntil = Date.now() + PIN_LOCKOUT_MS
      setLockedUntil(lockUntil)
      logAuditEntry('pin-lockout', `Bloqueado ${PIN_LOCKOUT_MS / 1000}s tras ${newCount} intentos`)
    }
    logAuditEntry('pin-fail', `Intento fallido #${newCount}`)
    return false
  }

  const handlePinSubmit = () => {
    if (!pinInput || Date.now() < lockedUntil) return
    if (reAuthMode) {
      if (verifyPin(pinInput, 're-auth')) {
        if (reAuthMode === 'cambio') setCambioUnlocked(true)
        else if (reAuthMode === 'pdf') setPdfUnlocked(true)
        setReAuthMode(null)
      }
    } else {
      verifyPin(pinInput, 'login')
    }
  }

  const requestReAuth = (mode: 'cambio' | 'pdf') => {
    setReAuthMode(mode)
    setPinInput('')
    setPinError(false)
    setShowPin(false)
  }

  const showAuditLog = () => {
    try {
      const raw = localStorage.getItem(AUDIT_LOG_KEY)
      const log = raw ? JSON.parse(raw) : []
      const msgs = log.map((e: { t: number; action: string; detail: string }) =>
        `${new Date(e.t).toLocaleString('es-AR')} - ${e.action}: ${e.detail}`
      ).join('\n')
      alert(msgs || 'Sin registros')
    } catch {}
  }

  return (
    <PriceOverridesProvider>
      <CartProvider>
      <div className="min-h-screen bg-background" onClick={resetSessionTimer}>
        {/* Header */}
        <header className="sticky top-0 z-50 bg-gradient-to-b from-background via-background/95 to-background/90 backdrop-blur-2xl border-b border-border/30">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-foreground tracking-tight truncate">Lista de Preços</h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-bold text-accent bg-accent/10 border border-accent/20 rounded-md px-2 py-0.5 shrink-0">
                    CAMBIO: {cambio}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 opacity-40 hover:opacity-100 transition-all duration-300"
                  onClick={handleOpenSettings}
                  aria-label="Configuracion"
                  title="Solo para administrador"
                >
                  <Settings className="h-[18px] w-[18px]" />
                </Button>
                <div className="lg:hidden">
                  <CartSheet whatsappNumber={WHATSAPP_NUMBER} cambio={cambio} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Category tabs */}
        <div className="sticky top-[65px] z-40 bg-gradient-to-b from-background/80 via-background/70 to-transparent backdrop-blur-xl border-b border-border/20 py-3">
          <div className="max-w-6xl mx-auto px-4">
            <nav className="flex gap-1 p-0.5 bg-secondary/40 rounded-xl w-fit" aria-label="Categorias">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { resetSessionTimer(); setActiveCategory(cat.id) }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-xs font-medium transition-all duration-300 whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-card text-foreground shadow-sm border border-border/40'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-current={activeCategory === cat.id ? 'page' : undefined}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <main className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Todos os preços em ARS, BRL e PIX. Adicione produtos ao carrinho e envie seu pedido pelo WhatsApp.
              </p>
              <ProductTable products={getProducts()} cambio={cambio} />
            </div>

            <aside className="hidden lg:block w-[300px] shrink-0">
              <div className="sticky top-[133px] max-h-[calc(100vh-155px)] flex flex-col bg-card border border-border/40 rounded-xl p-4">
                <CartSheet whatsappNumber={WHATSAPP_NUMBER} cambio={cambio} inline />
              </div>
            </aside>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/20 bg-gradient-to-t from-background via-background/95 to-background/90">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <a href="#vinos" onClick={() => setActiveCategory('vinos')} className="hover:text-foreground transition-colors">Vinos</a>
                <span className="text-border">·</span>
                <a href="#champagne" onClick={() => setActiveCategory('champagne')} className="hover:text-foreground transition-colors">Champagne</a>
                <span className="text-border">·</span>
                <a href="#fernet" onClick={() => setActiveCategory('fernet')} className="hover:text-foreground transition-colors">Fernet</a>
              </div>
              <div className="flex items-center gap-3">
                <span>Himmelimherzen</span>
                <span className="text-border">·</span>
                <span>Preços atualizados diariamente</span>
                <span className="text-border">·</span>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  WhatsApp <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={(open) => { if (!open) handleCloseSettings() }}>
          <DialogContent className="sm:max-w-lg border-border bg-card max-h-[85vh] overflow-y-auto">
            {!isAuthenticated || sessionLocked ? (
              <>
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-xl">Acceso Administrativo</DialogTitle>
                  <DialogDescription>
                    {sessionLocked ? 'Sesion expirada. Ingresa el PIN nuevamente.' : 'Verifica tu identidad para modificar el tipo de cambio'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {attemptCount > 0 && Date.now() >= lockedUntil && (
                    <div className="flex items-start gap-3 px-3 py-2 bg-destructive/10 rounded-lg border border-destructive/20">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-destructive">
                        {attemptCount >= MAX_PIN_ATTEMPTS
                          ? `Demasiados intentos. Espera ${lockCountdown}s.`
                          : `${attemptCount} de ${MAX_PIN_ATTEMPTS} intentos fallidos`}
                      </p>
                    </div>
                  )}

                  {lockedUntil > Date.now() && (
                    <div className="flex items-start gap-3 px-3 py-2 bg-destructive/10 rounded-lg border border-destructive/20">
                      <Lock className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-destructive font-bold">
                        Bloqueado. Espera {lockCountdown}s para reintentar.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      PIN de seguridad
                    </label>
                    <div className="relative">
                      <Input
                        type={showPin ? 'text' : 'password'}
                        placeholder={reAuthMode ? 'Re-ingresa tu PIN' : '**********'}
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value)
                          setPinError(false)
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && pinInput && handlePinSubmit()}
                        className={`h-12 text-center text-lg tracking-[0.3em] font-mono bg-secondary border-0 pr-10 ${
                          pinError ? 'ring-2 ring-destructive' : ''
                        }`}
                        autoFocus
                        disabled={lockedUntil > Date.now()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {pinError && (
                      <p className="text-xs text-destructive">PIN incorrecto. Intenta nuevamente.</p>
                    )}
                  </div>

                  <Button 
                    onClick={handlePinSubmit}
                    className="w-full h-11"
                    disabled={!pinInput || lockedUntil > Date.now()}
                  >
                    {reAuthMode ? 'Confirmar accion' : 'Verificar acceso'}
                  </Button>

                  {reAuthMode && (
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setReAuthMode(null)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <DialogHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-xl">Configuracion</DialogTitle>
                      <DialogDescription>
                        Actualiza el tipo de cambio y los precios desde PDF
                      </DialogDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" className="h-8 w-8" onClick={showAuditLog} title="Historial de cambios">
                        <History className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-destructive" onClick={lockSession} title="Cerrar sesion">
                        <Lock className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Tipo de cambio ($ ARS → R$)
                    </label>
                    {!cambioUnlocked ? (
                      <Button variant="outline" size="icon-sm" className="h-7 text-[10px] gap-1 px-2" onClick={() => requestReAuth('cambio')}>
                        <Lock className="h-3 w-3" /> Desbloquear
                      </Button>
                    ) : (
                      <span className="text-[10px] text-green-500 font-medium flex items-center gap-1">
                        <UnlockKeyhole className="h-3 w-3" /> Desbloqueado
                      </span>
                    )}
                  </div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={cambioStr}
                    onChange={(e) => cambioUnlocked ? handleCambioChange(e.target.value) : null}
                    className={`h-14 text-center text-3xl font-mono bg-secondary border-0 font-bold transition-all ${
                      !cambioUnlocked ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                    readOnly={!cambioUnlocked}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Los precios en BRL y PIX se actualizan en tiempo real
                  </p>
                </div>

                <div className="border-t border-border/30 my-2"></div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Actualizar precios por categoria</h4>
                    {!pdfUnlocked ? (
                      <Button variant="outline" size="icon-sm" className="h-7 text-[10px] gap-1 px-2" onClick={() => requestReAuth('pdf')}>
                        <Lock className="h-3 w-3" /> Desbloquear
                      </Button>
                    ) : (
                      <span className="text-[10px] text-green-500 font-medium flex items-center gap-1">
                        <UnlockKeyhole className="h-3 w-3" /> Desbloqueado
                      </span>
                    )}
                  </div>
                  <PdfUploadSection products={vinosData} categoryName="Vinos" />
                  <PdfUploadSection products={champagneData} categoryName="Champagne" />
                  <PdfUploadSection products={fernetData} categoryName="Fernet" />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CartProvider>
    </PriceOverridesProvider>
  )
}
