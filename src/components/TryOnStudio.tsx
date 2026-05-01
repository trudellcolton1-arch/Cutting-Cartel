"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, Lock, RefreshCw, Sliders } from "lucide-react";
import type { Hairstyle } from "@prisma/client";

type Landmarks = {
  faceTop: { x: number; y: number };
  faceBottom: { x: number; y: number };
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  faceWidth: number;
  faceHeight: number;
  angleRad: number;
};

const MODEL_BASE = "/models"; // tinyFaceDetector + faceLandmark68 weights live under public/models

export function TryOnStudio({
  styles,
  initialStyleId,
}: {
  styles: Hairstyle[];
  initialStyleId?: string;
}) {
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string | undefined>(initialStyleId ?? styles[0]?.id);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [length, setLength] = useState(3);
  const [fade, setFade] = useState(2);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("Ready when you are.");
  const [modelsReady, setModelsReady] = useState(false);
  const [landmarks, setLandmarks] = useState<Landmarks | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseImgRef = useRef<HTMLImageElement | null>(null);
  const overlayImgRef = useRef<HTMLImageElement | null>(null);

  const selected = styles.find((s) => s.id === selectedId);

  // Load face-api.js dynamically (client only) — keeps SSR clean.
  const loadModels = useCallback(async () => {
    try {
      const faceapi = await import("face-api.js");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE),
      ]);
      setModelsReady(true);
      return faceapi;
    } catch (e) {
      console.warn("[try-on] face-api models failed to load — falling back to centered overlay", e);
      setModelsReady(false);
      return null;
    }
  }, []);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  // Detect landmarks once a selfie is loaded.
  const detect = useCallback(async (img: HTMLImageElement) => {
    try {
      const faceapi = await import("face-api.js");
      if (!faceapi.nets.tinyFaceDetector.params) {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE);
      }
      const result = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
        .withFaceLandmarks();
      if (!result) return null;

      const lm = result.landmarks;
      const jaw = lm.getJawOutline();
      const leftEyePts = lm.getLeftEye();
      const rightEyePts = lm.getRightEye();
      const box = result.detection.box;

      const center = (pts: { x: number; y: number }[]) => ({
        x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
        y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
      });

      const leftEye = center(leftEyePts);
      const rightEye = center(rightEyePts);
      const angleRad = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

      const faceTop = { x: (box.left + box.right) / 2, y: box.top };
      const faceBottom = jaw[Math.floor(jaw.length / 2)];

      return {
        faceTop,
        faceBottom: { x: faceBottom.x, y: faceBottom.y },
        leftEye,
        rightEye,
        faceWidth: box.width,
        faceHeight: box.height,
        angleRad,
      } satisfies Landmarks;
    } catch (e) {
      console.warn("[try-on] detection failed", e);
      return null;
    }
  }, []);

  // Render the composite (selfie + hairstyle overlay) onto canvas.
  const renderComposite = useCallback(() => {
    const canvas = canvasRef.current;
    const baseImg = baseImgRef.current;
    if (!canvas || !baseImg) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = baseImg.naturalWidth || 720;
    const h = baseImg.naturalHeight || 960;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(baseImg, 0, 0, w, h);

    if (!selected) return;
    const overlay = overlayImgRef.current;
    if (!overlay || !overlay.complete) return;

    // length scales the overlay's vertical extent slightly (1..5 -> 0.85..1.15)
    const lengthScale = 0.85 + (length - 1) * 0.075;
    // fade tightens the bottom of the hair against the temples (visual cue)
    const fadeTighten = 1 - fade * 0.04;

    if (landmarks) {
      const { faceTop, faceWidth, angleRad } = landmarks;
      const targetWidth = faceWidth * selected.anchorScaleRatio * fadeTighten;
      const aspect = overlay.naturalHeight / overlay.naturalWidth;
      const targetHeight = targetWidth * aspect * lengthScale;

      const cx = faceTop.x;
      const cy = faceTop.y - targetHeight * (0.4 - selected.anchorTopRatio);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleRad);
      ctx.drawImage(overlay, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
      ctx.restore();
    } else {
      // Fallback — centered, scaled to a heuristic 55% of image width.
      const targetWidth = w * 0.55 * fadeTighten;
      const aspect = overlay.naturalHeight / overlay.naturalWidth;
      const targetHeight = targetWidth * aspect * lengthScale;
      const cx = w / 2;
      const cy = h * 0.22;
      ctx.drawImage(overlay, cx - targetWidth / 2, cy - targetHeight / 2, targetWidth, targetHeight);
    }
  }, [selected, landmarks, length, fade]);

  // Re-render whenever inputs change.
  useEffect(() => {
    renderComposite();
  }, [renderComposite, selfie, selectedId, length, fade]);

  // Pre-load overlay image whenever selection changes.
  useEffect(() => {
    if (!selected) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      overlayImgRef.current = img;
      renderComposite();
    };
    img.onerror = () => {
      overlayImgRef.current = null;
    };
    img.src = selected.overlayUrl;
  }, [selected, renderComposite]);

  // Handle file selection.
  const onFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setStatus("That doesn't look like an image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setSelfie(dataUrl);
      setStatus("Detecting face…");
      const img = new Image();
      img.onload = async () => {
        baseImgRef.current = img;
        const lm = await detect(img);
        setLandmarks(lm);
        setStatus(lm ? "Face locked. Style your cut." : "Couldn't pin landmarks — using centered overlay.");
        renderComposite();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Webcam capture.
  const captureFromCamera = async () => {
    try {
      setStatus("Opening camera…");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      // wait one frame
      await new Promise((r) => setTimeout(r, 600));
      const c = document.createElement("canvas");
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      c.getContext("2d")!.drawImage(video, 0, 0);
      stream.getTracks().forEach((t) => t.stop());
      const dataUrl = c.toDataURL("image/jpeg", 0.9);
      const file = await (await fetch(dataUrl)).blob();
      onFile(new File([file], "selfie.jpg", { type: "image/jpeg" }));
    } catch (e) {
      console.warn(e);
      setStatus("Camera access denied. Upload a photo instead.");
    }
  };

  // Lock-in flow: upload selfie + composite, create try-on session, redirect to booking.
  const lockInCut = async () => {
    if (!selfie || !selected) {
      setStatus("Select a style and a selfie first.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    setBusy(true);
    setStatus("Saving your cut…");

    try {
      const previewDataUrl = canvas.toDataURL("image/jpeg", 0.9);

      const [selfieRes, previewRes] = await Promise.all([
        fetch("/api/upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ data: selfie, kind: "selfie" }),
        }),
        fetch("/api/upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ data: previewDataUrl, kind: "preview" }),
        }),
      ]);

      if (!selfieRes.ok || !previewRes.ok) throw new Error("Upload failed");
      const selfieJson = await selfieRes.json();
      const previewJson = await previewRes.json();

      const sessRes = await fetch("/api/try-on", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          hairstyleId: selected.id,
          selfieUrl: selfieJson.url,
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
      setStatus("Something went wrong. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Canvas */}
      <div className="card">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-ink-700">
          {!selfie && (
            <div className="absolute inset-0 grid place-items-center text-center text-sm text-bone-200/60">
              <div className="px-6">
                <Camera className="mx-auto mb-2 h-8 w-8 text-cartel-300" />
                <div>Upload a selfie or use your camera to begin.</div>
                <div className="mt-2 text-xs text-bone-200/40">
                  Models {modelsReady ? "loaded" : "loading…"}
                </div>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />
          <video ref={videoRef} className="hidden" playsInline />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost">
            <Upload className="h-4 w-4" /> Upload
          </button>
          <button onClick={captureFromCamera} className="btn-ghost">
            <Camera className="h-4 w-4" /> Use camera
          </button>
          {selfie && (
            <button
              onClick={() => {
                setSelfie(null);
                setLandmarks(null);
                baseImgRef.current = null;
                if (canvasRef.current) {
                  const ctx = canvasRef.current.getContext("2d");
                  ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
                setStatus("Cleared. Upload another.");
              }}
              className="btn-ghost"
            >
              <RefreshCw className="h-4 w-4" /> Clear
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
          disabled={busy || !selfie || !selected}
          onClick={lockInCut}
          className="btn-primary w-full justify-center"
        >
          <Lock className="h-4 w-4" />
          {busy ? "Locking in…" : "Lock This Cut"}
        </button>
        {!selfie && <p className="text-center text-xs text-bone-200/50">Add a selfie to unlock</p>}
      </div>
    </div>
  );
}
