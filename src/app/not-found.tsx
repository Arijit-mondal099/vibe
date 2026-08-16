import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      {/* faint topographic texture, keeps the trail/terrain idea without competing with the signature */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative flex w-full max-w-lg flex-col items-center text-center">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Trail marker 404
        </span>

        <h1 className="mt-4 font-serif text-[7rem] font-normal leading-none text-primary sm:text-[9rem] shimmer">
          404
        </h1>

        <h2 className="mt-8 text-xl font-medium sm:text-2xl">
          Looks like you&apos;ve wandered off the trail
        </h2>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground sm:text-base">
          The page you&apos;re looking for doesn&apos;t exist, moved, or never
          left a marker. Let&apos;s get you back to solid ground.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Back to home
        </Link>
      </div>

      <style>{`
        @keyframes dash {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </main>
  );
}
