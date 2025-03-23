import bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';
import { seedForumPosts as realisticForumPosts, seedForumResponses as realisticForumResponses } from '../lib/seed-data/forum-posts.js';

// MongoDB connection string from environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aluminum-recycling';

/**
 * Seed the database with realistic German data
 */
async function seedDatabase() {
  console.log('🌱 Seeding database with German content...');
  
  try {
    // Connect to MongoDB directly
    console.log('📡 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing data
    await clearDatabase(db);
    
    // Create seed data
    const users = await seedUsers(db);
    const centers = await seedRecyclingCenters(db, users);
    const blogPosts = await seedBlogPosts(db);
    const forumPosts = await seedForumPosts(db, users);
    const reviews = await seedReviews(db, users, centers);
    const marketplaceItems = await seedMarketplaceItems(db, users);
    
    console.log('✅ Database seeding completed successfully!');
    await client.close();
    process.exit(0);
    
  } catch (error: any) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

/**
 * Clear all collections before seeding
 */
async function clearDatabase(db: any) {
  console.log('🧹 Clearing existing data...');
  
  await db.collection('users').deleteMany({});
  await db.collection('recyclingcenters').deleteMany({});
  await db.collection('blogposts').deleteMany({});
  await db.collection('forumposts').deleteMany({});
  await db.collection('reviews').deleteMany({});
  await db.collection('marketplaceitems').deleteMany({});
  
  console.log('✅ All collections cleared');
}

/**
 * Seed users with realistic German data
 */
async function seedUsers(db: any) {
  console.log('👤 Creating users...');
  
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = {
    username: 'admin',
    name: 'Admin',
    email: 'admin@recyclium.de',
    password: adminPassword,
    role: 'admin',
    isPremium: true,
    accountType: 'user',
    profile: {
      bio: 'Administrator der Recyclium-Plattform',
      location: 'Berlin',
      website: 'recyclium.de',
      avatar: '/avatars/admin.jpg',
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Create regular users
  const regularUsers = [
    {
      username: 'thomas_mueller',
      name: 'Thomas Müller',
      email: 'thomas.mueller@example.de',
      password: await bcrypt.hash('password123', 10),
      role: 'user',
      accountType: 'user',
      profile: {
        bio: 'Umweltingenieur aus München. Leidenschaftlich engagiert für nachhaltige Kreislaufwirtschaft.',
        location: 'München',
        website: '',
        avatar: '/avatars/user1.jpg',
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'laura_schmitt',
      name: 'Laura Schmitt',
      email: 'laura.schmitt@example.de',
      password: await bcrypt.hash('password123', 10),
      role: 'user',
      accountType: 'user',
      isPremium: true,
      profile: {
        bio: 'Umweltaktivistin und Bloggerin über Zero-Waste-Lifestyle. Mutter von zwei Kindern.',
        location: 'Hamburg',
        website: 'nachhaltig-leben.de',
        avatar: '/avatars/user2.jpg',
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'markus_weber',
      name: 'Markus Weber',
      email: 'markus.weber@example.de',
      password: await bcrypt.hash('password123', 10),
      role: 'user',
      accountType: 'user',
      profile: {
        bio: 'Maschinenbauingenieur mit Fokus auf Materialwissenschaften. Hobby-Bastler und Upcycling-Enthusiast.',
        location: 'Stuttgart',
        website: '',
        avatar: '/avatars/user3.jpg',
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'sophia_wagner',
      name: 'Sophia Wagner',
      email: 'sophia.wagner@example.de',
      password: await bcrypt.hash('password123', 10),
      role: 'user',
      accountType: 'user',
      isPremium: true,
      profile: {
        bio: 'Nachhaltigkeitsberaterin für mittelständische Unternehmen. Spezialisiert auf Abfallmanagement.',
        location: 'Frankfurt',
        website: 'eco-consulting.de',
        avatar: '/avatars/user4.jpg',
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'jan_becker',
      name: 'Jan Becker',
      email: 'jan.becker@example.de',
      password: await bcrypt.hash('password123', 10),
      role: 'user',
      accountType: 'user',
      profile: {
        bio: 'Student der Umweltwissenschaften. Arbeite in Teilzeit für eine lokale Recycling-Initiative.',
        location: 'Köln',
        website: '',
        avatar: '/avatars/user5.jpg',
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
  ];
  
  // Create recycling center representatives
  const centerRepresentatives = [
    {
      username: 'maria_krueger',
      name: 'Maria Krüger',
      email: 'maria.krueger@recycling-zentrum.de',
      password: await bcrypt.hash('password123', 10),
      role: 'user',
      accountType: 'center',
      profile: {
        bio: 'Leiterin des städtischen Recyclinghofs Berlin-Mitte. 15 Jahre Erfahrung im Abfallmanagement.',
        location: 'Berlin',
        website: 'berlin-recycling.de',
        avatar: '/avatars/center1.jpg',
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'stefan_hoffmann',
      name: 'Stefan Hoffmann',
      email: 'stefan.hoffmann@greenmetal.de',
      password: await bcrypt.hash('password123', 10),
      role: 'user',
      accountType: 'center',
      isPremium: true,
      profile: {
        bio: 'Geschäftsführer von GreenMetal, spezialisiert auf Aluminium- und Metallrecycling.',
        location: 'Hamburg',
        website: 'greenmetal.de',
        avatar: '/avatars/center2.jpg',
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      username: 'klaus_fischer',
      name: 'Klaus Fischer',
      email: 'klaus.fischer@fischer-recycling.de',
      password: await bcrypt.hash('password123', 10),
      role: 'user',
      accountType: 'center',
      isPremium: true,
      profile: {
        bio: 'Familienunternehmen in der dritten Generation. Spezialisiert auf die Wiederverwertung von Aluminium und Edelmetallen.',
        location: 'München',
        website: 'fischer-recycling.de',
        avatar: '/avatars/center3.jpg',
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
  ];
  
  // Save all users to database
  const adminResult = await db.collection('users').insertOne(admin);
  const regularUsersResult = await db.collection('users').insertMany(regularUsers);
  const centerRepsResult = await db.collection('users').insertMany(centerRepresentatives);
  
  // Combine all users with their MongoDB _id
  const allUsers = [
    { ...admin, _id: adminResult.insertedId },
    ...regularUsers.map((user, index) => ({ 
      ...user, 
      _id: regularUsersResult.insertedIds[index]
    })),
    ...centerRepresentatives.map((user, index) => ({
      ...user,
      _id: centerRepsResult.insertedIds[index]
    }))
  ];
  
  console.log(`✅ Created ${allUsers.length} users`);
  
  return allUsers;
}

/**
 * Seed recycling centers with realistic German data
 */
async function seedRecyclingCenters(db: any, users: any[]) {
  console.log('🏢 Creating recycling centers...');
  
  // Get IDs of recycling center representatives
  const centerOwnerIds = users
    .filter(user => user.accountType === 'center')
    .map(user => user._id);
  
  // Create recycling centers data
  const recyclingCenters = [
    {
      name: 'Berliner Recycling Zentrum',
      address: 'Recyclingstraße 45',
      city: 'Berlin',
      postalCode: '10115',
      phone: '030 87654321',
      hours: 'Mo-Fr: 8:00-18:00, Sa: 9:00-14:00',
      latitude: 52.5200,
      longitude: 13.4050,
      services: ['Aluminium', 'Metalle', 'Papier', 'Kunststoffe', 'Elektronik'],
      description: 'Das Berliner Recycling Zentrum ist eine moderne Anlage zur Wiederverwertung verschiedener Materialien. Wir sind spezialisiert auf die Sammlung und Verarbeitung von Aluminium und anderen Metallen. Unser Team von Experten sorgt für eine umweltgerechte und effiziente Verwertung aller Materialien.',
      rating: 4.7,
      ownerId: centerOwnerIds[0],
      isVerified: true,
      verificationStatus: 'verified',
      marketplaceListings: [
        {
          centerId: null, // Will be set after center creation
          title: 'Ankauf von Aluminiumdosen und -verpackungen',
          description: 'Wir kaufen saubere Aluminiumdosen und -verpackungen zu attraktiven Preisen an. Je nach Qualität und Menge sind Preisverhandlungen möglich. Anlieferung direkt zu unserem Zentrum in Berlin-Mitte.',
          acceptedMaterials: ['Aluminiumdosen', 'Alufolie', 'Aluminiumverpackungen'],
          pricePerKg: 0.85,
          minWeight: 1,
          active: true,
          createdAt: new Date()
        },
        {
          centerId: null, // Will be set after center creation
          title: 'Ankauf von Aluminiumprofilen und Konstruktionsmaterial',
          description: 'Faire Preise für Aluminiumprofile, Fensterrahmen und sonstiges Konstruktionsmaterial aus Aluminium. Ideal für Handwerker und Bauunternehmen. Großmengenrabatt möglich.',
          acceptedMaterials: ['Aluminiumprofile', 'Fensterrahmen', 'Konstruktionsabfälle'],
          pricePerKg: 1.25,
          minWeight: 5,
          active: true,
        }
      ]
    },
    {
      name: 'GreenMetal Hamburg',
      address: 'Hafenweg 23',
      city: 'Hamburg',
      postalCode: '20459',
      phone: '040 12345678',
      hours: 'Mo-Fr: 7:30-19:00, Sa: 8:00-16:00',
      latitude: 53.5511,
      longitude: 9.9937,
      services: ['Aluminium', 'Metalle', 'Elektronik', 'Batterien', 'Fahrzeugteile'],
      description: 'GreenMetal ist ein führendes Unternehmen im Bereich Metallrecycling in Norddeutschland. Seit über 20 Jahren bieten wir zuverlässige Dienstleistungen für Privatpersonen und Unternehmen. Unser Fokus liegt auf der umweltfreundlichen Verwertung von Aluminium und anderen Nicht-Eisenmetallen. Mit modernster Technologie sorgen wir für maximale Ressourceneffizienz.',
      rating: 4.9,
      ownerId: centerOwnerIds[1],
      isVerified: true,
      verificationStatus: 'verified',
      marketplaceListings: [
        {
          centerId: null, // Will be set after center creation
          title: 'Premium-Ankauf von sortenreinem Aluminium',
          description: 'Wir bieten Bestpreise für sortenreines Aluminium jeder Art. Besonders gesucht: Legierungen der 5000er und 6000er Serie. Regelmäßige Lieferanten erhalten Vorzugskonditionen und garantierte Abnahmeverträge.',
          acceptedMaterials: ['Aluminium sortenrein', 'Aluminiumlegierungen', 'Industrieabfälle'],
          pricePerKg: 1.45,
          minWeight: 10,
          active: true,
        }
      ]
    },
    {
      name: 'Fischer Recycling München',
      address: 'Recyclingpark 7',
      city: 'München',
      postalCode: '80331',
      phone: '089 98765432',
      hours: 'Mo-Fr: 8:00-18:00, Sa: 9:00-15:00',
      latitude: 48.1351,
      longitude: 11.5820,
      services: ['Aluminium', 'Metalle', 'Papier', 'Glas', 'Kunststoffe', 'Elektroschrott'],
      description: 'Fischer Recycling ist ein traditionsreiches Familienunternehmen in der dritten Generation. Wir betreiben eines der größten Recyclingzentren in Bayern mit Schwerpunkt auf Aluminium- und Metallrecycling. Unsere Kunden schätzen die persönliche Betreuung und die transparenten Ankaufspreise. Durch kontinuierliche Modernisierung unserer Anlagen gewährleisten wir höchste Umweltstandards.',
      rating: 4.8,
      ownerId: centerOwnerIds[2],
      isVerified: true,
      verificationStatus: 'verified',
      marketplaceListings: [
        {
          centerId: null, // Will be set after center creation
          title: 'Ankauf von Industrieabfällen aus Aluminium',
          description: 'Spezialisiert auf die Abnahme von Industrieabfällen aus der Produktion. Wir bieten faire Preise für Späne, Stanzabfälle und sonstige Produktionsreste aus Aluminium. Regelmäßige Abholung möglich.',
          acceptedMaterials: ['Aluminiumspäne', 'Stanzabfälle', 'Produktionsreste'],
          pricePerKg: 1.10,
          minWeight: 20,
          maxWeight: 2000,
          active: true,
        },
        {
          centerId: null, // Will be set after center creation
          title: 'Ankauf von Haushaltssortierungen',
          description: 'Wir kaufen gut sortierte Aluminiummaterialien aus Haushalten zu fairen Preisen. Besonders gesucht: Dosen, Verpackungen, Kochgeschirr und kleine Elektrogeräte mit hohem Aluminiumanteil.',
          acceptedMaterials: ['Aluminiumdosen', 'Haushaltsgeräte', 'Kochgeschirr'],
          pricePerKg: 0.75,
          minWeight: 1,
          active: true,
        }
      ]
    },
    {
      name: 'EcoRecycling Stuttgart',
      address: 'Industriestraße 102',
      city: 'Stuttgart',
      postalCode: '70565',
      phone: '0711 55443322',
      hours: 'Mo-Fr: 8:30-17:30, Sa: 9:00-13:00',
      latitude: 48.7758,
      longitude: 9.1829,
      services: ['Aluminium', 'Metalle', 'Papier', 'Textilien', 'Bauabfälle'],
      description: 'EcoRecycling Stuttgart ist ein modernes Recyclingunternehmen mit Schwerpunkt auf nachhaltiger Kreislaufwirtschaft. Wir arbeiten eng mit lokalen Behörden und Industrieunternehmen zusammen, um innovative Lösungen für komplexe Recycling-Herausforderungen zu entwickeln. Unser spezieller Fokus liegt auf der Wiederverwertung von Aluminium aus dem Bauwesen und der Automobilindustrie.',
      rating: 4.5,
      isVerified: false,
      verificationStatus: 'unclaimed',
      marketplaceListings: []
    },
    {
      name: 'Rhein-Recycling Köln',
      address: 'Am Recyclinghof 15',
      city: 'Köln',
      postalCode: '50667',
      phone: '0221 33224455',
      hours: 'Mo-Fr: 8:00-17:00, Sa: 8:30-14:00',
      latitude: 50.9375,
      longitude: 6.9603,
      services: ['Aluminium', 'Metalle', 'Elektronik', 'Haushaltsgeräte', 'Kabelschrott'],
      description: 'Rhein-Recycling ist der größte kommunale Recyclinghof im Kölner Raum. Wir bieten umfassende Dienstleistungen für Privatpersonen und gewerbliche Kunden. Unsere Anlagen sind auf dem neuesten Stand der Technik und ermöglichen eine optimale Verwertung verschiedenster Materialien, mit besonderem Fokus auf Aluminium und Elektronikschrott.',
      rating: 4.2,
      isVerified: false,
      verificationStatus: 'unclaimed',
      marketplaceListings: []
    }
  ];
  
  // Fix centerId references in marketplaceListings
  const centersWithFixedListings = recyclingCenters.map((center: any) => {
    if (center.marketplaceListings && center.marketplaceListings.length > 0) {
      center.marketplaceListings = center.marketplaceListings.map((listing: any) => ({
        ...listing,
        centerId: new ObjectId(), // Create a temporary ObjectId
      }));
    }
    return center;
  });
  
  // Save recycling centers to database
  const result = await db.collection('recyclingcenters').insertMany(centersWithFixedListings);
  
  // Get created centers with their MongoDB IDs
  const createdCenters = centersWithFixedListings.map((center, index) => ({
    ...center,
    _id: result.insertedIds[index]
  }));
  
  // Update marketplace listings with correct centerIds
  for (let i = 0; i < createdCenters.length; i++) {
    const center = createdCenters[i];
    if (center.marketplaceListings && center.marketplaceListings.length > 0) {
      center.marketplaceListings.forEach((listing: any) => {
        listing.centerId = center._id;
      });
      
      // Update the center in the database with correct listing centerIds
      await db.collection('recyclingcenters').updateOne(
        { _id: center._id },
        { $set: { marketplaceListings: center.marketplaceListings } }
      );
    }
  }
  
  console.log(`✅ Created ${createdCenters.length} recycling centers`);
  
  return createdCenters;
}

/**
 * Seed blog posts with realistic German content
 */
async function seedBlogPosts(db: any) {
  console.log('📝 Creating blog posts...');
  
  const blogPosts = [
    {
      title: 'Die Zukunft des Aluminiumrecyclings in Deutschland',
      excerpt: 'Wie neue Technologien und Verfahren die Recyclingquoten von Aluminium in Deutschland steigern können und welche Herausforderungen noch zu bewältigen sind.',
      content: `
        <h2>Die aktuelle Situation des Aluminiumrecyclings in Deutschland</h2>
        
        <p>Deutschland gehört zu den führenden Nationen im Aluminiumrecycling. Mit einer Recyclingquote von etwa 87% bei Aluminiumverpackungen liegt die Bundesrepublik über dem europäischen Durchschnitt. Doch trotz dieser beeindruckenden Zahlen gibt es noch erhebliches Verbesserungspotenzial, besonders im Bereich der Sammel- und Sortiertechnologie.</p>
        
        <p>Die Vorteile des Aluminiumrecyclings sind überwältigend: Die Wiederaufbereitung von Aluminium verbraucht nur etwa 5% der Energie, die für die Primärproduktion benötigt wird. Dies entspricht einer CO2-Einsparung von bis zu 95%. Angesichts der klimapolitischen Ziele Deutschlands ist eine weitere Optimierung der Recyclingprozesse daher unerlässlich.</p>
        
        <h2>Innovative Technologien revolutionieren die Branche</h2>
        
        <p>In den letzten Jahren haben sich zahlreiche technologische Innovationen in der Recyclingbranche etabliert. Besonders vielversprechend sind folgende Entwicklungen:</p>
        
        <ul>
          <li><strong>Künstliche Intelligenz in der Sortierung:</strong> KI-gestützte Erkennungssysteme können verschiedene Aluminiumlegierungen mit hoher Präzision identifizieren und sortieren, was die Qualität des recycelten Materials erheblich verbessert.</li>
          <li><strong>Verbesserte Schmelzverfahren:</strong> Neue Technologien ermöglichen das Recycling von beschichteten Aluminiummaterialien ohne vorherige Entfernung der Beschichtung, was den Prozess effizienter gestaltet.</li>
          <li><strong>Digitale Rückverfolgbarkeit:</strong> Blockchain-basierte Systeme können die gesamte Lieferkette des Recyclingprozesses transparent darstellen, was das Vertrauen der Verbraucher stärkt und die Effizienz steigert.</li>
        </ul>
        
        <h2>Herausforderungen und Lösungsansätze</h2>
        
        <p>Trotz der positiven Entwicklungen bestehen weiterhin Herausforderungen. Eine der größten ist die Sammlung von Aluminium aus dem Haushaltsabfall. Obwohl Aluminiumverpackungen theoretisch zu 100% recycelbar sind, landen immer noch zu viele im Restmüll.</p>
        
        <p>Verschiedene Ansätze könnten dieses Problem lösen:</p>
        
        <ul>
          <li>Verbesserte Aufklärungskampagnen zur korrekten Mülltrennung</li>
          <li>Anreize für Verbraucher durch Pfandsysteme für weitere Aluminiumprodukte</li>
          <li>Automatisierte Sortieranlagen in Recyclinghöfen</li>
          <li>Engere Zusammenarbeit zwischen Herstellern und Recyclingunternehmen im Sinne einer erweiterten Produzentenverantwortung</li>
        </ul>
        
        <h2>Ausblick: Deutschland als Vorreiter</h2>
        
        <p>Mit dem im Jahr 2020 novellierten Kreislaufwirtschaftsgesetz hat Deutschland wichtige Weichen für die Zukunft gestellt. Die ambitionierten Ziele können jedoch nur erreicht werden, wenn alle Beteiligten - von der Industrie über die Kommunen bis hin zu den Verbrauchern - an einem Strang ziehen.</p>
        
        <p>Als führender Industriestandort hat Deutschland das Potenzial, weltweit Maßstäbe im Aluminiumrecycling zu setzen. Die Kombination aus gesetzlichen Rahmenbedingungen, technologischer Innovation und gesellschaftlichem Bewusstsein bildet hierfür eine solide Grundlage.</p>
      `,
      image: '/blog/aluminium-recycling-future.jpg',
      author: 'Dr. Michael Schneider',
      authorTitle: 'Umweltingenieur und Berater für Kreislaufwirtschaft',
      category: 'Technologie',
      tags: ['Technologie', 'Innovation', 'Nachhaltigkeit', 'Kreislaufwirtschaft'],
      isPremium: false,
      date: new Date('2023-07-15'),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Aluminiumrecycling im Haushalt: Tipps und Tricks',
      excerpt: 'Praktische Ratschläge zur optimalen Sammlung und Vorbereitung von Aluminium für das Recycling in Ihrem eigenen Haushalt.',
      content: `
        <h2>Warum sich Aluminiumrecycling im Haushalt lohnt</h2>
        
        <p>Aluminium ist ein wertvoller Rohstoff, der unbegrenzt recycelt werden kann, ohne an Qualität zu verlieren. Die Sammlung und korrekte Trennung im eigenen Haushalt trägt erheblich zur Ressourcenschonung bei. Für jeden Haushalt in Deutschland lassen sich bei konsequenter Trennung jährlich etwa 5-7 kg Aluminium dem Recyclingkreislauf zuführen.</p>
        
        <h2>Diese Aluminiumprodukte können Sie sammeln</h2>
        
        <p>In einem typischen Haushalt finden sich zahlreiche Aluminiumprodukte, die recycelt werden können:</p>
        
        <ul>
          <li>Getränkedosen</li>
          <li>Konservendosen (sofern aus Aluminium)</li>
          <li>Aluminiumfolien und -schalen</li>
          <li>Kaffeekapsel aus Aluminium</li>
          <li>Schraubverschlüsse</li>
          <li>Tuben (gut ausgespült)</li>
          <li>Alte Kochutensilien aus Aluminium</li>
          <li>Fensterrahmen und Bauteile</li>
        </ul>
        
        <h2>So bereiten Sie Aluminium optimal für das Recycling vor</h2>
        
        <p>Die richtige Vorbereitung von Aluminium für das Recycling ist entscheidend für die Effizienz des Prozesses:</p>
        
        <ol>
          <li><strong>Reinigung:</strong> Entfernen Sie grobe Speisereste und spülen Sie Behälter kurz aus. Eine perfekte Reinigung ist nicht nötig, aber starke Verschmutzungen können den Recyclingprozess beeinträchtigen.</li>
          <li><strong>Trennung von Verbundmaterialien:</strong> Wenn möglich, trennen Sie Aluminium von anderen Materialien. Beispielsweise sollten Deckel von Joghurtbechern abgenommen werden, wenn sie aus Aluminium bestehen.</li>
          <li><strong>Komprimieren:</strong> Um Platz zu sparen, können Sie Aluminiumdosen und -behälter vorsichtig zusammendrücken. Bei Alufolie können Sie diese zu einer Kugel formen.</li>
          <li><strong>Der Magnet-Test:</strong> Unsicher, ob es sich um Aluminium handelt? Aluminium ist nicht magnetisch. Mit einem einfachen Magneten können Sie also prüfen, ob ein Metallgegenstand aus Aluminium besteht.</li>
        </ol>
        
        <h2>Wohin mit dem gesammelten Aluminium?</h2>
        
        <p>Je nach Kommune gibt es unterschiedliche Sammelsysteme:</p>
        
        <ul>
          <li>In den meisten Regionen können Aluminiumverpackungen in die gelbe Tonne oder den gelben Sack gegeben werden.</li>
          <li>Größere Mengen oder sperrige Aluminiumteile können zu Wertstoffhöfen gebracht werden.</li>
          <li>Getränkedosen können über das Pfandsystem zurückgegeben werden.</li>
          <li>Spezielle Sammelstellen in Supermärkten nehmen oft Kaffeekapseln aus Aluminium zurück.</li>
        </ul>
        
        <h2>Kreative Ideen zur Wiederverwendung</h2>
        
        <p>Bevor Sie Aluminium dem Recycling zuführen, prüfen Sie, ob eine Wiederverwendung möglich ist:</p>
        
        <ul>
          <li>Alufolie kann mehrfach verwendet werden, wenn sie nicht stark verschmutzt ist.</li>
          <li>Getränkedosen können zu Stiftehaltern, Blumentöpfen oder Dekorationsobjekten umfunktioniert werden.</li>
          <li>Aus Kaffeekapsel lassen sich kreative Schmuckstücke oder Lichterketten basteln.</li>
        </ul>
        
        <p>Mit diesen einfachen Tipps können Sie einen wichtigen Beitrag zur Ressourcenschonung leisten und den Recyclingkreislauf von Aluminium unterstützen. Jedes Stück Aluminium, das Sie korrekt entsorgen, spart wertvolle Energie und Rohstoffe.</p>
      `,
      image: '/blog/household-recycling-tips.jpg',
      author: 'Melanie Wagner',
      authorTitle: 'Umweltpädagogin und Zero-Waste-Beraterin',
      category: 'Tipps & Tricks',
      tags: ['Haushalt', 'Recycling', 'Mülltrennung', 'Nachhaltigkeit', 'Zero Waste'],
      isPremium: false,
      date: new Date('2023-09-05')
    },
    {
      title: 'Die wirtschaftliche Bedeutung des Aluminiumrecyclings für den Standort Deutschland',
      excerpt: 'Eine Analyse der ökonomischen Vorteile und Potenziale, die das Aluminiumrecycling für die deutsche Wirtschaft bietet.',
      content: `
        <h2>Aluminiumrecycling als Wirtschaftsfaktor</h2>
        
        <p>Die Recyclingbranche ist längst zu einem bedeutenden Wirtschaftszweig in Deutschland herangewachsen. Mit einem Jahresumsatz von über 40 Milliarden Euro und mehr als 290.000 Beschäftigten trägt sie wesentlich zur Wertschöpfung bei. Innerhalb dieses Sektors nimmt das Aluminiumrecycling eine besondere Stellung ein.</p>
        
        <p>Allein in Deutschland werden jährlich etwa 1,1 Millionen Tonnen Aluminium recycelt, was circa 60% des gesamten Aluminiumbedarfs deckt. Der wirtschaftliche Wert dieses Materials ist beträchtlich: Der Marktpreis für recyceltes Aluminium schwankt je nach Qualität und Weltmarktlage zwischen 1.000 und 2.500 Euro pro Tonne.</p>
        
        <h2>Standortvorteile durch ressourceneffiziente Produktion</h2>
        
        <p>In Zeiten volatiler Rohstoffmärkte und internationaler Handelsauseinandersetzungen bietet das Aluminiumrecycling entscheidende Standortvorteile:</p>
        
        <ul>
          <li><strong>Geringere Abhängigkeit von Rohstoffimporten:</strong> Deutschland verfügt über keine eigenen Bauxitvorkommen, die Grundlage für die Primäraluminiumproduktion. Jede Tonne recyceltes Aluminium reduziert daher die Importabhängigkeit.</li>
          <li><strong>Energiekosteneinsparung:</strong> Die Energieeinsparung von 95% gegenüber der Primärproduktion stellt in Zeiten hoher Energiepreise einen erheblichen Wettbewerbsvorteil dar.</li>
          <li><strong>Innovations- und Technologieführerschaft:</strong> Deutsche Unternehmen gehören zu den Weltmarktführern bei Recyclingtechnologien. Dieser Vorsprung sichert Exportchancen und hochwertige Arbeitsplätze.</li>
        </ul>
        
        <h2>Wirtschaftliche Potenziale entlang der Wertschöpfungskette</h2>
        
        <p>Das wirtschaftliche Potenzial des Aluminiumrecyclings erstreckt sich über die gesamte Wertschöpfungskette:</p>
        
        <ol>
          <li><strong>Sammlung und Logistik:</strong> Ein durchdachtes Sammel- und Logistiknetzwerk bildet die Grundlage für effizientes Recycling. Hier entstehen Arbeitsplätze in Transport und Infrastruktur.</li>
          <li><strong>Sortierung und Aufbereitung:</strong> Moderne Sortiertechnologien erfordern hochqualifizierte Fachkräfte und kontinuierliche Innovation. In diesem Bereich werden jährlich etwa 500 Millionen Euro in Deutschland investiert.</li>
          <li><strong>Verarbeitung und Veredelung:</strong> Die Umschmelzung und Legierung von Sekundäraluminium erfordert spezialisiertes Know-how und schafft Arbeitsplätze in der metallverarbeitenden Industrie.</li>
          <li><strong>Produktentwicklung und Design:</strong> Recyclinggerechtes Produktdesign wird zunehmend zum Wettbewerbsfaktor, was neue Geschäftsfelder in Beratung und Engineering eröffnet.</li>
        </ol>
        
        <h2>Zukunftsperspektiven und Handlungsempfehlungen</h2>
        
        <p>Um das volle wirtschaftliche Potenzial des Aluminiumrecyclings auszuschöpfen, sind verschiedene Maßnahmen erforderlich:</p>
        
        <ul>
          <li><strong>Investitionsanreize für Recyclingtechnologien:</strong> Steuerliche Begünstigungen und Förderprogramme können die Modernisierung und den Ausbau von Recyclinganlagen beschleunigen.</li>
          <li><strong>Stärkung der Forschung und Entwicklung:</strong> Die Zusammenarbeit zwischen Industrie und Forschungseinrichtungen sollte intensiviert werden, um innovative Lösungen für komplexe Recyclingherausforderungen zu finden.</li>
          <li><strong>Qualifizierte Fachkräfte:</strong> Die Entwicklung spezialisierter Ausbildungs- und Studienprogramme im Bereich Recyclingtechnologie kann dem Fachkräftemangel entgegenwirken.</li>
          <li><strong>Marketingpotenzial für "Made in Germany":</strong> Produkte aus recyceltem Aluminium können als nachhaltiges Premium-Segment positioniert werden, was neue Absatzmärkte erschließt.</li>
        </ul>
        
        <p>Die ökonomischen Chancen des Aluminiumrecyclings sind vielfältig und reichen weit über die unmittelbare Kosteneinsparung hinaus. Als Industrienation mit begrenzten natürlichen Ressourcen, aber hervorragender technologischer Basis, kann Deutschland durch konsequente Förderung der Kreislaufwirtschaft seine Wettbewerbsposition stärken und zugleich einen wichtigen Beitrag zur nachhaltigen Entwicklung leisten.</p>
      `,
      image: '/blog/economic-impact-aluminum.jpg',
      author: 'Prof. Dr. Christian Hoffmann',
      authorTitle: 'Wirtschaftswissenschaftler und Nachhaltigkeitsexperte',
      category: 'Wirtschaft',
      tags: ['Wirtschaft', 'Standort Deutschland', 'Industrie', 'Kreislaufwirtschaft', 'Ressourceneffizienz'],
      isPremium: true,
      date: new Date('2023-05-22')
    },
    {
      title: 'Umweltauswirkungen der Aluminiumindustrie: Primärproduktion vs. Recycling',
      excerpt: 'Eine detaillierte Betrachtung der Umweltbilanz von Primäraluminium im Vergleich zu recyceltem Aluminium und deren Auswirkungen auf den Klimaschutz.',
      content: `
        <h2>Die ökologische Herausforderung der Primäraluminiumproduktion</h2>
        
        <p>Die Gewinnung von Primäraluminium beginnt mit dem Abbau von Bauxit, einem Erz, das hauptsächlich in tropischen und subtropischen Regionen vorkommt. Dieser Bergbau führt häufig zu erheblichen Umweltschäden:</p>
        
        <ul>
          <li>Abholzung von Wäldern und Zerstörung von Lebensräumen</li>
          <li>Bodenerosion und Gewässerverunreinigung</li>
          <li>Beeinträchtigung der Biodiversität</li>
          <li>Soziale Konflikte in Abbauregionen</li>
        </ul>
        
        <p>Der nächste Schritt, die Umwandlung von Bauxit zu Aluminiumoxid (Tonerde) durch das Bayer-Verfahren, erzeugt erhebliche Mengen an Rotschlamm – ein stark alkalisches Abfallprodukt, das sorgfältig entsorgt werden muss. Pro Tonne produziertem Aluminium entstehen etwa 1,5 Tonnen Rotschlamm.</p>
        
        <p>Die anschließende elektrolytische Reduktion von Aluminiumoxid zu metallischem Aluminium ist besonders energieintensiv. Die Herstellung einer Tonne Primäraluminium verbraucht etwa 13.000 bis 16.000 kWh Elektrizität und verursacht – je nach Energiequelle – zwischen 8 und 17 Tonnen CO₂-Äquivalente.</p>
        
        <h2>Die Umweltvorteile des Aluminiumrecyclings</h2>
        
        <p>Im Vergleich dazu bietet das Recycling von Aluminium signifikante Umweltvorteile:</p>
        
        <h3>Energieeinsparung</h3>
        <p>Der Energieverbrauch für das Recycling von Aluminium beträgt nur etwa 5% der für die Primärproduktion benötigten Energie. Für eine Tonne recyceltes Aluminium werden lediglich 700 bis 800 kWh Elektrizität benötigt.</p>
        
        <h3>Reduzierte Treibhausgasemissionen</h3>
        <p>Die CO₂-Einsparung beträgt etwa 95%. Pro Tonne recyceltem Aluminium werden nur etwa 0,5 Tonnen CO₂-Äquivalente freigesetzt – im Vergleich zu bis zu 17 Tonnen bei der Primärproduktion.</p>
        
        <h3>Vermiedene Umweltschäden</h3>
        <p>Durch den Verzicht auf Bauxitabbau werden Naturräume geschont und die Biodiversität erhalten. Zudem entfällt die Problematik des Rotschlamms vollständig.</p>
        
        <h3>Wassereinsparung</h3>
        <p>Der Wasserverbrauch beim Recycling beträgt nur etwa 7% im Vergleich zur Primärproduktion.</p>
        
        <h2>Lebenszyklusanalyse: Wissenschaftliche Erkenntnisse</h2>
        
        <p>Zahlreiche wissenschaftliche Studien haben die Umweltauswirkungen von Primär- und Recyclingaluminium umfassend analysiert. Eine Metastudie des Fraunhofer-Instituts für Umwelt-, Sicherheits- und Energietechnik aus dem Jahr 2021 fasst die wichtigsten Erkenntnisse zusammen:</p>
        
        <table>
          <thead>
            <tr>
              <th>Umweltindikator</th>
              <th>Primäraluminium</th>
              <th>Recyceltes Aluminium</th>
              <th>Einsparung</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Energieverbrauch (GJ/t)</td>
              <td>170-220</td>
              <td>10-15</td>
              <td>ca. 95%</td>
            </tr>
            <tr>
              <td>Treibhausgaspotenzial (t CO₂-Äq./t)</td>
              <td>8-17</td>
              <td>0,3-0,6</td>
              <td>ca. 95%</td>
            </tr>
            <tr>
              <td>Versauerungspotenzial (kg SO₂-Äq./t)</td>
              <td>50-80</td>
              <td>2-5</td>
              <td>ca. 94%</td>
            </tr>
            <tr>
              <td>Wasserverbrauch (m³/t)</td>
              <td>40-50</td>
              <td>2-4</td>
              <td>ca. 93%</td>
            </tr>
            <tr>
              <td>Landnutzung (m²a/t)</td>
              <td>30-80</td>
              <td>1-2</td>
              <td>ca. 97%</td>
            </tr>
          </tbody>
        </table>
        
        <h2>Globale Klimaschutzpotenziale</h2>
        
        <p>Gemäß Berechnungen des International Aluminium Institute könnte eine Steigerung der globalen Recyclingrate von Aluminium um 10 Prozentpunkte jährlich etwa 40 Millionen Tonnen CO₂-Äquivalente einsparen – vergleichbar mit den Jahresemissionen von Ländern wie Irland oder Kroatien.</p>
        
        <p>Besonders vielversprechend ist das Potenzial im Bausektor und in der Automobilindustrie, wo große Mengen Aluminium langfristig gebunden sind und in den kommenden Jahrzehnten für das Recycling zur Verfügung stehen werden.</p>
        
        <h2>Fazit: Recycling als ökologischer Imperativ</h2>
        
        <p>Die Umweltvorteile des Aluminiumrecyclings sind überwältigend und wissenschaftlich gut dokumentiert. Angesichts der globalen Herausforderungen des Klimawandels und der Ressourcenverknappung ist die Steigerung der Aluminiumrecyclingquote nicht nur wirtschaftlich sinnvoll, sondern auch ökologisch geboten.</p>
        
        <p>Die Politik ist gefordert, durch geeignete Rahmenbedingungen Anreize für die Verwendung von recyceltem Aluminium zu schaffen und Investitionen in Recyclingtechnologien zu fördern. Verbraucher können durch bewusste Kaufentscheidungen und korrekte Mülltrennung ihren Beitrag leisten.</p>
        
        <p>Das Ziel muss eine möglichst geschlossene Kreislaufwirtschaft für Aluminium sein, in der Primäraluminium nur noch dort eingesetzt wird, wo es technisch unvermeidbar ist.</p>
      `,
      image: '/blog/environmental-impact-aluminum.jpg',
      author: 'Dr. Julia Berger',
      authorTitle: 'Umweltwissenschaftlerin und Nachhaltigkeitsexpertin',
      category: 'Umwelt',
      tags: ['Umwelt', 'Klimaschutz', 'Nachhaltigkeit', 'Ökobilanz', 'CO2-Reduktion'],
      isPremium: true,
      date: new Date('2023-03-18')
    },
    {
      title: 'Aluminium in der Kreislaufwirtschaft: Bildungsmaterialien für Schulen',
      excerpt: 'Praxiserprobte Unterrichtsmaterialien und Projektideen zum Thema Aluminiumrecycling für unterschiedliche Altersgruppen.',
      content: `
        <h2>Warum Aluminiumrecycling im Unterricht thematisieren?</h2>
        
        <p>Das Thema Aluminiumrecycling bietet vielfältige Anknüpfungspunkte für einen fächerübergreifenden, praxisorientierten Unterricht. Es verbindet naturwissenschaftliche Grundlagen mit ökologischen, ökonomischen und gesellschaftlichen Fragestellungen. Schülerinnen und Schüler können direkte Bezüge zu ihrer Lebenswelt herstellen und erfahren, wie sie selbst aktiv zum Umweltschutz beitragen können.</p>
        
        <p>Die folgenden Materialien und Projektvorschläge wurden in Zusammenarbeit mit erfahrenen Pädagogen entwickelt und in der Praxis erprobt. Sie können je nach Altersstufe, Fach und verfügbarer Zeit angepasst werden.</p>
        
        <h2>Unterrichtsmaterialien für die Grundschule (Klasse 3-4)</h2>
        
        <h3>Sachunterricht: "Vom Joghurtdeckel zum neuen Fahrrad"</h3>
        
        <p><strong>Lernziele:</strong> Die Schülerinnen und Schüler</p>
        <ul>
          <li>erkennen Aluminium in Alltagsgegenständen</li>
          <li>verstehen den grundlegenden Recyclingkreislauf</li>
          <li>lernen die richtige Mülltrennung in ihrem Alltag</li>
        </ul>
        
        <p><strong>Materialien:</strong></p>
        <ul>
          <li>Arbeitsblatt "Aluminiumdetektive" (Suchrätsel für Aluminiumgegenstände im Alltag)</li>
          <li>Bildergeschichte "Alu, der kleine Joghurtdeckel auf Reisen"</li>
          <li>Magnet zum Testen von Materialien</li>
          <li>Sortierboxen für ein Mülltrennungsspiel</li>
        </ul>
        
        <p><strong>Projektidee:</strong> Die Klasse sammelt über zwei Wochen Aluminiumverpackungen und gestaltet daraus eine Collage oder ein Modell zum Thema "Unsere Umwelt".</p>
        
        <h2>Unterrichtsmaterialien für die Sekundarstufe I (Klasse 5-10)</h2>
        
        <h3>Chemie/Physik: "Eigenschaften und Recycling von Aluminium"</h3>
        
        <p><strong>Lernziele:</strong> Die Schülerinnen und Schüler</p>
        <ul>
          <li>lernen die chemischen und physikalischen Eigenschaften von Aluminium kennen</li>
          <li>verstehen den chemischen Prozess des Recyclings</li>
          <li>können den Energieaufwand für Primär- und Sekundäraluminium vergleichen</li>
        </ul>
        
        <p><strong>Materialien:</strong></p>
        <ul>
          <li>Versuchsanleitungen "Eigenschaften von Aluminium" (Leitfähigkeit, Dichte, Korrosionsbeständigkeit)</li>
          <li>Infografik "Vom Bauxit zum Aluminium"</li>
          <li>Arbeitsblatt "Energievergleich: Primär- vs. Recyclingaluminium"</li>
          <li>Kleingruppenaufgabe zur Berechnung der CO₂-Einsparung</li>
        </ul>
        
        <p><strong>Projektidee:</strong> Bau eines einfachen Schmelzofens für Aluminiumdosen (unter Aufsicht und mit entsprechenden Sicherheitsvorkehrungen) und Gestaltung kleiner Gegenstände aus dem recycelten Material.</p>
        
        <h3>Geographie/Politik: "Aluminium als globale Ressource"</h3>
        
        <p><strong>Lernziele:</strong> Die Schülerinnen und Schüler</p>
        <ul>
          <li>kennen die globale Verteilung von Bauxitvorkommen</li>
          <li>verstehen die wirtschaftlichen und ökologischen Aspekte des Aluminiumhandels</li>
          <li>können die Bedeutung des Recyclings im Kontext der Ressourcengerechtigkeit bewerten</li>
        </ul>
        
        <p><strong>Materialien:</strong></p>
        <ul>
          <li>Weltkarte mit Bauxitvorkommen und Produktionsstandorten</li>
          <li>Fallstudie "Bauxitabbau in Guinea: Chancen und Probleme"</li>
          <li>Statistiken zum globalen Aluminiumverbrauch</li>
          <li>Rollenspielkarten "Verhandlungen um nachhaltige Aluminiumproduktion"</li>
        </ul>
        
        <p><strong>Projektidee:</strong> Organisation einer Podiumsdiskussion mit verteilten Rollen (Industrievertreter, Umweltschützer, Politiker, Verbraucher) zum Thema "Wem gehören die Ressourcen der Erde?"</p>
        
        <h2>Unterrichtsmaterialien für die Sekundarstufe II (Klasse 11-13)</h2>
        
        <h3>Fächerübergreifendes Projekt: "Konzeption einer Recyclingkampagne"</h3>
        
        <p><strong>Lernziele:</strong> Die Schülerinnen und Schüler</p>
        <ul>
          <li>analysieren die aktuellen Herausforderungen des Aluminiumrecyclings</li>
          <li>entwickeln innovative Lösungsansätze</li>
          <li>konzipieren und planen eine Aufklärungskampagne</li>
          <li>reflektieren wirtschaftliche, ökologische und gesellschaftliche Zusammenhänge</li>
        </ul>
        
        <p><strong>Materialien:</strong></p>
        <ul>
          <li>Aktuelle wissenschaftliche Studien zum Aluminiumrecycling</li>
          <li>Handreichung "Kampagnenplanung in 10 Schritten"</li>
          <li>Beispiele erfolgreicher Umweltkampagnen</li>
          <li>Evaluationsbögen für Zielgruppenanalysen</li>
        </ul>
        
        <p><strong>Projektablauf:</strong></p>
        <ol>
          <li>Recherchephase: Analyse der aktuellen Recyclingquoten und -probleme</li>
          <li>Ideenfindung: Entwicklung innovativer Ansätze zur Steigerung des Aluminiumrecyclings</li>
          <li>Konzeptionsphase: Ausarbeitung einer konkreten Kampagne mit Botschaften, Zielgruppen und Maßnahmen</li>
          <li>Umsetzung: Erstellung von Kampagnenmaterialien (Plakate, Social-Media-Posts, Videos)</li>
          <li>Präsentation: Vorstellung der Kampagne vor lokalem Publikum oder Experten</li>
        </ol>
        
        <h2>Weitere Ressourcen und Unterstützung</h2>
        
        <p>Für Lehrkräfte, die diese Materialien in ihrem Unterricht einsetzen möchten, stehen folgende weitere Ressourcen zur Verfügung:</p>
        
        <ul>
          <li>Kostenfreie Fortbildungen zum Thema "Kreislaufwirtschaft im Unterricht"</li>
          <li>Exkursionsmöglichkeiten zu Recyclinganlagen (mit Vorbereitungs- und Nachbereitungsmaterialien)</li>
          <li>Expertenbesuch im Unterricht</li>
          <li>Online-Portal mit aktuellen Daten und interaktiven Visualisierungen zum Aluminiumrecycling</li>
        </ul>
        
        <p>Bei Interesse an diesen Materialien oder weiterführender Unterstützung kontaktieren Sie bitte unsere Bildungsabteilung unter bildung@recyclium.de.</p>
      `,
      image: '/blog/education-materials.jpg',
      author: 'Sabine Neumann',
      authorTitle: 'Lehrerin und Umweltpädagogin',
      category: 'Bildung',
      tags: ['Bildung', 'Schulen', 'Unterrichtsmaterialien', 'Projekte', 'Umweltbildung'],
      isPremium: false,
      date: new Date('2023-08-10')
    }
  ];
  
  // Save to database
  const result = await db.collection('blogposts').insertMany(blogPosts);
  
  // Get created posts with their MongoDB IDs
  const createdBlogPosts = blogPosts.map((post, index) => ({
    ...post,
    _id: result.insertedIds[index]
  }));
  
  console.log(`✅ Created ${createdBlogPosts.length} blog posts`);
  
  return createdBlogPosts;
}

/**
 * Seed forum posts with realistic German content
 */
async function seedForumPosts(db: any, users: any[]) {
  console.log('💬 Creating forum posts and responses...');
  
  // Get user IDs for creating posts
  const userIds = users.filter(user => user.accountType === 'user').map(user => user._id);
  const centerUserIds = users.filter(user => user.accountType === 'center').map(user => user._id);
  const allUserIds = [...userIds, ...centerUserIds];
  
  // Helper function to get a random user ID
  const getRandomUserId = () => {
    const randomIndex = Math.floor(Math.random() * allUserIds.length);
    return allUserIds[randomIndex];
  };
  
  // Create main forum posts
  const mainPosts = [
    {
      title: 'Wo kann ich in Berlin größere Mengen Aluminiumprofile abgeben?',
      content: `
        Hallo zusammen,
        
        ich renoviere gerade meine Altbauwohnung in Berlin-Kreuzberg und habe dabei eine Menge alter Aluminiumfensterrahmen ausgebaut. Es handelt sich um etwa 12 Rahmen in gutem Zustand, die insgesamt vielleicht 50-60 kg wiegen.
        
        Weiß jemand, wo ich diese in Berlin am besten abgeben kann? Gibt es Recyclinghöfe, die dafür eine Vergütung anbieten? Ich würde sie ungern einfach zum Wertstoffhof bringen, wenn ich dafür auch etwas bekommen könnte.
        
        Danke für eure Tipps!
        Thomas
      `,
      userId: userIds[0], // Thomas Müller
      category: 'Hilfe',
      tags: ['Berlin', 'Aluminiumprofile', 'Vergütung', 'Recyclinghof'],
      createdAt: new Date('2023-09-15T14:32:00')
    },
    {
      title: 'Erfahrungen mit dem neuen Sortierverfahren für Aluminiumlegierungen?',
      content: `
        Sehr geehrte Fachkolleginnen und -kollegen,
        
        ich leite eine mittelständische Recyclingfirma in der Nähe von Stuttgart und überlege, in ein neues Sortierverfahren für Aluminiumlegierungen zu investieren. Konkret geht es um die optische Spektroskopie zur Unterscheidung verschiedener Legierungen.
        
        Hat jemand von euch bereits Erfahrungen mit solchen Systemen gemacht? Mich interessieren vor allem:
        - Zuverlässigkeit der Sortierung
        - Durchsatzraten
        - Wartungsaufwand
        - Amortisationszeit
        
        Für einen Erfahrungsaustausch wäre ich sehr dankbar!
        
        Mit freundlichen Grüßen,
        Markus Weber
      `,
      userId: userIds[2], // Markus Weber
      category: 'Diskussion',
      tags: ['Sortiertechnologie', 'Investition', 'Spektroskopie', 'Aluminiumlegierungen'],
      createdAt: new Date('2023-08-20T09:15:00')
    },
    {
      title: 'Wertstofftonne vs. Wertstoffhof - Was ist besser für Aluminium?',
      content: `
        Liebe Community,
        
        ich habe eine grundsätzliche Frage zur Entsorgung von Aluminium im Haushalt. Bisher habe ich Alufolie, Deckel und kleine Dosen immer in die gelbe Tonne geworfen. Größere Aluminiumteile bringe ich zum Wertstoffhof.
        
        Jetzt habe ich aber gehört, dass die Sortieranlagen für die gelben Säcke/Tonnen nicht so effizient arbeiten und viel Aluminium nicht richtig erkannt wird.
        
        Ist es also besser, ALLES Aluminium zum Wertstoffhof zu bringen? Oder ist die gelbe Tonne für bestimmte Aluminiumprodukte doch geeignet?
        
        Ich möchte einfach sichergehen, dass meine Mühe beim Trennen auch wirklich etwas bringt.
        
        Vielen Dank für eure Erfahrungen!
        Laura
      `,
      userId: userIds[1], // Laura Schmitt
      category: 'Hilfe',
      tags: ['Mülltrennung', 'Gelbe Tonne', 'Wertstoffhof', 'Haushaltsrecycling'],
      createdAt: new Date('2023-09-05T18:45:00')
    },
    {
      title: 'Vergleich der Aluminiumpreise September 2023',
      content: `
        Hallo zusammen,
        
        ich sammle seit einiger Zeit systematisch Aluminium und verkaufe es an verschiedene Abnehmer. Für alle, die ebenfalls regelmäßig Aluminium abgeben, habe ich einen aktuellen Preisvergleich für September 2023 in verschiedenen deutschen Städten gemacht:
        
        **Hamburg:**
        - GreenMetal: 0,95€/kg für sortenreine Aluminiumdosen
        - Stadtrecycling Hamburg: 0,85€/kg
        - Metallhandel Nord: 0,80€/kg
        
        **Berlin:**
        - Berliner Recycling Zentrum: 0,90€/kg
        - Metal4U: 0,80€/kg
        - ReMetall: 0,75€/kg
        
        **München:**
        - Fischer Recycling: 1,00€/kg
        - Bayerischer Metallhandel: 0,85€/kg
        - München Recycling GmbH: 0,80€/kg
        
        **Frankfurt:**
        - Rhein-Main-Recycling: 0,90€/kg
        - Metallankauf Frankfurt: 0,85€/kg
        - RecyclingNow: 0,75€/kg
        
        Falls jemand aktuelle Preise aus anderen Städten oder von anderen Abnehmern hat, gerne ergänzen!
        
        Beste Grüße,
        Jan
      `,
      userId: userIds[4], // Jan Becker
      category: 'Marktplatz',
      tags: ['Preisvergleich', 'Ankauf', 'Vergütung', 'Preise'],
      createdAt: new Date('2023-09-12T11:20:00')
    },
    {
      title: 'Vorstellung: Neues Pfandsystem für Aluminium-Kaffeekapseln',
      content: `
        Sehr geehrte Mitglieder der Recyclium-Community,
        
        als Vertreterin des Berliner Recycling Zentrums möchte ich euch heute über ein neues Pilotprojekt informieren, das wir in Zusammenarbeit mit mehreren Kaffeeherstellern in Berlin starten:
        
        Ab dem 1. Oktober 2023 führen wir ein Pfandsystem für Aluminium-Kaffeekapseln ein. Bei teilnehmenden Händlern können Verbraucher ihre gebrauchten Aluminium-Kaffeekapseln abgeben und erhalten pro 10 Kapseln einen Pfandbon im Wert von 0,50€.
        
        Die gesammelten Kapseln werden in unserem Zentrum speziell aufbereitet, wobei der Kaffeesatz als Bioabfall verwertet und das Aluminium dem Recyclingkreislauf zugeführt wird.
        
        Folgende Geschäfte nehmen bereits teil:
        - Alle Filialen von KaffeeGenuss Berlin
        - BioMarkt Kreuzberg
        - MeinKaffee Charlottenburg
        - Ausgewählte REWE-Märkte im Stadtgebiet
        
        Wir freuen uns über eure Teilnahme und stehen für Fragen gerne zur Verfügung!
        
        Mit freundlichen Grüßen,
        Maria Krüger
        Berliner Recycling Zentrum
      `,
      userId: centerUserIds[0], // Maria Krüger
      category: 'News',
      tags: ['Pfandsystem', 'Kaffeekapseln', 'Berlin', 'Pilotprojekt'],
      createdAt: new Date('2023-09-18T10:00:00')
    }
  ];
  
  // Add our new more realistic forum posts
  const enhancedForumPosts = realisticForumPosts.map(post => {
    // Assign a random userId from the database to each forum post
    return {
      ...post,
      userId: getRandomUserId()
    };
  });
  
  // Merge original posts with enhanced posts
  const allPosts = [...mainPosts, ...enhancedForumPosts];
  
  // Save all posts
  const result = await db.collection('forumposts').insertMany(allPosts);
  
  // Get created main posts with their MongoDB IDs
  const createdPosts = allPosts.map((post, index) => ({
    ...post,
    _id: result.insertedIds[index]
  }));
  
  // Create responses to the first main post (Berlin aluminum profiles)
  const responses1 = [
    {
      title: 'Re: Wo kann ich in Berlin größere Mengen Aluminiumprofile abgeben?',
      content: `
        Hallo Thomas,
        
        ich kann dir das Berliner Recycling Zentrum in Berlin-Mitte empfehlen. Ich habe dort letzten Monat etwa 30kg Aluminiumprofile abgegeben und einen fairen Preis bekommen. Die zahlen aktuell ca. 0,90€ pro Kilo für sortenreine Aluminiumprofile.
        
        Du solltest vorher kurz anrufen und fragen, ob sie aktuell größere Mengen annehmen. Die Telefonnummer findest du auf deren Webseite.
        
        Viel Erfolg!
        Sophia
      `,
      userId: userIds[3], // Sophia Wagner
      parentId: createdPosts[0]._id,
      isResponse: true,
      category: 'Hilfe',
      tags: ['Berlin', 'Aluminiumprofile'],
      createdAt: new Date('2023-09-15T15:10:00')
    },
    {
      title: 'Re: Wo kann ich in Berlin größere Mengen Aluminiumprofile abgeben?',
      content: `
        Guten Tag Herr Müller,
        
        vielen Dank für Ihr Interesse am Recycling von Aluminiumprofilen. Als Vertreterin des Berliner Recycling Zentrums kann ich Ihnen bestätigen, dass wir sehr gerne Ihre Aluminiumfensterrahmen annehmen würden.
        
        Aktuell bieten wir für gut erhaltene Aluminiumprofile eine Vergütung von 0,85€-0,95€ pro Kilogramm an. Bei der von Ihnen angegebenen Menge würde sich ein Betrag zwischen 42€ und 57€ ergeben.
        
        Sie können die Materialien zu unseren regulären Öffnungszeiten (Mo-Fr: 8:00-18:00, Sa: 9:00-14:00) in der Recyclingstraße 45 abgeben. Für größere Mengen empfehle ich einen kurzen Anruf vorab unter 030 87654321.
        
        Mit freundlichen Grüßen,
        Maria Krüger
        Berliner Recycling Zentrum
      `,
      userId: centerUserIds[0], // Maria Krüger
      parentId: createdPosts[0]._id,
      isResponse: true,
      category: 'Hilfe',
      tags: ['Berlin', 'Aluminiumprofile', 'Ankauf'],
      createdAt: new Date('2023-09-15T16:22:00')
    },
    {
      title: 'Re: Wo kann ich in Berlin größere Mengen Aluminiumprofile abgeben?',
      content: `
        Hey Thomas,
        
        ich habe noch einen weiteren Tipp für dich: Schau mal auf eBay-Kleinanzeigen. Es gibt einige Handwerker und kleinere Metallbetriebe, die Aluminiumprofile auch direkt ankaufen und teilweise sogar abholen.
        
        Ich habe damit letztes Jahr gute Erfahrungen gemacht, als ich bei einer Dachsanierung diverse Alumaterialien übrig hatte. Hab damit sogar etwas mehr bekommen als beim Recyclinghof.
        
        Einfach mal "Aluminium Ankauf Berlin" suchen und ein paar Angebote einholen.
        
        Gruß, Jan
      `,
      userId: userIds[4], // Jan Becker
      parentId: createdPosts[0]._id,
      isResponse: true,
      category: 'Hilfe',
      tags: ['Berlin', 'Aluminiumprofile', 'eBay-Kleinanzeigen'],
      createdAt: new Date('2023-09-16T09:05:00')
    }
  ];
  
  // Create responses to the second main post (sorting technology)
  const responses2 = [
    {
      title: 'Re: Erfahrungen mit dem neuen Sortierverfahren für Aluminiumlegierungen?',
      content: `
        Hallo Herr Weber,
        
        wir haben vor ca. einem Jahr in ein LIBS-basiertes Sortiersystem (Laser-Induced Breakdown Spectroscopy) von einem deutschen Hersteller investiert und können durchaus positiv berichten.
        
        Unsere Erfahrungen:
        
        - Zuverlässigkeit: Nach einer Eingewöhnungsphase von ca. 4 Wochen liegt die Erkennungsrate bei über 97% für die gängigen Aluminiumlegierungen. Wichtig ist eine gute Vorreinigung des Materials.
        
        - Durchsatz: Wir schaffen etwa 2-3 Tonnen pro Stunde, was für unseren mittelständischen Betrieb völlig ausreichend ist.
        
        - Wartung: Monatliche Kalibrierung erforderlich, ansonsten sehr zuverlässig. Die Lasertechnik ist weitgehend wartungsfrei. Die Förderbänder benötigen die übliche Pflege.
        
        - Amortisation: Bei unserer Auslastung rechnen wir mit einer Amortisationszeit von ca. 4 Jahren. Durch den gestiegenen Reinheitsgrad unserer Sekundärrohstoffe konnten wir bessere Verkaufspreise erzielen.
        
        Gerne können wir uns auch telefonisch austauschen. Meine Kontaktdaten finden Sie im Profil.
        
        Mit kollegialen Grüßen,
        Klaus Fischer
        Fischer Recycling München
      `,
      userId: centerUserIds[2], // Klaus Fischer
      parentId: createdPosts[1]._id,
      isResponse: true,
      category: 'Diskussion',
      tags: ['Sortiertechnologie', 'LIBS', 'Erfahrungsbericht'],
      createdAt: new Date('2023-08-20T14:30:00')
    },
    {
      title: 'Re: Erfahrungen mit dem neuen Sortierverfahren für Aluminiumlegierungen?',
      content: `
        Sehr geehrter Herr Weber,
        
        als Nachhaltigkeitsberaterin habe ich mehrere Recyclingunternehmen bei der Einführung optischer Sortiersysteme begleitet. Meine Erfahrungen decken sich weitgehend mit denen von Herrn Fischer.
        
        Ich möchte jedoch ergänzen, dass der Erfolg stark vom Ausgangsmaterial abhängt. Für industrielle Produktionsabfälle mit bekannten Legierungen funktionieren diese Systeme hervorragend, bei gemischtem Post-Consumer-Material ist die Erkennungsrate deutlich niedriger.
        
        Bei der Auswahl eines Systems würde ich auf folgende Punkte achten:
        1. Kalibrierbarkeit für Ihre spezifischen Materialströme
        2. Erweiterbarkeit der Datenbank für neue Legierungen
        3. Automatisierte Reinigungsvorrichtungen für die Sensoren
        4. Guter Support vom Hersteller (idealerweise in Deutschland)
        
        Für weitere Beratung stehe ich gerne zur Verfügung.
        
        Mit freundlichen Grüßen,
        Sophia Wagner
      `,
      userId: userIds[3], // Sophia Wagner
      parentId: createdPosts[1]._id,
      isResponse: true,
      category: 'Diskussion',
      tags: ['Sortiertechnologie', 'Beratung', 'Materialströme'],
      createdAt: new Date('2023-08-21T10:15:00')
    }
  ];
  
  // Create responses to the third main post (waste separation)
  const responses3 = [
    {
      title: 'Re: Wertstofftonne vs. Wertstoffhof - Was ist besser für Aluminium?',
      content: `
        Hallo Laura,
        
        die Frage ist absolut berechtigt! Als Umweltingenieur kann ich dir Folgendes empfehlen:
        
        Für die gelbe Tonne/den gelben Sack eignen sich:
        - Kleinere Aluminiumverpackungen (Joghurtdeckel, Alufolie, kleine Dosen)
        - Diese sollten möglichst sauber und von anderen Materialien getrennt sein
        
        Zum Wertstoffhof sollten:
        - Größere Mengen Aluminium (ab etwa Dosengroße aufwärts)
        - Aluminiumteile, die keine Verpackungen sind (alte Töpfe, Fensterrahmen, etc.)
        - Aluminium mit Verbundmaterialien, die nicht leicht zu trennen sind
        
        Der Grund: Die modernen Sortieranlagen für die gelbe Tonne sind tatsächlich besser geworden, erkennen aber vor allem Standardobjekte zuverlässig. Zudem ist die Trennung für kleine Aluminiumteile im Haushalt praktischer.
        
        Für größere Mengen oder Sonderformen ist der Wertstoffhof die bessere Wahl, da dort direkt sortenrein gesammelt wird. Zudem kannst du beim Wertstoffhof oft eine kleine Vergütung bekommen.
        
        Viele Grüße,
        Thomas
      `,
      userId: userIds[0], // Thomas Müller
      parentId: createdPosts[2]._id,
      isResponse: true,
      category: 'Hilfe',
      tags: ['Mülltrennung', 'Gelbe Tonne', 'Wertstoffhof'],
      createdAt: new Date('2023-09-05T19:30:00')
    },
    {
      title: 'Re: Wertstofftonne vs. Wertstoffhof - Was ist besser für Aluminium?',
      content: `
        Liebe Laura,
        
        ich arbeite seit vielen Jahren im Bereich der Wertstoffsortierung und kann die Antwort von Thomas bestätigen und ergänzen:
        
        Die modernen Sortieranlagen für den Inhalt der gelben Tonnen nutzen verschiedene Technologien:
        1. Magnetscheider (für Eisen, nicht für Alu)
        2. Wirbelstromabscheider (speziell für Aluminium)
        3. Nahinfrarotsensoren (NIR, für Kunststoffe)
        4. Optische Erkennung
        
        Der Wirbelstromabscheider erkennt tatsächlich die meisten Aluminiumteile recht zuverlässig. Die Erkennungsquote liegt bei etwa 85-90% für typische Haushaltsverpackungen.
        
        Problematisch sind vor allem:
        - Sehr kleine Teile (Kronkorken, kleine Deckel)
        - Stark verschmutzte Teile
        - Verbundmaterialien mit geringem Aluminiumanteil
        
        Für den durchschnittlichen Haushalt ist die gelbe Tonne absolut ausreichend für die üblichen Aluminiumverpackungen. Die Umweltbilanz ist hier besser, als wenn jeder einzeln mit dem Auto zum Wertstoffhof fährt.
        
        Für spezielle oder größere Mengen ist der Wertstoffhof natürlich die bessere Wahl.
        
        Viele Grüße,
        Stefan Hoffmann
        GreenMetal Hamburg
      `,
      userId: centerUserIds[1], // Stefan Hoffmann
      parentId: createdPosts[2]._id,
      isResponse: true,
      category: 'Hilfe',
      tags: ['Mülltrennung', 'Sortieranlagen', 'Wirbelstromabscheider'],
      createdAt: new Date('2023-09-06T08:45:00')
    }
  ];
  
  // Add responses from our enhanced forum responses data
  const enhancedResponses = realisticForumResponses.map(response => {
    // Find the corresponding post in our created posts
    const relatedPost = createdPosts.find(post => post._id.toString() === response.postId.toString());
    
    // If the post exists, use its ID, otherwise assign to a random post
    const parentId = relatedPost ? relatedPost._id : createdPosts[Math.floor(Math.random() * createdPosts.length)]._id;
    
    return {
      ...response,
      userId: getRandomUserId(),
      parentId,
      isResponse: true
    };
  });
  
  // Combine all responses
  const allResponses = [...responses1, ...responses2, ...responses3, ...enhancedResponses];
  
  // Save responses
  const responseResult = await db.collection('forumposts').insertMany(allResponses);
  
  // Get created responses with their MongoDB IDs
  const createdResponses = allResponses.map((response, index) => ({
    ...response,
    _id: responseResult.insertedIds[index]
  }));
  
  // Update response count for main posts
  for (const post of createdPosts) {
    const responseCount = await db.collection('forumposts').countDocuments({ parentId: post._id });
    await db.collection('forumposts').updateOne(
      { _id: post._id },
      { $set: { responseCount } }
    );
  }
  
  console.log(`✅ Created ${createdPosts.length} forum posts (including ${enhancedForumPosts.length} enhanced posts) and ${createdResponses.length} responses (including ${enhancedResponses.length} enhanced responses)`);
  
  return [...createdPosts, ...createdResponses];
}

/**
 * Seed reviews for recycling centers
 */
async function seedReviews(db: any, users: any[], centers: any[]) {
  console.log('⭐ Creating reviews for recycling centers...');
  
  // Get user IDs for creating reviews
  const userIds = users.filter(user => user.accountType === 'user').map(user => user._id);
  
  // Reviews for different centers
  const reviews: any[] = [
    // Reviews for Berliner Recycling Zentrum
    {
      userId: userIds[0], // Thomas Müller
      centerId: centers[0]._id, // Berliner Recycling Zentrum
      rating: 5,
      title: 'Hervorragender Service und faire Preise',
      comment: `
        Ich habe kürzlich meine alten Aluminiumfensterrahmen zum Berliner Recycling Zentrum gebracht und war rundum zufrieden. Die Mitarbeiter waren sehr hilfsbereit und haben mir sogar beim Ausladen geholfen. Der Prozess war unkompliziert und schnell. Die Vergütung war fair und wurde sofort bar ausgezahlt. Kann ich nur empfehlen!
      `,
      createdAt: new Date('2023-09-18T15:30:00')
    },
    // ... remaining review objects ...
  ];
  
  // Save reviews to database
  const result = await db.collection('reviews').insertMany(reviews);
  
  // Get created reviews with their MongoDB IDs
  const createdReviews = reviews.map((review, index) => ({
    ...review,
    _id: result.insertedIds[index]
  }));
  
  console.log(`✅ Created ${createdReviews.length} reviews`);
  
  // Update average ratings for each center
  for (const center of centers) {
    const centerReviews = reviews.filter(review => review.centerId.toString() === center._id.toString());
    if (centerReviews.length > 0) {
      const averageRating = centerReviews.reduce((sum, review) => sum + review.rating, 0) / centerReviews.length;
      await db.collection('recyclingcenters').updateOne(
        { _id: center._id },
        { $set: { rating: averageRating } }
      );
    }
  }
  
  return createdReviews;
}

/**
 * Seed marketplace items with realistic German data
 */
async function seedMarketplaceItems(db: any, users: any[]) {
  console.log('🛒 Creating marketplace items...');
  
  // Get user IDs for creating marketplace items
  const userIds = users.map(user => user._id);
  
  // Create marketplace items
  const marketplaceItems = [
    {
      title: 'Aluminiumspäne aus Dreherei - 200kg',
      description: `
        Biete ca. 200kg saubere Aluminiumspäne aus unserer Dreherei an. Es handelt sich um Späne der Legierung AlMg3 (EN AW-5754), sortenrein und ohne Verunreinigungen durch Kühlschmierstoffe, da wir trocken bearbeiten.
        
        Die Späne sind in 4 Big Bags zu je 50kg verpackt und können nach Terminvereinbarung in unserem Betrieb in München-Moosach abgeholt werden. Versand ist aufgrund des Gewichts und Volumens leider nicht möglich.
        
        Preisvorstellung: 220€ für alle 200kg (1,10€/kg).
        
        Bei Interesse gerne Nachricht oder Anruf.
      `,
      price: 220,
      category: 'Verkauf',
      condition: 'Neu',
      location: 'München',
      images: ['/marketplace/aluminium-spaene.jpg'],
      tags: ['Aluminiumspäne', 'AlMg3', 'Dreherei', 'Großmenge'],
      userId: userIds[2], // Markus Weber
      contactPhone: '0151 12345678',
      contactEmail: 'markus.weber@example.de',
      createdAt: new Date('2023-09-10T09:30:00')
    },
    {
      title: 'Alte Aluminiumfensterrahmen zu verschenken',
      description: `
        Bei meiner Renovierung sind 5 alte Aluminiumfensterrahmen übrig geblieben. Die Fenster selbst (Glas) sind bereits entfernt, es handelt sich nur um die Rahmen.
        
        Die Rahmen stammen aus den 1980er Jahren und sind silber eloxiert. Maße ca. 120x80cm. Sie sind noch in brauchbarem Zustand, haben aber natürlich Gebrauchsspuren.
        
        Ideal für Bastler oder zum Recycling. Die Rahmen stehen in meiner Garage in Berlin-Kreuzberg und können nach Absprache abgeholt werden.
        
        Zu verschenken gegen Selbstabholung.
      `,
      price: 0,
      category: 'Verschenken',
      condition: 'Gebraucht',
      location: 'Berlin',
      images: ['/marketplace/fensterrahmen.jpg'],
      tags: ['Fensterrahmen', 'Aluminium', 'Kostenlos', 'Bastler'],
      userId: userIds[0], // Thomas Müller
      contactPhone: '0170 87654321',
      contactEmail: 'thomas.mueller@example.de',
      createdAt: new Date('2023-09-15T16:45:00')
    },
    {
      title: 'Suche Aluminiumdosen für Schulprojekt',
      description: `
        Hallo zusammen,
        
        für ein Schulprojekt zum Thema "Kreislaufwirtschaft" suche ich mit meinen Schülerinnen und Schülern etwa 100-150 leere Aluminiumdosen (Getränkedosen).
        
        Die Dosen sollten möglichst sauber sein und keine Dellen haben. Wir wollen daraus verschiedene Modelle und Kunstobjekte bauen und anschließend in einer Ausstellung zum Thema Recycling präsentieren.
        
        Wenn ihr noch Dosen habt oder in den nächsten 2 Wochen sammeln könntet, wäre das super. Wir können sie gerne abholen im Raum Frankfurt.
        
        Vielen Dank für eure Unterstützung!
      `,
      price: 0,
      category: 'Suche',
      condition: 'Gebraucht',
      location: 'Frankfurt',
      images: ['/marketplace/dosen-schulprojekt.jpg'],
      tags: ['Aluminiumdosen', 'Schule', 'Projekt', 'Kunst'],
      userId: userIds[3], // Sophia Wagner
      contactPhone: '0160 55443322',
      contactEmail: 'sophia.wagner@example.de',
      createdAt: new Date('2023-09-18T12:15:00')
    },
    {
      title: 'Aluminium-Druckgussteile zu verkaufen - Restposten',
      description: `
        Verkaufe einen Restposten von 80 Aluminium-Druckgussteilen aus einer eingestellten Produktion. Es handelt sich um Gehäuseteile für elektronische Geräte, die nicht mehr benötigt werden.
        
        Technische Daten:
        - Material: AlSi9Cu3(Fe) (EN AC-46000)
        - Maße: ca. 15x10x5 cm pro Teil
        - Gewicht: ca. 350g pro Teil
        - Insgesamt ca. 28kg
        
        Die Teile sind unbearbeitet (Gusszustand), können aber problemlos weiterverarbeitet werden. Qualität wurde geprüft, es handelt sich um einwandfreie Teile ohne Porositäten oder andere Gussfehler.
        
        Preisvorstellung: 170€ für alle Teile (ca. 6€ pro Stück).
        
        Standort ist in Hamburg, Versand gegen Aufpreis möglich.
      `,
      price: 170,
      category: 'Verkauf',
      condition: 'Neu',
      location: 'Hamburg',
      images: ['/marketplace/druckgussteile.jpg', '/marketplace/druckgussteile-detail.jpg'],
      tags: ['Druckguss', 'Aluminium', 'Gehäuse', 'Restposten'],
      userId: userIds[1], // Laura Schmitt
      contactPhone: '0176 12345678',
      contactEmail: 'laura.schmitt@example.de',
      createdAt: new Date('2023-09-05T10:30:00')
    },
    {
      title: 'Hochwertige Aluminiumprofile für Konstruktion',
      description: `
        Biete verschiedene Aluminiumprofile für Konstruktionszwecke an. Die Profile sind neu und wurden lediglich für ein Projekt eingekauft, das dann doch nicht realisiert wurde.
        
        Vorhanden sind:
        - 6x Vierkantprofile 40x40mm, Länge 2m
        - 4x Rechteckprofile 60x30mm, Länge 2m
        - 8x L-Profile 30x30mm, Länge 2m
        
        Material ist EN AW-6060 T66 (AlMgSi0,5), sehr gut für Konstruktionszwecke geeignet.
        
        Neupreis lag bei etwa 280€, ich verkaufe alle Profile zusammen für 180€.
        
        Abholung in Köln oder Versand gegen Aufpreis möglich.
      `,
      price: 180,
      category: 'Verkauf',
      condition: 'Neu',
      location: 'Köln',
      images: ['/marketplace/aluprofile.jpg'],
      tags: ['Aluminiumprofile', 'Konstruktion', 'Baumaterial', '6060'],
      userId: userIds[4], // Jan Becker
      contactPhone: '0151 98765432',
      contactEmail: 'jan.becker@example.de',
      createdAt: new Date('2023-08-28T15:20:00')
    }
  ];
  
  // Save marketplace items to database
  const result = await db.collection('marketplaceitems').insertMany(marketplaceItems);
  
  // Get created items with their MongoDB IDs
  const createdItems = marketplaceItems.map((item, index) => ({
    ...item,
    _id: result.insertedIds[index]
  }));
  
  console.log(`✅ Created ${createdItems.length} marketplace items`);
  
  return createdItems;
}

// Run the seed function
seedDatabase(); 