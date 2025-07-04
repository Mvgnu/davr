'use client';

import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const claimFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Der Name muss mindestens 2 Zeichen lang sein.',
  }),
  email: z.string().email({
    message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  }),
  phone: z.string().optional(),
  message: z.string().min(10, {
    message: 'Die Nachricht muss mindestens 10 Zeichen lang sein.',
  }).max(500, {
    message: 'Die Nachricht darf maximal 500 Zeichen lang sein.',
  }),
  companyName: z.string().optional(),
  businessRole: z.string().optional(),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

interface ClaimCenterFormProps {
  recyclingCenterId: string;
  recyclingCenterName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ClaimCenterForm({
  recyclingCenterId,
  recyclingCenterName,
  onSuccess,
  onCancel,
}: ClaimCenterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
      companyName: '',
      businessRole: '',
    },
  });

  async function onSubmit(data: ClaimFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post(`/api/recycling-centers/${recyclingCenterId}/claim`, data);
      
      if (response.data.success) {
        toast.success('Ihre Anfrage wurde erfolgreich eingereicht');
        setShowSuccessMessage(true);
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(response.data.error || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später noch einmal.');
      }
    } catch (err: any) {
      console.error('Error submitting claim request:', err);
      setError(err.response?.data?.error || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später noch einmal.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (showSuccessMessage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Anfrage eingereicht</CardTitle>
          <CardDescription>
            Vielen Dank für Ihre Anfrage für {recyclingCenterName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Wir haben Ihre Anfrage zur Übernahme dieses Recycling-Centers erhalten. Unser Team wird Ihre Anfrage prüfen und sich in Kürze bei Ihnen melden.
          </p>
          <p>
            Sie werden per E-Mail benachrichtigt, sobald Ihre Anfrage bearbeitet wurde.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={onCancel}>Schließen</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recycling-Center beanspruchen</CardTitle>
        <CardDescription>
          Sind Sie der Besitzer von {recyclingCenterName}? Füllen Sie dieses Formular aus, um die Verwaltung zu übernehmen.
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm border border-red-200">
                {error}
              </div>
            )}
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ihr vollständiger Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail-Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="ihre-email@beispiel.de" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefonnummer (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+49 123 456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firmenname (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Name Ihrer Firma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="businessRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. Geschäftsführer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nachricht</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Bitte beschreiben Sie Ihre Beziehung zu diesem Recycling-Center und warum Sie es verwalten möchten." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Bitte geben Sie Informationen an, die Ihren Anspruch auf dieses Recycling-Center belegen.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Abbrechen
            </Button>
            
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird eingereicht...
                </>
              ) : (
                'Anfrage einreichen'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
} 