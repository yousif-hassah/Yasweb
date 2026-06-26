import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n } from "@/hooks/use-i18n";
import { dict } from "@/lib/translations";
import { SITE } from "@/lib/site-config";
import { toast } from "sonner";
import { Mail, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact Us | اتصل بنا — ${SITE.nameEn}` },
      {
        name: "description",
        content: "Contact YAS Barbershop in Baghdad: address, phone number, and location maps. تواصل مع صالون ياس للحلاقة في بغداد: تفاصيل العنوان، الهاتف وخارطة الموقع.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { lang } = useI18n();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name || !phone || !message) return;
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({ name, phone, message });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
  };

  return (
    <SiteLayout>
      <section className="mx-auto grid max-w-5xl gap-12 px-4 py-16 md:grid-cols-2">
        <div>
          <h1 className="mt-2 font-display text-4xl uppercase tracking-wider md:text-6xl">{dict.contact.title[lang]}</h1>
          <p className="mt-6 max-w-md text-muted-foreground">{dict.contact.blurb[lang]}</p>
          <div className="mt-8 space-y-3 text-sm">
            <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" />{SITE.address}</div>
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" />{SITE.phone}</div>
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" />{SITE.email}</div>
          </div>
        </div>
        <div className="border border-border bg-card p-6">
          {done ? (
            <div className="text-center">
              <div className="font-display text-2xl uppercase tracking-wider">{dict.contact.sent[lang]}</div>
            </div>
          ) : (
            <>
              <input className="w-full border border-border bg-background p-3 text-sm" placeholder={dict.booking.name[lang]} value={name} onChange={(e) => setName(e.target.value)} />
              <input className="mt-3 w-full border border-border bg-background p-3 text-sm" placeholder={dict.booking.phone[lang]} value={phone} onChange={(e) => setPhone(e.target.value)} />
              <textarea className="mt-3 w-full border border-border bg-background p-3 text-sm" rows={5} placeholder={dict.contact.message[lang]} value={message} onChange={(e) => setMessage(e.target.value)} />
              <button onClick={submit} disabled={submitting || !name || !phone || !message} className="mt-4 w-full bg-primary py-3 text-sm uppercase tracking-widest text-primary-foreground disabled:opacity-30">
                {dict.contact.send[lang]}
              </button>
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}