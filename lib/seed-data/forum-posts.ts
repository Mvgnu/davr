/**
 * Seed data for forum posts about recycling topics
 * Used for development and testing purposes
 */

import { v4 as uuidv4 } from 'uuid';

export interface SeedForumPost {
  _id: string;
  title: string;
  content: string;
  userId: string;
  username: string;
  userAvatar?: string;
  category: string;
  tags: string[];
  views: number;
  upvotes: number;
  downvotes: number;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SeedForumResponse {
  _id: string;
  postId: string;
  content: string;
  userId: string;
  username: string;
  userAvatar?: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
}

// Create a timestamp within the last 6 months
const randomRecentDate = () => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000);
  return pastDate.toISOString();
};

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

// Generate seed forum posts
export const seedForumPosts: SeedForumPost[] = [
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
    title: "Aluminium im Garten: Ist das unbedenklich?",
    content: `Hallo Recycling-Freunde,

Ich habe eine Frage zum Thema Aluminium im Garten. Hintergrund: Ich überlege, ob ich ausgediente Aluminiumtöpfe und -pfannen als Pflanzgefäße für Kräuter nutzen kann. Das sieht schick aus und wäre eine gute Weiterverwendung.

Allerdings bin ich unsicher, ob das Aluminium möglicherweise in den Boden oder die Pflanzen übergehen könnte. Besonders bei Kräutern, die später gegessen werden, macht mir das Sorgen.

**Meine konkreten Fragen:**

1. Ist es grundsätzlich gesundheitlich unbedenklich, in Aluminiumbehältern Pflanzen anzubauen?
2. Gibt es Pflanzen, die besonders empfindlich auf Aluminium reagieren?
3. Kann Aluminium durch Regenwasser (das ja leicht sauer ist) ausgewaschen werden und in den Gartenboden gelangen?
4. Falls es bedenklich ist: Gibt es eine Möglichkeit, die Töpfe zu behandeln oder zu beschichten, um sie trotzdem nutzen zu können?

Ich würde mich über Erfahrungen und Fachwissen sehr freuen!

Liebe Grüße,
Stefan aus München`,
    userId: userIds.stefan,
    username: "Stefan_Gartenfreund",
    userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
    category: "Hilfe",
    tags: ["Aluminium", "Garten", "Wiederverwendung", "Gesundheit"],
    views: 183,
    upvotes: 12,
    downvotes: 1,
    responseCount: 9,
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
    title: "Recyclingzentren in München: Erfahrungen und Empfehlungen",
    content: `Servus aus München!

Ich lebe seit kurzem in München und bin auf der Suche nach dem besten Ort, um meine Wertstoffe (insbesondere Aluminium) zu entsorgen oder eventuell sogar zu verkaufen.

Bisher habe ich folgende Orte gefunden:

**Wertstoffhof Freimann**
+ Große Annahme verschiedener Materialien
+ Gute Öffnungszeiten
- Oft lange Wartezeiten am Samstag
- Kein Ankauf von Wertstoffen

**RecyclingPoint München-Süd**
+ Ankauf von Metallen, auch in kleineren Mengen
+ Faire Preise (0,80€/kg für Aluminium)
+ Freundliches Personal
- Etwas abgelegener Standort

**Schrott Kaiser (Obersendling)**
+ Höchste Ankaufpreise (aktuell 0,95€/kg für Aluminium)
+ Schnelle Abwicklung
- Minimalmenge 5kg
- Nur vormittags geöffnet unter der Woche

Hat jemand weitere Empfehlungen oder Erfahrungen mit diesen oder anderen Recyclingmöglichkeiten in München? Besonders interessiert mich, ob es Unterschiede bei den Ankaufpreisen gibt und wie eure Erfahrungen mit dem Service sind.

Danke und Grüße,
Thomas`,
    userId: userIds.thomas,
    username: "Thomas_M",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    category: "Hilfe",
    tags: ["München", "Recyclingzentren", "Ankaufpreise", "Erfahrungsbericht"],
    views: 158,
    upvotes: 9,
    downvotes: 0,
    responseCount: 7,
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
  },
  {
    _id: uuidv4(),
    title: "Unser Schulprojekt: Aluminium-Sammlung für den guten Zweck",
    content: `Hallo zusammen,

ich bin Lehrerin an einer Gesamtschule in Köln, und wir haben mit unserer 8. Klasse ein spannendes Recyclingprojekt gestartet, das ich gerne mit euch teilen möchte – vielleicht als Inspiration für ähnliche Initiativen.

**Unser Projekt "Alu für Alle":**

Die Idee entstand im Umwelt-AG-Unterricht: Die Schüler:innen sammeln gezielt Aluminium (Dosen, Folien, Verschlüsse) und verkaufen das Material an lokale Recyclingunternehmen. Der Erlös wird vollständig an ein Aufforstungsprojekt im Kölner Umland gespendet.

**Was wir bisher erreicht haben:**
- In den ersten 3 Monaten: 87kg Aluminium gesammelt
- Erlös: 78,30€ (wurde bereits gespendet)
- Erste Bäume werden im Herbst gepflanzt
- Bewusstsein für Wertstoffe bei Schüler:innen und Eltern geschärft

**Wie wir die Sammlung organisiert haben:**
- Spezielle Sammeltonnen in jedem Klassenzimmer
- Wöchentliche "Sammel-Challenge" zwischen den Klassen
- Infotafel in der Aula mit Recyclingfakten und aktuellen Sammelständen
- Eltern als Multiplikatoren einbezogen

**Was uns überrascht hat:**
Die Schüler:innen haben selbst kleinste Aluminiumteile entdeckt, an die wir Erwachsenen gar nicht gedacht hätten – von Teelichtbehältern bis zu den Verschlüssen von Weinflaschen.

Falls ihr ähnliche Projekte plant oder Tipps habt, wie wir unsere Sammlung noch effizienter gestalten können, freue ich mich über eure Kommentare!

Viele Grüße,
Maria Kaiser
Gesamtschule Köln-Porz`,
    userId: userIds.maria,
    username: "Maria_Lehrerin",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    category: "Projekte",
    tags: ["Schulprojekt", "Sammlung", "Spendenaktion", "Umweltbildung"],
    views: 215,
    upvotes: 38,
    downvotes: 0,
    responseCount: 12,
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate()
  },
  {
    _id: uuidv4(),
    title: "Recyclingfähigkeit verschiedener Aluminium-Produkte im Vergleich",
    content: `Guten Tag allerseits,

in meiner Tätigkeit als Abfallberater werde ich häufig gefragt, welche Aluminiumprodukte besonders gut recycelbar sind und welche Probleme bereiten. Ich habe daher einen kleinen Guide zusammengestellt, den ich mit euch teilen möchte.

**Recyclingfähigkeit verschiedener Aluminium-Produkte: Ein Überblick**

🟢 **Sehr gut recycelbar (>95% Rückgewinnung):**
- Getränkedosen (sortenrein)
- Reine Alufolien (ohne Beschichtung)
- Fensterrahmen und Bauelemente
- Aluguss-Teile aus der Automobilindustrie

🟡 **Gut recycelbar (80-95% Rückgewinnung):**
- Verschmutztes Aluminium (z.B. mit Speiseresten)
- Kleinteile wie Schraubverschlüsse
- Tuben für Lebensmittel
- Grillschalen

🟠 **Bedingt recycelbar (50-80% Rückgewinnung):**
- Verbundfolien mit Papier
- Medikamentenblister
- Kaffeekapseln (mit Kaffeeresten)
- Farb- und Chemikalienbehälter (wenn nicht vollständig entleert)

🔴 **Schwierig zu recyceln (<50% Rückgewinnung):**
- Aluminium-Kunststoff-Verbunde (z.B. Chipstüten)
- Tetrapaks mit Aluschicht
- Beschichtete Alufolien mit Farb- oder Lackschichten
- Stark verschmutzte oder mit Gefahrstoffen kontaminierte Produkte

**Tipps für bessere Recyclingfähigkeit:**
1. Aluminium möglichst sauber entsorgen (kurz ausspülen reicht)
2. Verschiedene Materialien trennen (z.B. Joghurtdeckel vom Becher)
3. Kleinteile sammeln und gemeinsam entsorgen (z.B. in leerer Dose)
4. Bei Verbundmaterialien auf die Entsorgungshinweise achten

Ich hoffe, diese Übersicht ist hilfreich! Bei Fragen stehe ich gerne zur Verfügung.

Mit freundlichen Grüßen,
Jan Neumann
Abfallberater`,
    userId: userIds.jan,
    username: "Jan_Abfallberater",
    userAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop",
    category: "Fachdiskussion",
    tags: ["Recyclingfähigkeit", "Produktvergleich", "Entsorgungstipps", "Aluminium"],
    views: 387,
    upvotes: 41,
    downvotes: 2,
    responseCount: 19,
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate()
  },
  {
    _id: uuidv4(),
    title: "Crowdsourcing: Karte der besten Altmetall-Ankaufstellen in Deutschland",
    content: `Hallo Community,

ich habe mich entschlossen, ein Crowdsourcing-Projekt zu starten: Wir erstellen gemeinsam eine interaktive Karte mit den besten Ankaufstellen für Aluminium und andere Metalle in ganz Deutschland!

**Was bereits existiert:**
Ich habe eine Google Maps-Karte erstellt und die ersten 20 Ankaufstellen in Berlin, Hamburg und München eingetragen. Zu jeder Stelle gibt es Infos wie:
- Aktuelle Ankaufpreise
- Besonderheiten (Mindestmengen, spezielle Materialien)
- Öffnungszeiten
- Erfahrungsberichte/Bewertungen
- Kontaktdaten

**Was ich von euch brauche:**
1. Kennt ihr gute Ankaufstellen in eurer Region?
2. Habt ihr aktuelle Preisinfos?
3. Besondere Erfahrungen (positiv oder negativ)?

Mit dem folgenden Link könnt ihr direkt Einträge vorschlagen:
[recycling-map-deutschland.de/vorschlagen](http://recycling-map-deutschland.de/vorschlagen)

Alternativ könnt ihr auch hier im Forum antworten, und ich trage die Infos dann ein.

**Warum das Ganze?**
Die Preisunterschiede sind teilweise erheblich (bis zu 40%!), und viele gute Ankaufstellen sind kaum bekannt. Mit dieser Ressource können wir alle profitieren und gleichzeitig das Recycling fördern.

Sobald wir genügend Daten haben, werde ich die Karte öffentlich und kostenlos zur Verfügung stellen.

Vielen Dank für eure Mithilfe!
Laura`,
    userId: userIds.laura,
    username: "Laura_S",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    category: "Projekte",
    tags: ["Ankaufstellen", "Crowdsourcing", "Preisvergleich", "Karte"],
    views: 203,
    upvotes: 26,
    downvotes: 1,
    responseCount: 31,
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate()
  }
];

