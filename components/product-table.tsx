'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Product } from '@/lib/products-data'
import { useCart } from '@/lib/cart-context'
import { usePriceOverrides } from '@/lib/price-overrides'
import { Plus, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface ProductTableProps {
  products: Product[]
}

export function ProductTable({ products }: ProductTableProps) {
  const [search, setSearch] = useState('')
  const { addItem } = useCart()
  const { getPrice } = usePriceOverrides()

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products
    const searchLower = search.toLowerCase()
    return products.filter(p => 
      p.description.toLowerCase().includes(searchLower)
    )
  }, [products, search])

  const formatPesos = (value: number) => {
    return value.toLocaleString('es-AR')
  }

  const formatReales = (value: number) => {
    return value.toFixed(2)
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
        <Input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 pl-11 pr-10 bg-secondary/50 border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground focus-visible:border-accent/50 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Mobile view */}
      <div className="lg:hidden space-y-3">
        {filteredProducts.map((product) => (
          <div 
            key={product.id} 
            className="bg-card rounded-lg p-4 border border-border/40 active:scale-95 transition-all group hover:border-border/60"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-foreground leading-snug flex-1 group-active:opacity-70">
                {product.description}
              </p>
              <button
                className="shrink-0 h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-accent-foreground hover:shadow-lg hover:shadow-accent/30 transition-all hover:scale-110 active:scale-95"
                onClick={() => addItem(product)}
                aria-label={`Agregar ${product.description}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-ars/10 rounded-md p-2 text-center border border-ars/30">
                <div className="text-ars text-[10px] uppercase">ARS</div>
                <div className="text-ars font-bold">{formatPesos(getPrice(product).precioPesos)}</div>
              </div>
              <div className="bg-brl/10 rounded-md p-2 text-center border border-brl/30">
                <div className="text-brl text-[10px] uppercase">BRL</div>
                <div className="text-brl font-bold">{formatReales(getPrice(product).precioReales)}</div>
              </div>
              <div className="bg-pix/10 rounded-md p-2 text-center border border-pix/30">
                <div className="text-pix text-[10px] uppercase font-bold">PIX</div>
                <div className="text-pix font-bold">{formatReales(getPrice(product).precioPix)}</div>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Sin resultados
          </div>
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden lg:block bg-card rounded-lg border border-border/40 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/40 border-b border-border/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-ars uppercase tracking-wider">
                  ARS
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-brl uppercase tracking-wider">
                  BRL
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-pix uppercase tracking-wider">
                  PIX
                </th>
                <th className="px-6 py-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredProducts.map((product, idx) => (
                <tr 
                  key={product.id} 
                  className="hover:bg-secondary/30 transition-colors duration-200 group"
                >
                  <td className="px-6 py-4 text-sm text-foreground font-medium">
                    {product.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-ars text-right font-mono font-semibold tabular-nums">
                    {formatPesos(getPrice(product).precioPesos)}
                  </td>
                  <td className="px-6 py-4 text-sm text-brl text-right font-mono font-semibold tabular-nums">
                    {formatReales(getPrice(product).precioReales)}
                  </td>
                  <td className="px-6 py-4 text-sm text-pix text-right font-mono font-bold tabular-nums">
                    {formatReales(getPrice(product).precioPix)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-accent-foreground opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:shadow-lg hover:shadow-accent/30"
                      onClick={() => addItem(product)}
                      aria-label={`Agregar ${product.description}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground text-sm">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product count */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-3">
        <span>{filteredProducts.length}</span>
        <span className="text-border">•</span>
        <span>productos disponibles</span>
      </div>
    </div>
  )
}
