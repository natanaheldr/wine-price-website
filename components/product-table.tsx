'use client'

import { useState, useMemo } from 'react'
import type { Product } from '@/lib/products-data'
import { useCart } from '@/lib/cart-context'
import { usePriceOverrides } from '@/lib/price-overrides'
import { Plus, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface ProductTableProps {
  products: Product[]
  cambio: number
}

export function ProductTable({ products, cambio }: ProductTableProps) {
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
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 pl-10 pr-9 bg-secondary/30 border border-border/30 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-accent/50 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Limpiar busqueda"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Result count */}
      {search && (
        <p className="text-xs text-muted-foreground">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'resultado' : 'resultados'}
        </p>
      )}
      
      {/* Mobile cards */}
      <div className="lg:hidden space-y-2">
        {filteredProducts.map((product) => {
          const p = getPrice(product, cambio)
          return (
            <div
              key={product.id}
              className="group relative rounded-xl bg-card border border-border/40 p-3.5 transition-all hover:border-border/60 active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-foreground leading-snug flex-1">
                  {product.description}
                </p>
                <button
                  className="shrink-0 h-9 w-9 rounded-lg bg-accent/90 flex items-center justify-center text-accent-foreground hover:bg-accent hover:shadow-lg hover:shadow-accent/25 transition-all active:scale-90"
                  onClick={() => addItem(product)}
                  aria-label={`Agregar ${product.description}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-ars bg-ars/10 px-2 py-1 rounded-md">
                  ${formatPesos(p.precioPesos)}
                </span>
                <span className="text-[11px] font-mono font-semibold text-brl">
                  R$ {formatReales(p.precioReales)}
                </span>
                <span className="text-[11px] font-mono font-bold text-pix ml-auto">
                  PIX R$ {formatReales(p.precioPix)}
                </span>
              </div>
            </div>
          )
        })}
        {filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">Sin resultados</p>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <div className="rounded-xl border border-border/40 overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-ars uppercase tracking-wider w-28">
                  ARS
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-brl uppercase tracking-wider w-24">
                  BRL
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-pix uppercase tracking-wider w-24">
                  PIX
                </th>
                <th className="px-5 py-3.5 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredProducts.map((product) => {
                const p = getPrice(product, cambio)
                return (
                  <tr
                    key={product.id}
                    className="group hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-foreground font-medium leading-snug">
                        {product.description}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-mono font-bold text-ars tabular-nums">
                        ${formatPesos(p.precioPesos)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-mono font-semibold text-brl tabular-nums">
                        R$ {formatReales(p.precioReales)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-mono font-bold text-pix tabular-nums">
                        R$ {formatReales(p.precioPix)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        className="h-8 w-8 rounded-lg bg-accent/90 flex items-center justify-center text-accent-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:shadow-lg hover:shadow-accent/25 transition-all active:scale-90"
                        onClick={() => addItem(product)}
                        aria-label={`Agregar ${product.description}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
