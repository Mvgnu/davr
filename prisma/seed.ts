import { PrismaClient, VerificationStatus, ListingStatus, ListingType, DayOfWeek } from '@prisma/client';
import * as bcrypt from 'bcryptjs'; // Use bcryptjs directly for initial hashing
import { prisma } from '@/lib/db/prisma'; // Correct path
import { Prisma } from '@prisma/client';

const prismaClient = new PrismaClient();

// Define a type for the JSON data (without ReactNode icons)
interface DetailedJourneyStep {
  title: string;
  description: string;
  image_url: string;
}

// --- Define Detailed Journey Steps Data with enhanced factual content ---

// Aluminium journey steps - enhanced with more journalistic content
const aluminiumJourneySteps: DetailedJourneyStep[] = [
  {
    title: "Sammlung",
    description: "Aluminiumschrott wird über verschiedene Kanäle gesammelt. Der Gelbe Sack/Tonne erfasst 90% aller Verpackungen, während große Mengen auch über Schrottplätze und Werkstoffhöfe angenommen werden. Deutschland erreicht eine Sammelquote von über 90% – einer der höchsten Werte weltweit.",
    image_url: "/images/journey/aluminium/collection.jpg"
  },
  {
    title: "Sortierung",
    description: "Durch modernste Sensorik (Nahinfrarot, Wirbelstrom, Röntgen) werden Aluminiumteile in Sortierbetrieben präzise von anderen Materialien getrennt. Die Sortieranlagen erreichen eine Genauigkeit von 98%, was die Qualität und Reinheit des recycelten Materials sicherstellt.",
    image_url: "/images/journey/aluminium/sorting.jpg"
  },
  {
    title: "Schreddern",
    description: "Der sortierte Aluminiumschrott wird in industriellen Schreddern zerkleinert, um die Oberfläche zu vergrößern und die Verarbeitung zu optimieren. Dieser Prozess reduziert den Energiebedarf für das nachfolgende Schmelzen um bis zu 20%.",
    image_url: "/images/journey/aluminium/shredding.jpg"
  },
  {
    title: "Schmelzen",
    description: "In speziellen Öfen wird das Aluminiumgranulat bei ca. 750°C eingeschmolzen. Die Reinheit wird durch präzise Analyseverfahren kontinuierlich überwacht. Durch Recycling werden 95% der Energie eingespart, die für die Primärproduktion aus Bauxit nötig wäre – pro Tonne entspricht das 14.000 kWh.",
    image_url: "/images/journey/aluminium/melting.jpg"
  },
  {
    title: "Neue Produkte",
    description: "Das recycelte Aluminium behält seine Eigenschaften zu 100% und ist nicht von Primärmaterial zu unterscheiden. Es wird zu Barren oder Coils verarbeitet und in der Automobilindustrie, im Maschinenbau oder für neue Verpackungen eingesetzt. Ein recycelter Getränkedeckel kann nach nur 60 Tagen wieder im Handel sein.",
    image_url: "/images/journey/aluminium/products.jpg"
  }
];

// Copper journey steps - enhanced with more journalistic content
const copperJourneySteps: DetailedJourneyStep[] = [
  {
    title: "Sammlung",
    description: "Kupferschrott wird aufgrund seines hohen Materialwerts (5-7€/kg) über spezialisierte Erfassungssysteme gesammelt. Elektroaltgeräte, Kabel, Leitungen und Industrieschrott sind die Hauptquellen. Deutschland sammelt jährlich 400.000 Tonnen Kupferschrott.",
    image_url: "/images/journey/copper/collection.jpg"
  },
  {
    title: "Mechanische Aufbereitung",
    description: "Kabel und kupferhaltige Geräte werden mechanisch zerkleinert und in verschiedene Materialfraktionen getrennt. Modernste Shredder- und Separationstechnologien erreichen eine Trennschärfe von 99,5%, was die Wirtschaftlichkeit und Umweltverträglichkeit des Prozesses optimiert.",
    image_url: "/images/journey/copper/processing.jpg"
  },
  {
    title: "Schmelzen und Raffinieren",
    description: "Das getrennte Kupfer wird bei 1.085°C eingeschmolzen und zu reinem Kupfer raffiniert. Durch präzise elektrochemische Verfahren entsteht Elektrolytkupfer mit 99,99% Reinheit. Recycling spart 85% Energie im Vergleich zur Primärproduktion und reduziert CO₂-Emissionen um jährlich 65 Millionen Tonnen weltweit.",
    image_url: "/images/journey/copper/melting.jpg"
  },
  {
    title: "Weiterverarbeitung",
    description: "Das raffinierte Kupfer wird zu Draht, Rohren oder Halbzeugen verarbeitet. Die elektrische Leitfähigkeit von recyceltem Kupfer ist identisch mit der von Primärkupfer, weshalb es insbesondere in der Elektrotechnik, Elektronik und erneuerbaren Energien eingesetzt wird.",
    image_url: "/images/journey/copper/reprocessing.jpg"
  },
  {
    title: "Neue Anwendungen",
    description: "Das recycelte Kupfer findet Verwendung in Kabeln, Elektronik, Windrädern und Elektrofahrzeugen. Ein modernes Elektroauto enthält 83kg Kupfer, ein Windrad 4,7 Tonnen. Durch seine unbegrenzte Recyclingfähigkeit trägt Kupfer maßgeblich zur Ressourcenschonung und Erreichung der Klimaziele bei.",
    image_url: "/images/journey/copper/applications.jpg"
  }
];

