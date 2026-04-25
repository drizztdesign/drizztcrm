"use client";
import { Mail, MessageCircle, StickyNote, CalendarDays, FileText, FileInput, Phone, CreditCard } from "lucide-react";
import { Linkedin, Instagram } from "@/components/icons/BrandIcons";
import type { TimelineEvent, TimelineKind } from "@/lib/supabase/types";
import { cn } from "@/lib/cn";

const ICON: Record<TimelineKind, React.ElementType> = {
  whatsapp: MessageCircle,
  email: Mail,
  note: StickyNote,
  meeting: CalendarDays,
  proposal: FileText,
  linkedin: Linkedin,
  dm: Instagram,
  form: FileInput,
  call: Phone,
  payment: CreditCard,
};

const COLOR: Record<TimelineKind, string> = {
  whatsapp: "#25d366",
  email:    "var(--info)",
  note:     "var(--warn)",
  meeting:  "var(--purple)",
  proposal: "var(--accent)",
  linkedin: "#0a66c2",
  dm:       "var(--pink)",
  form:     "var(--fg-2)",
  call:     "var(--ok)",
  payment:  "var(--accent)",
};

export function TimelineList({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return <div className="text-fg-2 text-[13px]">Sin actividad todavía.</div>;
  }
  return (
    <div className="relative pl-[22px] tl-line">
      {events.map((e) => {
        const Icon = ICON[e.kind] ?? StickyNote;
        const color = COLOR[e.kind] ?? "var(--fg-2)";
        return (
          <div key={e.id} className="relative pb-4">
            <div
              className="absolute -left-[22px] top-2 w-4 h-4 rounded-full grid place-items-center"
              style={{
                background: `color-mix(in oklab, ${color} 20%, transparent)`,
                border: `1.5px solid ${color}`,
                color,
              }}
            >
              <Icon size={9} strokeWidth={2} />
            </div>
            <div className="text-[12px] text-fg-2 mb-0.5">
              <span className="font-medium text-fg-1">{e.who}</span>
              <span className="mx-1.5">·</span>
              <span className="text-fg-3">{e.t}</span>
            </div>
            <div className={cn("text-[13px] text-fg-0 leading-[1.5]")}>{e.body}</div>
          </div>
        );
      })}
    </div>
  );
}
