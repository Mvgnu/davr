import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PackageIcon } from "lucide-react";

type Material = {
  id: number;
  name: string;
  category: string;
};

type MaterialWithPrice = Material & {
  price?: number;
  minQuantity?: number;
  notes?: string;
};

interface MaterialsListProps {
  materials: MaterialWithPrice[];
  title?: string;
  emptyMessage?: string;
  showPrices?: boolean;
  maxHeight?: string;
}

export function MaterialsList({
  materials,
  title = "Akzeptierte Materialien",
  emptyMessage = "Keine Materialien verfügbar",
  showPrices = false,
  maxHeight = "300px"
}: MaterialsListProps) {
  // Group materials by category
  const materialsByCategory = materials.reduce((acc: Record<string, MaterialWithPrice[]>, material) => {
    if (!acc[material.category]) {
      acc[material.category] = [];
    }
    acc[material.category].push(material);
    return acc;
  }, {});

  const categories = Object.keys(materialsByCategory).sort();

  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
        <PackageIcon className="h-10 w-10 mb-3 text-gray-300" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="font-medium text-lg">{title}</h3>}
      <ScrollArea className={`border rounded-md`} style={{ maxHeight }}>
        <div className="p-4">
          {categories.map((category, index) => (
            <div key={category} className="mb-6 last:mb-0">
              <h4 className="font-medium text-sm text-gray-700 mb-3">{category}</h4>
              <div className="space-y-3">
                {materialsByCategory[category].map((material) => (
                  <div key={material.id} className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{material.name}</p>
                      {material.notes && (
                        <p className="text-xs text-gray-500 mt-1">{material.notes}</p>
                      )}
                    </div>
                    {showPrices && material.price && (
                      <div className="text-right">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {material.price.toFixed(2)} €/kg
                        </Badge>
                        {material.minQuantity && material.minQuantity > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Min. {material.minQuantity} kg
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {index < categories.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 