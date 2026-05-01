import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How The Cutting Cartel collects, uses, and protects your information when you book a chair or use Cutline AI.",
};

const LAST_UPDATED = "May 1, 2026";

export default function PrivacyPolicy() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-cartel-300">The Cutting Cartel</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-bone-200/60">Last updated · {LAST_UPDATED}</p>
      </header>

      <div className="space-y-8 text-bone-100/85 leading-relaxed">
        <Section title="The short version">
          We collect the bare minimum to book your chair and use Cutline AI: your name, email,
          the photos you upload, your appointment details, and your payment confirmation. We
          don&apos;t sell your data, we don&apos;t share your photos, and we delete things on
          request. The full details are below.
        </Section>

        <Section title="Who we are">
          The Cutting Cartel (&quot;we&quot;, &quot;us&quot;) is a barbershop based in Dallas,
          Texas. Our website (cuttingcartel.com) lets customers book appointments, prepay, and
          try on hairstyles with our in-house AI tool, Cutline AI. Operated by Brian Williams.
          For privacy questions: bookings@cuttingcartel.com.
        </Section>

        <Section title="What we collect">
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong className="text-bone-50">Account info</strong> — your name, email
              address, and (if you create a password account) a hashed password. If you sign in
              with Google, we receive your Google profile info per the consent screen.
            </li>
            <li>
              <strong className="text-bone-50">Selfies and AI previews</strong> — when you use
              Cutline AI, we store the selfie you upload and the AI-generated preview in our
              image storage provider (Cloudinary). These are tied to your try-on session and
              shared with the barber assigned to your booking.
            </li>
            <li>
              <strong className="text-bone-50">Appointment details</strong> — barber, date,
              time, selected style, length and fade settings, and any notes you write for the
              barber.
            </li>
            <li>
              <strong className="text-bone-50">Payment info</strong> — payments are processed
              entirely by Stripe. We never see or store your card number. We store the Stripe
              payment ID and amount for receipt and refund purposes.
            </li>
            <li>
              <strong className="text-bone-50">Standard server logs</strong> — IP address, user
              agent, page paths. Used for debugging and abuse prevention, retained 30 days.
            </li>
          </ul>
        </Section>

        <Section title="How we use it">
          <ul className="ml-5 list-disc space-y-2">
            <li>To create your account and authenticate you.</li>
            <li>To generate AI haircut previews using FLUX.1 + PuLID via Replicate.</li>
            <li>To book and confirm your appointment with the barber you choose.</li>
            <li>To process prepayment via Stripe and send you a receipt.</li>
            <li>To email the barber your selfie, AI preview, and notes so they&apos;re ready when you sit down.</li>
            <li>To email you booking confirmations and reminders.</li>
          </ul>
        </Section>

        <Section title="Who we share it with (and why)">
          We only share your data with the third parties required to make the service work:
          <ul className="mt-3 ml-5 list-disc space-y-2">
            <li>
              <strong className="text-bone-50">Stripe</strong> — to process your payment.
            </li>
            <li>
              <strong className="text-bone-50">Cloudinary</strong> — to host your selfie and AI
              preview securely.
            </li>
            <li>
              <strong className="text-bone-50">Replicate</strong> — to run the FLUX+PuLID model
              that generates your haircut preview. Your selfie is sent to Replicate&apos;s
              servers temporarily for generation; per their terms, it&apos;s not retained or
              used for training.
            </li>
            <li>
              <strong className="text-bone-50">Resend</strong> — to deliver booking confirmation
              emails.
            </li>
            <li>
              <strong className="text-bone-50">Google</strong> — only if you choose Google
              login.
            </li>
            <li>
              <strong className="text-bone-50">The barber</strong> assigned to your appointment
              — they see your selfie, AI preview, notes, and payment status in the barber
              dashboard.
            </li>
          </ul>
          We do <strong className="text-bone-50">not</strong> sell your data, share it with
          advertisers, or use it for training third-party AI models.
        </Section>

        <Section title="How long we keep it">
          <ul className="ml-5 list-disc space-y-2">
            <li>Account info: until you delete the account.</li>
            <li>Selfies and AI previews: 12 months after your last booking, then auto-deleted.</li>
            <li>Booking and payment records: 7 years (tax / accounting requirement).</li>
            <li>Server logs: 30 days.</li>
          </ul>
        </Section>

        <Section title="Your rights">
          You can email <a href="mailto:bookings@cuttingcartel.com" className="text-cartel-300 hover:text-cartel-100">bookings@cuttingcartel.com</a>{" "}
          at any time to:
          <ul className="mt-3 ml-5 list-disc space-y-2">
            <li>Request a copy of all data we hold about you.</li>
            <li>Delete your account and associated photos.</li>
            <li>Correct inaccurate info.</li>
            <li>Opt out of marketing emails (transactional booking emails will keep coming for active appointments).</li>
          </ul>
          We&apos;ll respond within 30 days.
        </Section>

        <Section title="Security">
          Passwords are hashed with bcrypt before storage. Payments are tokenized by Stripe.
          Selfies and AI previews live behind authenticated Cloudinary URLs. Sessions use
          NextAuth with HTTP-only cookies. Webhooks from Stripe are signature-verified.
        </Section>

        <Section title="Cookies">
          We use a small number of strictly-necessary cookies for authentication and CSRF
          protection. We do not use third-party advertising or tracking cookies.
        </Section>

        <Section title="Children">
          The site is intended for customers 13 and older. If you&apos;re booking on behalf of
          a child, you&apos;re responsible for parental consent.
        </Section>

        <Section title="Changes">
          If we change this policy materially, we&apos;ll email everyone with an active account
          and update the &quot;Last updated&quot; date above.
        </Section>

        <Section title="Contact">
          The Cutting Cartel · Dallas, TX ·{" "}
          <a href="mailto:bookings@cuttingcartel.com" className="text-cartel-300 hover:text-cartel-100">
            bookings@cuttingcartel.com
          </a>
        </Section>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-2xl text-bone-50">{title}</h2>
      <div className="text-bone-100/85">{children}</div>
    </section>
  );
}
