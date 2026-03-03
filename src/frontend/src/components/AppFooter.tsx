export default function AppFooter() {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "unknown-app";
  const utmContent = encodeURIComponent(hostname);
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 py-2 px-4 flex items-center justify-center glass border-t border-border">
      <p className="text-xs text-muted-foreground">
        © {year} Lens Studio &mdash; Built with{" "}
        <span className="text-amber" aria-label="love">
          ♥
        </span>{" "}
        using{" "}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${utmContent}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber hover:underline transition-colors"
        >
          caffeine.ai
        </a>
      </p>
    </footer>
  );
}
