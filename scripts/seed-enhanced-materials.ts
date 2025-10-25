import { PrismaClient, RecyclingDifficulty } from '@prisma/client';

const prisma = new PrismaClient();

// Enhanced material data with all new fields populated
const enhancedMaterials = [
  {
    name: 'Aluminium',
    slug: 'aluminium',
    description: 'Aluminium ist ein leichtes, silberfarbenes Metall, das zu 100% recycelbar ist ohne Qualitätsverlust. Es wird in Getränkedosen, Verpackungen, Bauteilen und Elektronik verwendet.',
    image_url: '/images/materials/aluminium.jpg',
    recyclability_percentage: 95,
    recycling_difficulty: RecyclingDifficulty.EASY,
    category_icon: 'metal',
    environmental_impact: {
      co2_saved_per_kg: 9.0,
      energy_saved_percentage: 95,
      water_saved_liters: 11000,
    },
    preparation_tips: [
      {
        title: 'Reinigen und trocknen',
        description: 'Spülen Sie Aluminiumverpackungen aus und lassen Sie sie trocknen, um Verunreinigungen zu vermeiden.',
        icon: 'droplet',
      },
      {
        title: 'Etiketten entfernen',
        description: 'Entfernen Sie Papier- und Plastiketiketten von Aluminiumdosen und -folien.',
        icon: 'scissors',
      },
      {
        title: 'Dosen zerdrücken',
        description: 'Zerdrücken Sie Aluminiumdosen, um Platz zu sparen und den Transport zu erleichtern.',
        icon: 'compress',
      },
      {
        title: 'Von Stahl trennen',
        description: 'Trennen Sie Aluminium von Stahlbehältern (Magnet-Test: Aluminium ist nicht magnetisch).',
        icon: 'magnet',
      },
    ],
    acceptance_rate: 89,
    average_price_per_unit: 0.85,
    price_unit: 'kg',
    fun_fact: 'Eine recycelte Aluminiumdose spart genug Energie, um einen Fernseher 3 Stunden lang zu betreiben!',
    annual_recycling_volume: 35000000,
  },
  {
    name: 'Papier',
    slug: 'papier',
    description: 'Papier wird aus Holzfasern hergestellt und ist eines der am häufigsten recycelten Materialien. Es umfasst Zeitungen, Kartons, Büropapier und Verpackungen.',
    image_url: '/images/materials/paper.jpg',
    recyclability_percentage: 80,
    recycling_difficulty: RecyclingDifficulty.EASY,
    category_icon: 'file-text',
    environmental_impact: {
      co2_saved_per_kg: 1.3,
      energy_saved_percentage: 65,
      water_saved_liters: 26,
    },
    preparation_tips: [
      {
        title: 'Trocken halten',
        description: 'Stellen Sie sicher, dass Papier trocken bleibt, da nasses Papier schwer zu recyceln ist.',
        icon: 'sun',
      },
      {
        title: 'Plastikfenster entfernen',
        description: 'Entfernen Sie Plastikfenster aus Briefumschlägen und Verpackungen.',
        icon: 'scissors',
      },
      {
        title: 'Klebeband entfernen',
        description: 'Entfernen Sie Klebeband und andere Nicht-Papier-Materialien von Kartons.',
        icon: 'minus-circle',
      },
      {
        title: 'Zusammenfalten',
        description: 'Falten Sie Kartons und Papier zusammen, um Platz zu sparen.',
        icon: 'fold-vertical',
      },
    ],
    acceptance_rate: 95,
    average_price_per_unit: 0.05,
    price_unit: 'kg',
    fun_fact: 'Eine Tonne recyceltes Papier rettet 17 Bäume!',
    annual_recycling_volume: 72000000,
  },
  {
    name: 'PET-Flaschen',
    slug: 'pet-flaschen',
    description: 'PET (Polyethylenterephthalat) ist ein klarer, starker Kunststoff, der hauptsächlich für Getränkeflaschen verwendet wird. PET ist vollständig recycelbar und kann zu neuen Flaschen oder Textilfasern verarbeitet werden.',
    image_url: '/images/materials/pet.jpg',
    recyclability_percentage: 90,
    recycling_difficulty: RecyclingDifficulty.EASY,
    category_icon: 'bottle',
    environmental_impact: {
      co2_saved_per_kg: 2.0,
      energy_saved_percentage: 75,
      water_saved_liters: 45,
    },
    preparation_tips: [
      {
        title: 'Ausspülen',
        description: 'Spülen Sie Flaschen kurz aus, um Rückstände zu entfernen.',
        icon: 'droplet',
      },
      {
        title: 'Deckel separat',
        description: 'Entfernen Sie Deckel und sammeln Sie sie separat (meist anderer Kunststoff).',
        icon: 'circle-off',
      },
      {
        title: 'Etiketten können bleiben',
        description: 'Etiketten müssen nicht entfernt werden - sie werden beim Recycling abgetrennt.',
        icon: 'check',
      },
      {
        title: 'Zerdrücken',
        description: 'Zerdrücken Sie Flaschen, um Platz im Sammelbehälter zu sparen.',
        icon: 'compress',
      },
    ],
    acceptance_rate: 92,
    average_price_per_unit: 0.30,
    price_unit: 'kg',
    fun_fact: 'Aus 25 recycelten PET-Flaschen kann ein Fleece-Pullover hergestellt werden!',
    annual_recycling_volume: 28000000,
  },
  {
    name: 'Glas',
    slug: 'glas',
    description: 'Glas ist zu 100% recycelbar ohne Qualitätsverlust und kann unendlich oft recycelt werden. Es wird in Flaschen, Gläsern und Fenstern verwendet.',
    image_url: '/images/materials/glass.jpg',
    recyclability_percentage: 100,
    recycling_difficulty: RecyclingDifficulty.EASY,
    category_icon: 'wine',
    environmental_impact: {
      co2_saved_per_kg: 0.3,
      energy_saved_percentage: 30,
      water_saved_liters: 12,
    },
    preparation_tips: [
      {
        title: 'Nach Farben trennen',
        description: 'Trennen Sie Glas nach Farben: Weiß, Grün, Braun für bessere Recyclingqualität.',
        icon: 'palette',
      },
      {
        title: 'Deckel entfernen',
        description: 'Entfernen Sie Metall- und Plastikdeckel von Gläsern und Flaschen.',
        icon: 'circle-off',
      },
      {
        title: 'Kurz ausspülen',
        description: 'Spülen Sie Gläser kurz aus, um Lebensmittelreste zu entfernen.',
        icon: 'droplet',
      },
      {
        title: 'Kein Fensterglas',
        description: 'Fensterglas, Spiegel und Glühbirnen gehören nicht in die Glassammlung.',
        icon: 'x-circle',
      },
    ],
    acceptance_rate: 98,
    average_price_per_unit: 0.03,
    price_unit: 'kg',
    fun_fact: 'Recyceltes Glas schmilzt bei niedrigeren Temperaturen als Rohstoffe, was Energie spart!',
    annual_recycling_volume: 85000000,
  },
  {
    name: 'Elektroschrott',
    slug: 'elektroschrott',
    description: 'Elektroschrott umfasst alle elektronischen Geräte wie Smartphones, Computer, Fernseher, Haushaltsgeräte und Batterien. Enthält wertvolle und gefährliche Materialien.',
    image_url: '/images/materials/electronics.jpg',
    recyclability_percentage: 75,
    recycling_difficulty: RecyclingDifficulty.HARD,
    category_icon: 'smartphone',
    environmental_impact: {
      co2_saved_per_kg: 3.5,
      energy_saved_percentage: 80,
      water_saved_liters: 8500,
    },
    preparation_tips: [
      {
        title: 'Daten löschen',
        description: 'Löschen Sie alle persönlichen Daten von Geräten vor der Entsorgung.',
        icon: 'trash-2',
      },
      {
        title: 'Batterien entfernen',
        description: 'Entfernen Sie Batterien und entsorgen Sie sie separat.',
        icon: 'battery',
      },
      {
        title: 'Kabel bündeln',
        description: 'Bündeln Sie Kabel und Zubehör zusammen mit dem Gerät.',
        icon: 'cable',
      },
      {
        title: 'Nicht zerlegen',
        description: 'Zerlegen Sie Geräte nicht selbst - überlassen Sie dies den Fachleuten.',
        icon: 'alert-triangle',
      },
    ],
    acceptance_rate: 72,
    average_price_per_unit: 0.15,
    price_unit: 'kg',
    fun_fact: 'Eine Tonne Elektroschrott enthält mehr Gold als 17 Tonnen Golderz!',
    annual_recycling_volume: 12000000,
  },
  {
    name: 'Textilien',
    slug: 'textilien',
    description: 'Alttextilien umfassen Kleidung, Schuhe, Bettwäsche und andere Stoffe. Sie können wiederverwendet, recycelt oder zu Dämmmaterial verarbeitet werden.',
    image_url: '/images/materials/textiles.jpg',
    recyclability_percentage: 65,
    recycling_difficulty: RecyclingDifficulty.MEDIUM,
    category_icon: 'shirt',
    environmental_impact: {
      co2_saved_per_kg: 3.6,
      energy_saved_percentage: 60,
      water_saved_liters: 6000,
    },
    preparation_tips: [
      {
        title: 'Sauber und trocken',
        description: 'Textilien sollten gewaschen und vollständig getrocknet sein.',
        icon: 'droplet-off',
      },
      {
        title: 'In Tüten verpacken',
        description: 'Verpacken Sie Textilien in geschlossenen Tüten, um sie vor Nässe zu schützen.',
        icon: 'package',
      },
      {
        title: 'Paarweise',
        description: 'Binden Sie Schuhe paarweise zusammen.',
        icon: 'link',
      },
      {
        title: 'Auch beschädigte Kleidung',
        description: 'Auch beschädigte Textilien können recycelt werden (als Putzlappen oder Dämmmaterial).',
        icon: 'recycle',
      },
    ],
    acceptance_rate: 68,
    average_price_per_unit: 0.08,
    price_unit: 'kg',
    fun_fact: 'Aus alten Textilien werden Dämmstoffe, Putzlappen und sogar neue Kleidungsstücke hergestellt!',
    annual_recycling_volume: 8500000,
  },
  {
    name: 'Bioabfall',
    slug: 'bioabfall',
    description: 'Bioabfall umfasst organische Küchenabfälle, Gartenabfälle und kompostierbare Materialien. Wird zu Kompost oder Biogas verarbeitet.',
    image_url: '/images/materials/organic.jpg',
    recyclability_percentage: 90,
    recycling_difficulty: RecyclingDifficulty.EASY,
    category_icon: 'leaf',
    environmental_impact: {
      co2_saved_per_kg: 0.5,
      energy_saved_percentage: 40,
      water_saved_liters: 2,
    },
    preparation_tips: [
      {
        title: 'Keine Plastiktüten',
        description: 'Verwenden Sie Papiertüten oder kompostierbare Beutel, keine Plastiktüten.',
        icon: 'ban',
      },
      {
        title: 'Keine Fleischreste',
        description: 'Fleisch und Knochen nicht in den Bioabfall (zieht Ungeziefer an).',
        icon: 'x-circle',
      },
      {
        title: 'Klein schneiden',
        description: 'Schneiden Sie große Abfälle klein für schnellere Kompostierung.',
        icon: 'scissors',
      },
      {
        title: 'Feuchtigkeit regulieren',
        description: 'Mischen Sie nasse und trockene Abfälle für optimale Kompostierung.',
        icon: 'droplets',
      },
    ],
    acceptance_rate: 85,
    average_price_per_unit: 0.02,
    price_unit: 'kg',
    fun_fact: 'Bioabfall wird zu nährstoffreichem Kompost, der Kunstdünger ersetzen kann!',
    annual_recycling_volume: 125000000,
  },
  {
    name: 'Batterien',
    slug: 'batterien',
    description: 'Batterien enthalten wertvolle Rohstoffe und gefährliche Schwermetalle. Sie müssen separat gesammelt und fachgerecht recycelt werden.',
    image_url: '/images/materials/batteries.jpg',
    recyclability_percentage: 85,
    recycling_difficulty: RecyclingDifficulty.MEDIUM,
    category_icon: 'battery',
    environmental_impact: {
      co2_saved_per_kg: 2.2,
      energy_saved_percentage: 70,
      water_saved_liters: 1500,
    },
    preparation_tips: [
      {
        title: 'Pole abkleben',
        description: 'Kleben Sie die Pole von Lithium-Batterien mit Klebeband ab (Brandgefahr).',
        icon: 'zap-off',
      },
      {
        title: 'Getrennt sammeln',
        description: 'Sammeln Sie Batterien getrennt von anderen Abfällen.',
        icon: 'package',
      },
      {
        title: 'Nicht beschädigen',
        description: 'Beschädigen oder öffnen Sie Batterien nicht.',
        icon: 'alert-triangle',
      },
      {
        title: 'Trocken lagern',
        description: 'Lagern Sie gesammelte Batterien an einem trockenen Ort.',
        icon: 'droplet-off',
      },
    ],
    acceptance_rate: 78,
    average_price_per_unit: 0.50,
    price_unit: 'kg',
    fun_fact: 'Aus recycelten Batterien werden Metalle für neue Batterien und sogar Besteck gewonnen!',
    annual_recycling_volume: 4500000,
  },
  {
    name: 'Kunststoffe',
    slug: 'kunststoffe',
    description: 'Kunststoffe sind vielfältige Materialien aus verschiedenen Polymeren. Umfasst Verpackungen, Folien, Behälter und mehr. Recyclingfähigkeit variiert je nach Typ.',
    image_url: '/images/materials/plastics.jpg',
    recyclability_percentage: 55,
    recycling_difficulty: RecyclingDifficulty.MEDIUM,
    category_icon: 'package',
    environmental_impact: {
      co2_saved_per_kg: 1.5,
      energy_saved_percentage: 55,
      water_saved_liters: 30,
    },
    preparation_tips: [
      {
        title: 'Nach Typen trennen',
        description: 'Achten Sie auf die Recycling-Codes (1-7) und trennen Sie wenn möglich.',
        icon: 'hash',
      },
      {
        title: 'Sauber und leer',
        description: 'Spülen Sie Kunststoffverpackungen aus und entfernen Sie Lebensmittelreste.',
        icon: 'droplet',
      },
      {
        title: 'Verschlüsse entfernen',
        description: 'Entfernen Sie Verschlüsse und Pumpen (meist anderer Kunststoff).',
        icon: 'circle-off',
      },
      {
        title: 'Zusammendrücken',
        description: 'Drücken Sie Kunststoffverpackungen zusammen, um Platz zu sparen.',
        icon: 'compress',
      },
    ],
    acceptance_rate: 82,
    average_price_per_unit: 0.12,
    price_unit: 'kg',
    fun_fact: 'Nur etwa 9% aller jemals produzierten Kunststoffe wurden recycelt!',
    annual_recycling_volume: 18000000,
  },
  {
    name: 'Metalle',
    slug: 'metalle',
    description: 'Metallschrott umfasst Eisen, Stahl, Kupfer, Messing und andere Metalle. Metalle sind unendlich oft recyclebar ohne Qualitätsverlust.',
    image_url: '/images/materials/metals.jpg',
    recyclability_percentage: 95,
    recycling_difficulty: RecyclingDifficulty.EASY,
    category_icon: 'wrench',
    environmental_impact: {
      co2_saved_per_kg: 1.8,
      energy_saved_percentage: 74,
      water_saved_liters: 40,
    },
    preparation_tips: [
      {
        title: 'Von Nicht-Metallen trennen',
        description: 'Entfernen Sie Kunststoff, Gummi und andere Nicht-Metall-Teile.',
        icon: 'scissors',
      },
      {
        title: 'Nach Metallart sortieren',
        description: 'Trennen Sie Eisenmetalle von Nichteisenmetallen (Magnet-Test).',
        icon: 'magnet',
      },
      {
        title: 'Sauber und trocken',
        description: 'Entfernen Sie groben Schmutz und Feuchtigkeit.',
        icon: 'droplet-off',
      },
      {
        title: 'Sicher verpacken',
        description: 'Verpacken Sie scharfe Metallteile sicher, um Verletzungen zu vermeiden.',
        icon: 'shield',
      },
    ],
    acceptance_rate: 93,
    average_price_per_unit: 0.25,
    price_unit: 'kg',
    fun_fact: 'Recycelter Stahl benötigt 60% weniger Energie als die Herstellung aus Eisenerz!',
    annual_recycling_volume: 45000000,
  },
];

