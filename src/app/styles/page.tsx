import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export default async function StylesPage() {
  const styles = await prisma.hairstyle.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const groups = styles.reduce<Record<string, typeof styles>>((acc, s) => {
    (acc[s.category] = acc[s.category] ?? []).push(s);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl">The Catalogue</h1>
      <p className="mt-2 max-w-2xl text-bone-200/70">
        Tap any cut to try it on with your face. Adjust length and fade in the studio, then lock it
        in.
      </p>

      {Object.entries(groups).length === 0 && (
        <div className="card mt-10 text-sm text-bone-200/70">
          Run <code>npm run db:seed</code> to load the starter catalog.
        </div>
      )}

      {Object.entries(groups).map(([category, items]) => (
        <section key={category} className="mt-10">
          <h2 className="font-display text-xl uppercase tracking-wider text-cartel-300">
            {category}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {items.map((s) => (
              <Link key={s.id} href={`/try-on?style=${s.slug}`} className="card group hover:border-cartel-500/60">
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-ink-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.thumbnailUrl} alt={s.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-bone-200/60">{s.description}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-cartel-300" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
