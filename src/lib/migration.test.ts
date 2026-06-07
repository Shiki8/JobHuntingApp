import { describe, it, expect } from 'vitest';
import { needsMigration } from './migration';

describe('needsMigration', () => {
  it('Supabase が空・ローカルに求人あり・フラグなし → true', () => {
    expect(needsMigration({ supabaseEmpty: true, hasLocalData: true, flagSet: false })).toBe(true);
  });

  it('Supabase にデータあり → false', () => {
    expect(needsMigration({ supabaseEmpty: false, hasLocalData: true, flagSet: false })).toBe(false);
  });

  it('ローカルにデータなし → false', () => {
    expect(needsMigration({ supabaseEmpty: true, hasLocalData: false, flagSet: false })).toBe(false);
  });

  it('マイグレーション完了フラグあり → false', () => {
    expect(needsMigration({ supabaseEmpty: true, hasLocalData: true, flagSet: true })).toBe(false);
  });
});
