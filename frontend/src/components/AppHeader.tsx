export default function AppHeader() {
  return (
    <header className="flex items-center gap-3 px-4 py-3 glass border-b border-border z-10 shrink-0">
      <img
        src="/assets/generated/camera-lens-icon.dim_128x128.png"
        alt="Lens Studio logo"
        width={44}
        height={44}
        className="rounded-full object-cover shrink-0"
      />
      <div className="flex flex-col min-w-0">
        <h1 className="font-display font-semibold text-lg leading-tight text-foreground tracking-tight">
          Lens Studio
        </h1>
        <p className="text-xs text-muted-foreground leading-none truncate">
          Capture every moment
        </p>
      </div>
    </header>
  );
}
