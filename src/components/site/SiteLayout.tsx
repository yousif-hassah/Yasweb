import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/hooks/use-i18n";

function AnnouncementBanner() {
  const { lang } = useI18n();
  const { data } = useQuery({
    queryKey: ["announcement-banner"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("announcements")
        .select("message_en,message_ar,link_url")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
  if (!data) return null;
  const msg = lang === "ar" ? data.message_ar : data.message_en;
  const content = <span className="text-xs uppercase tracking-widest">{msg}</span>;
  return (
    <div className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-1 text-center">
        {data.link_url ? <a href={data.link_url} className="hover:underline">{content}</a> : content}
      </div>
    </div>
  );
}

export function SiteLayout({
  children,
  isHome = false,
}: {
  children: ReactNode;
  isHome?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBanner />
      <Navbar transparent={isHome} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}