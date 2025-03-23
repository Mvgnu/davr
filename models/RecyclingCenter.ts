export interface MaterialPrice {
  materialId: string
  materialName: string
  pricePerKg: number
  minQuantity?: number
  notes?: string
  updatedAt: string
}

export interface OpeningHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  open: string  // Format: "HH:MM"
  close: string // Format: "HH:MM"
  isClosed: boolean
}

export interface RecyclingCenterLocation {
  address: string
  city: string
  zipCode: string
  state: string
  country: string
  coordinates: {
    latitude: number
    longitude: number
  }
}

export interface RecyclingCenter {
  id: string
  userId: string
  name: string
  description: string
  location: RecyclingCenterLocation
  contactInfo: {
    phone: string
    email: string
    website?: string
  }
  openingHours: OpeningHours[]
  acceptedMaterials: string[] // IDs of materials that are accepted
  buyMaterials: MaterialPrice[] // Materials the center buys with prices
  services: string[]
  certifications?: string[]
  rating?: {
    average: number
    count: number
  }
  images?: string[]
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface RecyclingCenterListItem {
  id: string
  name: string
  location: {
    city: string
    zipCode: string
    state: string
  }
  rating?: {
    average: number
    count: number
  }
  acceptedMaterialsCount: number
  buyMaterialsCount: number
  isVerified: boolean
} 