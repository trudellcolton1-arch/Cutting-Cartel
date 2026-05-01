import Replicate from "replicate";

/**
 * Cutline AI runs on FLUX.1 + PuLID via Replicate.
 *
 * PuLID (Pure and Lightning ID Customization) is a face-preservation adapter
 * that locks the customer's identity while FLUX generates the new hair, beard,
 * lighting, and background per the prompt.
 *
 * Cost: ~$0.04 per generation. Latency: 12–25 seconds.
 *
 * Pin a specific version SHA to avoid silent breakage when the model author
 * pushes an update. Override via REPLICATE_MODEL_VERSION if you want to A/B
 * test a newer model.
 */
const DEFAULT_MODEL =
  "zsxkib/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b";

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export function isReplicateConfigured() {
  return !!process.env.REPLICATE_API_TOKEN;
}

export type CutlineGenInput = {
  selfieUrl: string;
  /** descriptive prompt fragment for the cut, e.g. "low fade with textured top" */
  styleFragment: string;
  /** 1..5 — short to long */
  length: number;
  /** 0..5 — none to skin */
  fade: number;
};

/** Builds a tight, FLUX-friendly prompt from the cut + sliders. */
export function buildPrompt({ styleFragment, length, fade }: Omit<CutlineGenInput, "selfieUrl">): string {
  const lengthWord = ["very short", "short", "medium length", "longer", "long flowing"][
    Math.max(0, Math.min(4, length - 1))
  ];
  const fadeWord =
    fade === 0
      ? "natural sides, no fade"
      : fade === 1
      ? "subtle taper"
      : fade === 2
      ? "low fade with clean lines"
      : fade === 3
      ? "mid fade with sharp blend"
      : fade === 4
      ? "high fade, tight transition"
      : "skin fade, completely shaved sides";

  return [
    "professional barbershop portrait photograph,",
    `man with ${styleFragment},`,
    `${lengthWord} hair on top,`,
    `${fadeWord},`,
    "razor-sharp line up, well-groomed beard line,",
    "studio lighting, shallow depth of field, 50mm lens,",
    "high detail, photo-realistic, sharp focus on face,",
    "neutral grey backdrop",
  ].join(" ");
}

const NEGATIVE_PROMPT =
  "cartoon, anime, illustration, painting, blurry, low quality, distorted face, " +
  "extra ears, deformed, watermark, text, logo, low-res hair, plastic skin";

/**
 * Generate a photoreal preview of the customer with the requested cut.
 * Returns the Replicate output image URL (valid for ~1h — re-upload to
 * Cloudinary for permanence on lock-in).
 */
export async function generateCutPreview(input: CutlineGenInput): Promise<string> {
  if (!isReplicateConfigured()) {
    throw new Error("REPLICATE_API_TOKEN not set");
  }

  const prompt = buildPrompt(input);
  const model = (process.env.REPLICATE_MODEL_VERSION ?? DEFAULT_MODEL) as `${string}/${string}:${string}`;

  const output = await replicate.run(model, {
    input: {
      prompt,
      main_face_image: input.selfieUrl,
      negative_prompt: NEGATIVE_PROMPT,
      num_steps: 20,
      guidance_scale: 4,
      id_weight: 1.05,
      width: 768,
      height: 1024,
      num_outputs: 1,
      seed: undefined,
      output_format: "png",
      output_quality: 92,
    },
  });

  // Replicate returns either a string, an array of strings, or FileOutput-like
  // objects depending on SDK version. Normalize to the first URL.
  const url = extractUrl(output);
  if (!url) throw new Error("Replicate returned no image");
  return url;
}

function extractUrl(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    const first = output[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      const maybeUrl = (first as { url?: () => URL | string; href?: string }).url;
      if (typeof maybeUrl === "function") {
        const u = maybeUrl();
        return typeof u === "string" ? u : u.toString();
      }
      if (typeof (first as { href?: string }).href === "string") {
        return (first as { href: string }).href;
      }
    }
  }
  if (typeof output === "object") {
    const u = (output as { url?: () => URL | string }).url;
    if (typeof u === "function") {
      const v = u();
      return typeof v === "string" ? v : v.toString();
    }
  }
  return null;
}
