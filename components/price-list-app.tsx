'use client'

import { useState, useEffect } from 'react'
import { Wine, Sparkles, Coffee, Settings, Check, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { vinosData, champagneData, fernetData } from '@/lib/products-data'
import { CartProvider } from '@/lib/cart-context'
import { PriceOverridesProvider } from '@/lib/price-overrides'
import { PdfUploadSection } from '@/components/pdf-upload-section'
import { ProductTable } from '@/components/product-table'
import { CartSheet } from '@/components/cart-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Category = 'vinos' | 'champagne' | 'fernet'

const allProducts = [...vinosData, ...champagneData, ...fernetData]

const categories: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'vinos', label: 'Vinos', icon: <Wine className="h-4 w-4" /> },
  { id: 'champagne', label: 'Champagne', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'fernet', label: 'Fernet', icon: <Coffee className="h-4 w-4" /> },
]

// Número de WhatsApp para pedidos (reemplaza con el tuyo)
const WHATSAPP_NUMBER = '5491100000000'

// PIN de acceso para configuración (cámbialo por uno seguro)
const ADMIN_PIN = '147258369'

// Clave para localStorage
const CAMBIO_STORAGE_KEY = 'lista-precios-cambio'

export function PriceListApp() {
  const [activeCategory, setActiveCategory] = useState<Category>('vinos')
  const [cambio, setCambio] = useState(280)
  const [showSettings, setShowSettings] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [tempCambio, setTempCambio] = useState(280)
  const [pinError, setPinError] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)

  // Cargar el cambio guardado al montar
  useEffect(() => {
    const saved = localStorage.getItem(CAMBIO_STORAGE_KEY)
    if (saved) {
      const value = parseFloat(saved)
      if (!isNaN(value)) {
        setCambio(value)
        setTempCambio(value)
      }
    }
  }, [])

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
    setTempCambio(cambio)
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

  const handleSaveCambio = () => {
    setCambio(tempCambio)
    localStorage.setItem(CAMBIO_STORAGE_KEY, tempCambio.toString())
    handleCloseSettings()
  }

  return (
    <PriceOverridesProvider>
      <CartProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-gradient-to-b from-background via-background/95 to-background/90 backdrop-blur-2xl border-b border-border/30">
          <div className="max-w-6xl mx-auto px-4 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <h1 className="text-xl font-semibold text-foreground tracking-tight">Lista de Precios de Vinos, Champagne y Fernet</h1>
                  <div className="h-1 w-1 rounded-full bg-accent/60"></div>
                  <span className="text-sm font-mono text-accent font-bold">{cambio}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-secondary/50 opacity-40 hover:opacity-100 transition-all duration-300"
                  onClick={handleOpenSettings}
                  aria-label="Configuración"
                  title="Solo para administrador"
                >
                  <Settings className="h-5 w-5" />
                </Button>
                <CartSheet whatsappNumber={WHATSAPP_NUMBER} cambio={cambio} />
              </div>
            </div>
          </div>
        </header>

        {/* Category tabs */}
        <div className="sticky top-[77px] z-40 bg-gradient-to-b from-background/80 via-background/70 to-transparent backdrop-blur-xl border-b border-border/20 py-2">
          <div className="max-w-6xl mx-auto px-4">
            <nav className="flex gap-1.5 overflow-x-auto scrollbar-hide" aria-label="Categorías">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap group ${
                    activeCategory === cat.id
                      ? 'bg-accent text-background shadow-lg shadow-accent/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                  aria-current={activeCategory === cat.id ? 'page' : undefined}
                >
                  <span className={`transition-transform duration-300 ${activeCategory === cat.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {cat.icon}
                  </span>
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Consultá nuestra lista de precios actualizada de vinos, champagne y fernet. 
            Todos los precios están expresados en Pesos Argentinos (ARS), Reales (BRL) y PIX. 
            Hacé tu pedido por WhatsApp agregando productos al carrito.
          </p>
          <ProductTable products={getProducts()} />
        </main>

        {/* Footer */}
        <footer className="border-t border-border/20 bg-gradient-to-t from-background via-background/95 to-background/90">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <a href="#vinos" onClick={() => setActiveCategory('vinos')} className="hover:text-foreground transition-colors">Vinos</a>
                <span className="text-border">·</span>
                <a href="#champagne" onClick={() => setActiveCategory('champagne')} className="hover:text-foreground transition-colors">Champagne</a>
                <span className="text-border">·</span>
                <a href="#fernet" onClick={() => setActiveCategory('fernet')} className="hover:text-foreground transition-colors">Fernet</a>
              </div>
              <div className="flex items-center gap-4">
                <span>Himmelimherzen</span>
                <span className="text-border">·</span>
                <span>Precios actualizados diariamente</span>
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
                        placeholder="••••••••••"
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
                  <DialogTitle className="text-xl">Tipo de Cambio</DialogTitle>
                  <DialogDescription>
                    Actualiza el valor del cambio peso a real
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Valor actual ($ ARS → R$)
                    </label>
                    <Input
                      type="number"
                      value={tempCambio}
                      onChange={(e) => setTempCambio(Number(e.target.value))}
                      className="h-14 text-center text-3xl font-mono bg-secondary border-0 font-bold"
                      step="0.01"
                      min="0"
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Este cambio se aplicará a todos los precios
                    </p>
                  </div>

                  <Button 
                    onClick={handleSaveCambio}
                    className="w-full h-11 gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Guardar cambios
                  </Button>
                </div>

                <div className="border-t border-border/30 my-2"></div>

                <PdfUploadSection allProducts={allProducts} />
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CartProvider>
    </PriceOverridesProvider>
  )
}
