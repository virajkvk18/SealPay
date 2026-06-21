import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
}

export default function StatCard({
  label,
  value,
  helper,
  icon,
}: StatCardProps) {
  return (
    <article className="glass-panel rounded-2xl p-5 transition hover:-translate-y-1 hover:border-violet-200/35">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#53606a]">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-normal text-[#1e1233]">
            {value}
          </p>
        </div>
        <div className="grid size-12 place-items-center rounded-xl border border-violet-300/25 bg-violet-300/10 text-[#6d28d9]">
          {icon}
        </div>
      </div>
      <p className="mt-4 text-sm text-[#53606a]">{helper}</p>
    </article>
  );
}
