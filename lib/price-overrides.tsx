'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

export interface PriceOverride {
  precioPesos: number
  precioReales: number
  precioPix: number
}

const OVERRIDES_KEY = 'lista-precios-overrides'

interface PriceOverridesContextType {
  overrides: Record<string, PriceOverride>
  setOverrides: (overrides: Record<string, PriceOverride>) => void
  clearOverrides: () => void
  getPrice: (
    product: { id: string; precioPesos: number; precioReales: number; precioPix: number },
    cambio: number,
  ) => {
    precioPesos: number
    precioReales: number
    precioPix: number
  }
  hasOverrides: boolean
}

const PriceOverridesContext = createContext<PriceOverridesContextType | undefined>(undefined)

export function PriceOverridesProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverridesState] = useState<Record<string, PriceOverride>>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem(OVERRIDES_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setOverridesState(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  const setOverrides = useCallback((newOverrides: Record<string, PriceOverride>) => {
    setOverridesState({ ...newOverrides })
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(newOverrides))
  }, [])

  const clearOverrides = useCallback(() => {
    setOverridesState({})
    localStorage.removeItem(OVERRIDES_KEY)
  }, [])

  const getPrice = useCallback(
    (
      product: { id: string; precioPesos: number; precioReales: number; precioPix: number },
      cambio: number,
    ) => {
      const override = overrides[product.id]
      if (override) {
        return override
      }
      const computedReales = cambio > 0 ? product.precioPesos / cambio : product.precioReales
      return {
        precioPesos: product.precioPesos,
        precioReales: computedReales,
        precioPix: computedReales,
      }
    },
    [overrides],
  )

  return (
    <PriceOverridesContext.Provider
      value={{
        overrides,
        setOverrides,
        clearOverrides,
        getPrice,
        hasOverrides: Object.keys(overrides).length > 0,
      }}
    >
      {children}
    </PriceOverridesContext.Provider>
  )
}

export function usePriceOverrides() {
  const context = useContext(PriceOverridesContext)
  if (!context) {
    throw new Error('usePriceOverrides must be used within a PriceOverridesProvider')
  }
  return context
}
