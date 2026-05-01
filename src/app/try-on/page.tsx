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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl">The Studio</h1>
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
