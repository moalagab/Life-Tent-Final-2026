import { describe, it, expect } from 'vitest';
import { gregorianToHijri, formatHijriDate, isRamadan } from '@/lib/hijri';

describe('hijri', () => {
  describe('gregorianToHijri', () => {
    it('returns an object with day, month, year, monthName, monthNameAr', () => {
      const result = gregorianToHijri(new Date('2025-01-01'));
      expect(result).toHaveProperty('day');
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('year');
      expect(result).toHaveProperty('monthName');
      expect(result).toHaveProperty('monthNameAr');
    });

    it('day is between 1 and 30', () => {
      const result = gregorianToHijri(new Date('2025-06-01'));
      expect(result.day).toBeGreaterThanOrEqual(1);
      expect(result.day).toBeLessThanOrEqual(30);
    });

    it('month is between 1 and 12', () => {
      const result = gregorianToHijri(new Date('2025-06-01'));
      expect(result.month).toBeGreaterThanOrEqual(1);
      expect(result.month).toBeLessThanOrEqual(12);
    });

    it('year is in Hijri range (1400s)', () => {
      const result = gregorianToHijri(new Date('2025-01-01'));
      expect(result.year).toBeGreaterThanOrEqual(1400);
      expect(result.year).toBeLessThanOrEqual(1500);
    });

    it('monthName is a non-empty string', () => {
      const result = gregorianToHijri(new Date('2025-03-01'));
      expect(typeof result.monthName).toBe('string');
      expect(result.monthName.length).toBeGreaterThan(0);
    });

    it('monthNameAr is a non-empty Arabic string', () => {
      const result = gregorianToHijri(new Date('2025-03-01'));
      expect(typeof result.monthNameAr).toBe('string');
      expect(result.monthNameAr.length).toBeGreaterThan(0);
    });

    it('different dates produce different results', () => {
      const date1 = gregorianToHijri(new Date('2025-01-01'));
      const date2 = gregorianToHijri(new Date('2025-07-01'));
      // Six months apart should differ
      const areEqual = date1.day === date2.day && date1.month === date2.month && date1.year === date2.year;
      expect(areEqual).toBe(false);
    });
  });

  describe('formatHijriDate', () => {
    it('formats in Arabic by default', () => {
      const result = formatHijriDate(new Date('2025-01-01'));
      expect(result).toMatch(/هـ$/);
    });

    it('formats in Arabic when locale is ar', () => {
      const result = formatHijriDate(new Date('2025-01-01'), 'ar');
      expect(result).toMatch(/هـ$/);
    });

    it('formats in English when locale is en', () => {
      const result = formatHijriDate(new Date('2025-01-01'), 'en');
      expect(result).toMatch(/AH$/);
    });

    it('English format includes month name', () => {
      const result = formatHijriDate(new Date('2025-01-01'), 'en');
      const hijriMonths = ['Muharram', 'Safar', 'Rabi', 'Jumada', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', 'Dhu'];
      const hasMonth = hijriMonths.some((m) => result.includes(m));
      expect(hasMonth).toBe(true);
    });

    it('Arabic format includes Arabic month name', () => {
      const result = formatHijriDate(new Date('2025-01-01'), 'ar');
      const arabicMonths = ['محرم', 'صفر', 'ربيع', 'جمادى', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو'];
      const hasMonth = arabicMonths.some((m) => result.includes(m));
      expect(hasMonth).toBe(true);
    });
  });

  describe('isRamadan', () => {
    it('returns a boolean', () => {
      expect(typeof isRamadan(new Date('2025-03-01'))).toBe('boolean');
    });

    it('uses current date when no argument provided', () => {
      expect(() => isRamadan()).not.toThrow();
      expect(typeof isRamadan()).toBe('boolean');
    });

    it('Ramadan 2025 (March) returns true', () => {
      // Ramadan 1446 AH starts around March 1-2, 2025
      const ramadanDate = new Date('2025-03-10');
      expect(isRamadan(ramadanDate)).toBe(true);
    });

    it('January 2025 is not Ramadan', () => {
      expect(isRamadan(new Date('2025-01-01'))).toBe(false);
    });
  });
});
