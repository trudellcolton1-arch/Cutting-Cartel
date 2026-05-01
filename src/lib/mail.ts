import nodemailer from "nodemailer";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";

type Transporter = ReturnType<typeof nodemailer.createTransport>;

let _transport: Transporter | null = null;

function getTransport(): Transporter | null {
  if (_transport) return _transport;
  const host = process.env.EMAIL_SERVER_HOST;
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;
  if (!host || !user || !pass) return null;
  _transport = nodemailer.createTransport({
    host,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 465),
    secure: Number(process.env.EMAIL_SERVER_PORT ?? 465) === 465,
    auth: { user, pass },
  });
  return _transport;
}

export function isMailConfigured() {
  return !!(
    process.env.EMAIL_SERVER_HOST &&
    process.env.EMAIL_SERVER_USER &&
    process.env.EMAIL_SERVER_PASSWORD &&
    process.env.EMAIL_FROM
  );
}

type AppointmentEmail = {
  appointmentId: string;
  startsAt: Date;
  priceCents: number;
  customer: { name: string | null; email: string | null };
  barber: { displayName: string; shopName: string; userEmail: string | null };
  hairstyleName: string | null;
  notes: string | null;
  previewUrl: string | null;
  selfieUrl: string | null;
  appUrl: string;
};

const wrap = (title: string, body: string) => `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a0a0b;color:#fafaf7;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="width:40px;height:40px;border-radius:20px;background:#d99a2b;color:#0a0a0b;display:inline-block;text-align:center;line-height:40px;font-weight:800;font-size:20px;">✂</div>
      <div>
        <div style="font-size:18px;font-weight:700;letter-spacing:-0.3px;">The Cutting Cartel</div>
        <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#f5c46b;">Cutline AI · Dallas, TX</div>
      </div>
    </div>
    <h1 style="font-size:24px;font-weight:800;margin:0 0 12px;">${title}</h1>
    ${body}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #26262d;font-size:11px;color:rgba(250,250,247,0.5);">
      The Cutting Cartel · Dallas, TX · cuttingcartel.com
    </div>
  </div>
</body></html>`;

const button = (url: string, label: string) =>
  `<a href="${url}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#d99a2b;color:#0a0a0b;text-decoration:none;font-weight:700;font-size:14px;">${label}</a>`;

function row(label: string, value: string) {
  return `<tr><td style="padding:6px 0;color:rgba(250,250,247,0.6);font-size:13px;">${label}</td><td style="padding:6px 0;font-size:13px;font-weight:600;text-align:right;">${value}</td></tr>`;
}

/** Notify the barber that an appointment confirmed and is ready for the chair. */
export async function sendBarberAppointmentEmail(a: AppointmentEmail) {
  const t = getTransport();
  if (!t || !a.barber.userEmail) return;

  const detailsTable = `<table width="100%" style="margin:16px 0;border-collapse:collapse;">
    ${row("Customer", a.customer.name ?? a.customer.email ?? "—")}
    ${row("Email", a.customer.email ?? "—")}
    ${row("When", format(a.startsAt, "EEE, MMM d · h:mm a"))}
    ${row("Cut", a.hairstyleName ?? "Walk-in cut")}
    ${row("Paid", formatPrice(a.priceCents))}
  </table>`;

  const notesBlock = a.notes
    ? `<div style="margin-top:12px;padding:12px 14px;border-radius:12px;background:#1a1a1f;border:1px solid #26262d;">
         <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#f5c46b;margin-bottom:6px;">Notes</div>
         <div style="font-size:14px;line-height:1.4;">${escapeHtml(a.notes)}</div>
       </div>`
    : "";

  const previewBlock =
    a.previewUrl || a.selfieUrl
      ? `<div style="display:flex;gap:8px;margin-top:16px;">
          ${a.selfieUrl ? `<img src="${a.selfieUrl}" alt="customer" style="width:48%;border-radius:12px;border:1px solid #26262d;" />` : ""}
          ${a.previewUrl ? `<img src="${a.previewUrl}" alt="locked cut" style="width:48%;border-radius:12px;border:2px solid #d99a2b;" />` : ""}
        </div>`
      : "";

  const html = wrap(
    "New booking — chair locked",
    `<p style="margin:0 0 8px;color:rgba(250,250,247,0.8);font-size:14px;line-height:1.5;">
      Heads up — a customer just prepaid and locked their cut. Reference shot, notes,
      and payment status below.
    </p>
    ${detailsTable}
    ${notesBlock}
    ${previewBlock}
    <div style="margin-top:24px;">
      ${button(`${a.appUrl}/barber`, "Open Barber Dashboard")}
    </div>`
  );

  await t.sendMail({
    from: process.env.EMAIL_FROM,
    to: a.barber.userEmail,
    subject: `New booking · ${format(a.startsAt, "EEE MMM d, h:mm a")} · ${a.customer.name ?? "Customer"}`,
    html,
  });
}

/** Confirm the appointment to the customer with all the details. */
export async function sendCustomerAppointmentEmail(a: AppointmentEmail) {
  const t = getTransport();
  if (!t || !a.customer.email) return;

  const detailsTable = `<table width="100%" style="margin:16px 0;border-collapse:collapse;">
    ${row("Barber", `${a.barber.displayName} · ${a.barber.shopName}`)}
    ${row("When", format(a.startsAt, "EEE, MMM d · h:mm a"))}
    ${row("Cut", a.hairstyleName ?? "Walk-in cut")}
    ${row("Paid", formatPrice(a.priceCents))}
  </table>`;

  const previewBlock = a.previewUrl
    ? `<img src="${a.previewUrl}" alt="your cut" style="width:100%;border-radius:16px;border:2px solid #d99a2b;margin-top:12px;" />`
    : "";

  const html = wrap(
    "You're booked.",
    `<p style="margin:0 0 8px;color:rgba(250,250,247,0.8);font-size:14px;line-height:1.5;">
      Thanks for booking with The Cutting Cartel. Your barber has your reference cut,
      your notes, and your payment. Just show up.
    </p>
    ${detailsTable}
    ${previewBlock}
    <div style="margin-top:24px;">
      ${button(`${a.appUrl}/dashboard`, "View my booking")}
    </div>
    <p style="margin-top:24px;font-size:12px;color:rgba(250,250,247,0.5);">
      Need to cancel? Up to 12h before your slot for a full refund.
    </p>`
  );

  await t.sendMail({
    from: process.env.EMAIL_FROM,
    to: a.customer.email,
    subject: `Booked · ${format(a.startsAt, "EEE MMM d, h:mm a")} with ${a.barber.displayName}`,
    html,
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
