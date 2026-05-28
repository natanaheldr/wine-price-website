'use client'

import { useState, useEffect } from 'react'
import { Wine, Sparkles, Coffee, Settings, AlertCircle, Eye, EyeOff, ExternalLink } from 'lucide-react'
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

  const handleCambioChange = (raw: string) => {
    setCambioStr(raw)
    const parsed = parseFloat(raw)
    if (!isNaN(parsed) && parsed > 0) {
      setCambio(parsed)
      localStorage.setItem(CAMBIO_STORAGE_KEY, parsed.toString())
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
    setIsAuthenticated(false)
    setPinError(false)
    setShowPin(false)
    setAttemptCount(0)
  }

  const handleCloseSettings = () => {
    setShowSettings(false)
    setPinInput('')
    setIsAuthenticated(false)
    setPinError(false)
    setShowPin(false)
    setAttemptCount(0)
  }

  const handlePinSubmit = () => {
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true)
      setPinError(false)
      setAttemptCount(0)
    } else {
      setPinError(true)
      setAttemptCount(prev => prev + 1)
      setPinInput('')
      setShowPin(false)
    }
  }

  return (
    <PriceOverridesProvider>
      <CartProvider>
      <div className="min-h-screen bg-background">
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
                {/* Mobile cart trigger */}
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
                  onClick={() => setActiveCategory(cat.id)}
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
            {/* Products */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Todos os preços em ARS, BRL e PIX. Adicione produtos ao carrinho e envie seu pedido pelo WhatsApp.
              </p>
              <ProductTable products={getProducts()} cambio={cambio} />
            </div>

            {/* Desktop cart sidebar */}
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
        <Dialog open={showSettings} onOpenChange={handleCloseSettings}>
          <DialogContent className="sm:max-w-lg border-border bg-card max-h-[85vh] overflow-y-auto">
            {!isAuthenticated ? (
              <>
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-xl">Acceso Administrativo</DialogTitle>
                  <DialogDescription>
                    Verifica tu identidad para modificar el tipo de cambio
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {attemptCount > 0 && (
                    <div className="flex items-start gap-3 px-3 py-2 bg-destructive/10 rounded-lg border border-destructive/20">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-destructive">
                        {attemptCount === 1 ? '1 intento fallido' : `${attemptCount} intentos fallidos`}
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
                        placeholder="**********"
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
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPin ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {pinError && (
                      <p className="text-xs text-destructive">PIN incorrecto. Intenta nuevamente.</p>
                    )}
                  </div>

                  <Button 
                    onClick={handlePinSubmit}
                    className="w-full h-11"
                    disabled={!pinInput}
                  >
                    Verificar acceso
                  </Button>
                </div>
              </>
            ) : (
              <>
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-xl">Configuracion</DialogTitle>
                  <DialogDescription>
                    Actualiza el tipo de cambio y los precios desde PDF
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Tipo de cambio ($ ARS → R$)
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={cambioStr}
                    onChange={(e) => handleCambioChange(e.target.value)}
                    className="h-14 text-center text-3xl font-mono bg-secondary border-0 font-bold"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Los precios en BRL y PIX se actualizan en tiempo real
                  </p>
                </div>

                <div className="border-t border-border/30 my-2"></div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Actualizar precios por categoria</h4>
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
