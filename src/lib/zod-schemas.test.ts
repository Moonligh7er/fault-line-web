import { describe, it, expect } from 'vitest';
import {
  submitReportSchema,
  magicLinkSchema,
  voteSchema,
  searchReportsSchema,
  validateImageMagicBytes,
  descriptionSchema,
} from './zod-schemas';

describe('submitReportSchema', () => {
  const validBase = {
    category: 'pothole',
    latitude: 42.36,
    longitude: -71.06,
    sizeRating: 'medium',
    hazardLevel: 'moderate',
    isAnonymous: false,
    mediaUrls: [],
  };

  it('accepts a valid minimal report', () => {
    const result = submitReportSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('rejects invalid category', () => {
    const result = submitReportSchema.safeParse({ ...validBase, category: 'nope' });
    expect(result.success).toBe(false);
  });

  it('rejects out-of-range latitude', () => {
    const result = submitReportSchema.safeParse({ ...validBase, latitude: 91 });
    expect(result.success).toBe(false);
  });

  it('rejects out-of-range longitude', () => {
    const result = submitReportSchema.safeParse({ ...validBase, longitude: -181 });
    expect(result.success).toBe(false);
  });

  it('rejects infinite coordinates', () => {
    expect(
      submitReportSchema.safeParse({ ...validBase, latitude: Infinity }).success
    ).toBe(false);
    expect(
      submitReportSchema.safeParse({ ...validBase, longitude: NaN }).success
    ).toBe(false);
  });

  it('rejects bad zip format', () => {
    const result = submitReportSchema.safeParse({ ...validBase, zip: 'abcde' });
    expect(result.success).toBe(false);
  });

  it('accepts 5-digit and 9-digit zip', () => {
    expect(
      submitReportSchema.safeParse({ ...validBase, zip: '02139' }).success
    ).toBe(true);
    expect(
      submitReportSchema.safeParse({ ...validBase, zip: '02139-1234' }).success
    ).toBe(true);
  });

  it('caps description at 2000 chars', () => {
    const long = 'x'.repeat(2001);
    const result = submitReportSchema.safeParse({ ...validBase, description: long });
    expect(result.success).toBe(false);
  });

  it('limits mediaUrls to 5', () => {
    const urls = Array(6).fill('https://example.com/a.jpg');
    const result = submitReportSchema.safeParse({ ...validBase, mediaUrls: urls });
    expect(result.success).toBe(false);
  });

  it('rejects non-URL media entries', () => {
    const result = submitReportSchema.safeParse({
      ...validBase,
      mediaUrls: ['not a url'],
    });
    expect(result.success).toBe(false);
  });
});

describe('descriptionSchema', () => {
  it('strips ASCII control characters', () => {
    const input = 'hello\u0000world\u0007test\u007F!';
    const result = descriptionSchema.parse(input);
    expect(result).toBe('helloworldtest!');
  });

  it('preserves whitespace and printable chars', () => {
    const input = '  hello world  ';
    const result = descriptionSchema.parse(input);
    expect(result).toBe('hello world');
  });
});

describe('magicLinkSchema', () => {
  it('accepts a valid email', () => {
    expect(magicLinkSchema.safeParse({ email: 'user@example.com' }).success).toBe(
      true
    );
  });

  it('lowercases and trims', () => {
    const result = magicLinkSchema.parse({ email: '  USER@Example.COM  ' });
    expect(result.email).toBe('user@example.com');
  });

  it('rejects empty email', () => {
    expect(magicLinkSchema.safeParse({ email: '' }).success).toBe(false);
  });

  it('rejects missing @', () => {
    expect(magicLinkSchema.safeParse({ email: 'user.example.com' }).success).toBe(
      false
    );
  });

  it('rejects email over 254 chars', () => {
    const long = 'x'.repeat(250) + '@a.com';
    expect(magicLinkSchema.safeParse({ email: long }).success).toBe(false);
  });
});

describe('voteSchema', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts valid upvote', () => {
    expect(
      voteSchema.safeParse({ reportId: uuid, voteType: 'upvote' }).success
    ).toBe(true);
  });

  it('accepts valid confirm', () => {
    expect(
      voteSchema.safeParse({ reportId: uuid, voteType: 'confirm' }).success
    ).toBe(true);
  });

  it('rejects non-UUID reportId', () => {
    expect(
      voteSchema.safeParse({ reportId: 'not-a-uuid', voteType: 'upvote' }).success
    ).toBe(false);
  });

  it('rejects unknown voteType', () => {
    expect(
      voteSchema.safeParse({ reportId: uuid, voteType: 'downvote' }).success
    ).toBe(false);
  });
});

describe('searchReportsSchema', () => {
  it('caps radius at 50 km', () => {
    const result = searchReportsSchema.safeParse({
      lat: 42,
      lng: -71,
      radiusKm: 51,
    });
    expect(result.success).toBe(false);
  });

  it('defaults radius to 5', () => {
    const result = searchReportsSchema.parse({ lat: 42, lng: -71 });
    expect(result.radiusKm).toBe(5);
  });
});

describe('validateImageMagicBytes', () => {
  it('accepts JPEG signature', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    expect(validateImageMagicBytes(jpeg)).toBe(true);
  });

  it('accepts PNG signature', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    expect(validateImageMagicBytes(png)).toBe(true);
  });

  it('accepts GIF signature', () => {
    const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    expect(validateImageMagicBytes(gif)).toBe(true);
  });

  it('accepts WebP RIFF header', () => {
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00]);
    expect(validateImageMagicBytes(webp)).toBe(true);
  });

  it('rejects ZIP (disguised as image)', () => {
    const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    expect(validateImageMagicBytes(zip)).toBe(false);
  });

  it('rejects PE executable header', () => {
    const pe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);
    expect(validateImageMagicBytes(pe)).toBe(false);
  });

  it('rejects empty buffer', () => {
    expect(validateImageMagicBytes(new Uint8Array())).toBe(false);
  });

  it('rejects random bytes', () => {
    const random = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    expect(validateImageMagicBytes(random)).toBe(false);
  });
});
