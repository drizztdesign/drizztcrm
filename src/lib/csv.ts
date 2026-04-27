import type { DealWithRelations } from "@/lib/supabase/types";

const COLS: { header: string; get: (d: DealWithRelations) => string | number | null | undefined }[] = [
  { header: "code",            get: (d) => d.code },
  { header: "title",           get: (d) => d.title },
  { header: "stage",           get: (d) => d.stage },
  { header: "temp",            get: (d) => d.temp },
  { header: "score",           get: (d) => d.score },
  { header: "price_estimated", get: (d) => d.price_estimated },
  { header: "price_offered",   get: (d) => d.price_offered },
  { header: "price_closed",    get: (d) => d.price_closed },
  { header: "cost_estimated",  get: (d) => d.cost_estimated },
  { header: "source",          get: (d) => d.source },
  { header: "project_type",    get: (d) => d.project_type },
  { header: "pain",            get: (d) => d.pain },
  { header: "company",         get: (d) => d.company?.name ?? "" },
  { header: "company_city",    get: (d) => d.company?.city ?? "" },
  { header: "company_sector",  get: (d) => d.company?.sector ?? "" },
  { header: "contact",         get: (d) => d.contact?.name ?? "" },
  { header: "contact_email",   get: (d) => d.contact?.email ?? "" },
  { header: "contact_phone",   get: (d) => d.contact?.phone ?? "" },
  { header: "next_action",     get: (d) => d.next_action ?? "" },
  { header: "next_action_date",get: (d) => d.next_action_date ?? "" },
  { header: "tags",            get: (d) => d.tags?.join("|") ?? "" },
  { header: "stage_entered_at",get: (d) => d.stage_entered_at },
  { header: "last_touch",      get: (d) => d.last_touch },
  { header: "created_at",      get: (d) => d.created_at },
];

function escape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function dealsToCSV(deals: DealWithRelations[]): string {
  const header = COLS.map((c) => c.header).join(",");
  const rows = deals.map((d) => COLS.map((c) => escape(c.get(d))).join(","));
  return [header, ...rows].join("\n");
}

export function downloadCSV(filename: string, content: string) {
  // BOM so Excel opens UTF-8 correctly
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