// PET journey steps - enhanced with more journalistic content
const petJourneySteps: DetailedJourneyStep[] = [
  {
    title: "Sammlung",
    description: "PET-Flaschen werden in Deutschland durch das Pfandsystem (25 Cent) gesammelt, was zu einer außergewöhnlichen Rücklaufquote von 98,4% führt. Jährlich werden so 460.000 Tonnen hochwertige PET-Flaschen für das Recycling bereitgestellt, ohne Verunreinigung durch andere Kunststoffe.",
    image_url: "/images/journey/pet/collection.jpg"
  },
  {
    title: "Sortierung und Reinigung",
    description: "Die Flaschen werden nach Farben sortiert (klar, blau, grün, bunt) und von Etiketten und Verschlüssen befreit. Anschließend werden sie in industriellen Anlagen gewaschen und sterilisiert, um Lebensmittelreste und Klebstoffe zu entfernen. Die Sortiergenauigkeit liegt bei über 99,5%.",
    image_url: "/images/journey/pet/sorting.jpg"
  },
  {
    title: "Zerkleinerung",
    description: "Die gereinigten Flaschen werden zu PET-Flakes zerkleinert – millimetergroße Kunststoffteilchen, die als Rohstoff für neue Produkte dienen. Deutschland produziert jährlich 390.000 Tonnen PET-Flakes, die entweder zu neuem Granulat weiterverarbeitet oder direkt verwendet werden.",
    image_url: "/images/journey/pet/shredding.jpg"
  },
  {
    title: "Regranulierung",
    description: "Durch thermische und mechanische Prozesse werden aus PET-Flakes wieder Granulate hergestellt. Besonders innovativ ist das Bottle-to-Bottle-Recycling, bei dem durch spezielle Dekontaminationsverfahren lebensmittelechtes rPET (recyceltes PET) entsteht. Die Umweltbilanz verbessert sich mit jedem Recyclingzyklus.",
    image_url: "/images/journey/pet/regranulation.jpg"
  },
  {
    title: "Neue Produkte",
    description: "Aus recyceltem PET entstehen neue Getränkeflaschen (34% rPET-Anteil, Tendenz steigend), Textilfasern für Kleidung und Teppiche sowie technische Bauteile. Jede Tonne recyceltes PET spart 1,9 Tonnen CO₂ und 6.700 kWh Energie. Bis 2025 soll der Recyclinganteil in PET-Flaschen auf 50% steigen.",
    image_url: "/images/journey/pet/products.jpg"
  }
];

// Paper journey steps - enhanced with more journalistic content
const paperJourneySteps: DetailedJourneyStep[] = [
  {
    title: "Sammlung",
    description: "Altpapier wird in Deutschland über die Blaue Tonne, Wertstoffhöfe und gewerbliche Sammlungen erfasst. Mit einer jährlichen Sammelmenge von 15,6 Millionen Tonnen und einer Recyclingquote von 78% ist Deutschland europäischer Spitzenreiter. Pro Person werden durchschnittlich 107 kg Altpapier pro Jahr gesammelt.",
    image_url: "/images/journey/paper/collection.jpg"
  },
  {
    title: "Sortierung",
    description: "Das gesammelte Altpapier wird in 5 Hauptsorten klassifiziert: gemischtes Altpapier, Kaufhausaltpapier, Zeitungen/Zeitschriften, Aktenordnerpapier und Kraftpapiere. Moderne Sortieranlagen mit NIR-Sensoren und KI-gestützter Bilderkennung erreichen eine Sortenreinheit von über 97%.",
    image_url: "/images/journey/paper/sorting.jpg"
  },
  {
    title: "Deinking und Aufschluss",
    description: "In der Papierfabrik wird das sortierte Altpapier in großen Pulpern mit Wasser zu einer Fasersuspension aufgelöst. Beim Deinking-Prozess werden Druckfarben durch spezielle Waschverfahren und Flotation entfernt. Pro Tonne Altpapier werden 70% Wasser und 60% Energie im Vergleich zur Frischfaserherstellung eingespart.",
    image_url: "/images/journey/paper/deinking.jpg"
  },
  {
    title: "Papierherstellung",
    description: "Die gereinigte Fasersuspension wird auf die Papiermaschine gebracht, entwässert, gepresst und getrocknet. Die deutsche Papierindustrie produziert jährlich 22,7 Millionen Tonnen Papier, davon 78% aus Recyclingfasern. Eine Papierfaser kann 5-7 mal recycelt werden, bevor sie zu kurz wird.",
    image_url: "/images/journey/paper/production.jpg"
  },
  {
    title: "Neue Papierprodukte",
    description: "Aus Recyclingpapier entstehen neue Verpackungen (85% Recyclinganteil), Zeitungen (100%), Hygienepapiere (65%) und Büropapiere (50%). Durch die Verwendung von Recyclingpapier werden in Deutschland jährlich 3,6 Millionen Tonnen CO₂ eingespart – das entspricht dem Ausstoß von 850.000 Mittelklassewagen pro Jahr.",
    image_url: "/images/journey/paper/products.jpg"
  }
];

