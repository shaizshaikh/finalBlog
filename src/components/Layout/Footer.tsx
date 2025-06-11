
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-8 text-center">
      <div className="container mx-auto px-4">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Cloud Journal. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Dedicated to insights in cloud technology and software development.
        </p>
        {/* The unsubscribe link below is now removed as per user request */}
        {/*
        <p className="text-xs text-muted-foreground mt-2">
          <Link href="/unsubscribe" className="hover:underline">Unsubscribe from newsletter</Link>
        </p>
        */}
      </div>
    </footer>
  );
}
