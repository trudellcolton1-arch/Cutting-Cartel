import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type Props = { params: { id: string } };

export const dynamic = "force-dynamic";

async function loadTryOn(id: string) {
  return prisma.tryOnSession.findUnique({
    where: { id },
    include: { hairstyle: true, user: { select: { name: true } } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await loadTryOn(params.id);
  if (!t) return { title: "Cut not found" };
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://cuttingcartel.com";
  const ogUrl = `${base}/api/og/try-on/${params.id}`;
  const first = (t.user?.name ?? "Someone").split(" ")[0];
  const title = `${first} locked in: ${t.hairstyle.name} · Cutline AI`;
  const description = `AI hairstyle try-on by The Cutting Cartel — Dallas, TX. See the cut, lock the line, sit in the chair.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const t = await loadTryOn(params.id);
  if (!t) return notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="font-display text-3xl">{t.hairstyle.name}</h1>
      <p className="mt-1 text-sm text-bone-200/70">Locked in via Cutline AI</p>

      <div className="card mt-8 grid gap-3 md:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.selfieUrl} alt="before" className="aspect-[3/4] w-full rounded-xl object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={t.previewUrl ?? t.selfieUrl}
          alt="after"
          className="aspect-[3/4] w-full rounded-xl object-cover ring-2 ring-cartel-500"
        />
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link href="/try-on" className="btn-primary">Try yours</Link>
        <Link href="/booking" className="btn-ghost">Book a chair</Link>
      </div>
    </div>
  );
}