// Glass journey steps
const glassJourneySteps: DetailedJourneyStep[] = [
  {
    title: "Sammlung",
    description: "Altglas wird in Deutschland über Glascontainer nach Farben (weiß, grün, braun) getrennt gesammelt. Die Sammelquote beträgt beeindruckende 90%. Pro Jahr werden etwa 2 Millionen Tonnen Glasverpackungen recycelt, was etwa 7,5 Milliarden Flaschen entspricht.",
    image_url: "/images/journey/glass/collection.jpg"
  },
  {
    title: "Sortierung und Reinigung",
    description: "In spezialisierten Anlagen werden Fremdstoffe wie Korken, Metalldeckel und Etiketten entfernt. Moderne optische Systeme erfassen bis zu 200.000 Glasscherben pro Stunde und sortieren mit einer Genauigkeit von 99,8% nach Farben, um die höchste Qualität zu garantieren.",
    image_url: "/images/journey/glass/sorting.jpg"
  },
  {
    title: "Zerkleinerung",
    description: "Das sortierte Glas wird zu Scherben zerkleinert (Glasbruch). Diese bilden den Rohstoff für neue Glasprodukte. Der Altglasanteil bei der Produktion von Glasverpackungen in Deutschland liegt bei durchschnittlich 60% bei Behälterglas, für grünes Glas sogar bei bis zu 95%.",
    image_url: "/images/journey/glass/crushing.jpg"
  },
  {
    title: "Einschmelzung",
    description: "In Glasschmelzwannen werden die Scherben bei etwa 1.600°C eingeschmolzen. Durch die Verwendung von Altglas sinkt die Schmelztemperatur um etwa 10°C pro 10% Scherbeneinsatz, was erheblich Energie einspart - für 10% Scherben etwa 3% weniger Energiebedarf.",
    image_url: "/images/journey/glass/melting.jpg"
  },
  {
    title: "Neue Glasprodukte",
    description: "Aus der Glasschmelze werden neue Flaschen und Gläser geformt. Glas kann theoretisch unbegrenzt oft recycelt werden, ohne an Qualität zu verlieren. Jede Tonne recyceltes Glas spart 300 kg CO₂ und ersetzt 1,2 Tonnen Primärrohstoffe wie Sand und Soda.",
    image_url: "/images/journey/glass/products.jpg"
  }
];

// E-Waste (Electronics) journey steps
const ewasteJourneySteps: DetailedJourneyStep[] = [
  {
    title: "Sammlung",
    description: "Elektroschrott wird über kommunale Wertstoffhöfe, Rücknahmesysteme des Handels und Herstellerrücknahmeprogramme erfasst. Deutschland sammelt jährlich über 900.000 Tonnen, was etwa 10,8 kg pro Einwohner entspricht. Die europäische WEEE-Richtlinie gibt eine Sammelquote von 65% vor.",
    image_url: "/images/journey/ewaste/collection.jpg"
  },
  {
    title: "Demontage und Sortierung",
    description: "In spezialisierten Recyclingbetrieben werden zunächst Schadstoffe wie Batterien und Quecksilberschalter entfernt. Anschließend erfolgt die manuelle oder teilautomatisierte Zerlegung in Baugruppen. Moderne Anlagen verarbeiten bis zu 50 Tonnen E-Schrott pro Tag.",
    image_url: "/images/journey/ewaste/dismantling.jpg"
  },
  {
    title: "Mechanische Aufbereitung",
    description: "Die vorsortierten Materialien werden geschreddert und durch mechanische Verfahren wie Magnetabscheider, Wirbelstromabscheider und Dichtetrennung in reine Materialfraktionen getrennt. Hierbei werden Metalle, Kunststoffe und andere Wertstoffe voneinander separiert.",
    image_url: "/images/journey/ewaste/processing.jpg"
  },
  {
    title: "Metallrückgewinnung",
    description: "Edelmetalle wie Gold, Silber und Palladium werden durch hydrometallurgische oder pyrometallurgische Verfahren zurückgewonnen. Eine Tonne Handys enthält etwa 300g Gold – 30-mal mehr als eine Tonne Golderz. Weltweit schlummern in ungenutzten Geräten Rohstoffe im Wert von über 50 Milliarden Euro.",
    image_url: "/images/journey/ewaste/metal_recovery.jpg"
  },
  {
    title: "Rohstoffrückführung",
    description: "Die gewonnenen Sekundärrohstoffe werden zur Herstellung neuer Produkte eingesetzt. Durch fachgerechtes Recycling werden bis zu 90% der Materialien zurückgewonnen. E-Schrott-Recycling ist ein Schlüsselelement der 'Urban Mining'-Strategie und spart jährlich etwa 1,6 Millionen Tonnen CO₂ in Deutschland.",
    image_url: "/images/journey/ewaste/reuse.jpg"
  }
];

