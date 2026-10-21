/** In-app loading moment: a moon circling the ledger sun. Matches the boot screen. */
export default function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5" role="status" aria-label={label}>
      <div className="relative h-16 w-16">
        <div className="absolute inset-[22px] rounded-full bg-[radial-gradient(circle_at_36%_30%,#fff1d2,#f0a43a_60%,#d98a1c)] shadow-[0_0_24px_4px_rgba(240,164,58,0.35)]" />
        <div className="absolute inset-0 animate-[spin_1.6s_linear_infinite] rounded-full border border-ink/10">
          <span className="absolute -top-[5px] left-1/2 -ml-[5px] h-2.5 w-2.5 rounded-full bg-ink-3" />
        </div>
      </div>
      <span className="kicker text-faint">{label}</span>
    </div>
  );
}
