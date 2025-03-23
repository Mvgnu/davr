/**
 * Material types for recycling with German translations
 */

export interface MaterialOption {
  value: string;
  label: string;
  category: string;
  description?: string;
  icon?: string;
}

export const MATERIAL_CATEGORIES = [
  { value: 'metalle', label: 'Metalle' },
  { value: 'kunststoffe', label: 'Kunststoffe' },
  { value: 'papier', label: 'Papier & Karton' },
  { value: 'glas', label: 'Glas' },
  { value: 'elektronik', label: 'Elektronik' },
  { value: 'holz', label: 'Holz' },
  { value: 'textilien', label: 'Textilien' },
  { value: 'sonderabfall', label: 'Sonderabfall' },
  { value: 'bauabfall', label: 'Bauabfall' },
  { value: 'fahrzeugteile', label: 'Fahrzeugteile' },
  { value: 'sonstige', label: 'Sonstige' },
];

export const MATERIALS: MaterialOption[] = [
  // Metalle
  { value: 'aluminium', label: 'Aluminium', category: 'metalle', description: 'Aluminiumschrott, Dosen, Profile und andere Aluminiumprodukte' },
  { value: 'kupfer', label: 'Kupfer', category: 'metalle', description: 'Kupferrohre, Kabel, Drähte und andere Kupferprodukte' },
  { value: 'messing', label: 'Messing', category: 'metalle', description: 'Messingrohre, Armaturen, Beschläge und andere Messingprodukte' },
  { value: 'edelstahl', label: 'Edelstahl', category: 'metalle', description: 'Edelstahlschrott, Behälter, Rohre und andere Edelstahlprodukte' },
  { value: 'stahl', label: 'Stahl', category: 'metalle', description: 'Stahlschrott, Träger, Rohre und andere Stahlprodukte' },
  { value: 'gusseisen', label: 'Gusseisen', category: 'metalle', description: 'Gusseisenteile, Heizkörper, Pfannen und andere Gusseisenprodukte' },
  { value: 'zink', label: 'Zink', category: 'metalle', description: 'Zinkschrott, Dachrinnen, Fallrohre und andere Zinkprodukte' },
  { value: 'blei', label: 'Blei', category: 'metalle', description: 'Bleischrott, Batterien, Bleche und andere Bleiprodukte' },
  { value: 'edelmetalle', label: 'Edelmetalle', category: 'metalle', description: 'Gold, Silber, Platin und andere Edelmetalle' },
  { value: 'metallmischungen', label: 'Metallmischungen', category: 'metalle', description: 'Gemischte Metalle und Legierungen' },
  
  // Kunststoffe
  { value: 'pet', label: 'PET', category: 'kunststoffe', description: 'Polyethylenterephthalat: Getränkeflaschen, Verpackungen' },
  { value: 'pe', label: 'PE', category: 'kunststoffe', description: 'Polyethylen: Folien, Tüten, Flaschen, Eimer' },
  { value: 'pp', label: 'PP', category: 'kunststoffe', description: 'Polypropylen: Lebensmittelverpackungen, Möbel, Automobilteile' },
  { value: 'ps', label: 'PS', category: 'kunststoffe', description: 'Polystyrol: Schaumstoff, Verpackungen, Einweggeschirr' },
  { value: 'pvc', label: 'PVC', category: 'kunststoffe', description: 'Polyvinylchlorid: Rohre, Bodenbeläge, Profile' },
  { value: 'abs', label: 'ABS', category: 'kunststoffe', description: 'Acrylnitril-Butadien-Styrol: Elektrogeräte, Spielzeug' },
  { value: 'sonstige-kunststoffe', label: 'Sonstige Kunststoffe', category: 'kunststoffe', description: 'Andere Kunststoffarten und -mischungen' },
  
  // Papier & Karton
  { value: 'zeitungen', label: 'Zeitungen & Zeitschriften', category: 'papier', description: 'Zeitungen, Zeitschriften, Werbematerialien' },
  { value: 'karton', label: 'Karton & Pappe', category: 'papier', description: 'Kartonagen, Wellpappe, Schachteln' },
  { value: 'buero-papier', label: 'Büropapier', category: 'papier', description: 'Druckerpapier, Dokumentenpapier, Schreibpapier' },
  { value: 'buecher', label: 'Bücher & Broschüren', category: 'papier', description: 'Bücher, Kataloge, Broschüren' },
  { value: 'gemischtes-papier', label: 'Gemischtes Papier', category: 'papier', description: 'Verschiedene Papiersorten gemischt' },
  
  // Glas
  { value: 'weissglas', label: 'Weißglas', category: 'glas', description: 'Transparente Glasflaschen und -behälter' },
  { value: 'gruenglas', label: 'Grünglas', category: 'glas', description: 'Grüne Glasflaschen und -behälter' },
  { value: 'braunglas', label: 'Braunglas', category: 'glas', description: 'Braune Glasflaschen und -behälter' },
  { value: 'buntglas', label: 'Buntglas', category: 'glas', description: 'Verschiedenfarbige Glasobjekte' },
  { value: 'flachglas', label: 'Flachglas', category: 'glas', description: 'Fensterglas, Spiegelglas, Plattenglas' },
  
  // Elektronik
  { value: 'computer', label: 'Computer & Laptops', category: 'elektronik', description: 'PCs, Laptops, Server und Zubehör' },
  { value: 'smartphones', label: 'Smartphones & Tablets', category: 'elektronik', description: 'Mobiltelefone, Tablets und Zubehör' },
  { value: 'haushaltsgeraete', label: 'Haushaltsgeräte', category: 'elektronik', description: 'Kühlschränke, Waschmaschinen, Herde usw.' },
  { value: 'unterhaltungselektronik', label: 'Unterhaltungselektronik', category: 'elektronik', description: 'Fernseher, Radios, Stereoanlagen usw.' },
  { value: 'leiterplatten', label: 'Leiterplatten', category: 'elektronik', description: 'Platinen und elektronische Komponenten' },
  { value: 'kabel', label: 'Kabel & Leitungen', category: 'elektronik', description: 'Stromkabel, Netzwerkkabel, Telefonkabel' },
  { value: 'batterien', label: 'Batterien & Akkus', category: 'elektronik', description: 'Alle Arten von Batterien und Akkumulatoren' },
  
  // Holz
  { value: 'massivholz', label: 'Massivholz', category: 'holz', description: 'Unbehandeltes Vollholz, Bretter, Balken' },
  { value: 'spanplatten', label: 'Spanplatten', category: 'holz', description: 'Pressspan, MDF, OSB-Platten' },
  { value: 'holzmoebel', label: 'Holzmöbel', category: 'holz', description: 'Tische, Stühle, Schränke aus Holz' },
  { value: 'paletten', label: 'Paletten & Transportholz', category: 'holz', description: 'Europaletten, Holzkisten, Transportverpackungen' },
  
  // Textilien
  { value: 'kleidung', label: 'Kleidung', category: 'textilien', description: 'Alle Arten von Bekleidung' },
  { value: 'heimtextilien', label: 'Heimtextilien', category: 'textilien', description: 'Bettwäsche, Handtücher, Vorhänge, Teppiche' },
  { value: 'industrietextilien', label: 'Industrietextilien', category: 'textilien', description: 'Technische Textilien, Geotextilien' },
  
  // Sonderabfall
  { value: 'farben', label: 'Farben & Lacke', category: 'sonderabfall', description: 'Farbreste, Lacke, Lösungsmittel' },
  { value: 'chemikalien', label: 'Chemikalien', category: 'sonderabfall', description: 'Haushaltschemikalien, Reinigungsmittel' },
  { value: 'altoel', label: 'Altöl & Schmierstoffe', category: 'sonderabfall', description: 'Motoröl, Hydrauliköl, Schmierfette' },
  
  // Bauabfall
  { value: 'bauschutt', label: 'Bauschutt', category: 'bauabfall', description: 'Beton, Ziegel, Fliesen, Keramik' },
  { value: 'bauholz', label: 'Bauholz', category: 'bauabfall', description: 'Behandeltes Holz aus Bau und Abriss' },
  { value: 'daemmstoffe', label: 'Dämmstoffe', category: 'bauabfall', description: 'Mineral-, Glas- und Schaumstoffdämmung' },
  { value: 'metalle-bau', label: 'Baumetalle', category: 'bauabfall', description: 'Metallschrott aus Bau und Abriss' },
  
  // Fahrzeugteile
  { value: 'autoteile', label: 'Autoteile', category: 'fahrzeugteile', description: 'Karosserieteile, Motoren, Getriebe usw.' },
  { value: 'reifen', label: 'Reifen & Gummi', category: 'fahrzeugteile', description: 'Altreifen, Gummiteile von Fahrzeugen' },
  { value: 'autobatterien', label: 'Autobatterien', category: 'fahrzeugteile', description: 'Starterbatterien und andere Fahrzeugbatterien' },
  
  // Sonstige
  { value: 'biomasse', label: 'Biomasse', category: 'sonstige', description: 'Organisches Material, Grünschnitt, Kompost' },
  { value: 'verbundstoffe', label: 'Verbundstoffe', category: 'sonstige', description: 'Materialien aus verschiedenen, nicht trennbaren Komponenten' },
  { value: 'sperrabfall', label: 'Sperrabfall', category: 'sonstige', description: 'Große Gegenstände, die nicht in reguläre Abfallbehälter passen' },
];

/**
 * Get materials by category
 */
export function getMaterialsByCategory(category: string): MaterialOption[] {
  return MATERIALS.filter(material => material.category === category);
}

/**
 * Get material by value
 */
export function getMaterialByValue(value: string): MaterialOption | undefined {
  return MATERIALS.find(material => material.value === value);
}

/**
 * Get multiple materials by their values
 */
export function getMaterialsByValues(values: string[]): MaterialOption[] {
  return MATERIALS.filter(material => values.includes(material.value));
}

/**
 * Get common units for recycling materials
 */
export const MATERIAL_UNITS = [
  { value: 'kg', label: 'Kilogramm (kg)' },
  { value: 't', label: 'Tonnen (t)' },
  { value: 'stueck', label: 'Stück' },
  { value: 'palette', label: 'Palette' },
  { value: 'container', label: 'Container' },
  { value: 'liter', label: 'Liter (l)' },
  { value: 'kubikmeter', label: 'Kubikmeter (m³)' },
  { value: 'ballen', label: 'Ballen' },
  { value: 'sack', label: 'Sack' },
]; 