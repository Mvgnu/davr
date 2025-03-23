export interface Material {
  id: string
  name: string
  description: string
  category: MaterialCategory
  recyclable: boolean
  marketValueLevel: 'Low' | 'Medium' | 'High'
  approximateMarketPriceRange: {
    min: number
    max: number
  }
  properties: {
    density?: number  // g/cm³
    meltingPoint?: number // °C
    commonUses?: string[]
    recyclingNotes?: string
  }
  preparationInstructions?: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export type MaterialCategory = 
  | 'Packaging' 
  | 'Household' 
  | 'Construction' 
  | 'Industry' 
  | 'Automotive' 
  | 'Electronics' 
  | 'Composite'

export interface MaterialListItem {
  id: string
  name: string
  category: MaterialCategory
  recyclable: boolean
  marketValueLevel: 'Low' | 'Medium' | 'High'
  approximateMarketPriceRange: {
    min: number
    max: number
  }
} 