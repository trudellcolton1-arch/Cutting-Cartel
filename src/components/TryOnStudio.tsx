"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, Lock, RefreshCw, Sliders, Sparkles, Wand2 } from "lucide-react";
import type { Hairstyle } from "@prisma/client";
import { CameraCapture } from "@/components/CameraCapture";
import { uploadSelfie } from "@/lib/imageUpload";

type GenState = "idle" | "uploading" | "generating" | "done" | "error";

export function TryOnStudio({
  styles,
  initialStyleId,
}: {
  styles: Hairstyle[];
  initialStyleId?: string;
}) {
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string | undefined>(initialStyleId ?? styles[0]?.id);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [selfieRemoteUrl, setSelfieRemoteUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [length, setLength] = useState(3);
  const [fade, setFade] = useState(2);
  const [notes, setNotes] = useState("");
  const [genState, setGenState] = useState<GenState>("idle");
  const [status, setStatus] = useState("Upload a selfie to start.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // increment to abort stale generation responses
  const genTokenRef = useRef(0);

  const selected = styles.find((s) => s.id === selectedId);

  // Resize + direct-upload the selfie to Cloudinary in the browser.
  // Reports 0..1 progress; falls back to /api/upload if direct isn't configured.
  const handleSelfieUpload = useCallback(async (file: File): Promise<string | null> => {
    setGenState("uploading");
    setStatus("Uploading selfie…");
    setUploadProgress(0);
    try {
      const url = await uploadSelfie(file, (p) => setUploadProgress(p));
      return url;
    } catch (e) {
      console.error(e);
      setError("Upload failed. Try again.");
      setGenState("error");
      return null;
    }
  }, []);

  // Kick off a Replicate generation. Token-protected so a slow response from
  // a previous style doesn't clobber the latest one.
  const generate = useCallback(
    async (selfie: string, hairstyleId: string, len: number, fd: number) => {
      const token = ++genTokenRef.current;
      setGenState("generating");
      setError(null);
      setStatus("Cutline AI is cutting your hair… (12–25s)");
      try {
        const res = await fetch("/api/cutline-ai/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ selfieUrl: selfie, hairstyleId, length: len, fade: fd }),
        });
        if (token !== genTokenRef.current) return; // stale
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? "Generation failed");
        }
        const { previewUrl } = await res.json();
        if (token !== genTokenRef.current) return;
        setPreviewUrl(previewUrl);
        setGenState("done");
        setStatus("Looking good. Tweak it or lock it in.");
      } catch (e) {
        if (token !== genTokenRef.current) return;
        const msg = e instanceof Error ? e.message : "Generation failed";
        setError(msg);
        setGenState("error");
        setStatus("Generation failed.");
      }
    },
    []
  );

  // When user picks a new selfie:
  //   1. Show local preview INSTANTLY via object URL (no FileReader/base64 wait)
  //   2. Resize + direct-upload to Cloudinary in parallel (1-3s)
  //   3. As soon as the URL comes back, kick off Replicate generation
  const onFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("That doesn't look like an image.");
      return;
    }
    // instant local preview
    const objectUrl = URL.createObjectURL(file);
    setSelfieDataUrl(objectUrl);
    setPreviewUrl(null);
    setError(null);

    const remote = await handleSelfieUpload(file);
    if (!remote) return;
    setSelfieRemoteUrl(remote);
    if (selected) generate(remote, selected.id, length, fade);
  };

  const openCamera = () => {
    setError(null);
    setCameraOpen(true);
  };

  const handleCameraCapture = (file: File) => {
    setCameraOpen(false);
    onFile(file);
  };

  // Re-generate when style/length/fade change. Debounced — and we wait until
  // any in-flight generation finishes before kicking off a new one so we don't
  // stack requests against Replicate's rate limit.
  useEffect(() => {
    if (!selfieRemoteUrl || !selected) return;
    if (genState === "generating" || genState === "uploading") return;
    const handle = setTimeout(() => {
      generate(selfieRemoteUrl, selected.id, length, fade);
    }, 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, length, fade, selfieRemoteUrl, genState]);

  const lockInCut = async () => {
    if (!selfieRemoteUrl || !previewUrl || !selected) {
      setError("Wait for the AI cut to finish first.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Saving your cut…");
    try {
      // Re-upload the Replicate output to Cloudinary for permanent storage
      const previewRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: previewUrl, kind: "preview" }),
      });
      if (!previewRes.ok) throw new Error("Preview upload failed");
      const previewJson = await previewRes.json();

      const sessRes = await fetch("/api/try-on", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          hairstyleId: selected.id,
          selfieUrl: selfieRemoteUrl,
          previewUrl: previewJson.url,
          length,
          fade,
          notes,
        }),
      });
      if (!sessRes.ok) throw new Error("Could not save try-on");
      const { tryOn } = await sessRes.json();
      router.push(`/booking?tryOnId=${tryOn.id}`);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  };

  const reset = () => {
    setSelfieDataUrl(null);
    setSelfieRemoteUrl(null);
    setPreviewUrl(null);
    setGenState("idle");
    setError(null);
    setStatus("Upload a selfie to start.");
    genTokenRef.current++;
  };

  const showSpinner = genState === "uploading" || genState === "generating";
  const displayImage = previewUrl ?? selfieDataUrl;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Preview canvas */}
      <div className="card">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-ink-700">
          {!displayImage ? (
            <div className="absolute inset-0 grid place-items-center text-center text-sm text-bone-200/60">
              <div className="px-6">
                <Sparkles className="mx-auto mb-2 h-8 w-8 text-cartel-300" />
                <div className="font-display text-base text-bone-50">Cutline AI</div>
                <div className="mt-1 text-xs text-bone-200/60">
                  Upload or shoot a selfie. We&apos;ll cut your hair with AI.
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt="preview"
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
                style={{ opacity: showSpinner ? 0.45 : 1 }}
              />
              {showSpinner && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="rounded-2xl bg-ink-900/80 px-5 py-4 backdrop-blur">
                    <div className="flex items-center gap-3 text-sm">
                      <Wand2 className="h-4 w-4 animate-pulse text-cartel-300" />
                      <span>
                        {genState === "uploading" ? "Uploading selfie…" : "Cutline AI is cutting…"}
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-ink-700">
                      {genState === "uploading" ? (
                        <div
                          className="h-full bg-cartel-500 transition-[width] duration-150"
                          style={{ width: `${Math.max(8, Math.round(uploadProgress * 100))}%` }}
                        />
                      ) : (
                        <div className="h-full w-1/2 animate-[loader_1.4s_ease-in-out_infinite] bg-cartel-500" />
                      )}
                    </div>
                  </div>
                </div>
              )}
              {previewUrl && genState === "done" && (
                <span className="pill absolute left-3 top-3 border-blade-500/50 bg-blade-500/10 text-blade-400">
                  <Sparkles className="h-3 w-3" /> AI preview
                </span>
              )}
            </>
          )}
        </div>

        <style>{`@keyframes loader { 0%{transform:translateX(-100%);} 50%{transform:translateX(50%);} 100%{transform:translateX(200%);} }`}</style>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost">
            <Upload className="h-4 w-4" /> Upload
          </button>
          <button onClick={openCamera} className="btn-ghost">
            <Camera className="h-4 w-4" /> Use camera
          </button>
          {selfieRemoteUrl && selected && genState !== "generating" && (
            <button
              onClick={() => generate(selfieRemoteUrl, selected.id, length, fade)}
              className="btn-ghost"
            >
              <RefreshCw className="h-4 w-4" /> Re-roll
            </button>
          )}
          {displayImage && (
            <button onClick={reset} className="btn-ghost">
              Clear
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </div>

        <p className="mt-3 text-xs text-bone-200/60">{status}</p>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg">Pick your cut</h3>
            <span className="pill">{styles.length} styles</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {styles.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`overflow-hidden rounded-xl border text-left transition ${
                  s.id === selectedId
                    ? "border-cartel-500 shadow-glow"
                    : "border-ink-600 hover:border-cartel-500/50"
                }`}
              >
                <div className="aspect-[4/3] bg-ink-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.thumbnailUrl} alt={s.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-2 text-xs">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-bone-200/60">{s.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="flex items-center gap-2 font-display text-lg">
            <Sliders className="h-4 w-4 text-cartel-300" /> Dial it in
          </h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className="label">Length: {length}</label>
              <input
                type="range"
                min={1}
                max={5}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full accent-cartel-500"
              />
            </div>
            <div>
              <label className="label">Fade: {fade === 0 ? "none" : fade === 5 ? "skin" : fade}</label>
              <input
                type="range"
                min={0}
                max={5}
                value={fade}
                onChange={(e) => setFade(Number(e.target.value))}
                className="w-full accent-cartel-500"
              />
            </div>
            <div>
              <label className="label">Notes for your barber</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="input resize-none"
                placeholder="Mid fade, leave length on top, keep beard tight…"
              />
            </div>
          </div>
        </div>

        <button
          disabled={busy || genState !== "done" || !previewUrl}
          onClick={lockInCut}
          className="btn-primary w-full justify-center"
        >
          <Lock className="h-4 w-4" />
          {busy ? "Locking in…" : "Lock This Cut"}
        </button>
        {!previewUrl && (
          <p className="text-center text-xs text-bone-200/50">
            Cutline AI needs to finish the cut first
          </p>
        )}
      </div>

      {cameraOpen && (
        <CameraCapture onCapture={handleCameraCapture} onClose={() => setCameraOpen(false)} />
      )}
    </div>
  );
}
