import { describe, it, expect } from 'vitest';
import { parseNominatimAddress } from './location';

describe('parseNominatimAddress', () => {
  it('extracts street, city, 2-letter state and zip', () => {
    const r = parseNominatimAddress({
      address: {
        house_number: '1',
        road: 'City Hall Square',
        city: 'Boston',
        'ISO3166-2-lvl4': 'US-MA',
        postcode: '02201',
      },
    });
    expect(r).toEqual({ address: '1 City Hall Square', city: 'Boston', state: 'MA', zip: '02201' });
  });

  it('uses town/village when there is no city', () => {
    expect(parseNominatimAddress({ address: { town: 'Concord', 'ISO3166-2-lvl4': 'US-NH' } }).city).toBe('Concord');
  });

  it('rejects non-US states and malformed zips', () => {
    const r = parseNominatimAddress({ address: { city: 'Toronto', 'ISO3166-2-lvl4': 'CA-ON', postcode: 'M5H 2N2' } });
    expect(r.state).toBeNull();
    expect(r.zip).toBeNull();
  });

  it('survives an empty or malformed body', () => {
    expect(parseNominatimAddress(null)).toEqual({ address: null, city: null, state: null, zip: null });
  });
});
