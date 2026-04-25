"use client";
import { useState } from "react";
import { Mail, MessageCircle, StickyNote, Send } from "lucide-react";
import { Instagram } from "@/components/icons/BrandIcons";
import { cn } from "@/lib/cn";
import { useAddTimelineEvent } from "@/lib/queries/timeline";
import { mailtoLink, whatsappLink } from "@/lib/format";
import { useT } from "@/lib/useT";
import { useUI } from "@/store/ui";
import type { TimelineKind } from "@/lib/supabase/types";

type Channel = "whatsapp" | "email" | "instagram" | "note";
const CHANNELS: { id: Channel; label: string; icon: React.ElementType }[] = [
  { id: "whatsapp",  label: "WhatsApp",  icon: MessageCircle },
  { id: "email",     label: "Email",     icon: Mail },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "note",      label: "Nota",      icon: StickyNote },
];

export function Composer({ dealId, contactEmail, contactPhone }: {
  dealId: string;
  contactEmail: string | null;
  contactPhone: string | null;
}) {
  const { lang } = useT();
  const show = useUI((s) => s.showToast);
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [text, setText] = useState("");
  const add = useAddTimelineEvent();

  const placeholder: Record<Channel, string> = {
    whatsapp: lang === "es" ? "Mensaje de WhatsApp..." : "WhatsApp message...",
    email:    lang === "es" ? "Redactar email..."     : "Compose email...",
    instagram:lang === "es" ? "DM de Instagram..."    : "Instagram DM...",
    note:     lang === "es" ? "Nota interna..."       : "Internal note...",
  };

  const submit = async () => {
    if (!text.trim()) return;
    const kind: TimelineKind = channel === "instagram" ? "dm" : (channel as TimelineKind);
    const who = lang === "es" ? "Tú" : "You";
    const t = lang === "es" ? "Ahora" : "Just now";

    add.mutate({ dealId, kind, who, body: text, t }, {
      onSuccess: () => {
        show(lang === "es" ? "Mensaje añadido al timeline" : "Added to timeline", "ok");
        setText("");
        if (channel === "whatsapp" && contactPhone) {
          window.open(whatsappLink(contactPhone, text), "_blank");
        } else if (channel === "email" && contactEmail) {
          window.open(mailtoLink(contactEmail, undefined, text), "_blank");
        }
      },
      onError: (e) => show(e instanceof Error ? e.message : "Error", "error"),
    });
  };

  return (
    <div className="border border-border rounded-lg bg-bg-2 overflow-hidden">
      <div className="flex border-b border-border">
        {CHANNELS.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => setChannel(c.id)}
              className={cn(
                "flex-1 py-2.5 text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors",
                channel === c.id ? "text-accent bg-bg-1" : "text-fg-2 hover:text-fg-0"
              )}
            >
              <Icon size={13} strokeWidth={1.5} />
              {c.label}
            </button>
          );
        })}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder[channel]}
        className="w-full min-h-[70px] bg-transparent border-0 outline-none resize-y p-3 text-[13px] text-fg-0"
      />
      <div className="flex items-center gap-2 p-2 border-t border-border">
        <button
          onClick={submit}
          disabled={!text.trim() || add.isPending}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-ink font-semibold text-[12px] rounded-md disabled:opacity-60 hover:brightness-105"
        >
          <Send size={12} strokeWidth={2} />
          {lang === "es" ? "Enviar" : "Send"}
        </button>
      </div>
    </div>
  );
}
