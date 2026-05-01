"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, RotateCcw } from "lucide-react";

/**
 * Live-preview camera modal that works on iOS Safari.
 * Key gotchas: <video> must NOT be display:none (Safari won't render frames),
 * needs playsInline + muted + autoplay attributes, and the stream must be
 * stopped on close to release the camera light.
 */
export function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1080 },
            height: { ideal: 1440 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          // iOS Safari needs these set as attributes, not just JSX props, before play()
          video.setAttribute("playsinline", "true");
          video.setAttribute("muted", "true");
          video.muted = true;
          await video.play();
          setReady(true);
        }
      } catch (e) {
        console.warn(e);
        setError(
          e instanceof Error && e.name === "NotAllowedError"
            ? "Camera access denied. Allow camera in your browser settings, or upload a photo."
            : "Couldn't open the camera. Upload a photo instead."
        );
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    // un-mirror for the front camera so the saved file matches what the user sees in life
    if (facing === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    c.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
        // stop the stream before handing off so the camera light dies fast
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        onCapture(file);
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-900">
      {/* top bar */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full bg-ink-700/80 text-bone-50"
          aria-label="Close camera"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="text-xs uppercase tracking-[0.3em] text-cartel-300">Cutline AI</div>
        <button
          onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
          className="grid h-10 w-10 place-items-center rounded-full bg-ink-700/80 text-bone-50"
          aria-label="Flip camera"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      {/* preview */}
      <div className="relative flex-1 overflow-hidden bg-black">
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="absolute inset-0 h-full w-full object-cover"
          // mirror live preview so it feels natural, but un-mirror at capture time
          style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }}
        />

        {!ready && !error && (
          <div className="absolute inset-0 grid place-items-center text-sm text-bone-200/70">
            Opening camera…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center px-8 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        {/* face-frame guide */}
        {ready && !error && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div
              className="rounded-[50%] border-2 border-cartel-500/70"
              style={{ width: "60%", aspectRatio: "3/4" }}
            />
          </div>
        )}
      </div>

      {/* shutter */}
      <div className="flex items-center justify-center gap-6 p-6">
        <button
          onClick={capture}
          disabled={!ready}
          className="grid h-20 w-20 place-items-center rounded-full bg-cartel-500 text-ink-900 shadow-glow transition active:scale-95 disabled:opacity-50"
          aria-label="Take photo"
        >
          <Camera className="h-8 w-8" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
