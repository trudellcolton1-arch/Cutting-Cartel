import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The agreement between you and 24/7 Cuts when you book a chair, prepay, or use Cutline AI.",
};

const LAST_UPDATED = "May 1, 2026";

export default function TermsOfService() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-cartel-300">24/7 Cuts</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-bone-200/60">Last updated · {LAST_UPDATED}</p>
      </header>

      <div className="space-y-8 text-bone-100/85 leading-relaxed">
        <Section title="The short version">
          By using 247cuts.com you agree to these terms. Bookings require prepayment.
          Cancel at least 12 hours before your appointment for a full refund. Don&apos;t upload
          photos of anyone but yourself. We reserve the right to cancel bookings that violate
          these rules.
        </Section>

        <Section title="1. Who&apos;s on the hook">
          These terms are an agreement between you and 24/7 Cuts, a mobile barber service
          operating in Dallas, Texas, run by Brian Williams. By creating an account, booking an
          appointment, or using Cutline AI, you accept these terms in full. If you don&apos;t
          accept them, don&apos;t use the service.
        </Section>

        <Section title="2. Eligibility">
          You must be at least 13 years old to use this site. If you&apos;re between 13 and 18,
          a parent or guardian must consent and be responsible for your booking.
        </Section>

        <Section title="3. Your account">
          You&apos;re responsible for the accuracy of the info on your account and for keeping
          your password safe. Don&apos;t share your account, and let us know immediately if you
          suspect unauthorized access. We may suspend or terminate accounts that abuse the
          service, double-book to no-show, or violate these terms.
        </Section>

        <Section title="4. Bookings & prepayment">
          <ul className="ml-5 list-disc space-y-2">
            <li>All appointments require prepayment in full at the time of booking, processed by Stripe.</li>
            <li>Your slot is held only after payment confirms — slots are first-come, first-served.</li>
            <li>Prices shown at checkout are final and include any applicable fees.</li>
          </ul>
        </Section>

        <Section title="5. Cancellation & refunds">
          <ul className="ml-5 list-disc space-y-2">
            <li><strong className="text-bone-50">More than 12 hours before</strong> your appointment: cancel from your dashboard for a full refund within 5–10 business days.</li>
            <li><strong className="text-bone-50">Less than 12 hours before</strong>: no refund. The chair was held for you.</li>
            <li><strong className="text-bone-50">No-shows</strong> forfeit the full payment.</li>
            <li><strong className="text-bone-50">If we cancel</strong> (illness, equipment failure, emergency) you&apos;ll get a full refund automatically.</li>
            <li><strong className="text-bone-50">Disputes</strong> are handled directly with us — please email us before opening a chargeback so we can fix it.</li>
          </ul>
        </Section>

        <Section title="6. Cutline AI">
          Cutline AI generates a photoreal preview of you with a selected hairstyle using
          FLUX.1 + PuLID via Replicate. By using it, you agree:
          <ul className="mt-3 ml-5 list-disc space-y-2">
            <li>You&apos;ll only upload photos of yourself, with your consent.</li>
            <li>The AI preview is an artistic approximation — your actual cut may vary based on hair texture, density, and barber interpretation.</li>
            <li>Your selfie and the AI preview are stored on Cloudinary and shared with the barber for your booking. See the <a href="/privacy" className="text-cartel-300 hover:text-cartel-100">Privacy Policy</a>.</li>
            <li>You retain ownership of your photos. We get a limited license to host, generate from, and show them to your assigned barber for the purposes of completing your booking.</li>
          </ul>
        </Section>

        <Section title="7. Acceptable use">
          You agree not to:
          <ul className="mt-3 ml-5 list-disc space-y-2">
            <li>Upload photos of anyone other than yourself, or photos you don&apos;t have rights to.</li>
            <li>Upload anything illegal, sexual, hateful, or that depicts minors inappropriately.</li>
            <li>Try to break, scrape, reverse-engineer, or overload the service.</li>
            <li>Book appointments you don&apos;t intend to honor (no-show abuse).</li>
            <li>Impersonate another person or barber.</li>
          </ul>
          Violations may result in account termination and forfeiture of any paid amounts.
        </Section>

        <Section title="8. The cut itself">
          The barber will use the AI preview, your style selection, and your notes as
          reference. Final results depend on your hair&apos;s real-life properties (texture,
          length, density, scalp condition), the barber&apos;s professional judgment, and the
          conversation you have in the chair. We don&apos;t guarantee a 1:1 match between the
          AI preview and the finished cut.
        </Section>

        <Section title="9. Intellectual property">
          The site, branding (&quot;24/7 Cuts&quot;, &quot;Cutline AI&quot;, our logos),
          and the underlying code are owned by 24/7 Cuts. You may not copy, reuse,
          rebrand, or sublicense any of it without written permission. You retain all rights to
          your own photos.
        </Section>

        <Section title="10. Disclaimers">
          The service is provided &quot;as is&quot; without warranties of any kind. We do our
          best to keep things up and accurate, but we don&apos;t guarantee uninterrupted
          availability, error-free generation, or that the service will meet your specific
          expectations. Cutline AI is a styling preview tool, not medical or scientific advice.
        </Section>

        <Section title="11. Limitation of liability">
          To the maximum extent allowed by law, our total liability to you for any claim
          related to the service is limited to the amount you&apos;ve paid us in the 12 months
          before the claim. We&apos;re not liable for indirect, consequential, or incidental
          damages.
        </Section>

        <Section title="12. Indemnity">
          You agree to indemnify and hold us harmless from any claim arising out of your misuse
          of the service or your violation of these terms (including third-party photo claims).
        </Section>

        <Section title="13. Changes">
          We may update these terms occasionally. Material changes will be emailed to active
          accounts. The &quot;Last updated&quot; date above will reflect the latest version.
          Continued use of the service after a change means you accept the new terms.
        </Section>

        <Section title="14. Governing law">
          These terms are governed by the laws of the State of Texas. Any disputes will be
          resolved in the state or federal courts located in Dallas County, Texas.
        </Section>

        <Section title="15. Contact">
          24/7 Cuts · Dallas, TX ·{" "}
          <a href="mailto:bookings@247cuts.com" className="text-cartel-300 hover:text-cartel-100">
            bookings@247cuts.com
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
