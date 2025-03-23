#!/usr/bin/env node

const mongoose = require('mongoose');
const readline = require('readline');
const { generateSlug } = require('../models/BlogPost');

// Seed data
const magazinSeedData = [
  {
    title: "Die Zukunft des Aluminium-Recyclings in Deutschland",
    excerpt: "Ein Blick auf die neuesten Technologien und Entwicklungen im Bereich des Aluminium-Recyclings und wie sie die Zukunft der Kreislaufwirtschaft in Deutschland gestalten werden.",
    content: `Aluminium ist eines der am häufigsten recycelten Materialien weltweit und besonders in Deutschland hat sich eine fortschrittliche Recycling-Infrastruktur entwickelt. Die Zukunft des Aluminium-Recyclings in Deutschland sieht vielversprechend aus.

**Innovative Technologien verändern die Branche**

In den letzten Jahren haben technologische Fortschritte das Aluminium-Recycling effizienter und umweltfreundlicher gemacht. Moderne Sortieranlagen nutzen künstliche Intelligenz und Sensortechnologie, um verschiedene Aluminiumlegierungen präzise zu trennen. Diese Präzision war früher nicht möglich und eröffnet neue Möglichkeiten für die Wiederverwertung von komplexen Produkten.

## Höhere Recyclingraten durch verbesserte Sammelsysteme

Deutschland hat bereits eine der höchsten Recyclingraten für Aluminium in Europa, aber es gibt immer noch Raum für Verbesserungen. Neue Sammelsysteme, die auf dem Prinzip der erweiterten Herstellerverantwortung basieren, werden eingeführt, um die Rückgewinnung von Aluminium aus Verpackungen, Elektronik und Fahrzeugen zu maximieren.

* Einführung von digitalen Pfandsystemen für Aluminiumverpackungen
* Optimierte Logistikketten für gewerblichen Aluminiumschrott
* Automatisierte Rücknahmestationen in Einzelhandelsgeschäften

### Wirtschaftliche Vorteile des Aluminium-Recyclings

Das Recycling von Aluminium spart nicht nur Ressourcen, sondern bietet auch erhebliche wirtschaftliche Vorteile. Im Vergleich zur Primärproduktion verbraucht das Recycling von Aluminium etwa 95% weniger Energie. Dies führt zu niedrigeren Kosten und einer geringeren Umweltbelastung.

Die deutsche Recyclingwirtschaft schafft zudem zahlreiche Arbeitsplätze und trägt zur lokalen Wertschöpfung bei. Experten schätzen, dass der Sektor in den kommenden Jahren weiter wachsen wird, insbesondere durch die steigende Nachfrage nach recyceltem Material in der Automobilindustrie und anderen Hightech-Branchen.

Die Kreislaufwirtschaft für Aluminium ist ein Paradebeispiel für nachhaltiges Wirtschaften und wird in Zukunft eine noch wichtigere Rolle in Deutschlands Strategie zur Reduzierung von CO2-Emissionen und Ressourcenverbrauch spielen.`,
    image: "/images/magazin/aluminium-recycling-zukunft.jpg",
    author: "Dr. Michael Schmidt",
    authorTitle: "Materialwissenschaftler",
    category: "Technologie",
    tags: ["Aluminium", "Recycling", "Innovation", "Kreislaufwirtschaft", "Nachhaltigkeit"],
    isPremium: false,
    date: new Date("2023-11-15")
  },
  {
    title: "Wie Sie Ihren Aluminium-Abfall richtig trennen",
    excerpt: "Praktische Tipps für den Alltag: Erfahren Sie, wie Sie Aluminium korrekt sortieren und entsorgen können, um zum effektiven Recycling beizutragen.",
    content: `Die richtige Trennung von Aluminium-Abfall ist ein wichtiger Beitrag zum Umweltschutz. Obwohl viele Menschen denken, dass sie ihren Abfall korrekt trennen, gibt es oft Unsicherheiten bezüglich Aluminiumprodukten. Dieser Leitfaden hilft Ihnen, Aluminium richtig zu recyceln.

**Welche Aluminiumprodukte können recycelt werden?**

Grundsätzlich können fast alle Aluminiumprodukte recycelt werden. Zu den häufigsten recycelbaren Aluminiumprodukten gehören:

* Getränkedosen
* Aluminiumfolie und Schalen
* Kaffeekapseln aus Aluminium
* Tuben (z.B. für Senf oder Tomatenmark)
* Verschlüsse von Gläsern und Flaschen
* Kleine Haushaltsgegenstände aus Aluminium

## Vorbereitung für das Recycling

Bevor Sie Aluminiumprodukte in die Sammlung geben, sollten Sie einige Vorbereitungen treffen:

### Reinigung

Entfernen Sie grobe Essensreste und spülen Sie die Aluminiumprodukte kurz aus. Perfekte Sauberkeit ist nicht notwendig, aber starke Verschmutzungen können den Recyclingprozess beeinträchtigen.

### Komprimierung

Drücken Sie Dosen und andere hohle Aluminiumgegenstände zusammen, um Platz zu sparen. Dies macht die Sammlung und den Transport effizienter.

### Trennung von Verbundmaterialien

Bei Produkten, die aus Aluminium und anderen Materialien bestehen, versuchen Sie, diese zu trennen. Beispielsweise können Sie bei Kaffeekapseln den Kaffee entfernen und nur die Aluminiumhülle recyceln.

## Die richtige Entsorgung

In Deutschland gibt es verschiedene Möglichkeiten zur Entsorgung von Aluminium:

* **Gelber Sack/Gelbe Tonne**: Hier gehören Verpackungen aus Aluminium hinein
* **Wertstoffhof**: Größere Aluminiumgegenstände können zum Wertstoffhof gebracht werden
* **Schrottsammler**: Einige mobile Schrottsammler nehmen auch Aluminium an
* **Pfandsystem**: Für Aluminiumdosen gibt es in Deutschland ein Pfandsystem

**Häufige Fehler vermeiden**

Ein häufiger Irrtum ist, dass alles, was silbern glänzt, auch Aluminium ist. Viele Verpackungen, die wie Aluminium aussehen, sind jedoch beschichtete Kunststoffe. Ein einfacher Test: Echtes Aluminium behält seine Form, wenn Sie es zusammendrücken, während Kunststofffolien zurückspringen.

Durch die korrekte Trennung und Entsorgung von Aluminium leisten Sie einen wichtigen Beitrag zum Umweltschutz und zur Ressourcenschonung. Jede recycelte Aluminiumdose spart genug Energie, um einen Fernseher drei Stunden lang zu betreiben!`,
    image: "/images/magazin/aluminium-trennung-guide.jpg",
    author: "Lisa Müller",
    authorTitle: "Umweltberaterin",
    category: "Tipps & Tricks",
    tags: ["Mülltrennung", "Recycling", "Haushalt", "Nachhaltigkeit", "Umweltschutz"],
    isPremium: false,
    date: new Date("2023-09-22")
  },
  {
    title: "Europäische Recycling-Ziele: Herausforderungen für Deutschland",
    excerpt: "Analyse der EU-Recyclingvorgaben und wie Deutschland seine Strategie anpassen muss, um die ambitionierten Ziele für Aluminium und andere Materialien zu erreichen.",
    content: `Die Europäische Union hat im Rahmen des European Green Deal und des Aktionsplans für die Kreislaufwirtschaft ambitionierte Recyclingziele festgelegt. Diese stellen auch für ein Vorreiterland wie Deutschland neue Herausforderungen dar, insbesondere im Bereich des Aluminium-Recyclings.

**Die aktuellen EU-Ziele für Aluminium**

Die EU hat folgende Recyclingziele für Aluminiumverpackungen festgelegt:

* Bis 2025: 50% aller Aluminiumverpackungen müssen recycelt werden
* Bis 2030: 60% Recyclingquote für Aluminiumverpackungen
* Langfristiges Ziel: Vollständige Kreislaufwirtschaft für alle Metalle

## Deutschlands aktuelle Position

Deutschland erfüllt bereits heute viele der EU-Vorgaben für Recycling. Bei Aluminium liegt die Recyclingquote bei etwa 87% für Getränkedosen, was deutlich über dem EU-Durchschnitt liegt. Dennoch gibt es Bereiche, in denen Verbesserungsbedarf besteht:

### Herausforderungen für die deutsche Recyclingstrategie

Deutschland steht vor mehreren Herausforderungen, um die EU-Ziele vollständig zu erfüllen:

* **Komplexe Verbundmaterialien**: Viele moderne Produkte kombinieren Aluminium mit anderen Materialien, was das Recycling erschwert.
* **Exportdynamik**: Ein bedeutender Teil des in Deutschland gesammelten Aluminiumschrotts wird exportiert, was die Kontrolle über den tatsächlichen Recyclingprozess erschwert.
* **Qualität vs. Quantität**: Die EU-Ziele fokussieren sich zunehmend auch auf die Qualität des recycelten Materials, nicht nur auf die Menge.

## Politische Maßnahmen und wirtschaftliche Auswirkungen

Die Bundesregierung hat verschiedene Maßnahmen ergriffen, um die Recyclingquoten weiter zu verbessern:

* Novellierung des Verpackungsgesetzes
* Stärkung der Herstellerverantwortung
* Förderung von Forschung und Innovation im Recyclingbereich

Diese Maßnahmen haben auch wirtschaftliche Konsequenzen. Einerseits entstehen Kosten für die Anpassung von Sammelsystemen und Recyclingtechnologien. Andererseits eröffnen sich neue Geschäftschancen für innovative Unternehmen im Bereich der Kreislaufwirtschaft.

**Die Rolle der Verbraucher**

Ein oft unterschätzter Faktor bei der Erreichung der Recyclingziele ist das Verbraucherverhalten. Aufklärungskampagnen und Bildungsinitiativen sind notwendig, um das Bewusstsein für die Bedeutung korrekter Mülltrennung zu schärfen.

Trotz der Herausforderungen ist Deutschland gut positioniert, um die europäischen Recyclingziele zu erreichen. Mit dem richtigen Mix aus politischen Maßnahmen, technologischen Innovationen und Verbraucherbewusstsein kann Deutschland seine Führungsrolle im Bereich des Aluminium-Recyclings in Europa weiter ausbauen.`,
    image: "/images/magazin/eu-recycling-ziele.jpg",
    author: "Prof. Dr. Thomas Weber",
    authorTitle: "Umweltökonom",
    category: "Politik",
    tags: ["EU", "Umweltpolitik", "Recyclingziele", "Kreislaufwirtschaft", "Nachhaltigkeit"],
    isPremium: true,
    date: new Date("2023-10-05")
  }
];

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aluminum-recycling';

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return false;
  }
}

