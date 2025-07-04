// This script seeds the database with a comprehensive hierarchy of recycling materials
// Using ES modules
import { PrismaClient, Prisma } from '@prisma/client';
import slugify from 'slugify';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Database connection string
const DB_CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/davr';

// Fix for ES modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define materials with parent-child relationships
const materialCategories = [
  {
    name: 'Kunststoff (Plastics)',
    description: 'Verschiedene Arten von recycelbaren Kunststoffen',
    materials: [
      {
        name: 'PET (Polyethylenterephthalat)',
        subtype: 'Typ 1',
        recyclable: true,
        market_value_level: 'high',
        approximate_min_price: 0.20,
        approximate_max_price: 0.50,
        image_url: '/images/materials/pet.jpg',
        subtypes: [
          { name: 'PET-Flaschen', description: 'Transparente Getränkeflaschen', recyclable: true },
          { name: 'PET-Lebensmittelverpackungen', description: 'Durchsichtige Verpackungen für Lebensmittel', recyclable: true },
          { name: 'PET-Folien', description: 'Dünne Kunststofffolien aus PET', recyclable: true }
        ]
      },
      {
        name: 'HDPE (High-Density Polyethylen)',
        subtype: 'Typ 2',
        recyclable: true,
        market_value_level: 'medium',
        approximate_min_price: 0.15,
        approximate_max_price: 0.40,
        image_url: '/images/materials/hdpe.jpg',
        subtypes: [
          { name: 'HDPE-Flaschen', description: 'Shampoo-, Reinigungsmittel- und Milchflaschen', recyclable: true },
          { name: 'HDPE-Behälter', description: 'Lebensmittelbehälter, Eimer', recyclable: true },
          { name: 'HDPE-Rohre', description: 'Wasserleitungen, Abflussrohre', recyclable: true }
        ]
      },
      {
        name: 'PVC (Polyvinylchlorid)',
        subtype: 'Typ 3',
        recyclable: true,
        market_value_level: 'low',
        approximate_min_price: 0.05,
        approximate_max_price: 0.20,
        image_url: '/images/materials/pvc.jpg',
        subtypes: [
          { name: 'PVC-Rohre', description: 'Abwasserrohre, Elektroinstallationsrohre', recyclable: true },
          { name: 'PVC-Fensterprofile', description: 'Kunststofffensterrahmen', recyclable: true },
          { name: 'PVC-Bodenbeläge', description: 'Vinyl-Bodenbeläge', recyclable: true }
        ]
      },
      {
        name: 'LDPE (Low-Density Polyethylen)',
        subtype: 'Typ 4',
        recyclable: true,
        market_value_level: 'low',
        approximate_min_price: 0.10,
        approximate_max_price: 0.25,
        image_url: '/images/materials/ldpe.jpg',
        subtypes: [
          { name: 'Plastiktüten', description: 'Einkaufstüten, Verpackungsbeutel', recyclable: true },
          { name: 'Folien', description: 'Verpackungsfolien, Schrumpffolien', recyclable: true },
          { name: 'Flex-Verpackungen', description: 'Flexible Verpackungen', recyclable: true }
        ]
      },
      {
        name: 'PP (Polypropylen)',
        subtype: 'Typ 5',
        recyclable: true,
        market_value_level: 'medium',
        approximate_min_price: 0.15,
        approximate_max_price: 0.35,
        image_url: '/images/materials/pp.jpg',
        subtypes: [
          { name: 'Lebensmittelbehälter', description: 'Margarine-, Joghurtbecher', recyclable: true },
          { name: 'Verschlüsse', description: 'Flaschendeckel, Verpackungsverschlüsse', recyclable: true },
          { name: 'Technische Teile', description: 'Automobilteile, Haushaltsgeräte', recyclable: true }
        ]
      },
      {
        name: 'PS (Polystyrol)',
        subtype: 'Typ 6',
        recyclable: true,
        market_value_level: 'low',
        approximate_min_price: 0.08,
        approximate_max_price: 0.20,
        image_url: '/images/materials/ps.jpg',
        subtypes: [
          { name: 'Styropor', description: 'Verpackungsmaterial, Dämmstoff', recyclable: true },
          { name: 'CD-Hüllen', description: 'Transparente Kunststoffhüllen', recyclable: true },
          { name: 'Einweggeschirr', description: 'Einwegbecher, -teller', recyclable: true }
        ]
      }
    ]
  },
  {
    name: 'Metall (Metal)',
    description: 'Metallische Wertstoffe und Legierungen',
    materials: [
      {
        name: 'Aluminium',
        subtype: 'Non-ferrous',
        recyclable: true,
        market_value_level: 'high',
        approximate_min_price: 0.50,
        approximate_max_price: 1.50,
        image_url: '/images/materials/aluminum.jpg',
        subtypes: [
          { name: 'Getränkedosen', description: 'Aluminium-Getränkedosen', recyclable: true },
          { name: 'Alufolie', description: 'Haushaltsfolie, Verpackungsfolie', recyclable: true },
          { name: 'Aluminiumprofile', description: 'Fenster-, Türrahmen, Konstruktionsmaterial', recyclable: true }
        ]
      },
      {
        name: 'Stahl',
        subtype: 'Ferrous',
        recyclable: true,
        market_value_level: 'medium',
        approximate_min_price: 0.15,
        approximate_max_price: 0.40,
        image_url: '/images/materials/steel.jpg',
        subtypes: [
          { name: 'Konservendosen', description: 'Lebensmittelkonserven', recyclable: true },
          { name: 'Stahlschrott', description: 'Baustahlreste, Metallteile', recyclable: true },
          { name: 'Altautos', description: 'Autoteile aus Stahl', recyclable: true }
        ]
      },
      {
        name: 'Kupfer',
        subtype: 'Non-ferrous',
        recyclable: true,
        market_value_level: 'very_high',
        approximate_min_price: 3.00,
        approximate_max_price: 7.00,
        image_url: '/images/materials/copper.jpg',
        subtypes: [
          { name: 'Kabel', description: 'Elektrokabel, Datenkabel', recyclable: true },
          { name: 'Rohre', description: 'Wasserrohre, Heizungsrohre', recyclable: true },
          { name: 'Elektronikbauteile', description: 'Leiterplatten, elektrische Komponenten', recyclable: true }
        ]
      },
      {
        name: 'Edelstahl',
        subtype: 'Ferrous',
        recyclable: true,
        market_value_level: 'high',
        approximate_min_price: 0.80,
        approximate_max_price: 2.00,
        image_url: '/images/materials/stainless-steel.jpg',
        subtypes: [
          { name: 'Küchenutensilien', description: 'Töpfe, Pfannen, Besteck', recyclable: true },
          { name: 'Industrieausrüstung', description: 'Tanks, Rohre, Behälter', recyclable: true },
          { name: 'Dekorative Elemente', description: 'Geländer, Fassadenelemente', recyclable: true }
        ]
      }
    ]
  },
  {
    name: 'Papier & Karton (Paper & Cardboard)',
    description: 'Zellstoffbasierte Wertstoffe',
    materials: [
      {
        name: 'Zeitungspapier',
        subtype: 'Paper',
        recyclable: true,
        market_value_level: 'low',
        approximate_min_price: 0.05,
        approximate_max_price: 0.15,
        image_url: '/images/materials/newspaper.jpg',
        subtypes: [
          { name: 'Zeitungen', description: 'Tageszeitungen, Wochenblätter', recyclable: true },
          { name: 'Zeitschriften', description: 'Magazine, Illustrierte', recyclable: true }
        ]
      },
      {
        name: 'Karton',
        subtype: 'Cardboard',
        recyclable: true,
        market_value_level: 'medium',
        approximate_min_price: 0.08,
        approximate_max_price: 0.25,
        image_url: '/images/materials/cardboard.jpg',
        subtypes: [
          { name: 'Verpackungskartons', description: 'Versandkartons, Produktverpackungen', recyclable: true },
          { name: 'Wellpappe', description: 'Mehrschichtiger Karton für stabile Verpackungen', recyclable: true },
          { name: 'Getränkekartons', description: 'Tetra Pak, Milch- und Saftkartons', recyclable: true }
        ]
      },
      {
        name: 'Büropapier',
        subtype: 'Paper',
        recyclable: true,
        market_value_level: 'medium',
        approximate_min_price: 0.10,
        approximate_max_price: 0.30,
        image_url: '/images/materials/office-paper.jpg',
        subtypes: [
          { name: 'Druckerpapier', description: 'Standardpapier für Drucker und Kopierer', recyclable: true },
          { name: 'Notizbücher', description: 'Schulhefte, Notizblöcke', recyclable: true },
          { name: 'Briefumschläge', description: 'Post- und Versandumschläge', recyclable: true }
        ]
      }
    ]
  },
  {
    name: 'Glas (Glass)',
    description: 'Verschiedene Arten von Recyclingglas',
    materials: [
      {
        name: 'Weißglas',
        subtype: 'Clear glass',
        recyclable: true,
        market_value_level: 'medium',
        approximate_min_price: 0.10,
        approximate_max_price: 0.25,
        image_url: '/images/materials/clear-glass.jpg',
        subtypes: [
          { name: 'Getränkeflaschen', description: 'Wasser-, Wein-, Spirituosenflaschen', recyclable: true },
          { name: 'Konservengläser', description: 'Einmachgläser, Marmeladengläser', recyclable: true }
        ]
      },
      {
        name: 'Braunglas',
        subtype: 'Brown glass',
        recyclable: true,
        market_value_level: 'medium',
        approximate_min_price: 0.08,
        approximate_max_price: 0.20,
        image_url: '/images/materials/brown-glass.jpg',
        subtypes: [
          { name: 'Bierflaschen', description: 'Standardflaschen für Bier', recyclable: true },
          { name: 'Medikamentengläser', description: 'Arzneimittelverpackungen', recyclable: true }
        ]
      },
      {
        name: 'Grünglas',
        subtype: 'Green glass',
        recyclable: true,
        market_value_level: 'medium',
        approximate_min_price: 0.08,
        approximate_max_price: 0.20,
        image_url: '/images/materials/green-glass.jpg',
        subtypes: [
          { name: 'Weinflaschen', description: 'Standard-Weinflaschen (grün)', recyclable: true },
          { name: 'Sektflaschen', description: 'Flaschen für Schaumwein', recyclable: true }
        ]
      }
    ]
  },
  {
    name: 'Elektroschrott (E-Waste)',
    description: 'Elektronische und elektrische Altgeräte',
    materials: [
      {
        name: 'Haushaltsgroßgeräte',
        subtype: 'Large appliances',
        recyclable: true,
        market_value_level: 'medium',
        approximate_min_price: 5.00,
        approximate_max_price: 50.00,
        image_url: '/images/materials/large-appliances.jpg',
        subtypes: [
          { name: 'Kühlgeräte', description: 'Kühlschränke, Gefriertruhen', recyclable: true },
          { name: 'Waschmaschinen', description: 'Waschmaschinen, Trockner', recyclable: true },
          { name: 'Herde/Öfen', description: 'Elektroherde, Backöfen', recyclable: true }
        ]
      },
      {
        name: 'Kleingeräte',
        subtype: 'Small appliances',
        recyclable: true,
        market_value_level: 'medium',
        approximate_min_price: 1.00,
        approximate_max_price: 10.00,
        image_url: '/images/materials/small-appliances.jpg',
        subtypes: [
          { name: 'Küchengeräte', description: 'Mixer, Toaster, Kaffeemaschinen', recyclable: true },
          { name: 'Staubsauger', description: 'Bodenstaubsauger, Handstaubsauger', recyclable: true },
          { name: 'Bügeleisen', description: 'Dampfbügeleisen, Bügelsysteme', recyclable: true }
        ]
      },
      {
        name: 'IT und Telekommunikation',
        subtype: 'IT equipment',
        recyclable: true,
        market_value_level: 'high',
        approximate_min_price: 2.00,
        approximate_max_price: 20.00,
        image_url: '/images/materials/it-equipment.jpg',
        subtypes: [
          { name: 'Computer', description: 'Desktop-PCs, Laptops', recyclable: true },
          { name: 'Smartphones', description: 'Mobiltelefone, Tablets', recyclable: true },
          { name: 'Peripheriegeräte', description: 'Drucker, Scanner, Tastaturen', recyclable: true }
        ]
      },
      {
        name: 'Unterhaltungselektronik',
        subtype: 'Consumer electronics',
        recyclable: true,
        market_value_level: 'medium',
        approximate_min_price: 1.50,
        approximate_max_price: 15.00,
        image_url: '/images/materials/consumer-electronics.jpg',
        subtypes: [
          { name: 'Fernseher', description: 'LCD, LED, Plasma-TVs', recyclable: true },
          { name: 'Audio-Geräte', description: 'HiFi-Anlagen, Lautsprecher', recyclable: true },
          { name: 'Spielkonsolen', description: 'Videospielkonsolen, Zubehör', recyclable: true }
        ]
      }
    ]
  },
  {
    name: 'Textilien (Textiles)',
    description: 'Altkleider und andere Textilartikel',
    materials: [
      {
        name: 'Kleidung',
        subtype: 'Clothing',
        recyclable: true,
        market_value_level: 'medium',
        approximate_min_price: 0.20,
        approximate_max_price: 2.00,
        image_url: '/images/materials/clothing.jpg',
        subtypes: [
          { name: 'Oberbekleidung', description: 'T-Shirts, Hosen, Jacken', recyclable: true },
          { name: 'Unterwäsche', description: 'Socken, Unterhosen, BHs', recyclable: true },
          { name: 'Schuhe', description: 'Alle Arten von Schuhen', recyclable: true }
        ]
      },
      {
        name: 'Haustextilien',
        subtype: 'Home textiles',
        recyclable: true,
        market_value_level: 'low',
        approximate_min_price: 0.10,
        approximate_max_price: 1.00,
        image_url: '/images/materials/home-textiles.jpg',
        subtypes: [
          { name: 'Bettwäsche', description: 'Laken, Kissenbezüge, Bettbezüge', recyclable: true },
          { name: 'Handtücher', description: 'Bad- und Küchentextilien', recyclable: true },
          { name: 'Vorhänge', description: 'Gardinen, Verdunkelungsvorhänge', recyclable: true }
        ]
      }
    ]
  },
  {
    name: 'Batterien & Akkus (Batteries)',
    description: 'Alle Arten von Batterien und Akkumulatoren',
    materials: [
      {
        name: 'Haushaltsbatterien',
        subtype: 'Household batteries',
        recyclable: true,
        market_value_level: 'low',
        approximate_min_price: 0.05,
        approximate_max_price: 0.50,
        image_url: '/images/materials/household-batteries.jpg',
        subtypes: [
          { name: 'Alkaline-Batterien', description: 'Standard-Einwegbatterien', recyclable: true },
          { name: 'Knopfzellen', description: 'Kleine runde Batterien für Uhren, etc.', recyclable: true },
          { name: 'Lithium-Batterien', description: 'Lithium-Einwegbatterien', recyclable: true }
        ]
      },
      {
        name: 'Akkus',
        subtype: 'Rechargeable batteries',
        recyclable: true,
        market_value_level: 'medium',
        approximate_min_price: 0.50,
        approximate_max_price: 3.00,
        image_url: '/images/materials/rechargeable-batteries.jpg',
        subtypes: [
          { name: 'Lithium-Ionen-Akkus', description: 'Für Elektrogeräte, Smartphones', recyclable: true },
          { name: 'Nickel-Metallhydrid-Akkus', description: 'Wiederaufladbare Standardbatterien', recyclable: true },
          { name: 'Autobatterien', description: 'Blei-Säure-Batterien für Fahrzeuge', recyclable: true }
        ]
      }
    ]
  },
  {
    name: 'Sondermüll (Hazardous Waste)',
    description: 'Gefährliche und besonders zu behandelnde Abfälle',
    materials: [
      {
        name: 'Farben und Lacke',
        subtype: 'Paints & varnishes',
        recyclable: false,
        market_value_level: 'none',
        approximate_min_price: 0.00,
        approximate_max_price: 0.00,
        image_url: '/images/materials/paints.jpg',
        subtypes: [
          { name: 'Wandfarben', description: 'Dispersionsfarben, Latexfarben', recyclable: false },
          { name: 'Sprühdosen', description: 'Spraydosen mit Farbresten', recyclable: false },
          { name: 'Holzlacke', description: 'Lasuren, Klarlacke', recyclable: false }
        ]
      },
      {
        name: 'Chemikalien',
        subtype: 'Chemicals',
        recyclable: false,
        market_value_level: 'none',
        approximate_min_price: 0.00,
        approximate_max_price: 0.00,
        image_url: '/images/materials/chemicals.jpg',
        subtypes: [
          { name: 'Reinigungsmittel', description: 'Aggressive Reiniger, Lösungsmittel', recyclable: false },
          { name: 'Pflanzenschutzmittel', description: 'Dünger, Pestizide, Herbizide', recyclable: false },
          { name: 'Säuren und Laugen', description: 'Ätzende Flüssigkeiten', recyclable: false }
        ]
      },
      {
        name: 'Leuchtmittel',
        subtype: 'Light bulbs',
        recyclable: true,
        market_value_level: 'low',
        approximate_min_price: 0.00,
        approximate_max_price: 0.10,
        image_url: '/images/materials/light-bulbs.jpg',
        subtypes: [
          { name: 'Energiesparlampen', description: 'Kompaktleuchtstofflampen', recyclable: true },
          { name: 'LED-Lampen', description: 'Alle Arten von LED-Leuchtmitteln', recyclable: true },
          { name: 'Leuchtstoffröhren', description: 'Neonröhren, Leuchtstoffröhren', recyclable: true }
        ]
      }
    ]
  }
];

