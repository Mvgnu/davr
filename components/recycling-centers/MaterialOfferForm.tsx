import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

type Material = {
  id: number;
  name: string;
  category: string;
};

type MaterialOffer = {
  id?: number;
  materialId: number;
  materialName?: string;
  price: number;
  minQuantity: number;
  maxQuantity?: number;
  notes?: string;
  active: boolean;
};

const materialOfferSchema = z.object({
  materialId: z.number(),
  price: z.number().min(0, 'Preis kann nicht negativ sein'),
  minQuantity: z.number().min(0, 'Mindestmenge kann nicht negativ sein'),
  maxQuantity: z.number().optional(),
  notes: z.string().optional(),
  active: z.boolean().default(true),
});

interface MaterialOfferFormProps {
  materials: Material[];
  selectedMaterialId: number | null;
  onSelectMaterial: (materialId: number) => void;
  initialData?: MaterialOffer;
  onSubmit: (data: MaterialOffer) => void;
  onCancel: () => void;
}

export default function MaterialOfferForm({
  materials,
  selectedMaterialId,
  onSelectMaterial,
  initialData,
  onSubmit,
  onCancel,
}: MaterialOfferFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof materialOfferSchema>>({
    resolver: zodResolver(materialOfferSchema),
    defaultValues: {
      materialId: initialData?.materialId || 0,
      price: initialData?.price || 0,
      minQuantity: initialData?.minQuantity || 0,
      maxQuantity: initialData?.maxQuantity,
      notes: initialData?.notes || '',
      active: initialData?.active !== false,
    },
  });

  // Set form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        materialId: initialData.materialId,
        price: initialData.price,
        minQuantity: initialData.minQuantity,
        maxQuantity: initialData.maxQuantity,
        notes: initialData.notes || '',
        active: initialData.active !== false,
      });
      
      if (initialData.materialId && !selectedMaterialId) {
        onSelectMaterial(initialData.materialId);
      }
    }
  }, [initialData, form, onSelectMaterial, selectedMaterialId]);

  const handleSubmit = async (values: z.infer<typeof materialOfferSchema>) => {
    setIsLoading(true);
    
    try {
      onSubmit({
        ...values,
        materialId: selectedMaterialId || values.materialId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categorizedMaterials = materials.reduce((acc: Record<string, Material[]>, material) => {
    if (!acc[material.category]) {
      acc[material.category] = [];
    }
    acc[material.category].push(material);
    return acc;
  }, {});

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-4">
          {selectedMaterialId === null ? (
            <FormField
              control={form.control}
              name="materialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(parseInt(value));
                      onSelectMaterial(parseInt(value));
                    }}
                    value={field.value ? field.value.toString() : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Material auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(categorizedMaterials).map(([category, categoryMaterials]) => (
                        <div key={category}>
                          <div className="px-2 py-1.5 text-sm font-semibold bg-gray-100">
                            {category}
                          </div>
                          {categoryMaterials.map((material) => (
                            <SelectItem
                              key={material.id}
                              value={material.id.toString()}
                              className="pl-4"
                            >
                              {material.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="mb-4">
              <label className="text-sm font-medium">Material</label>
              <div className="mt-1">
                <div className="text-base">
                  {materials.find(m => m.id === selectedMaterialId)?.name || 'Unbekanntes Material'}
                </div>
                <div className="text-sm text-gray-500">
                  {materials.find(m => m.id === selectedMaterialId)?.category || 'Keine Kategorie'}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preis (€/kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mindestmenge (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Höchstmenge (kg) - Optional</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Angebot aktiv</FormLabel>
                    <p className="text-sm text-gray-500">
                      Deaktivieren Sie das Angebot temporär, ohne es zu löschen
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hinweise - Optional</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ''}
                    placeholder="Zusätzliche Informationen oder Bedingungen für dieses Material"
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Abbrechen
          </Button>
          
          <Button type="submit" disabled={isLoading || !selectedMaterialId}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichern...
              </>
            ) : initialData ? 'Aktualisieren' : 'Hinzufügen'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 