import { describe, it, expect } from 'vitest';
import { safeNextPath } from './safe-redirect';

const ORIGIN = 'https://app.fault-line.dev';

describe('safeNextPath', () => {
  it('rejects backslash tricks', () => {
    expect(safeNextPath('/\\evil.com', ORIGIN)).toBe('/');
    expect(safeNextPath('/\\/evil.com', ORIGIN)).toBe('/');
  });

  it('rejects control characters', () => {
    expect(safeNextPath('/\t/evil.com', ORIGIN)).toBe('/');
    expect(safeNextPath('/\n/evil.com', ORIGIN)).toBe('/');
  });

  it('rejects protocol-relative URLs', () => {
    expect(safeNextPath('//evil.com', ORIGIN)).toBe('/');
  });

  it('rejects absolute URLs, even to our own origin', () => {
    expect(safeNextPath('https://evil.com', ORIGIN)).toBe('/');
    expect(safeNextPath(`${ORIGIN}/dashboard`, ORIGIN)).toBe('/');
  });

  it('keeps same-origin paths with their query string', () => {
    expect(safeNextPath('/ok?x=1', ORIGIN)).toBe('/ok?x=1');
    expect(safeNextPath('/report/abc/legal', ORIGIN)).toBe('/report/abc/legal');
  });

  it('drops the fragment and falls back on junk', () => {
    expect(safeNextPath('/ok#frag', ORIGIN)).toBe('/ok');
    expect(safeNextPath('', ORIGIN)).toBe('/');
    expect(safeNextPath(undefined, ORIGIN)).toBe('/');
    expect(safeNextPath(['java', 'script:alert(1)'].join(''), ORIGIN)).toBe('/');
  });
});
