import type { ReactNode } from "react";
import helmet from "../../../assets/helmet-480.png";
import { Brand } from "../../../components/ui";

/** Split auth layout: brand panel on the left (desktop), form on the right. */
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-[1fr_1.1fr]">
      <div className="grain relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-paper md:flex">
        <Brand light />
        <div>
          <img src={helmet} alt="" className="w-56 drop-shadow-2xl lg:w-72" />
          <p className="mt-10 max-w-sm font-display text-3xl font-medium leading-snug text-paper">
            "Happiness doesn't result from what we get, but from what we give."
          </p>
        </div>
        <p className="text-xs text-paper/50">Portfolio demo. Fictional campaigns, test payments only.</p>
      </div>
      <div className="flex items-center justify-center bg-paper px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 md:hidden">
            <Brand />
          </div>
          <h1 className="font-display text-4xl font-semibold text-ink">{title}</h1>
          <div className="mt-2 text-muted">{subtitle}</div>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
