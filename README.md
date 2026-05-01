# Cutline AI · The Cutting Cartel

AI-powered haircut try-on and booking platform built for Brian Williams and
The Cutting Cartel — Dallas, TX. Customers upload a selfie, try on hairstyles
with AI face-tracking, lock in their cut, and prepay before sitting in the
chair.

**Domain:** [cuttingcartel.com](https://cuttingcartel.com)

---

## Architecture

```
Next.js 14 (App Router, RSC + client islands)
  ├── /              landing
  ├── /try-on        AI hairstyle studio (face-api.js overlay engine)
  ├── /styles        catalogue
  ├── /booking       barber + slot picker → Stripe Checkout
  ├── /dashboard     customer bookings
  ├── /barber        barber chair view (today + upcoming)
  └── /api/...       REST routes (auth, upload, try-on, availability,
                     appointments, stripe webhook)

PostgreSQL (Prisma ORM)
  Users · Barbers · Hairstyles · TryOnSessions · Appointments · Payments

NextAuth (Google + Email magic-link + Credentials)
Stripe Checkout (mode=payment)  + signed webhook
Cloudinary (selfies + AI preview composites)
face-api.js (TinyFaceDetector + 68-landmark model) for client-side overlay
```

### Folder structure

```
src/
  app/
    layout.tsx, page.tsx, globals.css, providers.tsx
    auth/{signin,register,verify}/page.tsx
    try-on/page.tsx
    styles/page.tsx
    booking/{page.tsx, success/page.tsx, cancel/page.tsx}
    dashboard/page.tsx
    barber/{page.tsx, profile/page.tsx}
    api/
      auth/[...nextauth]/route.ts
      auth/register/route.ts
      hairstyles/route.ts
      barbers/route.ts
      availability/route.ts
      try-on/route.ts
      upload/route.ts
      appointments/route.ts
      appointments/[id]/route.ts
      stripe/webhook/route.ts
  components/
    SiteHeader.tsx, SiteFooter.tsx
    TryOnStudio.tsx (AI vision overlay)
    BookingFlow.tsx
  lib/
    auth.ts, prisma.ts, stripe.ts, cloudinary.ts, booking.ts, utils.ts
  middleware.ts
  types/next-auth.d.ts
prisma/
  schema.prisma
  seed.ts
public/
  models/  (face-api.js weights — see scripts/fetch-models.sh)
scripts/
  fetch-models.sh
```

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in:

| Var | Notes |
|-----|-------|
| `DATABASE_URL` | Postgres URL. Local: `postgresql://postgres:postgres@localhost:5432/cutline?schema=public` |
| `NEXTAUTH_URL` | `http://localhost:3000` in dev |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud → OAuth credentials. Add `http://localhost:3000/api/auth/callback/google` as redirect. |
| `EMAIL_*` | SMTP creds for magic-link sign-in. Resend works out of the box. |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | From dashboard.stripe.com |
| `STRIPE_WEBHOOK_SECRET` | Run `stripe listen` (see Stripe section below) |
| `CLOUDINARY_*` | Cloudinary dashboard. Create an unsigned upload preset for `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` if you want browser-direct uploads later. |

### 3. Database

```bash
npx prisma db push        # create schema in your dev DB
npm run db:seed           # load barbers + hairstyle catalogue + demo customer
```

Demo accounts created by `seed`:

| Role | Email | Password |
|------|-------|----------|
| Barber | `brian@cuttingcartel.com` | `changeme123` |
| Barber | `marcus@cuttingcartel.com` | `changeme123` |
| Customer | `demo@cuttingcartel.com` | `demo12345` |

> Rotate these passwords before any deploy.

### 4. AI models (face-api.js)

```bash
bash scripts/fetch-models.sh
```

Downloads ~3MB of model weights to `public/models/`. Without them the studio
falls back to a centered overlay.

### 5. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Stripe setup

1. Get test keys from [dashboard.stripe.com](https://dashboard.stripe.com/test/apikeys).
2. Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env`.
3. Run the local webhook listener so payment confirmations flow back to your DB:

   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.
4. Test card: `4242 4242 4242 4242` · any future expiry · any CVC.

The webhook handles:

- `checkout.session.completed` → mark Appointment `CONFIRMED`, Payment `SUCCEEDED`
- `checkout.session.expired` / `async_payment_failed` → cancel appointment, free the slot
- `charge.refunded` → mark Payment `REFUNDED`

---

## Deploy (Vercel)

1. Push to GitHub and import the repo into Vercel.
2. Set all env vars (same names as `.env.example`).
3. Add a managed Postgres (Vercel Postgres / Neon / Supabase) and set
   `DATABASE_URL`.
4. After first deploy, run a one-off:

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

5. In Stripe dashboard, add a webhook endpoint pointing to
   `https://YOUR_DOMAIN/api/stripe/webhook` and put the new `whsec_...` in your
   Vercel env vars.
6. In Google Cloud, add `https://YOUR_DOMAIN/api/auth/callback/google` to the
   OAuth client.

---

## Security

- All API routes that mutate data require an authenticated session.
- The `/api/upload` endpoint validates content-type and rejects payloads > 8MB.
- Stripe webhook verifies the signature header against `STRIPE_WEBHOOK_SECRET`.
- Slot booking is double-checked inside a transaction; the `(barberId, startsAt)`
  unique index prevents races.
- Middleware locks `/barber/*` to users with `BARBER` or `ADMIN` roles.
- Passwords are hashed with bcrypt (cost 12).

---

## Roadmap (bonus)

- AI haircut recommendation based on detected face shape (oval/round/square).
- Shareable before/after preview (OG image generator).
- Barber profile pages with a portfolio of past cuts.
- SMS confirmations via Twilio.
- Calendar export (.ics) for confirmed bookings.

---

Built for Brian Williams · The Cutting Cartel · Dallas, TX
