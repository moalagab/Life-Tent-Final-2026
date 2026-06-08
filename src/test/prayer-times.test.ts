import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
  getTodayPrayerTimes,
  getNextPrayer,
  type PrayerTimes,
} from '@/lib/prayer-times';

describe('prayer-times', () => {
  describe('getTodayPrayerTimes', () => {
    it('returns all six prayer times', () => {
      const times = getTodayPrayerTimes();
      expect(times).toHaveProperty('fajr');
      expect(times).toHaveProperty('sunrise');
      expect(times).toHaveProperty('dhuhr');
      expect(times).toHaveProperty('asr');
      expect(times).toHaveProperty('maghrib');
      expect(times).toHaveProperty('isha');
    });

    it('each prayer has name, nameAr, time, and timestamp', () => {
      const times = getTodayPrayerTimes();
      const prayers = [times.fajr, times.sunrise, times.dhuhr, times.asr, times.maghrib, times.isha];
      for (const prayer of prayers) {
        expect(typeof prayer.name).toBe('string');
        expect(typeof prayer.nameAr).toBe('string');
        expect(typeof prayer.time).toBe('string');
        expect(prayer.timestamp).toBeInstanceOf(Date);
      }
    });

    it('prayer times are in HH:MM format', () => {
      const times = getTodayPrayerTimes();
      const timeRegex = /^\d{2}:\d{2}$/;
      expect(times.fajr.time).toMatch(timeRegex);
      expect(times.dhuhr.time).toMatch(timeRegex);
      expect(times.isha.time).toMatch(timeRegex);
    });

    it('prayers are in chronological order', () => {
      const times = getTodayPrayerTimes();
      const timestamps = [
        times.fajr.timestamp,
        times.sunrise.timestamp,
        times.dhuhr.timestamp,
        times.asr.timestamp,
        times.maghrib.timestamp,
        times.isha.timestamp,
      ];
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i].getTime()).toBeGreaterThan(timestamps[i - 1].getTime());
      }
    });

    it('Arabic prayer names are non-empty strings', () => {
      const times = getTodayPrayerTimes();
      expect(times.fajr.nameAr).toBe('الفجر');
      expect(times.dhuhr.nameAr).toBe('الظهر');
      expect(times.asr.nameAr).toBe('العصر');
      expect(times.maghrib.nameAr).toBe('المغرب');
      expect(times.isha.nameAr).toBe('العشاء');
    });
  });

  describe('getNextPrayer', () => {
    it('returns a prayer and remaining time string', () => {
      const times = getTodayPrayerTimes();
      const next = getNextPrayer(times);
      expect(next).toHaveProperty('prayer');
      expect(next).toHaveProperty('remaining');
      expect(typeof next.remaining).toBe('string');
      expect(next.remaining.length).toBeGreaterThan(0);
    });

    it('remaining time matches expected format (Xh Ym or Ym)', () => {
      const times = getTodayPrayerTimes();
      const next = getNextPrayer(times);
      const validFormat = /^\d+h \d+m$|^\d+m$/;
      expect(next.remaining).toMatch(validFormat);
    });

    it('when all prayers have passed, returns next day fajr', () => {
      // Mock current time to 23:59
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T23:59:00'));
      const times = getTodayPrayerTimes();
      const next = getNextPrayer(times);
      expect(next.prayer.name).toBe('Fajr');
      vi.useRealTimers();
    });

    it('returns fajr when current time is midnight', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T00:01:00'));
      const times = getTodayPrayerTimes();
      const next = getNextPrayer(times);
      expect(next.prayer.name).toBe('Fajr');
      vi.useRealTimers();
    });
  });
});
