import { z } from 'zod';
import { CATEGORY_KEYS } from './categories';

const categoryEnum = z.enum(CATEGORY_KEYS as [string, ...string[]]);

export const latitudeSchema = z.number().finite().gte(-90).lte(90);
export const longitudeSchema = z.number().finite().gte(-180).lte(180);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(254);

export const descriptionSchema = z
  .string()
  .trim()
  .max(2000)
  .transform((s) => {
    // Strip ASCII control characters (0x00-0x1F + DEL 0x7F).
    // Linear-time loop avoids regex entirely.
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      if (code >= 0x20 && code !== 0x7f) out += s.charAt(i);
    }
    return out;
  });

export const submitReportSchema = z.object({
  category: categoryEnum,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().length(2).optional(),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/).optional(),
  description: descriptionSchema.optional(),
  sizeRating: z.enum(['small', 'medium', 'large', 'massive']),
  hazardLevel: z.enum([
    'minor',
    'moderate',
    'significant',
    'dangerous',
    'extremely_dangerous',
  ]),
  isAnonymous: z.boolean().default(false),
  mediaUrls: z.array(z.string().url()).max(5).default([]),
});

export type SubmitReportInput = z.infer<typeof submitReportSchema>;

export const voteSchema = z.object({
  reportId: z.string().uuid(),
  voteType: z.enum(['upvote', 'confirm']),
});

export const searchReportsSchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
  radiusKm: z.number().positive().max(50).default(5),
  category: categoryEnum.optional(),
});

export const magicLinkSchema = z.object({
  email: emailSchema,
});

/**
 * Validates photo upload by magic bytes (not just extension or MIME header).
 * Mirrors the mobile app's validateImageMagicBytes.
 */
const MAGIC_BYTES: Record<string, number[]> = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46],
  bmp: [0x42, 0x4d],
};

export function validateImageMagicBytes(bytes: Uint8Array): boolean {
  for (const signature of Object.values(MAGIC_BYTES)) {
    const sig = signature;
    if (!sig) continue;
    if (bytes.length < sig.length) continue;
    let match = true;
    for (let i = 0; i < sig.length; i++) {
      if (bytes[i] !== sig[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
