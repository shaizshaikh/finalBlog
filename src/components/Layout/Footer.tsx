
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-8 text-center">
      <div className="container mx-auto px-4">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Cloud Journal. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Inspired by modern tech blogs. Built with Next.js and Tailwind CSS.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          <Link href="/unsubscribe" className="hover:underline">Unsubscribe from newsletter</Link>
        </p>
      </div>
    </footer>
  );
}