async function seedEnhancedMaterials() {
  console.log('🌱 Starting enhanced materials seeding...\n');

  for (const materialData of enhancedMaterials) {
    try {
      // Check if material already exists
      const existing = await prisma.material.findUnique({
        where: { slug: materialData.slug },
      });

      if (existing) {
        // Update existing material with new fields
        const updated = await prisma.material.update({
          where: { slug: materialData.slug },
          data: {
            description: materialData.description,
            image_url: materialData.image_url,
            recyclability_percentage: materialData.recyclability_percentage,
            recycling_difficulty: materialData.recycling_difficulty,
            category_icon: materialData.category_icon,
            environmental_impact: materialData.environmental_impact,
            preparation_tips: materialData.preparation_tips,
            acceptance_rate: materialData.acceptance_rate,
            average_price_per_unit: materialData.average_price_per_unit,
            price_unit: materialData.price_unit,
            fun_fact: materialData.fun_fact,
            annual_recycling_volume: materialData.annual_recycling_volume,
          },
        });
        console.log(`✅ Updated: ${updated.name} (${updated.slug})`);
      } else {
        // Create new material
        const created = await prisma.material.create({
          data: materialData,
        });
        console.log(`✨ Created: ${created.name} (${created.slug})`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${materialData.name}:`, error);
    }
  }

  console.log('\n✅ Enhanced materials seeding completed!');
  console.log(`📊 Total materials processed: ${enhancedMaterials.length}`);
}

// Run the seed function
seedEnhancedMaterials()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
