import Link from "next/link";
import { XCircle } from "lucide-react";

export default function CancelPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <XCircle className="mx-auto h-12 w-12 text-red-400" />
      <h1 className="mt-4 font-display text-3xl">Payment cancelled</h1>
      <p className="mt-2 text-sm text-bone-200/70">
        Your slot has been released. You can pick another time below.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/booking" className="btn-primary">
          Try again
        </Link>
        <Link href="/" className="btn-ghost">
          Back home
        </Link>
      </div>
    </div>
  );
}
