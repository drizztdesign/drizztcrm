"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Contact, Company } from "@/lib/supabase/types";

export function useContacts() {
  const sb = createClient();
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async (): Promise<(Contact & { company?: Company | null })[]> => {
      const { data, error } = await sb
        .from("contacts")
        .select("*, company:companies(*)")
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as (Contact & { company?: Company | null })[];
    },
  });
}

export function useCompanies() {
  const sb = createClient();
  return useQuery({
    queryKey: ["companies"],
    queryFn: async (): Promise<Company[]> => {
      const { data, error } = await sb.from("companies").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Company[];
    },
  });
}

export function useCreateCompany() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Company> & { name: string }) => {
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) throw new Error("not authenticated");
      const { data, error } = await sb.from("companies").insert({
        owner_id: auth.user.id,
        name: input.name,
        website: input.website ?? "",
        sector: input.sector ?? "",
        city: input.city ?? "",
        phone: input.phone ?? "",
        notes: input.notes ?? "",
        tags: input.tags ?? [],
      }).select().single();
      if (error) throw error;
      return data as Company;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}

export function useCreateContact() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Contact> & { name: string }) => {
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) throw new Error("not authenticated");
      const { data, error } = await sb.from("contacts").insert({
        owner_id: auth.user.id,
        name: input.name,
        role: input.role ?? "",
        email: input.email ?? "",
        phone: input.phone ?? "",
        avatar: input.avatar ?? (input.name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("")),
        company_id: input.company_id ?? null,
        tags: input.tags ?? [],
      }).select().single();
      if (error) throw error;
      return data as Contact;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useUpdateContact() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Contact> }) => {
      const { error } = await sb.from("contacts").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useUpdateCompany() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Company> }) => {
      const { error } = await sb.from("companies").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}

export function useDeleteContact() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useDeleteCompany() {
  const sb = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}
