/**
 * Seed data for marketplace listings
 * Used for development and testing purposes
 */

import { v4 as uuidv4 } from 'uuid';

export interface SeedMarketplaceListing {
  _id: string;
  title: string;
  description: string;
  price: number;
  location: {
    city: string;
    coordinates?: [number, number];
  };
  images: string[];
  materialType: string;
  quantity: number;
  unit: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  bidCount?: number;
}

// Sample image URLs for listings
const sampleImages = [
  'https://images.unsplash.com/photo-1605600659873-d808a13e4d9a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1558438067-a9833fff78ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1567613974220-c976f9760f46?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516992654410-9309d4587e94?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1620531080067-69001afb0e1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
];

// Create a timestamp within the last month
const randomRecentDate = () => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
  return pastDate.toISOString();
};

// Generate seed listings
export const seedMarketplaceListings: SeedMarketplaceListing[] = [
  {
    _id: "824b684d-63cf-4ad5-859d-df53facf1e84",
    title: 'Aluminiumschrott aus Industrieanlage',
    description: 'Hochwertige Aluminiumreste aus einer Produktionsanlage. Ideal für Recycling und Wiederverwendung. Die Teile sind bereits vorsortiert und gereinigt.',
    price: 450,
    location: {
      city: 'Berlin',
      coordinates: [13.4050, 52.5200]
    },
    images: [sampleImages[0]],
    materialType: 'aluminium',
    quantity: 500,
    unit: 'kg',
    status: 'active',
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate(),
    userId: 'user123',
    bidCount: 3
  },
  {
    _id: "821e80e5-0eed-4895-ac8d-0cf3e8021c99",
    title: 'Kupferkabel und -rohre',
    description: 'Verschiedene Kupferrohre und -kabel aus Baustellenresten. Gute Qualität, leicht verarbeitet. Rohre haben verschiedene Durchmesser.',
    price: 750,
    location: {
      city: 'München',
      coordinates: [11.5820, 48.1351]
    },
    images: [sampleImages[1], sampleImages[2]],
    materialType: 'kupfer',
    quantity: 250,
    unit: 'kg',
    status: 'active',
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate(),
    userId: 'user456',
    bidCount: 5
  },
  {
    _id: "98f56508-2972-40ce-acf7-e37caeb8e20b",
    title: 'Altpapier und Kartonagen',
    description: 'Gemischtes Altpapier und gefaltete Kartonagen aus Büroräumung. Sauber und trocken gelagert. Keine Verunreinigungen durch Kunststoffe oder andere Materialien.',
    price: 120,
    location: {
      city: 'Hamburg',
      coordinates: [9.9937, 53.5511]
    },
    images: [sampleImages[3]],
    materialType: 'karton',
    quantity: 800,
    unit: 'kg',
    status: 'active',
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate(),
    userId: 'user789',
    bidCount: 1
  },
  {
    _id: "d5cbce75-bcac-4cba-91f0-2ff944d12dc9",
    title: 'PET-Flaschen transparent',
    description: 'Saubere, gepresste PET-Flaschen (transparent) aus Sammelstelle. Bereits in Ballen gepresst und zur Abholung bereit.',
    price: 300,
    location: {
      city: 'Köln',
      coordinates: [6.9603, 50.9375]
    },
    images: [sampleImages[4]],
    materialType: 'pet',
    quantity: 1,
    unit: 'ballen',
    status: 'active',
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate(),
    userId: 'user123',
    bidCount: 0
  },
  {
    _id: "4ac9c3c4-2e69-46ee-845d-93aae77fa73d",
    title: 'Stahlträger aus Abriss',
    description: 'Stahlträger verschiedener Größen aus Gebäudeabriss. Leichte Gebrauchsspuren, aber strukturell einwandfrei. Perfekt für Bauprojekte oder Metallrecycling.',
    price: 1200,
    location: {
      city: 'Frankfurt',
      coordinates: [8.6821, 50.1109]
    },
    images: [sampleImages[2]],
    materialType: 'stahl',
    quantity: 2000,
    unit: 'kg',
    status: 'pending',
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate(),
    userId: 'user456',
    bidCount: 2
  },
  {
    _id: "99f216c8-3409-4c5e-a5a9-e339b51c3d5c",
    title: 'Autobatterien zur Entsorgung',
    description: 'Gebrauchte Autobatterien zur fachgerechten Entsorgung und Recycling. Die Batterien sind noch in ihrem Gehäuse und wurden trocken gelagert.',
    price: 85,
    location: {
      city: 'Dresden',
      coordinates: [13.7384, 51.0504]
    },
    images: [],
    materialType: 'autobatterien',
    quantity: 20,
    unit: 'stueck',
    status: 'active',
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate(),
    userId: 'user789',
    bidCount: 0
  },
  {
    _id: "69d6b1d8-74f2-45f8-861c-893414646ed7",
    title: 'Elektronikschrott sortiert',
    description: 'Sortierter Elektronikschrott aus IT-Abteilung. Enthält Platinen, Prozessoren, Speichermodule und andere Komponenten. Ideal für Wertstoffrückgewinnung.',
    price: 550,
    location: {
      city: 'Stuttgart',
      coordinates: [9.1829, 48.7758]
    },
    images: [sampleImages[1]],
    materialType: 'leiterplatten',
    quantity: 50,
    unit: 'kg',
    status: 'sold',
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate(),
    userId: 'user123',
    bidCount: 7
  },
  {
    _id: "0d92b914-4939-4a9d-90b1-bee1c2d1eb2a",
    title: 'Holzpaletten gebraucht',
    description: 'Gebrauchte Europaletten in gutem Zustand. Können wiederverwendet oder als Brennholz genutzt werden. Vorwiegend Europaletten nach EPAL-Standard.',
    price: 180,
    location: {
      city: 'Düsseldorf',
      coordinates: [6.7735, 51.2277]
    },
    images: [sampleImages[3]],
    materialType: 'paletten',
    quantity: 30,
    unit: 'stueck',
    status: 'active',
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate(),
    userId: 'user456',
    bidCount: 4
  },
  {
    _id: "430d2569-d8cb-41c8-8d1a-acc8e30d55fd",
    title: 'Bauholz aus Dachstuhl',
    description: 'Gut erhaltenes Bauholz aus Dachstuhlsanierung. Balken verschiedener Größen, teilweise mit Verzierungen. Historisches Holz mit Charakter.',
    price: 900,
    location: {
      city: 'Leipzig',
      coordinates: [12.3731, 51.3397]
    },
    images: [],
    materialType: 'massivholz',
    quantity: 3,
    unit: 'kubikmeter',
    status: 'active',
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate(),
    userId: 'user789',
    bidCount: 2
  },
  {
    _id: "4e847382-d535-4112-8ec1-700807a2df07",
    title: 'Mischkunststoffe aus Produktion',
    description: 'Verschiedene thermoplastische Kunststoffreste aus der Produktion. Sauber und sortenrein. Geeignet für die Herstellung von Granulat zur Wiederverwertung.',
    price: 280,
    location: {
      city: 'Hannover',
      coordinates: [9.7320, 52.3759]
    },
    images: [sampleImages[4]],
    materialType: 'sonstige-kunststoffe',
    quantity: 400,
    unit: 'kg',
    status: 'pending',
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate(),
    userId: 'user123',
    bidCount: 1
  },
  {
    _id: "6262256f-f421-4b85-a602-e2f9043176bd",
    title: 'Altglas gemischt',
    description: 'Altglas verschiedener Farben und Formen. Hauptsächlich Flaschen und Konservengläser. Bereits gereinigt und ohne Verschlüsse.',
    price: 80,
    location: {
      city: 'Nürnberg',
      coordinates: [11.0767, 49.4521]
    },
    images: [sampleImages[0]],
    materialType: 'buntglas',
    quantity: 300,
    unit: 'kg',
    status: 'active',
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate(),
    userId: 'user456',
    bidCount: 0
  },
  {
    _id: "2e492372-8c0b-41a6-8f07-bd17bf085f4f",
    title: 'Altkleider für Recycling',
    description: 'Sortierte Altkleider guter Qualität. Gewaschen und zum Teil noch tragbar. Geeignet für Second-Hand oder textiles Recycling.',
    price: 150,
    location: {
      city: 'Bremen',
      coordinates: [8.8017, 53.0793]
    },
    images: [sampleImages[2]],
    materialType: 'kleidung',
    quantity: 100,
    unit: 'kg',
    status: 'active',
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate(),
    userId: 'user789',
    bidCount: 3
  }
]; 