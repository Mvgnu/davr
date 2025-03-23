'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContentSection, { 
  ContentBlock,
  InfoBlock,
  WarningBlock,
  CardBlock,
  ListBlock,
  CTABlock,
  StatsBlock
} from "@/components/shared/ContentSection";
import { 
  Recycle, 
  PanelTop, 
  FileText, 
  HelpCircle,
  Trash2,
  Leaf,
  BarChart3,
  Calendar,
  Trophy
} from 'lucide-react';

const RecyclingGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState('basics');

  // German recycling statistics
  const statsBlocks: ContentBlock[] = [
    {
      id: 'recycling-stats',
      type: 'stats',
      title: 'Recycling-Statistiken in Deutschland',
      columns: 4,
      stats: [
        { value: '67%', label: 'Recyclingquote', trend: 2.3 },
        { value: '615kg', label: 'Abfall pro Person/Jahr' },
        { value: '5.8M', label: 'Tonnen Plastikmüll jährlich' },
        { value: '14M', label: 'Tonnen CO₂ eingespart' }
      ]
    }
  ];

  // Basics content blocks
  const basicsBlocks: ContentBlock[] = [
    {
      id: 'basics-intro',
      type: 'info',
      title: 'Warum Recycling wichtig ist',
      content: 'Recycling in Deutschland spielt eine zentrale Rolle im Umweltschutz und in der nachhaltigen Ressourcennutzung. Durch die Wiederverwertung von Materialien werden Rohstoffe geschont, Energie eingespart und die Umweltbelastung reduziert.',
      variant: 'highlight'
    },
    ...statsBlocks,
    {
      id: 'german-system',
      type: 'card',
      title: 'Das deutsche Abfallsystem verstehen',
      content: 'Deutschland hat eines der fortschrittlichsten Abfallmanagementsysteme der Welt. Es basiert auf dem Kreislaufwirtschaftsgesetz und dem Verursacherprinzip, nach dem der Erzeuger von Abfall für dessen ordnungsgemäße Entsorgung verantwortlich ist.',
      color: 'blue',
      link: {
        text: 'Mehr über das Kreislaufwirtschaftsgesetz',
        url: '/resources/kreislaufwirtschaftsgesetz'
      }
    },
    {
      id: 'bins-info',
      type: 'list',
      title: 'Die deutschen Mülltonnen',
      iconType: 'check',
      items: [
        {
          text: 'Blauer Behälter (Papier)',
          description: 'Für Papier, Pappe und Karton. Keine verschmutzten Papierverpackungen oder Kassenbons.'
        },
        {
          text: 'Gelber Sack/Gelbe Tonne',
          description: 'Für Verpackungen aus Plastik, Metall und Verbundstoffen. Erkennbar am Grünen Punkt oder dem Recycling-Symbol.'
        },
        {
          text: 'Braune Biotonne',
          description: 'Für organische Abfälle wie Essensreste, Gartenabfälle und unbehandelte Holzreste.'
        },
        {
          text: 'Graue/Schwarze Restmülltonne',
          description: 'Für nicht wiederverwertbare Abfälle, die in keinen anderen Behälter gehören.'
        },
        {
          text: 'Glascontainer',
          description: 'Getrennt nach Farben: Weiß, Grün und Braun. Pfandflaschen gehören nicht hierher!'
        }
      ]
    },
    {
      id: 'common-mistakes',
      type: 'warning',
      title: 'Häufige Fehler beim Recycling',
      content: 'Kassenbons gehören in den Restmüll, nicht ins Altpapier, da sie oft Thermopapier enthalten. Pizzakartons mit Essensresten sollten nicht im Papiermüll entsorgt werden. Glühbirnen dürfen nicht in den Glascontainer, sondern müssen als Sondermüll entsorgt werden.',
      variant: 'default'
    }
  ];

  // Materials content blocks
  const materialsBlocks: ContentBlock[] = [
    {
      id: 'materials-intro',
      type: 'info',
      title: 'Richtige Materialtrennung',
      content: 'Die korrekte Trennung verschiedener Materialien ist entscheidend für ein effektives Recycling. Jeder Werkstoff erfordert spezifische Behandlungsmethoden, um optimal wiederverwertet werden zu können.',
      variant: 'highlight'
    },
    {
      id: 'plastic-guide',
      type: 'card',
      title: 'Kunststoffe (Plastik)',
      content: 'Plastikverpackungen werden im gelben Sack/gelber Tonne gesammelt. Achten Sie auf die Recycling-Codes 1-7 auf dem Boden der Verpackungen. PET (1) und HDPE (2) sind am einfachsten zu recyceln, während PVC (3) und Polystyrol (6) problematischer sind.',
      color: 'green',
      link: {
        text: 'Kunststoff-Recyclingcodes verstehen',
        url: '/materials/plastic-codes'
      }
    },
    {
      id: 'paper-guide',
      type: 'card',
      title: 'Papier & Karton',
      content: 'Zeitungen, Zeitschriften, Bücher (ohne Umschlag), Briefumschläge (ohne Fenster), saubere Pappe und Kartons gehören in die blaue Tonne. Wichtig: Papier sollte nicht verschmutzt oder nass sein, da dies den Recyclingprozess beeinträchtigt.',
      color: 'blue'
    },
    {
      id: 'glass-guide',
      type: 'card',
      title: 'Glas',
      content: 'Glasflaschen und -behälter werden nach Farben getrennt (weiß, grün, braun) recycelt. Deckel entfernen, aber Etiketten können dranbleiben. Achtung: Trinkgläser, Fensterglas, Keramik, Porzellan und Glühbirnen gehören NICHT in den Glascontainer!',
      color: 'amber'
    },
    {
      id: 'electronics-guide',
      type: 'card',
      title: 'Elektronik & Batterien',
      content: 'Elektrogeräte enthalten wertvolle und teils gefährliche Stoffe und müssen an speziellen Sammelstellen oder im Handel abgegeben werden. Batterien und Akkus können an Sammelboxen in Geschäften zurückgegeben werden.',
      color: 'purple',
      link: {
        text: 'E-Waste Sammelstellen finden',
        url: '/recycling-centers?material=electronics'
      }
    },
    {
      id: 'special-materials',
      type: 'warning',
      title: 'Sondermüll richtig entsorgen',
      content: 'Farben, Lacke, Chemikalien, Medikamente, Energiesparlampen und andere Sonderabfälle dürfen nicht im Hausmüll entsorgt werden. Nutzen Sie stattdessen Wertstoffhöfe oder spezielle Sammelstellen, um Umweltschäden zu vermeiden.',
      variant: 'critical'
    }
  ];

  // Best practices content blocks
  const bestPracticesBlocks: ContentBlock[] = [
    {
      id: 'best-practices-intro',
      type: 'success',
      title: 'Bewährte Recycling-Methoden',
      content: 'Mit den richtigen Gewohnheiten und etwas Planung kann jeder seinen Beitrag zu einer besseren Abfallwirtschaft leisten. Hier sind einige bewährte Methoden, die Ihnen helfen können, Ihren Recyclingprozess zu optimieren.'
    },
    {
      id: 'preparation-tips',
      type: 'list',
      title: 'Vorbereitung von Recyclingmaterialien',
      iconType: 'arrow',
      items: [
        {
          text: 'Verpackungen ausspülen',
          description: 'Lebensmittelreste können den Recyclingprozess beeinträchtigen und unangenehme Gerüche verursachen.'
        },
        {
          text: 'Deckel entfernen',
          description: 'Trennen Sie Deckel von Flaschen und Behältern, da sie oft aus unterschiedlichen Materialien bestehen.'
        },
        {
          text: 'Flach zusammendrücken',
          description: 'Kartons und Plastikflaschen zusammendrücken, um Platz zu sparen und Transporteffizienz zu erhöhen.'
        },
        {
          text: 'Verbundmaterialien trennen',
          description: 'Wenn möglich, trennen Sie verschiedene Materialien einer Verpackung (z.B. Plastikfenster aus Papierumschlägen).'
        }
      ]
    },
    {
      id: 'household-organization',
      type: 'card',
      title: 'Organisation im Haushalt',
      content: 'Richten Sie ein übersichtliches Trennsystem in Ihrem Haushalt ein. Mehrere kleine Behälter oder ein Mehrkammersystem helfen, Platz zu sparen und die Mülltrennung zu vereinfachen. Beschriften Sie die Behälter klar und platzieren Sie sie an strategisch günstigen Orten (z.B. Küche, Bad).',
      color: 'green'
    },
    {
      id: 'circular-economy',
      type: 'info',
      title: 'Kreislaufwirtschaft fördern',
      content: 'Recycling ist nur ein Teil der Lösung. Die Kreislaufwirtschaft beginnt bereits beim Einkauf: Wählen Sie Produkte mit wenig Verpackung, aus recycelten Materialien oder mit Mehrwegsystemen. Reparieren und wiederverwenden Sie Gegenstände, bevor Sie sie entsorgen.',
      variant: 'highlight'
    },
    {
      id: 'seasonal-guide',
      type: 'card',
      title: 'Saisonale Recycling-Tipps',
      content: 'Während der Feiertage fällt besonders viel Verpackungsmüll an. Geschenkpapier kann oft recycelt werden (Ausnahme: glänzendes oder beschichtetes Papier). Weihnachtsbäume werden in vielen Gemeinden Anfang Januar gesammelt und zu Kompost verarbeitet.',
      color: 'blue',
      link: {
        text: 'Saisonaler Recycling-Kalender',
        url: '/resources/seasonal-guide'
      }
    },
    {
      id: 'call-to-recycle',
      type: 'cta',
      title: 'Werden Sie aktiv!',
      content: 'Recycling ist eine Gemeinschaftsaufgabe. Informieren Sie sich über lokale Initiativen und Projekte in Ihrer Nähe, um mehr zu tun.',
      primaryButton: {
        text: 'Recycling-Zentren finden',
        url: '/recycling-centers'
      },
      secondaryButton: {
        text: 'Lokale Veranstaltungen',
        url: '/events'
      },
      variant: 'highlight'
    }
  ];

  // FAQ content blocks
  const faqBlocks: ContentBlock[] = [
    {
      id: 'faq-list',
      type: 'list',
      title: 'Häufig gestellte Fragen',
      iconType: 'none',
      items: [
        {
          text: 'Was passiert mit meinem recycelten Müll?',
          description: 'Recyclingmaterial wird sortiert, gereinigt, zerkleinert und zu neuen Rohstoffen verarbeitet. Diese werden dann zur Herstellung neuer Produkte verwendet. Der Prozess variiert je nach Material.'
        },
        {
          text: 'Muss ich Etiketten von Flaschen und Dosen entfernen?',
          description: 'Nein, moderne Sortieranlagen können Etiketten während des Recyclingprozesses entfernen. Es ist jedoch hilfreich, Verschlüsse zu entfernen, da sie oft aus anderen Materialien bestehen.'
        },
        {
          text: 'Warum kann ich Pizza-Kartons nicht recyceln?',
          description: 'Pizzakartons sind oft mit Fett und Essensresten verunreinigt, was das Papierrecycling beeinträchtigt. Saubere Teile können abgetrennt und recycelt werden, verschmutzte Teile gehören in den Biomüll.'
        },
        {
          text: 'Was bedeuten die Nummern auf Plastikverpackungen?',
          description: 'Die Nummern 1-7 in den Recycling-Dreiecken geben den Kunststofftyp an und helfen beim Sortieren. Nicht alle sind gleich gut recycelbar: 1 (PET) und 2 (HDPE) sind am einfachsten zu recyceln.'
        },
        {
          text: 'Wie entsorge ich Elektronikgeräte richtig?',
          description: 'Elektronikgeräte müssen an speziellen Sammelstellen, Wertstoffhöfen oder im Handel abgegeben werden. Viele Geschäfte sind verpflichtet, Altgeräte zurückzunehmen, besonders beim Kauf eines neuen Geräts.'
        },
        {
          text: 'Was tun mit kaputten Energiesparlampen und LEDs?',
          description: 'Diese enthalten teils gefährliche Stoffe und gehören zum Sondermüll. Sammelstellen finden Sie in Baumärkten, Elektrofachgeschäften oder auf Wertstoffhöfen.'
        }
      ]
    },
    {
      id: 'additional-resources',
      type: 'card',
      title: 'Weitere Ressourcen',
      content: 'Für detailliertere Informationen zum Recycling in Deutschland können Sie die offiziellen Richtlinien des Umweltbundesamtes konsultieren oder die Website Ihres lokalen Abfallwirtschaftsbetriebs besuchen.',
      color: 'gray',
      link: {
        text: 'PDF-Leitfaden herunterladen',
        url: '/resources/recycling-guide-de.pdf'
      }
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Hero Section with gradient background */}
      <div className="relative overflow-hidden rounded-2xl mb-10">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-800 opacity-90"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('/images/recycling-pattern.png')]"></div>
        
        <div className="relative p-8 md:p-12 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Recycling-Leitfaden für Deutschland</h1>
          <p className="text-xl md:text-2xl text-green-100 mb-6">
            Erfahren Sie, wie Sie richtig recyceln und zum Umweltschutz beitragen können
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-5 py-3 flex items-center">
              <Leaf className="w-5 h-5 mr-2 text-green-200" />
              <span className="text-green-100">Verantwortungsbewusst recyceln</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-5 py-3 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-200" />
              <span className="text-green-100">67% Recyclingquote</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-5 py-3 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-green-200" />
              <span className="text-green-100">Weltweiter Vorreiter</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation tabs */}
      <Tabs defaultValue="basics" className="mb-10" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basics" className="flex items-center justify-center">
            <Recycle className="w-4 h-4 mr-2" />
            <span>Grundlagen</span>
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center justify-center">
            <PanelTop className="w-4 h-4 mr-2" />
            <span>Materialien</span>
          </TabsTrigger>
          <TabsTrigger value="best-practices" className="flex items-center justify-center">
            <FileText className="w-4 h-4 mr-2" />
            <span>Best Practices</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center justify-center">
            <HelpCircle className="w-4 h-4 mr-2" />
            <span>FAQ</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="basics" className="mt-6">
          <ContentSection 
            title="Grundlagen des Recyclings" 
            subtitle="Verstehen Sie die Basis für effektives Recycling in Deutschland"
            blocks={basicsBlocks}
          />
        </TabsContent>
        
        <TabsContent value="materials" className="mt-6">
          <ContentSection 
            title="Materialien richtig trennen" 
            subtitle="Lernen Sie, wie verschiedene Materialien korrekt sortiert und recycelt werden"
            blocks={materialsBlocks}
          />
        </TabsContent>
        
        <TabsContent value="best-practices" className="mt-6">
          <ContentSection 
            title="Best Practices für den Alltag" 
            subtitle="Praktische Tipps für effizientes und nachhaltiges Recycling zu Hause"
            blocks={bestPracticesBlocks}
          />
        </TabsContent>
        
        <TabsContent value="faq" className="mt-6">
          <ContentSection 
            title="Häufig gestellte Fragen" 
            subtitle="Antworten auf die wichtigsten Fragen zum Thema Recycling"
            blocks={faqBlocks}
          />
        </TabsContent>
      </Tabs>
      
      {/* Call to action at bottom */}
      <div className="mt-12 bg-gray-100 rounded-xl p-8 border border-gray-200">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:mr-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Finden Sie Recycling-Möglichkeiten in Ihrer Nähe
            </h3>
            <p className="text-gray-600">
              Nutzen Sie unsere Karte, um Recyclingzentren, Wertstoffhöfe und spezielle 
              Sammelstellen in Ihrer Umgebung zu finden.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="/recycling-centers" className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center justify-center">
              <Trash2 className="w-5 h-5 mr-2" />
              Recycling-Zentren finden
            </a>
            <a href="/events" className="bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center justify-center">
              <Calendar className="w-5 h-5 mr-2" />
              Recycling-Events
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecyclingGuide; 