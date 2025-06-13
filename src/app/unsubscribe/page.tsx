
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailMinus, ShieldAlert } from 'lucide-react';
import { unsubscribeFromNewsletter } from '@/app/actions/newsletterActions';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; // Ensure this page is dynamically rendered

const unsubscribeSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type UnsubscribeFormData = z.infer<typeof unsubscribeSchema>;

export default function UnsubscribePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UnsubscribeFormData>({
    resolver: zodResolver(unsubscribeSchema),
  });

  const onSubmit: SubmitHandler<UnsubscribeFormData> = async (data) => {
    setIsSubmitting(true);
    setFormMessage(null);
    try {
      const result = await unsubscribeFromNewsletter(data.email);
      if (result.success) {
        toast({
          title: "Unsubscription Processed",
          description: result.message,
        });
        setFormMessage({ type: 'success', text: result.message });
        reset();
      } else {
        toast({
          title: "Unsubscription Failed",
          description: result.message,
          variant: "destructive",
        });
        setFormMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error("Unsubscribe error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setFormMessage({ type: 'error', text: "An unexpected error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-card shadow-xl rounded-lg">
      <div className="text-center mb-8">
        <MailMinus className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-3xl font-bold font-headline">Unsubscribe from Newsletter</h1>
        <p className="text-muted-foreground mt-2">
          We're sorry to see you go. Enter your email address below to stop receiving new article notifications.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="email" className="font-medium">Email Address</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="you@example.com"
            className="mt-1"
            disabled={isSubmitting}
          />
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>

        {formMessage && (
          <div className={`p-3 rounded-md text-sm ${formMessage.type === 'success' ? 'bg-green-100 border border-green-300 text-green-700' : 'bg-red-100 border border-red-300 text-red-700'} flex items-center`}>
            {formMessage.type === 'success' ? <MailMinus className="h-5 w-5 mr-2" /> : <ShieldAlert className="h-5 w-5 mr-2" />}
            {formMessage.text}
          </div>
        )}

        <Button type="submit" className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MailMinus className="mr-2 h-4 w-4" />
          )}
          {isSubmitting ? 'Processing...' : 'Unsubscribe'}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Changed your mind? <Link href="/" className="text-primary hover:underline">Return to homepage</Link>.
      </p>
    </div>
  );
}
