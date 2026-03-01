import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container flex flex-col items-center justify-center gap-2 py-6 px-4 text-center md:flex-row md:justify-between">
        <p className="text-sm text-muted-foreground">
          © 2025. Built with <Heart className="inline h-4 w-4 fill-red-500 text-red-500" /> using{' '}
          <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4 hover:text-primary">
            caffeine.ai
          </a>
        </p>
        <p className="text-xs text-muted-foreground">Empowering communities through civic engagement</p>
      </div>
    </footer>
  );
}