// Generate responses for forum posts
export const seedForumResponses: SeedForumResponse[] = [
  // Responses for "Zero-Waste Lebensstil" post
  {
    _id: uuidv4(),
    postId: seedForumPosts[0]._id,
    content: `Hallo Anna,

super Bericht! Ich lebe auch seit etwa 8 Monaten "Zero-Waste" und kann vieles bestätigen. Besonders die Kosteneinsparung überrascht immer wieder Freunde, wenn ich davon erzähle.

Eine Ergänzung zu deinen Elektronik-Problemen: In München gibt es den Laden "ReUSE", der gebrauchte Elektronik und Ersatzteile ohne neue Verpackung anbietet. Die haben auch einen Onlineshop. Vielleicht gibt es sowas auch in Hamburg?

Viele Grüße,
Sabine`,
    userId: uuidv4(),
    username: "Sabine78",
    upvotes: 8,
    downvotes: 0,
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate()
  },
  {
    _id: uuidv4(),
    postId: seedForumPosts[0]._id,
    content: `Danke für deine Tipps, Anna!

Ich habe auch mit dem Bienenwachstüchern experimentiert, war aber nicht ganz zufrieden. Die wurden bei mir nach etwa 2 Monaten etwas brüchig und nicht mehr gut formbar. Hast du einen bestimmten Anbieter, den du empfehlen kannst, oder stellst du sie selbst her?

LG aus Berlin
Max`,
    userId: uuidv4(),
    username: "MaxBerlin",
    upvotes: 3,
    downvotes: 0,
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate()
  },
  // Responses for "Aluminium im Garten" post
  {
    _id: uuidv4(),
    postId: seedForumPosts[3]._id,
    content: `Hallo Stefan,

als Gartenbauingenieur kann ich dir zu Aluminiumtöpfen folgendes sagen:

1. Aluminium kann tatsächlich bei saurem Regen oder sauren Böden in kleinen Mengen in die Erde übergehen.

2. Für Zierpflanzen ist das in der Regel unbedenklich.

3. Bei Kräutern und Gemüse würde ich es NICHT empfehlen, da Aluminium tatsächlich in die Pflanzen übergehen kann, besonders bei:
   - Tomaten
   - Basilikum
   - Thymian
   - Petersilie
   (diese reagieren empfindlich auf Aluminium)

4. Eine gute Alternative: Die Alutöpfe mit lebensmittelechtem Epoxydharz oder spezieller Pflanztopffarbe von innen beschichten. Es gibt im Baumarkt spezielle Farben dafür, die eine Barriere bilden.

Oder: Verwende die Alutöpfe als dekorative Übertöpfe und stelle normale Anzuchttöpfe hinein.

Hoffe, das hilft!
Martin`,
    userId: uuidv4(),
    username: "Gartenbau_Martin",
    upvotes: 12,
    downvotes: 0,
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate()
  },
  // Responses for "Aktueller Stand: Was passiert wirklich mit unserem recycelten Aluminium?" post
  {
    _id: uuidv4(),
    postId: seedForumPosts[1]._id,
    content: `Sehr geehrter Herr Dr. Berger,

vielen Dank für Ihren informativen Beitrag. Ich arbeite selbst in einer Sortieranlage in Dortmund und kann Ihre Ausführungen bestätigen.

Eine Ergänzung zum Thema Kleinteile: Wir haben letztes Jahr eine neue optische Sortieranlage mit KI-Unterstützung in Betrieb genommen, die tatsächlich auch kleinere Aluminiumteile ab ca. 1,5 cm erkennen kann. Die Erkennungsrate liegt bei etwa 70%, was eine deutliche Verbesserung zu früheren Systemen darstellt.

Das Problem der Verschmutzung bleibt allerdings bestehen. Unsere Erfahrung zeigt, dass besonders Alufolien mit anhaftenden Lebensmittelresten zu Qualitätsverlusten im Recyclingprozess führen.

Mit freundlichen Grüßen,
Katharina Meyer
Technische Leiterin, RheinSort GmbH`,
    userId: uuidv4(),
    username: "K_Meyer_RheinSort",
    upvotes: 15,
    downvotes: 0,
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate()
  },
  {
    _id: uuidv4(),
    postId: seedForumPosts[1]._id,
    content: `Eine Frage, die mich schon lange beschäftigt: Was passiert eigentlich mit den Farben und Lacken auf bedruckten Aluminiumdosen? Werden die komplett herausgefiltert oder schmelzen die mit ein? Und wenn sie einschmelzen, beeinträchtigt das die Qualität des recycelten Aluminiums?`,
    userId: uuidv4(),
    username: "Recycling_Neuling",
    upvotes: 7,
    downvotes: 0,
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate()
  },
  {
    _id: uuidv4(),
    postId: seedForumPosts[1]._id,
    content: `@Recycling_Neuling: Eine gute Frage! Die Druckfarben und Lacke auf Aluminiumdosen werden im Recyclingprozess tatsächlich thermisch behandelt. Vor dem eigentlichen Einschmelzen durchlaufen die zerkleinerten Dosen eine Erhitzungsphase (ca. 400-500°C), bei der die organischen Bestandteile der Farben und Lacke verbrennen. 

Die anorganischen Bestandteile (Pigmente etc.) werden später im Schmelzprozess in die Schlacke abgeführt, die regelmäßig vom flüssigen Aluminium abgezogen wird.

Moderne Recyclinganlagen haben sehr effiziente Filtersysteme, um die bei der Verbrennung entstehenden Emissionen zu reinigen. Ein kleiner Teil der Lackbestandteile kann jedoch im Aluminium verbleiben und die Legierungsqualität minimal beeinflussen - daher wird recyceltes Aluminium oft mit Primäraluminium gemischt, um konstante Qualitäten zu gewährleisten.

Dr. Michael Berger`,
    userId: userIds.michael,
    username: "Dr_Berger",
    upvotes: 11,
    downvotes: 0,
    createdAt: randomRecentDate(),
    updatedAt: randomRecentDate()
  }
]; 