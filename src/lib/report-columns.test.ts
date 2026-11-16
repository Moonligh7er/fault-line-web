import { describe, it, expect } from 'vitest';
import {
  API_V1_REPORT_COLUMNS,
  EXPORT_REPORT_COLUMNS,
  OPEN311_REPORT_COLUMNS,
  REPORT_COLUMNS,
  REPORT_COLUMN_LIST,
  withoutUserId,
} from './report-columns';

const cols = (s: string) => s.split(',').map((c) => c.trim());

describe('report column lists', () => {
  it('never name user_id or *', () => {
    for (const list of [REPORT_COLUMNS, OPEN311_REPORT_COLUMNS, API_V1_REPORT_COLUMNS, EXPORT_REPORT_COLUMNS]) {
      expect(cols(list)).not.toContain('user_id');
      expect(cols(list)).not.toContain('*');
    }
  });

  it('narrow lists only use known columns', () => {
    const known = new Set<string>(REPORT_COLUMN_LIST);
    for (const list of [OPEN311_REPORT_COLUMNS, API_V1_REPORT_COLUMNS, EXPORT_REPORT_COLUMNS]) {
      for (const c of cols(list)) expect(known.has(c)).toBe(true);
    }
  });

  it('withoutUserId strips the owner from realtime rows', () => {
    const row = withoutUserId({ id: 'a', user_id: 'u', status: 'submitted' });
    expect(row).toEqual({ id: 'a', status: 'submitted' });
  });
});
