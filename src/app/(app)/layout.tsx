import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TweaksPanel } from "@/components/layout/TweaksPanel";
import { Toast } from "@/components/layout/Toast";
import { LeadDrawer } from "@/components/lead/LeadDrawer";
import { RealtimeProvider } from "@/components/realtime/RealtimeProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-full bg-bg-0">
      <Sidebar userEmail={user.email ?? ""} />
      <main className="flex flex-col overflow-hidden bg-bg-0 flex-1 min-w-0">
        {children}
      </main>
      <TweaksPanel />
      <LeadDrawer />
      <Toast />
      <RealtimeProvider />
    </div>
  );
}
