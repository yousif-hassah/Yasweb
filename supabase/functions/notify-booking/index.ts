import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const TO_EMAIL = "yastudio.iq@gmail.com";

serve(async (req) => {
  try {
    const body = await req.json();
    // Supabase webhook payload has the inserted row inside .record
    const record = body?.record ?? body;

    if (!record || !record.id) {
      return new Response(JSON.stringify({ error: "No record found in request" }), { status: 400 });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase URL or SERVICE_ROLE_KEY environment variables");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500 });
    }

    // Initialize Supabase admin client to fetch customer, barber, and service details
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1. Fetch customer details
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .select("name, phone")
      .eq("id", record.customer_id)
      .maybeSingle();

    // 2. Fetch barber details
    const { data: barber, error: barbErr } = await supabase
      .from("barbers")
      .select("name_en, name_ar")
      .eq("id", record.barber_id)
      .maybeSingle();

    // 3. Fetch service details
    const { data: service, error: svcErr } = await supabase
      .from("services")
      .select("name_en, name_ar")
      .eq("id", record.service_id)
      .maybeSingle();

    if (custErr || barbErr || svcErr) {
      console.error("Error fetching related details:", { custErr, barbErr, svcErr });
    }

    const customerName = customer?.name ?? "عميل جديد";
    const customerPhone = customer?.phone ?? "غير متوفر";
    const barberName = barber ? `${barber.name_ar} (${barber.name_en})` : "غير محدد";
    const serviceName = service ? `${service.name_ar} / ${service.name_en}` : "غير محدد";
    
    // Format starts_at date to a readable string (Baghdad Time UTC+3)
    // IMPORTANT: Always treat starts_at as UTC by ensuring the string ends with Z.
    // Without this, Deno may parse a bare "YYYY-MM-DDTHH:MM:SS" string as local
    // server time instead of UTC, causing the Baghdad offset to be applied twice
    // or not at all — producing wrong times in the notification email.
    const rawStarts = String(record.starts_at ?? "");
    const utcString = rawStarts.endsWith("Z") || rawStarts.includes("+")
      ? rawStarts           // already has explicit offset — leave as-is
      : rawStarts + "Z";    // bare string → force UTC
    const startsAtDate = new Date(utcString);
    const baghdadOffsetMs = 3 * 60 * 60 * 1000;
    const baghdadTime = new Date(startsAtDate.getTime() + baghdadOffsetMs);
    // Use getUTC* so we read the Baghdad-shifted value, not the server's local offset
    const bH  = baghdadTime.getUTCHours();
    const bMin = baghdadTime.getUTCMinutes();
    const period = bH >= 12 ? "م" : "ص";
    const h12   = ((bH + 11) % 12) + 1;
    const timeStr = `${h12}:${String(bMin).padStart(2, "0")} ${period}`;
    const dateStr = `${baghdadTime.getUTCFullYear()}-${String(baghdadTime.getUTCMonth() + 1).padStart(2, "0")}-${String(baghdadTime.getUTCDate()).padStart(2, "0")}`;
    // Human-readable date for the email (DD/MM/YYYY)
    const dateHuman = `${String(baghdadTime.getUTCDate()).padStart(2, "0")}/${String(baghdadTime.getUTCMonth() + 1).padStart(2, "0")}/${baghdadTime.getUTCFullYear()}`;

    const priceIqd = record.price_iqd ? `${record.price_iqd.toLocaleString()} IQD` : "0 IQD";
    const notes = record.notes ? record.notes : "لا توجد ملاحظات";

    if (!RESEND_API_KEY) {
      console.warn("No RESEND_API_KEY configured. Booking details logged only.");
      return new Response(JSON.stringify({ 
        ok: true, 
        message: "Email skipped: RESEND_API_KEY missing",
        booking: { customerName, customerPhone, barberName, serviceName, dateStr, timeStr }
      }), { status: 200 });
    }

    // 4. Send email using Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "YAS Booking <onboarding@resend.dev>",
        to: [TO_EMAIL],
        subject: `📅 حجز جديد مؤكد — ${customerName}`,
        html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; padding: 20px; background-color: #f9f9f9; }
    .card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    h2 { color: #1a202c; border-bottom: 2px solid #3182ce; padding-bottom: 12px; margin-top: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    td { padding: 10px 0; border-bottom: 1px solid #edf2f7; font-size: 15px; }
    td.label { color: #4a5568; font-weight: bold; width: 120px; }
    .footer { margin-top: 24px; font-size: 12px; color: #718096; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <h2>📅 حجز جديد في صالون YAS</h2>
    <table>
      <tr>
        <td class="label">العميل:</td>
        <td>${customerName}</td>
      </tr>
      <tr>
        <td class="label">رقم الهاتف:</td>
        <td><a href="tel:${customerPhone}">${customerPhone}</a></td>
      </tr>
      <tr>
        <td class="label">الحلاق:</td>
        <td>${barberName}</td>
      </tr>
      <tr>
        <td class="label">الخدمة:</td>
        <td>${serviceName}</td>
      </tr>
      <tr>
        <td class="label">التاريخ والوقت:</td>
        <td><strong>${dateHuman}</strong> في تمام الساعة <strong>${timeStr}</strong> (بتوقيت بغداد)</td>
      </tr>
      <tr>
        <td class="label">السعر:</td>
        <td><span style="color: #2f855a; font-weight: bold;">${priceIqd}</span></td>
      </tr>
      <tr>
        <td class="label">ملاحظات:</td>
        <td style="white-space: pre-wrap; font-style: italic; color: #4a5568;">"${notes}"</td>
      </tr>
    </table>
    <div class="footer">
      تم إرسال هذا الإشعار تلقائياً فور تأكيد الحجز من موقع YAS الإلكتروني.
    </div>
  </div>
</body>
</html>`,
      }),
    });

    const resData = await res.json();
    if (!res.ok) {
      console.error("Resend API error:", resData);
      return new Response(JSON.stringify({ error: resData }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, emailId: resData.id }), { status: 200 });

  } catch (err) {
    console.error("Notify booking error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
