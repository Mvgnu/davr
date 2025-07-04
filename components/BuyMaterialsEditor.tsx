import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Trash2, Save } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Separator } from './ui/separator';
import { Card } from './ui/card';
import { useToast } from '@/lib/hooks/useToast';
import { MATERIALS } from '@/lib/constants/materials';

interface BuyMaterial {
  materialId: string;
  pricePerKg: number;
  minWeight?: number; 
  maxWeight?: number;
  active: boolean;
}

interface BuyMaterialsEditorProps {
  centerId: string;
  initialMaterials?: BuyMaterial[];
  onSave?: (materials: BuyMaterial[]) => void;
  isLoading?: boolean;
}

const BuyMaterialsEditor: React.FC<BuyMaterialsEditorProps> = ({
  centerId,
  initialMaterials = [],
  onSave,
  isLoading = false
}) => {
  const [materials, setMaterials] = useState<BuyMaterial[]>(initialMaterials);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Update materials if initialMaterials changes
    setMaterials(initialMaterials);
  }, [initialMaterials]);

  const addMaterial = () => {
    setMaterials([
      ...materials,
      {
        materialId: '',
        pricePerKg: 0,
        active: true
      }
    ]);
  };

  const removeMaterial = (index: number) => {
    const newMaterials = [...materials];
    newMaterials.splice(index, 1);
    setMaterials(newMaterials);
  };

  const updateMaterial = (index: number, field: keyof BuyMaterial, value: any) => {
    const newMaterials = [...materials];
    newMaterials[index] = {
      ...newMaterials[index],
      [field]: value
    };
    setMaterials(newMaterials);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate materials
      const invalidMaterials = materials.filter(
        m => !m.materialId || typeof m.pricePerKg !== 'number' || m.pricePerKg < 0
      );
      
      if (invalidMaterials.length > 0) {
        toast({
          title: 'Fehler',
          description: 'Bitte geben Sie für alle Materialien eine gültige ID und einen positiven Preis ein.',
          variant: 'destructive'
        });
        return;
      }
      
      // Filter out duplicate materials
      const uniqueMaterials = materials.reduce((acc: BuyMaterial[], material) => {
        const existingIndex = acc.findIndex(m => m.materialId === material.materialId);
        if (existingIndex === -1) {
          acc.push(material);
        }
        return acc;
      }, []);
      
      // Call API to save materials
      const response = await fetch(`/api/recycling-centers/${centerId}/buy-materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ buyMaterials: uniqueMaterials })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save materials');
      }
      
      toast({
        title: 'Gespeichert',
        description: 'Die Ankaufspreise wurden erfolgreich gespeichert.',
      });
      
      // Call onSave callback if provided
      if (onSave) {
        onSave(uniqueMaterials);
      }
      
      // Refresh data
      router.refresh();
    } catch (error) {
      console.error('Error saving buy materials:', error);
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ankaufspreise für Materialien</h3>
        <Button 
          onClick={addMaterial} 
          variant="outline" 
          size="sm"
          disabled={isLoading || isSaving}
        >
          <Plus className="h-4 w-4 mr-2" />
          Material hinzufügen
        </Button>
      </div>
      
      <Separator className="my-4" />
      
      {materials.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Ankaufspreise festgelegt. Fügen Sie Materialien hinzu, die Sie ankaufen möchten.
        </p>
      ) : (
        <div className="space-y-4">
          {materials.map((material, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`material-${index}`}>Material</Label>
                  <Select
                    value={material.materialId}
                    onValueChange={value => updateMaterial(index, 'materialId', value)}
                    disabled={isLoading || isSaving}
                  >
                    <SelectTrigger className="w-full" id={`material-${index}`}>
                      <SelectValue placeholder="Material auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIALS.map(m => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor={`price-${index}`}>Preis pro kg (€)</Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={material.pricePerKg}
                    onChange={e => updateMaterial(index, 'pricePerKg', parseFloat(e.target.value))}
                    disabled={isLoading || isSaving}
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => removeMaterial(index)}
                    disabled={isLoading || isSaving}
                    className="ml-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor={`min-${index}`}>Mindestgewicht (kg, optional)</Label>
                  <Input
                    id={`min-${index}`}
                    type="number"
                    min="0"
                    value={material.minWeight || ''}
                    onChange={e => updateMaterial(
                      index, 
                      'minWeight', 
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )}
                    disabled={isLoading || isSaving}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`max-${index}`}>Höchstgewicht (kg, optional)</Label>
                  <Input
                    id={`max-${index}`}
                    type="number"
                    min="0"
                    value={material.maxWeight || ''}
                    onChange={e => updateMaterial(
                      index, 
                      'maxWeight', 
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )}
                    disabled={isLoading || isSaving}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`active-${index}`}
                    checked={material.active}
                    onChange={e => updateMaterial(index, 'active', e.target.checked)}
                    disabled={isLoading || isSaving}
                  />
                  <Label htmlFor={`active-${index}`}>Aktiv</Label>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <div className="flex justify-end mt-4">
        <Button 
          onClick={handleSave} 
          disabled={isLoading || isSaving}
          className="w-full md:w-auto"
        >
          {isSaving ? 'Wird gespeichert...' : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Ankaufspreise speichern
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default BuyMaterialsEditor; 