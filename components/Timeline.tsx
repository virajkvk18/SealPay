import { ExternalLink, Fingerprint } from "lucide-react";
import type { TimelineEvent } from "@/lib/mockData";
import { formatDateTime, formatWallet } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";

interface TimelineProps {
  events: TimelineEvent[];
  explorerMode?: boolean;
}

export default function Timeline({
  events,
  explorerMode = false,
}: TimelineProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return (
    <div className="space-y-4">
      {sortedEvents.map((event, index) => (
        <div key={event.id} className="relative pl-8">
          <div className="absolute left-0 top-1 grid size-5 place-items-center rounded-full border border-violet-300/40 bg-violet-300/15">
            <span className="size-2 rounded-full bg-violet-200" />
          </div>
          {index < sortedEvents.length - 1 ? (
            <span className="absolute left-2.5 top-7 h-[calc(100%+0.25rem)] w-px bg-white/10" />
          ) : null}

          <article className="rounded-2xl border border-[#101d25]/10 bg-white/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#1e1233]">
                  {event.title}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#74777b]">
                  {formatDateTime(event.timestamp)} by {event.actor}
                </p>
              </div>
              <StatusBadge status={event.status} compact />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#53606a]">
              {event.description}
            </p>

            {event.txHash ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-violet-300/15 bg-violet-300/[0.06] px-3 py-2 text-xs text-[#6d28d9]">
                <Fingerprint className="size-4 shrink-0" />
                <span className="font-mono">{formatWallet(event.txHash)}</span>
                {explorerMode ? (
                  <ExternalLink className="size-3.5 opacity-60" />
                ) : null}
              </div>
            ) : null}
          </article>
        </div>
      ))}
    </div>
  );
}