// Textiles journey steps
const textilesJourneySteps: DetailedJourneyStep[] = [
  {
    title: "Sammlung",
    description: "Alttextilien werden über Altkleidercontainer, Second-Hand-Läden und zunehmend auch über Rücknahmesysteme des Handels gesammelt. In Deutschland fallen jährlich etwa 1,35 Millionen Tonnen Alttextilien an, was ca. 16,5 kg pro Person entspricht.",
    image_url: "/images/journey/textiles/collection.jpg"
  },
  {
    title: "Sortierung",
    description: "In Sortierbetrieben werden die Textilien manuell nach Qualität, Material und Verwendungszweck kategorisiert. Etwa 50% sind noch als Kleidung tragbar und gelangen in den Second-Hand-Kreislauf. Hochwertige Sortierbetriebe unterscheiden bis zu 400 verschiedene Kategorien.",
    image_url: "/images/journey/textiles/sorting.jpg"
  },
  {
    title: "Wiederverwertung",
    description: "Nicht mehr tragbare Textilien werden zu Putzlappen, Malervlies oder Füllmaterial verarbeitet. Etwa 20-30% der gesammelten Textilien werden so zu neuen Produkten. Innovative Technologien ermöglichen zunehmend auch das Faser-zu-Faser-Recycling für echte Kreislaufwirtschaft.",
    image_url: "/images/journey/textiles/recycling.jpg"
  },
  {
    title: "Fasergewinnung",
    description: "Durch mechanisches oder chemisches Recycling werden aus alten Textilien neue Fasern gewonnen. Für ein T-Shirt aus recycelter Baumwolle werden bis zu 2.700 Liter Wasser eingespart. Die Recyclingindustrie arbeitet intensiv an Technologien für gemischte Fasern, die bisher schwer zu recyceln sind.",
    image_url: "/images/journey/textiles/fiber_recovery.jpg"
  },
  {
    title: "Neue Textilprodukte",
    description: "Aus recycelten Fasern werden neue Garne, Stoffe und Bekleidung hergestellt. Große Modemarken haben sich verpflichtet, bis 2030 mindestens 25% recycelte Materialien zu verwenden. In Deutschland werden durch Textilrecycling jährlich etwa 1 Million Tonnen CO₂ und 1,4 Millionen Tonnen Rohstoffe eingespart.",
    image_url: "/images/journey/textiles/new_products.jpg"
  }
];

// Batteries journey steps
const batteriesJourneySteps: DetailedJourneyStep[] = [
  {
    title: "Sammlung",
    description: "Altbatterien werden an über 200.000 Sammelstellen in Deutschland erfasst - in Geschäften, öffentlichen Einrichtungen und Wertstoffhöfen. Das Batteriegesetz verpflichtet zu einer Sammelquote von 50%, aktuell werden etwa 52,2% erreicht, mit jährlich etwa 27.500 Tonnen gesammelten Batterien.",
    image_url: "/images/journey/batteries/collection.jpg"
  },
  {
    title: "Sortierung",
    description: "Die gesammelten Batterien werden nach Batterietypen sortiert: Alkaline, Lithium-Ionen, Nickel-Cadmium, Nickel-Metallhydrid, Blei-Säure usw. Moderne Sortieranlagen setzen auf KI-gestützte Bilderkennung und erreichen Sortiergenauigkeiten von über 97%.",
    image_url: "/images/journey/batteries/sorting.jpg"
  },
  {
    title: "Mechanische Aufbereitung",
    description: "Die sortierten Batterien werden geschreddert und in ihre Bestandteile zerlegt. Bei Lithium-Ionen-Batterien erfolgt dies in Spezialanlagen unter Schutzgas oder in Wasserbädern, um Brände zu vermeiden. Dieser Prozess ermöglicht die Rückgewinnung von bis zu 75% des Batteriematerials.",
    image_url: "/images/journey/batteries/processing.jpg"
  },
  {
    title: "Metallrückgewinnung",
    description: "Mittels hydrometallurgischer und pyrometallurgischer Verfahren werden wertvolle Metalle wie Lithium, Kobalt, Nickel und Mangan zurückgewonnen. Diese Metalle sind besonders für die E-Mobilität essentiell. Der Kobaltpreis ist in den letzten Jahren um 500% gestiegen, was das Recycling wirtschaftlich attraktiver macht.",
    image_url: "/images/journey/batteries/metal_recovery.jpg"
  },
  {
    title: "Rohstoffrückführung",
    description: "Die recycelten Metalle werden zur Herstellung neuer Batterien oder anderer Produkte eingesetzt. Moderne Recyclingtechnologien können bis zu 95% des Lithiums und 98% der anderen Metalle zurückgewinnen. Mit dem Hochlauf der Elektromobilität wird das Batterierecycling bis 2030 um das 10-fache wachsen.",
    image_url: "/images/journey/batteries/reuse.jpg"
  }
];

