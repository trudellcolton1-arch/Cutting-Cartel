"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Upload,
  Lock,
  RefreshCw,
  Sliders,
  Sparkles,
  Wand2,
  Scissors,
} from "lucide-react";
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
  const [customPrompt, setCustomPrompt] = useState("");
  const [notes, setNotes] = useState("");
  const [genState, setGenState] = useState<GenState>("idle");
  const [status, setStatus] = useState("Add a selfie to start.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // increment to abort stale generation responses
  const genTokenRef = useRef(0);

  const selected = styles.find((s) => s.id === selectedId);
  const isWorking = genState === "uploading" || genState === "generating";
  const canGenerate = !!selfieRemoteUrl && !!selected && !isWorking;
  const canLock = !!previewUrl && genState === "done" && !busy;

  const handleSelfieUpload = useCallback(async (file: File): Promise<string | null> => {
    setGenState("uploading");
    setStatus("Uploading selfie…");
    setUploadProgress(0);
    setError(null);
    try {
      const url = await uploadSelfie(file, (p) => setUploadProgress(p));
      setGenState("idle");
      setStatus("Pick a style and tap Cut my hair.");
      return url;
    } catch (e) {
      console.error(e);
      setError("Upload failed. Try again.");
      setGenState("error");
      return null;
    }
  }, []);

  const onFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("That doesn't look like an image.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setSelfieDataUrl(objectUrl);
    setPreviewUrl(null);
    const remote = await handleSelfieUpload(file);
    if (remote) setSelfieRemoteUrl(remote);
  };

  const openCamera = () => {
    setError(null);
    setCameraOpen(true);
  };

  const handleCameraCapture = (file: File) => {
    setCameraOpen(false);
    onFile(file);
  };

  // Manual generation — only fires when the user explicitly taps "Cut my hair".
  // No more auto-firing on slider/style change (saves credits + prevents loops).
  const generate = async () => {
    if (!selfieRemoteUrl || !selected) {
      setError("Add a selfie and pick a style first.");
      return;
    }
    const token = ++genTokenRef.current;
    setGenState("generating");
    setError(null);
    setStatus("Cutline AI is cutting… (15-25s)");
    try {
      const res = await fetch("/api/cutline-ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          selfieUrl: selfieRemoteUrl,
          hairstyleId: selected.id,
          length,
          fade,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });
      if (token !== genTokenRef.current) return;
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Generation failed");
      }
      const { previewUrl: url } = await res.json();
      if (token !== genTokenRef.current) return;
      setPreviewUrl(url);
      setGenState("done");
      setStatus("Looking good. Lock it in or tweak and re-cut.");
    } catch (e) {
      if (token !== genTokenRef.current) return;
      const msg = e instanceof Error ? e.message : "Generation failed";
      setError(msg);
      setGenState("error");
      setStatus("Generation failed.");
    }
  };

  const lockInCut = async () => {
    if (!selfieRemoteUrl || !previewUrl || !selected) return;
    setBusy(true);
    setError(null);
    setStatus("Saving your cut…");
    try {
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
          notes: [customPrompt && `Cut: ${customPrompt}`, notes].filter(Boolean).join("\n\n"),
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
    setCustomPrompt("");
    setGenState("idle");
    setError(null);
    setStatus("Add a selfie to start.");
    genTokenRef.current++;
  };

  const displayImage = previewUrl ?? selfieDataUrl;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Preview canvas */}
      <div className="card">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-ink-700">
          {!displayImage ? (
            <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-bone-200/60">
              <div>
                <Sparkles className="mx-auto mb-2 h-8 w-8 text-cartel-300" />
                <div className="font-display text-base text-bone-50">Cutline AI</div>
                <div className="mt-1 text-xs text-bone-200/60">
                  Upload or shoot a selfie. Pick a style. Tap <span className="font-semibold text-cartel-300">Cut my hair</span>.
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
                style={{ opacity: isWorking ? 0.45 : 1 }}
              />
              {isWorking && (
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
          {previewUrl && !isWorking && (
            <button onClick={generate} className="btn-ghost">
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

      {/* Controls */}
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
          </div>
        </div>

        <div className="card">
          <label className="label">
            <Wand2 className="mr-1 inline h-3.5 w-3.5 text-cartel-300" />
            Describe your dream cut <span className="text-bone-200/40">(optional)</span>
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            maxLength={500}
            className="input resize-none"
            placeholder="e.g. mid fade with a textured pomp, a single line on the left side, beard kept tight…"
          />
          <p className="mt-1 text-right text-[10px] text-bone-200/40">{customPrompt.length}/500</p>
        </div>

        <div className="card">
          <label className="label">Notes for your barber</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="input resize-none"
            placeholder="Allergies, scalp sensitivity, anything Brian should know."
          />
        </div>

        {/* Primary action — explicit Cut my hair */}
        <button
          disabled={!canGenerate}
          onClick={generate}
          className="btn-primary w-full justify-center text-base"
        >
          <Scissors className="h-4 w-4" />
          {genState === "generating" ? "Cutting…" : previewUrl ? "Cut again" : "Cut my hair"}
        </button>

        {/* Lock-in only after a successful generation */}
        {canLock && (
          <button
            disabled={busy}
            onClick={lockInCut}
            className="btn-ghost w-full justify-center border-cartel-500 text-cartel-300 hover:bg-cartel-500/10"
          >
            <Lock className="h-4 w-4" />
            {busy ? "Locking in…" : "Lock this cut & book"}
          </button>
        )}

        {!selfieRemoteUrl && (
          <p className="text-center text-xs text-bone-200/50">Upload a selfie to unlock</p>
        )}
      </div>

      {cameraOpen && (
        <CameraCapture onCapture={handleCameraCapture} onClose={() => setCameraOpen(false)} />
      )}
    </div>
  );
}
