'use client'

import { useState, useMemo } from 'react'
import { useCart } from '@/lib/cart-context'
import { usePriceOverrides } from '@/lib/price-overrides'
import { ShoppingCart, X, Minus, Plus, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface CartSheetProps {
  whatsappNumber: string
  cambio: number
}

export function CartSheet({ whatsappNumber, cambio }: CartSheetProps) {
  const [open, setOpen] = useState(false)
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPesos,
    getTotalReales,
    getTotalPix,
    getTotalItems,
  } = useCart()

  const { getPrice } = usePriceOverrides()

  const totalPesos = useMemo(
    () => items.reduce((t, i) => t + getPrice(i.product).precioPesos * i.quantity, 0),
    [items, getPrice],
  )

  const totalReales = useMemo(
    () => items.reduce((t, i) => t + getPrice(i.product).precioReales * i.quantity, 0),
    [items, getPrice],
  )

  const totalPix = useMemo(
    () => items.reduce((t, i) => t + getPrice(i.product).precioPix * i.quantity, 0),
    [items, getPrice],
  )

  const formatPesos = (value: number) => {
    return value.toLocaleString('es-AR')
  }

  const formatReales = (value: number) => {
    return value.toFixed(2)
  }

  const sendToWhatsApp = () => {
    if (items.length === 0) return

    let message = '*PEDIDO*\n'
    message += `TC: ${cambio}\n\n`
    
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.product.description}\n`
      message += `   x${item.quantity} = $${formatPesos(getPrice(item.product).precioPesos * item.quantity)}\n\n`
    })

    message += '---\n'
    message += `*TOTAL ARS:* $${formatPesos(totalPesos)}\n`
    message += `*TOTAL BRL:* R$${formatReales(totalReales)}\n`
    message += `*TOTAL PIX:* R$${formatReales(totalPix)}`

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button 
          className="relative h-10 w-10 rounded-lg bg-secondary/50 border border-border/30 flex items-center justify-center text-foreground hover:bg-secondary hover:border-border/60 transition-all duration-300 group"
          aria-label="Ver carrito"
        >
          <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />
          {getTotalItems() > 0 && (
            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center shadow-lg shadow-accent/40 animate-pulse">
              {getTotalItems()}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-background border-border/50">
        <SheetHeader className="border-b border-border/30 pb-4 pt-6">
          <SheetTitle className="flex items-center gap-3 text-lg text-foreground font-semibold">
            <ShoppingCart className="h-5 w-5 text-accent" />
            Pedido
            {getTotalItems() > 0 && (
              <span className="ml-auto text-sm font-mono text-muted-foreground">{getTotalItems()} items</span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center text-muted-foreground space-y-4">
              <div className="h-16 w-16 rounded-lg bg-secondary/50 flex items-center justify-center mx-auto border border-border/30">
                <ShoppingCart className="h-8 w-8 opacity-40" />
              </div>
              <div>
                <p className="text-sm font-medium">Carrito vacío</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Agrega productos para comenzar</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-secondary/40 rounded-lg p-4 border border-border/30 hover:border-border/50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-sm font-medium text-foreground leading-snug flex-1 group-hover:text-accent transition-colors">
                      {item.product.description}
                    </p>
                    <button
                      className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center shrink-0 transition-all hover:scale-110"
                      onClick={() => removeItem(item.product.id)}
                      aria-label={`Eliminar ${item.product.description}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 bg-background/60 rounded-md p-1">
                      <button
                        className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center text-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        aria-label="Reducir cantidad"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value)
                          if (!isNaN(val) && val > 0) {
                            updateQuantity(item.product.id, val)
                          }
                        }}
                        className="w-12 h-7 text-center text-sm font-bold font-mono bg-transparent border-0 text-foreground"
                      />
                      <button
                        className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center text-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-sm font-mono font-bold text-ars min-w-fit">
                      ${formatPesos(getPrice(item.product).precioPesos * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/30 pt-5 mt-4 space-y-4">
              <div className="space-y-2.5 bg-secondary/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider text-ars font-semibold">ARS</span>
                  <span className="text-sm font-mono font-bold text-ars">${formatPesos(totalPesos)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider text-brl font-semibold">BRL</span>
                  <span className="text-sm font-mono font-bold text-brl">R${formatReales(totalReales)}</span>
                </div>
                <div className="h-px bg-border/30 my-2"></div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs uppercase tracking-wider text-pix font-bold">PIX</span>
                  <span className="text-lg font-mono font-bold text-pix">R${formatReales(totalPix)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 h-11 rounded-lg text-sm font-medium"
                  onClick={clearCart}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Vaciar
                </Button>
                <Button
                  className="flex-1 h-11 rounded-lg bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold text-sm shadow-lg shadow-[#25D366]/30"
                  onClick={sendToWhatsApp}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