async function main() {
  console.log(`Start seeding ...`);

  // --- Seed Users ---
  const adminPassword = await bcrypt.hash('password123', 10); // Hash directly using bcrypt
  const adminUser = await prismaClient.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      image: '/images/avatars/admin.jpg',
    },
  });
  console.log(`Created/Found admin user with id: ${adminUser.id}`);

  // Create a normal user for seeding listings/reviews
  const userPassword = await bcrypt.hash('password123', 10); // Hash directly using bcrypt
  const normalUser = await prismaClient.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Normal User',
      password: userPassword,
      role: 'USER',
      emailVerified: new Date(),
      image: '/images/avatars/user.jpg',
    },
  });
  console.log(`Created/Found normal user with id: ${normalUser.id}`);

  // Create a center owner user
  const centerOwnerPassword = await bcrypt.hash('password123', 10);
  const centerOwnerUser = await prismaClient.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      name: 'Center Owner User',
      password: centerOwnerPassword,
      role: 'CENTER_OWNER',
      emailVerified: new Date(),
      image: '/images/avatars/owner.jpg',
    },
  });
  console.log(`Created/Found center owner user with id: ${centerOwnerUser.id}`);

  // --- Seed Materials with enhanced descriptions (Create parents first) ---
  const metal = await prismaClient.material.upsert({ 
    where: { slug: 'metall' }, 
    update: {}, 
    create: { 
      name: 'Metall', 
      slug: 'metall', 
      description: 'Metalle gehören zu den wertvollsten recycelbaren Materialien. Durch ihre nahezu unbegrenzte Wiederverwertbarkeit ohne Qualitätsverlust spielen sie eine zentrale Rolle in der Kreislaufwirtschaft. In Deutschland werden jährlich über 20 Millionen Tonnen Metallschrott recycelt, was die Abhängigkeit von Rohstoffimporten deutlich reduziert und die CO₂-Bilanz verbessert.', 
      image_url: '/images/materials/default_metal.jpg' 
    } 
  });

  const plastic = await prismaClient.material.upsert({ 
    where: { slug: 'kunststoff' }, 
    update: {}, 
    create: { 
      name: 'Kunststoff', 
      slug: 'kunststoff', 
      description: 'Kunststoffe sind vielseitige Materialien, deren Recycling aufgrund unterschiedlicher Polymertypen eine Herausforderung darstellt. Deutschland verbraucht jährlich etwa 14 Millionen Tonnen Kunststoff, wovon 46% recycelt werden – deutlich über dem EU-Durchschnitt. Moderne Sortier- und Verwertungstechnologien ermöglichen zunehmend hochwertiges Kunststoffrecycling und schließen Materialkreisläufe.', 
      image_url: '/images/materials/default_plastic.jpg' 
    } 
  });

  const paper = await prismaClient.material.upsert({ 
    where: { slug: 'papier-pappe' }, 
    update: {},
    create: {
      name: 'Papier & Pappe', 
      slug: 'papier-pappe', 
      description: "Papier ist ein flächiger, aus Pflanzenfasern bestehender Werkstoff mit einer Flächenmasse von 7-225 g/m². Deutschland sammelt jährlich 15,6 Millionen Tonnen Altpapier (78% Recyclingquote) – europäischer Spitzenwert. Papierrecycling spart 70% Wasser und 60% Energie gegenüber der Frischfaserherstellung. Die Papierproduktion in Deutschland basiert zu 78% auf Recyclingfasern. Ein Altpapieranteil von 65% in der weltweiten Papierproduktion könnte jährlich 250 Millionen Tonnen CO₂ einsparen – mehr als der gesamte Flugverkehr verursacht.", 
      image_url: '/images/materials/default_paper.jpg', 
      journeyStepsJson: paperJourneySteps
    } as any
  });

  // Add ALL other parent materials HERE
  const glass = await prismaClient.material.upsert({ 
    where: { slug: 'glas' }, 
    update: {}, 
    create: { 
      name: 'Glas', 
      slug: 'glas', 
      description: 'Glas ist ein anorganischer, homogener Feststoff, der aus Siliziumdioxid (SiO₂) als Netzwerkbildner besteht. Deutschland recycelt jährlich etwa 2 Millionen Tonnen Altglas mit einer Sammelquote von 90%, eine der höchsten weltweit. Glas lässt sich ohne Qualitätsverlust unendlich oft recyceln. Jede Tonne recyceltes Glas spart 300 kg CO₂ und 1,2 Tonnen Primärrohstoffe wie Sand und Soda. Der Energiebedarf sinkt beim Glasrecycling um bis zu 25% gegenüber der Primärherstellung.',
      image_url: '/images/materials/default_glass.jpg',
      journeyStepsJson: glassJourneySteps
    } as any 
  });

  const electronics = await prismaClient.material.upsert({ 
    where: { slug: 'elektronik' }, 
    update: {}, 
    create: { 
      name: 'Elektronik', 
      slug: 'elektronik', 
      description: 'Elektro- und Elektronikgeräte enthalten eine komplexe Mischung wertvoller und teils kritischer Rohstoffe. Deutschland sammelt jährlich über 900.000 Tonnen Elektroschrott (10,8 kg pro Einwohner), der etwa 16 verschiedene Metalle enthält, darunter Gold, Silber, Kupfer und Seltene Erden. Urban Mining wird immer wichtiger: Eine Tonne Smartphones enthält bis zu 300g Gold – 30-mal mehr als eine Tonne Golderz. Fachgerechtes Recycling gewinnt bis zu 90% der Materialien zurück und spart jährlich 1,6 Millionen Tonnen CO₂.',
      image_url: '/images/materials/default_electronics.jpg',
      journeyStepsJson: ewasteJourneySteps
    } as any 
  });

  const textiles = await prismaClient.material.upsert({ 
    where: { slug: 'textilien' }, 
    update: {}, 
    create: { 
      name: 'Textilien', 
      slug: 'textilien', 
      description: 'Textilien umfassen Kleidung, Haushaltstextilien und technische Textilien aus natürlichen oder synthetischen Fasern. Deutschland sammelt jährlich etwa 1,35 Millionen Tonnen Alttextilien (16,5 kg pro Person), wovon 50% als Second-Hand-Kleidung weiterverwendet werden. Die Textilproduktion ist extrem ressourcenintensiv: Ein Baumwoll-T-Shirt benötigt bis zu 2.700 Liter Wasser. Durch Recycling werden jährlich etwa 1 Million Tonnen CO₂ und 1,4 Millionen Tonnen Rohstoffe eingespart. Innovative Faser-zu-Faser-Recyclingverfahren ermöglichen echte Kreislaufwirtschaft.',
      image_url: '/images/materials/default_textiles.jpg',
      journeyStepsJson: textilesJourneySteps
    } as any 
  });

  const batteries = await prismaClient.material.upsert({ 
    where: { slug: 'batterien' }, 
    update: {}, 
    create: { 
      name: 'Batterien', 
      slug: 'batterien', 
      description: 'Batterien und Akkumulatoren sind Energiespeicher, die chemische in elektrische Energie umwandeln. Deutschland sammelt jährlich etwa 27.500 Tonnen Altbatterien (52,2% Sammelquote). Mit dem Hochlauf der Elektromobilität wird das Batterierecycling bis 2030 um das 10-fache wachsen. Moderne Recyclingtechnologien gewinnen bis zu 95% des Lithiums und 98% anderer Metalle zurück. Lithium-Ionen-Batterien enthalten wertvolle Rohstoffe wie Kobalt, Nickel und Lithium, deren Primärgewinnung oft unter kritischen Umwelt- und Sozialbedingungen erfolgt.',
      image_url: '/images/materials/default_batteries.jpg',
      journeyStepsJson: batteriesJourneySteps
    } as any 
  });

  // --- Seed Child Materials with Enhanced Descriptions and Journeys ---
  await prismaClient.material.upsert({
    where: { slug: 'aluminium' }, 
    update: {},
    create: {
      name: 'Aluminium', 
      slug: 'aluminium', 
      parent_id: metal.id, 
      description: "Aluminium ist ein silbrig-weißes Leichtmetall (Dichte: 2,7 g/cm³) mit hervorragender Korrosionsbeständigkeit und unbegrenzter Recyclingfähigkeit. Die Primärproduktion aus Bauxit ist extrem energieintensiv (13-14 kWh/kg), während das Recycling 95% dieser Energie einspart. Deutschland recycelt über 90% aller Aluminiumverpackungen und erreicht damit eine der höchsten Quoten weltweit. Recyceltes Aluminium behält seine physikalischen Eigenschaften zu 100% und ist vom Primärmaterial nicht zu unterscheiden.", 
      image_url: '/images/materials/default_aluminium.jpg', 
      journeyStepsJson: aluminiumJourneySteps
    } as any
  });

  await prismaClient.material.upsert({
    where: { slug: 'kupfer' }, 
    update: {},
    create: {
      name: 'Kupfer', 
      slug: 'kupfer', 
      parent_id: metal.id, 
      description: "Kupfer ist ein rötliches Metall mit der weltweit besten elektrischen Leitfähigkeit (58,108·10⁶ S/m) nach Silber. Es spielt eine Schlüsselrolle für die Energiewende und Elektromobilität. Deutschland recycelt jährlich etwa 400.000 Tonnen Kupfer – 45% des Bedarfs. Der hohe Materialwert (5-7€/kg) sorgt für effiziente Sammlungen. Ein durchschnittliches Windrad enthält 4,7 Tonnen, ein Elektroauto 83 kg Kupfer. Das Metall kann ohne Qualitätsverlust unbegrenzt recycelt werden und ist damit ein Paradebeispiel für Kreislaufwirtschaft.", 
      image_url: '/images/materials/default_copper.jpg', 
      journeyStepsJson: copperJourneySteps
    } as any
  });

  await prismaClient.material.upsert({
    where: { slug: 'pet' }, 
    update: {},
    create: {
      name: 'PET (Polyethylenterephthalat)', 
      slug: 'pet', 
      parent_id: plastic.id, 
      description: "Polyethylenterephthalat (PET) ist ein thermoplastischer Kunststoff mit hervorragender Transparenz, Lebensmittelechtheit und Recyclabilität. Deutschland sammelt durch das Pfandsystem 98,4% aller PET-Flaschen – weltweit einzigartig. Mit 390.000 Tonnen recyceltem PET jährlich werden 750.000 Tonnen CO₂ eingespart. Der Anteil an recyceltem PET (rPET) in Neuverpackungen liegt bei 34% und soll bis 2025 auf 50% steigen. Besonders innovativ ist das Bottle-to-Bottle-Recycling, bei dem aus alten neue Flaschen mit Lebensmittelkontakt werden.", 
      image_url: '/images/materials/default_pet.jpg', 
      journeyStepsJson: petJourneySteps
    } as any
  });

  await prismaClient.material.upsert({
    where: { slug: 'hdpe' }, 
    update: { /* No journey steps defined yet */ },
    create: {
      name: 'HDPE (High-Density Polyethylen)', 
      slug: 'hdpe', 
      parent_id: plastic.id, 
      description: 'HDPE ist ein vielseitiger, robuster Kunststoff mit hoher Steifigkeit, der hauptsächlich für Shampooflaschen, Reinigungsmittel und Kanister verwendet wird. Mit einem Schmelzpunkt von 130°C eignet sich HDPE gut für das mechanische Recycling. Deutschland verwertet jährlich etwa 100.000 Tonnen HDPE. Da es sich kaum mit Wasser verbindet, schwimmt HDPE bei der Trennung im Recyclingprozess oben – ein wichtiges Merkmal für die automatische Sortierung.', 
      image_url: '/images/materials/default_hdpe.jpg' 
      // Add journeyStepsJson here if defined
    }
  });
  
  console.log('Upserted ALL materials with journey steps and enhanced descriptions.');

  // --- Fetch ALL necessary IDs AFTER creating materials ---
  const aluminium = await prismaClient.material.findUnique({ where: { slug: 'aluminium' }, select: { id: true } });
  const copper = await prismaClient.material.findUnique({ where: { slug: 'kupfer' }, select: { id: true } });
  const pet = await prismaClient.material.findUnique({ where: { slug: 'pet' }, select: { id: true } });
  const paperMaterial = await prismaClient.material.findUnique({ where: { slug: 'papier-pappe' }, select: { id: true } });
  const glassInfo = await prismaClient.material.findUnique({ where: { slug: 'glas' }, select: { id: true } });
  const electronicsInfo = await prismaClient.material.findUnique({ where: { slug: 'elektronik' }, select: { id: true } });
  const textilesInfo = await prismaClient.material.findUnique({ where: { slug: 'textilien' }, select: { id: true } });
  const batteriesInfo = await prismaClient.material.findUnique({ where: { slug: 'batterien' }, select: { id: true } });

  // --- Seed Recycling Centers ---
  const center1 = await prismaClient.recyclingCenter.create({
    data: {
      name: 'Recyclinghof Berlin Mitte',
      description: 'Zentraler Recyclinghof für verschiedene Materialien.',
      address_street: 'Musterstraße 1',
      city: 'Berlin',
      postal_code: '10115',
      latitude: 52.5200,
      longitude: 13.4050,
      phone_number: '030 123456',
      website: 'https://example-berlin.com',
      managedById: adminUser.id,
      slug: 'recyclinghof-berlin-mitte',
      verification_status: 'VERIFIED',
    }
  });
  console.log(`Created recycling center with id: ${center1.id}`);

  const center2 = await prismaClient.recyclingCenter.create({
    data: {
      name: 'Wertstoffhof Hamburg Altona',
      description: 'Annahmestelle für Wertstoffe und Grünschnitt in Hamburg.',
      address_street: 'Beispielweg 10',
      city: 'Hamburg',
      postal_code: '22767',
      latitude: 53.5511,
      longitude: 9.9937,
      phone_number: '040 987654',
      website: 'https://example-hamburg.com',
      managedById: centerOwnerUser.id, // Assign to center owner
      slug: 'wertstoffhof-hamburg-altona',
      verification_status: 'PENDING',
    }
  });
  console.log(`Created recycling center with id: ${center2.id}`);

  console.log(`Created recycling centers.`);

  // --- Seed Marketplace Listings --- (Now this should work)
  await prismaClient.marketplaceListing.createMany({
    data: [
      // Original Listings
      {
        title: 'Gebrauchte Aluminiumbleche (Charge 1)',
        description: 'Ca. 100kg Aluminiumbleche, gemischte Größen, von Industriedemontage.',
        quantity: 100,
        unit: 'kg',
        location: 'Berlin',
        seller_id: adminUser.id,
        material_id: aluminium?.id, // Use fetched ID
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/alu1.jpg',
      },
      {
        title: 'Sammelposten Altpapier - Bürosortierung',
        description: 'Gemischtes Büropapier, ca. 50kg, trocken gelagert.',
        quantity: 50,
        unit: 'kg',
        location: 'Hamburg',
        seller_id: normalUser.id, // Use normal user
        material_id: paperMaterial?.id, // Use parent paper ID
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/paper1.jpg',
      },
      {
        title: 'Kupferkabel-Abschnitte',
        description: 'Verschiedene Längen Kupferkabel-Abschnitte, ca. 15kg.',
        quantity: 15,
        unit: 'kg',
        location: 'München',
        seller_id: adminUser.id,
        material_id: copper?.id, // Use fetched ID
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/copper1.jpg',
      },
      {
        title: 'PET Flaschen (klar) - gepresst',
        description: 'Ballen mit klaren PET-Flaschen, ca. 250kg.',
        quantity: 250,
        unit: 'kg',
        location: 'Frankfurt',
        seller_id: normalUser.id, // Use normal user
        material_id: pet?.id, // Use fetched ID
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/pet1.jpg',
      },
      // Additional Listings
      {
        title: 'Glasflaschen gemischt - große Menge',
        description: 'Ca. 500kg gemischte Glasflaschen aus Gastronomie, überwiegend grün und braun.',
        quantity: 500,
        unit: 'kg',
        location: 'Berlin',
        seller_id: adminUser.id,
        material_id: glassInfo?.id, 
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/glass1.jpg',
      },
      {
        title: 'Weißglas Sammlung - Lebensmittelgläser',
        description: 'Sortierte weiße Glasverpackungen, gereinigt, ca. 120kg.',
        quantity: 120,
        unit: 'kg',
        location: 'München',
        seller_id: normalUser.id,
        material_id: glassInfo?.id,
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/glass2.jpg',
      },
      {
        title: 'Ausrangierte Laptops (Firmenbestand)',
        description: 'Lot mit 25 gebrauchten Business-Laptops, funktionsfähig, 3-5 Jahre alt, für Wiederaufbereitung oder Recycling.',
        quantity: 25,
        unit: 'Stück',
        location: 'Hamburg',
        seller_id: adminUser.id,
        material_id: electronicsInfo?.id,
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/electronics1.jpg',
      },
      {
        title: 'Gemischte Leiterplatten zum Recycling',
        description: 'Etwa 30kg gemischte Leiterplatten aus verschiedenen Elektronikgeräten, ideal für Metallrückgewinnung.',
        quantity: 30,
        unit: 'kg',
        location: 'Frankfurt',
        seller_id: normalUser.id,
        material_id: electronicsInfo?.id,
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/electronics2.jpg',
      },
      {
        title: 'Baumwolltextilien - Sorte A (Wiederverwendbar)',
        description: 'Etwa 200kg sortierte Baumwollkleidung in gutem Zustand, gewaschen und verkaufsbereit.',
        quantity: 200,
        unit: 'kg',
        location: 'Köln',
        seller_id: adminUser.id,
        material_id: textilesInfo?.id,
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/textiles1.jpg',
      },
      {
        title: 'Industrieabschnitte Leinenstoffe',
        description: 'Reste aus Leinenproduktion, naturbelassen, verschiedene Größen, insg. ca. 75kg.',
        quantity: 75,
        unit: 'kg',
        location: 'Leipzig',
        seller_id: normalUser.id,
        material_id: textilesInfo?.id,
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/textiles2.jpg',
      },
      {
        title: 'Industriecharge Lithium-Ionen-Akkus',
        description: 'Gebrauchte Li-Ion-Akkus aus Produktionsausschuss, ca. 40kg, für fachgerechtes Recycling.',
        quantity: 40,
        unit: 'kg',
        location: 'Stuttgart',
        seller_id: adminUser.id,
        material_id: batteriesInfo?.id,
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/batteries1.jpg',
      },
      {
        title: 'Gemischte Haushaltsbatterien',
        description: 'Gesammelte Haushaltsbatterien, sortiert nach Typen, insgesamt ca. 15kg.',
        quantity: 15,
        unit: 'kg',
        location: 'Düsseldorf',
        seller_id: normalUser.id,
        material_id: batteriesInfo?.id,
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/batteries2.jpg',
      },
      {
        title: 'Suche: Kupferkabel in größeren Mengen',
        description: 'Suche kontinuierlich Kupferkabel jeder Art, ab 100kg, saubere, gewichtsgenaue Abrechnung, schnelle Abholung.',
        quantity: 100,
        unit: 'kg',
        location: 'Berlin',
        seller_id: normalUser.id,
        material_id: copper?.id,
        type: 'BUY',
        status: 'ACTIVE',
        image_url: '/images/placeholder/copper_buy.jpg',
      },
      {
        title: 'Ankauf von Industriebestand PET-Flaschen',
        description: 'Kaufe transparente PET-Flaschen aus Lagerräumung oder Überschuss, große Mengen willkommen.',
        quantity: 1000,
        unit: 'kg',
        location: 'München',
        seller_id: adminUser.id,
        material_id: pet?.id,
        type: 'BUY',
        status: 'ACTIVE',
        image_url: '/images/placeholder/pet_buy.jpg',
      },
    ],
    skipDuplicates: true,
  });

  console.log(`Created ALL marketplace listings.`);

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  }); 