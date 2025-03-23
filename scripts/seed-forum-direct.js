/**
 * Direct forum seeding script
 * Seeds the database with German forum posts about recycling
 * This version includes the data directly in the script
 */

import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aluminum-recycling';

// Create a timestamp within the last 6 months
const randomRecentDate = () => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000);
  return pastDate.toISOString();
};

// Generate forum data directly
function generateForumData() {
  // Mock user IDs
  const userIds = {
    thomas: "user_thomas_" + uuidv4().substring(0, 8),
    laura: "user_laura_" + uuidv4().substring(0, 8),
    markus: "user_markus_" + uuidv4().substring(0, 8),
    jan: "user_jan_" + uuidv4().substring(0, 8),
    maria: "user_maria_" + uuidv4().substring(0, 8),
    stefan: "user_stefan_" + uuidv4().substring(0, 8),
    anna: "user_anna_" + uuidv4().substring(0, 8),
    michael: "user_michael_" + uuidv4().substring(0, 8),
    sarah: "user_sarah_" + uuidv4().substring(0, 8),
    lars: "user_lars_" + uuidv4().substring(0, 8),
  };

  // Generate forum posts
  const forumPosts = [
    {
      _id: uuidv4(),
      title: "Zero-Waste Lebensstil: Meine Erfahrungen nach einem Jahr",
      content: `Hallo zusammen,

Vor genau einem Jahr habe ich beschlossen, meinen Lebensstil auf Zero-Waste umzustellen. Ich möchte heute meine Erfahrungen teilen und ein paar Tipps geben, die mir besonders bei der Reduzierung von Aluminium- und Plastikverpackungen geholfen haben.

**Meine Top 5 Maßnahmen:**

1. **Unverpackt-Laden statt Supermarkt**: Ich kaufe Grundnahrungsmittel wie Reis, Nudeln, Müsli und Nüsse nur noch in Unverpackt-Läden mit eigenen Behältern. In Hamburg gibt es mittlerweile vier solcher Läden!

2. **Metallstrohhalme und Brotdosen aus Edelstahl**: Kein Einweg-Aluminium oder Plastik mehr für unterwegs.

3. **Selbstgemachte Körperpflege**: Ich stelle Deo, Zahnpasta und Seife jetzt selbst her. Erstaunlich einfach und keine Verpackung mehr nötig.

4. **Milch vom Bauern im Mehrwegglas**: Statt Tetrapaks kaufe ich direkt vom Erzeuger im Pfandglas.

5. **"Nein, danke" zur Alufolie**: Bienenwachstücher sind eine super Alternative!

Was mir noch schwerfällt: Gewisse Elektronik und Ersatzteile sind kaum ohne Verpackung zu bekommen. Hat jemand Tipps dazu?

Die größte Überraschung: Ich spare tatsächlich Geld, obwohl ich dachte, Zero-Waste sei teurer. Die Anfangsinvestitionen in wiederverwendbare Produkte amortisieren sich erstaunlich schnell.

Wie sind eure Erfahrungen? Was funktioniert gut, was ist schwierig?

Viele Grüße,
Anna`,
      userId: userIds.anna,
      username: "Anna_Schmidt",
      userAvatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop",
      category: "Erfahrungsberichte",
      tags: ["Zero-Waste", "Nachhaltigkeit", "Verpackungsfrei", "Alltagstipps"],
      views: 342,
      upvotes: 28,
      downvotes: 2,
      responseCount: 15,
      createdAt: randomRecentDate(),
      updatedAt: randomRecentDate()
    },
    {
      _id: uuidv4(),
      title: "Aktueller Stand: Was passiert wirklich mit unserem recycelten Aluminium?",
      content: `Guten Tag zusammen,

Als Umweltingenieur beschäftige ich mich beruflich mit Materialkreisläufen und möchte heute einmal aufklären, was tatsächlich mit dem Aluminium passiert, das wir trennen und entsorgen.

**Aktuelle Zahlen für Deutschland (2022):**
- Recyclingquote für Aluminiumverpackungen: 90,2%
- Energieeinsparung durch Recycling: 95% im Vergleich zur Neuproduktion
- CO2-Einsparung: 8 Tonnen pro Tonne recyceltes Aluminium

**Der tatsächliche Prozess:**
1. Sammlung (Gelbe Tonne/Sack oder Wertstoffhof)
2. Vorsortierung in Sortieranlagen
3. Aufbereitung (Reinigung, Schreddern)
4. Einschmelzen bei ca. 660-720°C
5. Legierungszusammensetzung anpassen
6. Gießen neuer Produkte

**Probleme im System:**
- Nicht alle Verbundmaterialien mit Aluminium können effizient getrennt werden
- Kleinteile (unter 2cm) werden oft nicht erkannt und gehen verloren
- Verschmutztes Aluminium verursacht Qualitätsverluste

**Was können wir besser machen?**
- Aludeckel von Joghurtbechern vor Entsorgung abtrennen
- Kaffeekapseln vollständig entleeren
- Alufolie möglichst sauber halten und zu größeren Bällen formen

Ich freue mich auf eure Fragen und Anmerkungen zum Thema!

Mit freundlichen Grüßen,
Dr. Michael Berger`,
      userId: userIds.michael,
      username: "Dr_Berger",
      userAvatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop",
      category: "Fachdiskussion",
      tags: ["Aluminium", "Recyclingprozess", "Kreislaufwirtschaft", "Experteninfo"],
      views: 521,
      upvotes: 47,
      downvotes: 3,
      responseCount: 23,
      createdAt: randomRecentDate(),
      updatedAt: randomRecentDate()
    },
    {
      _id: uuidv4(),
      title: "Umfrage: Welche Recycling-Mythen halten sich hartnäckig?",
      content: `Liebe Community,

Für eine Informationskampagne unserer lokalen Umweltinitiative "GrüneZukunft Bayern" sammle ich Recycling-Mythen, die sich hartnäckig halten. Ich würde mich freuen, wenn ihr mir helfen könntet, die gängigsten Missverständnisse zum Thema Aluminium- und allgemeines Recycling zusammenzutragen.

**Beispiele für Mythen, die ich bereits gesammelt habe:**

1. "Die Mülltrennung ist sinnlos, weil am Ende doch alles zusammengekippt wird."
2. "Joghurtbecher müssen vor dem Einwerfen gespült werden."
3. "Schwarzer Kunststoff kann nicht recycelt werden."
4. "Aluminiumfolie mit Essensresten kann problemlos recycelt werden."
5. "Die Deckel von Glasflaschen müssen immer entfernt werden."

**Welche Recycling-Mythen habt ihr schon gehört?** 
**Und noch wichtiger: Könnt ihr aufklären, was wirklich stimmt?**

Die gesammelten Informationen werden in eine Broschüre und eine Social-Media-Kampagne einfließen, mit der wir besonders ältere Menschen und Familien mit Kindern erreichen wollen.

Vielen Dank für eure Mithilfe!
Sarah Hofmann
GrüneZukunft Bayern`,
      userId: userIds.sarah,
      username: "Sarah_H",
      userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      category: "Umfragen",
      tags: ["Recycling-Mythen", "Aufklärung", "Mülltrennung", "Umweltbildung"],
      views: 298,
      upvotes: 32,
      downvotes: 0,
      responseCount: 28,
      createdAt: randomRecentDate(),
      updatedAt: randomRecentDate()
    },
    {
      _id: uuidv4(),
      title: "Neues Verfahren zur Trennung von Aluminium-Verbundmaterialien vorgestellt",
      content: `Sehr geehrte Fachkolleginnen und -kollegen,

auf der RecyclingTech 2023 in Düsseldorf wurde letzte Woche ein innovatives Verfahren zur besseren Trennung von Aluminium-Verbundmaterialien vorgestellt, das ich hier kurz zusammenfassen möchte.

**Das "HydroSep"-Verfahren:**

Das von der TU Dresden entwickelte Verfahren nutzt eine neuartige Kombination aus Ultraschall und speziellen Enzymen, um die problematische Trennung von Aluminium-Kunststoff-Verbunden zu optimieren. Bisherige Verfahren konnten nur etwa 60-70% des Aluminiums aus solchen Verbunden zurückgewinnen.

**Vorteile des neuen Verfahrens:**
- Rückgewinnungsquote von über 92% des enthaltenen Aluminiums
- Energieeffizienter als thermische Trennverfahren (ca. 40% weniger Energiebedarf)
- Die Kunststofffraktion bleibt weitgehend unbeeinträchtigt und kann ebenfalls recycelt werden
- Geringer Wasserverbrauch durch Kreislaufführung

**Anwendungsgebiete:**
- Verbundfolien (z.B. Kaffeeverpackungen)
- Getränkekartons mit Alubeschichtung
- Blisterverpackungen von Medikamenten
- Bestimmte Elektronikkomponenten

Die ersten Pilotanlagen sollen Anfang 2024 in Betrieb gehen. Eine Musteranlage kann bereits jetzt an der TU Dresden besichtigt werden.

Bei Interesse an weiteren technischen Details und Wirtschaftlichkeitsberechnungen stehe ich gerne zur Verfügung, da ich am Forschungsprojekt beteiligt war.

Mit freundlichen Grüßen,
Prof. Dr. Lars Weber
Institut für Kreislaufwirtschaft, TU Dresden`,
      userId: userIds.lars,
      username: "Prof_Weber",
      userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
      category: "News",
      tags: ["Innovation", "Verbundmaterialien", "Trennverfahren", "Forschung"],
      views: 412,
      upvotes: 53,
      downvotes: 1,
      responseCount: 18,
      createdAt: randomRecentDate(),
      updatedAt: randomRecentDate()
    },
    {
      _id: uuidv4(),
      title: "Diskussion: Ist Aluminium das ideale Kreislaufmaterial?",
      content: `Liebe Community,

ich möchte eine Diskussion darüber anstoßen, ob Aluminium tatsächlich das "perfekte" Kreislaufmaterial ist, wie es oft dargestellt wird.

**Pro-Argumente:**
1. Theoretisch unbegrenzt oft recycelbar ohne Qualitätsverlust
2. Enorme Energieeinsparung beim Recycling (bis zu 95% gegenüber der Primärproduktion)
3. Hohe Wertschöpfung im Kreislauf
4. Leichtgewicht (relevant für Transport und Emissionen)
5. Korrosionsbeständigkeit

**Kontra-Argumente:**
1. Extrem energieintensive Primärproduktion
2. Oft problematische Abbaubedingungen für Bauxit (Umweltzerstörung, soziale Konflikte)
3. Hohe CO2-Emissionen bei der Herstellung
4. Viele Aluminium-Produkte sind nicht recyclinggerecht designt
5. Tendenziell steigender Verbrauch trotz besserer Alternativen in manchen Anwendungen

Was denkt ihr? Ist Aluminium zu Recht das "Vorzeigematerial" der Kreislaufwirtschaft? Oder gibt es bessere Materialien? Und in welchen Anwendungen sollten wir Aluminium bevorzugen oder vermeiden?

Freue mich auf eine sachliche Diskussion!

Viele Grüße,
Markus`,
      userId: userIds.markus,
      username: "Markus_Weber",
      userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      category: "Diskussion",
      tags: ["Kreislaufwirtschaft", "Materialvergleich", "Nachhaltigkeit", "Aluminium"],
      views: 278,
      upvotes: 24,
      downvotes: 3,
      responseCount: 16,
      createdAt: randomRecentDate(),
      updatedAt: randomRecentDate()
    }
  ];

  // Generate forum responses
  const forumResponses = [
    {
      _id: uuidv4(),
      postId: forumPosts[0]._id, // Reference to first post
      content: `Hallo Anna,

danke für deinen inspirierenden Beitrag! Ich bin selbst seit etwa 8 Monaten auf dem Zero-Waste-Pfad und kann vieles bestätigen, was du schreibst.

Besonders wichtig finde ich deinen Punkt mit den Bienenwachstüchern - die nutze ich auch und sie halten bei mir schon sehr lange. 

Zu deiner Frage bezüglich Elektronik: Das ist wirklich schwierig. Was mir geholfen hat:
- Lokale Repair-Cafés nutzen, um Geräte länger am Leben zu halten
- Gebrauchtkauf über eBay Kleinanzeigen oder refurbed.de
- Für unvermeidbare Neuanschaffungen: Hersteller wie Fairphone oder Shift wählen, die auf Reparierbarkeit und modularen Aufbau setzen

Vielleicht hilft dir das weiter?

Viele Grüße,
Thomas`,
      userId: userIds.thomas,
      username: "Thomas_K",
      userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
      upvotes: 8,
      downvotes: 0,
      createdAt: randomRecentDate(),
      updatedAt: randomRecentDate()
    },
    {
      _id: uuidv4(),
      postId: forumPosts[0]._id, // Reference to first post
      content: `Hi Anna,

toller Bericht! Ich habe auch mit Zero Waste angefangen, aber aus Kostengründen wieder aufgehört. Ich finde, du unterschätzt den zeitlichen Aufwand - allein die Fahrten zu verschiedenen Spezialläden statt einem Supermarkt kosten mich viel Zeit und Nerven.

Was sind deine Tipps für Zeitsparende Zero-Waste-Maßnahmen?

LG Laura`,
      userId: userIds.laura,
      username: "Laura_M",
      userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      upvotes: 3,
      downvotes: 1,
      createdAt: randomRecentDate(),
      updatedAt: randomRecentDate()
    },
    {
      _id: uuidv4(),
      postId: forumPosts[3]._id, // Reference to fourth post (the technical one)
      content: `Sehr geehrter Herr Prof. Dr. Weber,

vielen Dank für diesen informativen Beitrag. Ich arbeite bei einem mittelständischen Recyclingunternehmen und wir sind sehr an neuen Verfahren zur besseren Trennung von Verbundmaterialien interessiert.

Zwei Fragen hätte ich:
1. Wie hoch sind die zu erwartenden Investitionskosten für eine industrielle Anlage?
2. Gibt es bereits Überlegungen für Lizenzierungsmöglichkeiten?

Wir würden uns freuen, wenn Sie uns weitere Informationen zukommen lassen könnten oder vielleicht sogar für ein persönliches Gespräch zur Verfügung stünden.

Mit freundlichen Grüßen,
Jan Müller
Technischer Leiter
EcoRecycle GmbH`,
      userId: userIds.jan,
      username: "Jan_Mueller",
      userAvatar: null,
      upvotes: 12,
      downvotes: 0,
      createdAt: randomRecentDate(),
      updatedAt: randomRecentDate()
    }
  ];

  return { forumPosts, forumResponses, userIds };
}

