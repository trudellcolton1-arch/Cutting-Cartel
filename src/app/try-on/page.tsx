import { Suspense } from "react";
import { TryOnStudio } from "@/components/TryOnStudio";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TryOnPage({
  searchParams,
}: {
  searchParams: { style?: string };
}) {
  const styles = await prisma.hairstyle
    .findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } })
    .catch(() => []);

  const initialSlug = searchParams.style;
  const initialId = initialSlug ? styles.find((s) => s.slug === initialSlug)?.id : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <div className="mb-5 sm:mb-6">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-cartel-500/40 bg-cartel-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cartel-300">
            Cutline AI
          </span>
          <span className="text-xs text-bone-200/50">by The Cutting Cartel</span>
        </div>
        <h1 className="mt-3 font-display text-2xl sm:text-3xl md:text-4xl">The Studio</h1>
        <p className="mt-1 text-sm text-bone-200/70">
          Upload a selfie or use your camera. Switch styles, dial in length and fade, then lock it
          in.
        </p>
      </div>

      <Suspense fallback={<div className="card text-bone-200/60">Loading studio…</div>}>
        <TryOnStudio styles={styles} initialStyleId={initialId} />
      </Suspense>
    </div>
  );
}
