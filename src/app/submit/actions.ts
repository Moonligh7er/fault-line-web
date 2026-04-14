'use server';

import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  submitReportSchema,
  validateImageMagicBytes,
  MAX_UPLOAD_BYTES,
  ALLOWED_MIME,
} from '@/lib/zod-schemas';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

interface ActionResult {
  ok: boolean;
  reportId?: string;
  error?: string;
}

export async function submitReport(form: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: 'Sign in required.' };

  const h = await headers();
  const rl = await checkRateLimit('submit', getRateLimitKey(user.id, h));
  if (!rl.success) {
    return { ok: false, error: 'Submission limit reached. Try again later.' };
  }

  // Parse and validate form data
  const raw = {
    category: form.get('category'),
    latitude: Number(form.get('latitude')),
    longitude: Number(form.get('longitude')),
    description: form.get('description') ?? undefined,
    sizeRating: form.get('sizeRating'),
    hazardLevel: form.get('hazardLevel'),
    isAnonymous: form.get('isAnonymous') === 'true',
    mediaUrls: [] as string[],
  };

  const parsed = submitReportSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid form data.' };
  }

  const mediaUrls: { url: string; type: 'photo'; thumbnailUrl?: string }[] = [];

  // --- Photo upload with magic-byte validation ---
  const photo = form.get('photo');
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_UPLOAD_BYTES) {
      return { ok: false, error: 'Photo exceeds 5 MB.' };
    }
    if (!ALLOWED_MIME.includes(photo.type as (typeof ALLOWED_MIME)[number])) {
      return { ok: false, error: 'Photo type not allowed.' };
    }
    const buf = new Uint8Array(await photo.arrayBuffer());
    if (!validateImageMagicBytes(buf)) {
      return { ok: false, error: 'Photo failed content validation.' };
    }
    const uploadRl = await checkRateLimit('upload', getRateLimitKey(user.id, h));
    if (!uploadRl.success) {
      return { ok: false, error: 'Upload limit reached.' };
    }

    const ext = photo.type.split('/')[1] ?? 'jpg';
    const key = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { data: upload, error: uploadErr } = await supabase.storage
      .from('report-photos')
      .upload(key, buf, {
        contentType: photo.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadErr || !upload) {
      return { ok: false, error: 'Upload failed.' };
    }

    const { data: publicUrl } = supabase.storage
      .from('report-photos')
      .getPublicUrl(upload.path);

    mediaUrls.push({ url: publicUrl.publicUrl, type: 'photo' });
  }

  // --- Insert report (RLS enforces user_id matches authenticated user) ---
  const { data: report, error: insertErr } = await supabase
    .from('reports')
    .insert({
      user_id: parsed.data.isAnonymous ? null : user.id,
      category: parsed.data.category,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      address: parsed.data.address ?? null,
      city: parsed.data.city ?? null,
      state: parsed.data.state ?? null,
      zip: parsed.data.zip ?? null,
      description: parsed.data.description ?? null,
      size_rating: parsed.data.sizeRating,
      hazard_level: parsed.data.hazardLevel,
      media: mediaUrls,
      status: 'submitted',
      is_anonymous: parsed.data.isAnonymous,
    })
    .select('id')
    .single();

  if (insertErr || !report) {
    return { ok: false, error: 'Could not create report.' };
  }

  return { ok: true, reportId: report.id };
}
