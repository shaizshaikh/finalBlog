
"use client";

import { useState, type ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2 } from 'lucide-react';
import { subscribeToNewsletter } from '@/app/actions/newsletterActions';

interface NewsletterDialogProps {
  children: ReactNode;
}

export function NewsletterDialog({ children }: NewsletterDialogProps) {
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await subscribeToNewsletter(email);

    if (result.success) {
      toast({
        title: "Subscription Successful!",
        description: result.message,
      });
      setEmail('');
      setIsOpen(false);
    } else {
      toast({
        title: "Subscription Failed",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isSubmitting) setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5 text-primary" />
            Subscribe to Our Newsletter
          </DialogTitle>
          <DialogDescription>
            Stay updated with the latest articles and news from Cloud Journal. No spam, ever.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="col-span-3"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Subscribe
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
