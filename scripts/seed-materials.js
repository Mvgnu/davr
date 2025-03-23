// This script seeds the database with a comprehensive hierarchy of recycling materials
// Using ES modules
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const { Client } = pg;

// Database connection string
const DB_CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/davr';

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
          { name: 'Weinflaschen', description: 'Standardflaschen für Wein', recyclable: true },
          { name: 'Saftflaschen', description: 'Flaschen für Säfte und andere Getränke', recyclable: true }
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

// Function to seed materials with parent-child relationships
async function seedMaterials() {
  const client = new Client({
    connectionString: DB_CONNECTION_STRING
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // First, check if materials already exist
    const checkResult = await client.query('SELECT COUNT(*) FROM materials');
    const count = parseInt(checkResult.rows[0].count);

    if (count > 0) {
      console.log(`Database already has ${count} materials. Use the --force flag to reseed.`);
      if (!process.argv.includes('--force')) {
        console.log('Exiting without seeding. Use --force to replace existing data.');
        await client.end();
        return;
      }
      console.log('Force flag detected. Clearing existing materials...');
      await client.query('DELETE FROM materials');
    }

    console.log('Seeding materials...');

    // For each category, insert parent materials and their children
    for (const category of materialCategories) {
      console.log(`Processing category: ${category.name}`);
      
      for (const material of category.materials) {
        // Insert the parent material
        const parentQuery = `
          INSERT INTO materials (name, description, category, subtype, recyclable, market_value_level, 
                               approximate_min_price, approximate_max_price, image_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `;
        
        const parentValues = [
          material.name,
          material.description || `${material.name} recycling material`,
          category.name,
          material.subtype,
          material.recyclable,
          material.market_value_level,
          material.approximate_min_price,
          material.approximate_max_price,
          material.image_url
        ];
        
        const parentResult = await client.query(parentQuery, parentValues);
        const parentId = parentResult.rows[0].id;
        
        console.log(`  Added parent material: ${material.name} (ID: ${parentId})`);
        
        // Insert all subtypes as child materials
        if (material.subtypes && material.subtypes.length > 0) {
          for (const subtype of material.subtypes) {
            const childQuery = `
              INSERT INTO materials (name, description, category, subtype, recyclable, parent_id, 
                                   market_value_level, approximate_min_price, approximate_max_price)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING id
            `;
            
            const childValues = [
              subtype.name,
              subtype.description || `${subtype.name} - a type of ${material.name}`,
              category.name,
              `${material.subtype} - subtype`,
              subtype.recyclable,
              parentId,
              material.market_value_level,
              material.approximate_min_price * 0.9, // Slightly lower than parent
              material.approximate_max_price * 0.9  // Slightly lower than parent
            ];
            
            const childResult = await client.query(childQuery, childValues);
            console.log(`    Added subtype: ${subtype.name} (ID: ${childResult.rows[0].id})`);
          }
        }
      }
    }

    console.log('Materials seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding materials:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Add parent_id column if it doesn't exist
async function ensureParentIdColumn() {
  const client = new Client({
    connectionString: DB_CONNECTION_STRING
  });

  try {
    await client.connect();
    
    // Check if parent_id column exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'materials' AND column_name = 'parent_id'
    `;
    const result = await client.query(checkColumnQuery);
    
    if (result.rows.length === 0) {
      console.log('Adding parent_id column to materials table...');
      await client.query('ALTER TABLE materials ADD COLUMN parent_id INTEGER REFERENCES materials(id)');
      console.log('Added parent_id column successfully');
    } else {
      console.log('parent_id column already exists');
    }
  } catch (error) {
    console.error('Error ensuring parent_id column:', error);
  } finally {
    await client.end();
  }
}

async function run() {
  await ensureParentIdColumn();
  await seedMaterials();
}

run().catch(console.error); 