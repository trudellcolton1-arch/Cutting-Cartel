export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-700">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-8 text-xs text-bone-200/60 md:flex-row md:items-center md:justify-between">
        <div>
          © {new Date().getFullYear()} The Cutting Cartel · Dallas, TX · Built by Brian Williams
        </div>
        <div className="h-1 w-24 rounded stripe-accent" aria-hidden />
        <div className="text-bone-200/50">cuttingcartel.com</div>
      </div>
    </footer>
  );
}
