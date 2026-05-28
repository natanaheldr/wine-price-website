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
  inline?: boolean
}

export function CartSheet({ whatsappNumber, cambio, inline }: CartSheetProps) {
  const [open, setOpen] = useState(false)
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
  } = useCart()

  const { getPrice } = usePriceOverrides()

  const totalPesos = useMemo(
    () => items.reduce((t, i) => t + getPrice(i.product, cambio).precioPesos * i.quantity, 0),
    [items, getPrice, cambio],
  )

  const totalReales = useMemo(
    () => items.reduce((t, i) => t + getPrice(i.product, cambio).precioReales * i.quantity, 0),
    [items, getPrice, cambio],
  )

  const totalPix = useMemo(
    () => items.reduce((t, i) => t + getPrice(i.product, cambio).precioPix * i.quantity, 0),
    [items, getPrice, cambio],
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
      message += `   x${item.quantity} = $${formatPesos(getPrice(item.product, cambio).precioPesos * item.quantity)}\n\n`
    })

    message += '---\n'
    message += `*TOTAL ARS:* $${formatPesos(totalPesos)}\n`
    message += `*TOTAL BRL:* R$${formatReales(totalReales)}\n`
    message += `*TOTAL PIX:* R$${formatReales(totalPix)}`

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  const cartContent = (
    <>
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center text-muted-foreground space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto border border-border/30">
              <ShoppingCart className="h-8 w-8 opacity-40" />
            </div>
            <div>
              <p className="text-sm font-medium">Carrinho vazio</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Adicione produtos para começar</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="group flex items-center gap-3 rounded-xl p-3 bg-secondary/40 border border-border/30 hover:border-border/50 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground leading-snug truncate">
                    {item.product.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-0.5 bg-background/60 rounded-lg p-0.5">
                      <button
                        className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        aria-label="Reduzir quantidade"
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
                        className="w-8 h-6 text-center text-xs font-bold font-mono bg-transparent border-0 text-foreground p-0"
                      />
                      <button
                        className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-xs font-mono font-semibold text-ars ml-auto">
                      ${formatPesos(getPrice(item.product, cambio).precioPesos * item.quantity)}
                    </span>
                  </div>
                </div>
                <button
                  className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-all opacity-0 group-hover:opacity-100"
                  onClick={() => removeItem(item.product.id)}
                  aria-label={`Remover ${item.product.description}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-border/30 pt-4 mt-4 space-y-4">
            <div className="space-y-2 bg-secondary/30 rounded-xl p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-xs uppercase tracking-wider text-ars font-semibold">ARS</span>
                <span className="text-sm font-mono font-bold text-ars">${formatPesos(totalPesos)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-xs uppercase tracking-wider text-brl font-semibold">BRL</span>
                <span className="text-sm font-mono font-bold text-brl">R${formatReales(totalReales)}</span>
              </div>
              <div className="h-px bg-border/30 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-pix font-bold">PIX</span>
                <span className="text-base font-mono font-bold text-pix">R${formatReales(totalPix)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 h-10 rounded-xl text-xs font-medium"
                onClick={clearCart}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Esvaziar
              </Button>
              <Button
                size="sm"
                className="flex-[2] h-10 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold text-xs shadow-lg shadow-[#25D366]/20"
                onClick={sendToWhatsApp}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Enviar pedido
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )

  if (inline) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 pb-4 border-b border-border/30 mb-4">
          <ShoppingCart className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Carrinho</span>
          {getTotalItems() > 0 && (
            <span className="ml-auto text-xs font-mono text-muted-foreground bg-secondary/60 rounded-full px-2 py-0.5">
              {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}
            </span>
          )}
        </div>
        {cartContent}
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button 
          className="relative h-10 w-10 rounded-xl bg-secondary/50 border border-border/30 flex items-center justify-center text-foreground hover:bg-secondary hover:border-border/60 transition-all duration-300 group"
          aria-label="Ver carrinho"
        >
          <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />
          {getTotalItems() > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center shadow-lg shadow-accent/40">
              {getTotalItems()}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-background border-border/50 p-6">
        <SheetHeader className="border-b border-border/30 pb-4 mb-4">
          <SheetTitle className="flex items-center gap-3 text-base text-foreground font-semibold">
            <ShoppingCart className="h-4 w-4 text-accent" />
            Carrinho
            {getTotalItems() > 0 && (
              <span className="ml-auto text-xs font-mono text-muted-foreground bg-secondary/60 rounded-full px-2 py-0.5">
                {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>
        {cartContent}
      </SheetContent>
    </Sheet>
  )
}