// Main function to seed forum data
async function seedForumDirect() {
  console.log('🌱 Seeding forum data directly...');
  
  // Generate forum data
  const forumData = generateForumData();
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing forum posts and responses
    console.log('🧹 Clearing existing forum data...');
    await db.collection('forumposts').deleteMany({});
    
    // Create user accounts if they don't exist
    console.log('👤 Checking for users...');
    const usersCount = await db.collection('users').countDocuments();
    
    if (usersCount === 0) {
      console.log('👤 Creating sample users...');
      const users = [
        {
          username: 'MariaM',
          email: 'maria@example.com',
          password: '$2a$10$kIqR5rWqEAIBJJNTT6CdZ.T9GloeaCP6l.MK2X3D4kA4aJXFuhbpe', // 'password123'
          name: 'Maria Müller',
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          username: 'ThomasS',
          email: 'thomas@example.com',
          password: '$2a$10$kIqR5rWqEAIBJJNTT6CdZ.T9GloeaCP6l.MK2X3D4kA4aJXFuhbpe', // 'password123'
          name: 'Thomas Schmidt',
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          username: 'AnnaW',
          email: 'anna@example.com',
          password: '$2a$10$kIqR5rWqEAIBJJNTT6CdZ.T9GloeaCP6l.MK2X3D4kA4aJXFuhbpe', // 'password123'
          name: 'Anna Weber',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const result = await db.collection('users').insertMany(users);
      console.log(`✅ Created ${result.insertedCount} sample users`);
    } else {
      console.log(`✅ Found ${usersCount} existing users`);
    }
    
    // Get user IDs to associate with forum posts
    const users = await db.collection('users').find({}).toArray();
    
    // Prepare forum posts by associating with real user IDs
    console.log('📝 Preparing forum posts...');
    const posts = forumData.forumPosts.map((post, index) => {
      // Assign a user to this post (cycling through available users)
      const user = users[index % users.length];
      
      return {
        ...post,
        userId: user._id,
        username: user.username || post.username,
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt)
      };
    });
    
    // Insert forum posts
    console.log('📝 Inserting forum posts...');
    const postsResult = await db.collection('forumposts').insertMany(posts);
    console.log(`✅ Inserted ${postsResult.insertedCount} forum posts`);
    
    // Map old post IDs to new MongoDB IDs
    const postIdMap = posts.reduce((map, post, index) => {
      const oldId = forumData.forumPosts[index]._id;
      map[oldId] = postsResult.insertedIds[index];
      return map;
    }, {});
    
    // Prepare forum responses by updating post references
    console.log('📝 Preparing forum responses...');
    const responses = forumData.forumResponses.map((response, index) => {
      // Assign a user to this response (cycling through available users)
      const user = users[(index + 1) % users.length];
      
      return {
        ...response,
        postId: postIdMap[response.postId] || response.postId, // Map to new post ID
        userId: user._id,
        username: user.username || response.username,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt)
      };
    });
    
    // Insert forum responses
    if (responses.length > 0) {
      console.log('📝 Inserting forum responses...');
      const responsesResult = await db.collection('forumposts').insertMany(responses);
      console.log(`✅ Inserted ${responsesResult.insertedCount} forum responses`);
    }
    
    // Update response counts on posts
    console.log('📝 Updating post response counts...');
    for (const [oldPostId, newPostId] of Object.entries(postIdMap)) {
      const responseCount = responses.filter(r => r.postId.toString() === newPostId.toString()).length;
      
      if (responseCount > 0) {
        await db.collection('forumposts').updateOne(
          { _id: newPostId },
          { $set: { responseCount } }
        );
      }
    }
    
    console.log('✅ Forum data seeding completed successfully!');
    await client.close();
    
  } catch (error) {
    console.error('❌ Error seeding forum data:', error);
    process.exit(1);
  }
}

// Run the function
seedForumDirect().catch(console.error); 