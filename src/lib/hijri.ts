// Hijri Date Utilities (Umm al-Qura Calendar approximation)

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  monthNameAr: string;
}

const hijriMonths = [
  { en: 'Muharram', ar: 'محرم' },
  { en: 'Safar', ar: 'صفر' },
  { en: 'Rabi al-Awwal', ar: 'ربيع الأول' },
  { en: 'Rabi al-Thani', ar: 'ربيع الثاني' },
  { en: 'Jumada al-Awwal', ar: 'جمادى الأولى' },
  { en: 'Jumada al-Thani', ar: 'جمادى الآخرة' },
  { en: 'Rajab', ar: 'رجب' },
  { en: 'Sha\'ban', ar: 'شعبان' },
  { en: 'Ramadan', ar: 'رمضان' },
  { en: 'Shawwal', ar: 'شوال' },
  { en: 'Dhu al-Qi\'dah', ar: 'ذو القعدة' },
  { en: 'Dhu al-Hijjah', ar: 'ذو الحجة' },
];

export function gregorianToHijri(date: Date): HijriDate {
  // Using Intl.DateTimeFormat for accurate Hijri conversion
  const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  
  const parts = hijriFormatter.formatToParts(date);
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '1');
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '1446');
  
  return {
    day,
    month,
    year,
    monthName: hijriMonths[month - 1]?.en || '',
    monthNameAr: hijriMonths[month - 1]?.ar || '',
  };
}

export function formatHijriDate(date: Date, locale: 'ar' | 'en' = 'ar'): string {
  const hijri = gregorianToHijri(date);
  if (locale === 'ar') {
    return `${hijri.day} ${hijri.monthNameAr} ${hijri.year}هـ`;
  }
  return `${hijri.day} ${hijri.monthName} ${hijri.year} AH`;
}

export function isRamadan(date: Date = new Date()): boolean {
  const hijri = gregorianToHijri(date);
  return hijri.month === 9;
}
