# 24/7 Cuts

Dallas's premier barbershop, online. Customers book the chair, prepay through Stripe,
and use **Cutline AI** — our in-house AI try-on powered by **FLUX.1 + PuLID** —
to generate a photoreal preview of themselves with the new cut before they sit down.
The barber gets the reference image, notes, and payment confirmation by email
the moment the booking confirms.

**Domain:** [247cuts.com](https://247cuts.com) · Built by Brian Williams.

---

## Architecture

```
Next.js 14 (App Router, RSC + client islands)
  ├── /              landing
  ├── /try-on        Cutline AI studio (FLUX + PuLID via Replicate)
  ├── /styles        catalogue
  ├── /booking       barber + slot picker → Stripe Checkout
  ├── /dashboard     customer bookings
  ├── /barber        barber chair view (today + upcoming)
  ├── /share/[id]    shareable before/after page (dynamic OG card)
  └── /api/...       REST routes

Postgres + Prisma     Users · Barbers · Hairstyles · TryOnSessions · Appointments · Payments
NextAuth              Google OAuth + magic-link + credentials
Stripe Checkout       prepayment + signed webhook
Cloudinary            selfie + AI preview storage
Replicate (FLUX+PuLID) photoreal hair generation, ~$0.04/cut, 12–25s latency
Nodemailer (Resend)   booking confirmation emails to barber + customer
next/og               dynamic share cards for iMessage / Twitter / Slack
```

### Folder structure

```
src/
  app/
    layout.tsx · page.tsx · globals.css · providers.tsx
    auth/{signin,register,verify}/page.tsx
    try-on/page.tsx
    styles/page.tsx
    booking/{page.tsx, success/page.tsx, cancel/page.tsx}
    dashboard/page.tsx
    barber/{page.tsx, profile/page.tsx}
    share/[id]/page.tsx
    api/
      auth/[...nextauth]/route.ts
      auth/register/route.ts
      cutline-ai/generate/route.ts   ← FLUX + PuLID generation
      hairstyles/route.ts
      barbers/route.ts
      availability/route.ts
      try-on/route.ts
      upload/route.ts
      appointments/{route.ts, [id]/route.ts}
      stripe/webhook/route.ts        ← also sends booking emails
      og/route.tsx                   ← landing OG card
      og/try-on/[id]/route.tsx       ← per-cut share card
  components/
    SiteHeader · SiteFooter
    TryOnStudio.tsx (Cutline AI client)
    BookingFlow.tsx
  lib/
    auth.ts · prisma.ts · stripe.ts · cloudinary.ts · booking.ts
    replicate.ts (FLUX + PuLID prompt + call)
    mail.ts      (booking confirmation emails)
    utils.ts
prisma/
  schema.prisma · seed.ts
```

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in.

#### Required for the site to start

| Var | Where it comes from |
|-----|---------------------|
| `DATABASE_URL` | Vercel Postgres / Neon / Supabase |
| `NEXTAUTH_URL` | Your live URL, e.g. `https://247cuts.com` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Same as `NEXTAUTH_URL` |

#### Required for booking + payment

| Var | Where it comes from |
|-----|---------------------|
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same place |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → Add endpoint `https://YOUR_DOMAIN/api/stripe/webhook` → Copy signing secret |

#### Required for selfie + AI preview storage

| Var | Where it comes from |
|-----|---------------------|
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | cloudinary.com (free tier is plenty) |

#### Required for Cutline AI

| Var | Where it comes from |
|-----|---------------------|
| `REPLICATE_API_TOKEN` | replicate.com → Account → API tokens |

#### Required for email confirmations to Brian + customers

[Resend](https://resend.com) is the easiest. Sign up, verify the `247cuts.com`
domain, generate an API key.

| Var | Value |
|-----|-------|
| `EMAIL_SERVER_HOST` | `smtp.resend.com` |
| `EMAIL_SERVER_PORT` | `465` |
| `EMAIL_SERVER_USER` | `resend` |
| `EMAIL_SERVER_PASSWORD` | your Resend API key |
| `EMAIL_FROM` | `24/7 Cuts <bookings@247cuts.com>` |

#### Optional

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google sign-in. Add
  `https://YOUR_DOMAIN/api/auth/callback/google` as redirect URI.

### 3. Database

```bash
npx prisma db push       # create schema in your dev DB
npm run db:seed          # load barbers + 6 starter hairstyles + demo customer
```

Seeded accounts (rotate before deploying):

| Role | Email | Password |
|------|-------|----------|
| Barber | `brian@247cuts.com` | `changeme123` |
| Barber | `marcus@247cuts.com` | `changeme123` |
| Customer | `demo@247cuts.com` | `demo12345` |

### 4. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Cutline AI · FLUX.1 + PuLID

Cutline AI runs on Replicate, model `zsxkib/flux-pulid` (pinned by SHA in
`src/lib/replicate.ts`). PuLID locks the customer's face identity while FLUX
generates the new hair, beard, and styling per the cut's prompt.

**Flow:**
1. Customer uploads/snaps a selfie → uploaded to Cloudinary
2. Selects a hairstyle from the catalog → triggers generation
3. Server calls `replicate.run("zsxkib/flux-pulid", { main_face_image, prompt })`
4. Returns a 768×1024 PNG of the customer with the new cut, ~12–25s
5. Length / fade sliders modulate the prompt; debounced re-generation
6. **Lock This Cut** → the AI preview is re-uploaded to Cloudinary for permanence
   and saved on the booking, sent to the barber

**Cost:** ~$0.04 per generation. On a $45 cut, that's noise.

**Per-style prompt** lives in the `Hairstyle.prompt` column. To add a style,
add a row with a descriptive fragment like
`"low fade haircut with textured tousled crown, soft messy top, sharp temple line"`
— the server lib stitches in length + fade modifiers and base prompt scaffolding.

---

## Stripe webhook

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

The webhook handles:
- `checkout.session.completed` → mark Appointment `CONFIRMED`, Payment `SUCCEEDED`,
  **email both barber and customer with the booking details + AI preview**
- `checkout.session.expired` / `async_payment_failed` → cancel appointment, free
  the slot
- `charge.refunded` → mark Payment `REFUNDED`

Test card: `4242 4242 4242 4242` · any future expiry · any CVC.

---

## How Brian gets booking emails

The moment Stripe confirms a customer's payment, the webhook fires
`sendBarberAppointmentEmail` → Brian receives an email at the address tied to
his barber user record (the `email` column on his `User` row, e.g.
`brian@247cuts.com`). The email contains:

- Customer name + email
- Date / time of the booking
- Selected cut + length + fade
- Notes for the barber
- The AI-generated reference shot side-by-side with the original selfie
- A button that opens the Barber Dashboard

The customer simultaneously gets their own confirmation email with the AI
preview and a link to their bookings.

If `EMAIL_*` env vars are missing, the bookings still confirm fine — they just
don't email anyone. Set Resend up before going live.

---

## Deploy (Vercel)

1. Push to GitHub, import into Vercel.
2. Set every env var listed above in Project Settings → Environment Variables.
3. Add Vercel Postgres (Storage tab) — auto-injects `DATABASE_URL`.
4. After first deploy, run once:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
5. In Stripe → Webhooks → add `https://YOUR_DOMAIN/api/stripe/webhook` and put
   the new `whsec_...` into Vercel.
6. In Resend → verify your domain, add the API key as `EMAIL_SERVER_PASSWORD`.

---

## Security

- All API routes that mutate data require an authenticated session.
- The `/api/upload` endpoint validates content-type and rejects payloads > 8MB.
- Stripe webhook verifies the signature header against `STRIPE_WEBHOOK_SECRET`.
- Slot booking is double-checked inside a transaction; the
  `(barberId, startsAt)` unique index prevents races.
- Middleware locks `/barber/*` to `BARBER` or `ADMIN` roles.
- Passwords are hashed with bcrypt (cost 12).
- Replicate token never leaves the server.

---

## Roadmap

- AI haircut recommendation based on detected face shape (Claude vision).
- Shareable before/after preview already shipping at `/share/[id]` with
  dynamic OG cards.
- Barber portfolio pages with past cuts.
- SMS confirmations via Twilio.
- Calendar export (.ics) for confirmed bookings.

---

Built for Brian Williams · 24/7 Cuts · Dallas, TX