// Define a simple BlogPost schema
const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String, default: '/blog-post-placeholder.jpg' },
    author: { type: String, required: true },
    authorTitle: { type: String, required: true },
    category: { type: String, required: true },
    tags: { type: [String], default: [] },
    isPremium: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Generate slug if not provided
BlogPostSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = generateSlug(this.title);
  }
  next();
});

// Create model
const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema);

// Ask for user confirmation
function askForConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Add slugs to seed data
const enrichedSeedData = magazinSeedData.map(post => ({
  ...post,
  slug: post.slug || generateSlug(post.title)
}));

// Seed function
async function seedMagazinArticles() {
  console.log('=== Starting Magazine Seeding Process ===');
  
  // Connect to database
  const connected = await connectToMongoDB();
  if (!connected) {
    console.error('Could not connect to database. Exiting...');
    process.exit(1);
  }
  
  try {
    // Check if we already have articles
    const existingCount = await BlogPost.countDocuments();
    console.log(`Found ${existingCount} existing articles`);
    
    if (existingCount > 0) {
      const shouldContinue = await askForConfirmation(
        `There are already ${existingCount} articles in the database. Do you want to delete them and seed new ones? (y/n) `
      );
      
      if (!shouldContinue) {
        console.log('Seeding canceled by user');
        process.exit(0);
      }
      
      // Delete existing articles
      await BlogPost.deleteMany({});
      console.log('Deleted existing articles');
    }
    
    // Insert seed data
    console.log(`Inserting ${enrichedSeedData.length} magazine articles...`);
    const result = await BlogPost.insertMany(enrichedSeedData);
    
    // Log article info
    console.log(`Successfully seeded ${result.length} magazine articles:`);
    result.forEach((article) => {
      console.log(`- ${article.title} (${article.category}) [${article.slug}]`);
    });
    
    console.log('\nSeeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the seed function
seedMagazinArticles(); 