async function seedMaterials() {
  console.log('Seeding materials using Prisma Client...');

  for (const category of materialCategories) {
    console.log(`Processing category: ${category.name}`);
    // Create/update parent category material
    const parentSlug = slugify(category.name, { lower: true, strict: true });
    let parentMaterial = await prisma.material.upsert({
      where: { slug: parentSlug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: {
        name: category.name,
        slug: parentSlug,
        description: category.description,
      },
    });
    console.log(`  Upserted parent: ${parentMaterial.name} (ID: ${parentMaterial.id})`);

    for (const material of category.materials) {
      const childSlug = slugify(material.name, { lower: true, strict: true });
      // Create/update child material linked to parent
      let childMaterial = await prisma.material.upsert({
        where: { slug: childSlug },
        update: {
          name: material.name,
          // description: material.description, // Add description if available in data
          parent_id: parentMaterial.id,
        },
        create: {
          name: material.name,
          slug: childSlug,
          // description: material.description, // Add description if available in data
          parent_id: parentMaterial.id,
        },
      });
      console.log(`    Upserted child: ${childMaterial.name} (Parent: ${parentMaterial.name})`);
      
      // Handle tertiary subtypes if they exist (assuming schema supports another level or just flatten)
      if (material.subtypes) {
        for (const subtype of material.subtypes) {
            const subtypeSlug = slugify(subtype.name, { lower: true, strict: true });
             // Create/update subtype material linked to child
            await prisma.material.upsert({
                where: { slug: subtypeSlug },
                update: {
                    name: subtype.name,
                    description: subtype.description,
                    parent_id: childMaterial.id,
                },
                create: {
                    name: subtype.name,
                    slug: subtypeSlug,
                    description: subtype.description,
                    parent_id: childMaterial.id,
                },
            });
            console.log(`      Upserted subtype: ${subtype.name} (Parent: ${childMaterial.name})`);
        }
      }
    }
  }
  console.log('Material seeding completed.');
}

async function main() {
  try {
    await seedMaterials();
  } catch (error) {
    console.error("Error during material seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 