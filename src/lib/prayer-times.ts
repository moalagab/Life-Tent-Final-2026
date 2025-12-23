// Prayer Times Calculator (simplified for Riyadh timezone)

export interface PrayerTime {
  name: string;
  nameAr: string;
  time: string;
  timestamp: Date;
}

export interface PrayerTimes {
  fajr: PrayerTime;
  sunrise: PrayerTime;
  dhuhr: PrayerTime;
  asr: PrayerTime;
  maghrib: PrayerTime;
  isha: PrayerTime;
}

// Simplified prayer times for Riyadh (would use API in production)
function getPrayerTimesForDate(date: Date): PrayerTimes {
  const month = date.getMonth();
  
  // Approximate prayer times that vary by month (Riyadh)
  const times: Record<number, { fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string }> = {
    0: { fajr: '05:28', sunrise: '06:51', dhuhr: '12:14', asr: '15:13', maghrib: '17:36', isha: '19:06' }, // Jan
    1: { fajr: '05:19', sunrise: '06:40', dhuhr: '12:16', asr: '15:28', maghrib: '17:52', isha: '19:22' }, // Feb
    2: { fajr: '04:56', sunrise: '06:15', dhuhr: '12:12', asr: '15:38', maghrib: '18:08', isha: '19:38' }, // Mar
    3: { fajr: '04:24', sunrise: '05:44', dhuhr: '12:03', asr: '15:44', maghrib: '18:23', isha: '19:53' }, // Apr
    4: { fajr: '03:58', sunrise: '05:22', dhuhr: '11:59', asr: '15:47', maghrib: '18:37', isha: '20:07' }, // May
    5: { fajr: '03:47', sunrise: '05:16', dhuhr: '12:02', asr: '15:51', maghrib: '18:49', isha: '20:19' }, // Jun
    6: { fajr: '03:56', sunrise: '05:23', dhuhr: '12:07', asr: '15:52', maghrib: '18:51', isha: '20:21' }, // Jul
    7: { fajr: '04:12', sunrise: '05:35', dhuhr: '12:05', asr: '15:44', maghrib: '18:35', isha: '20:05' }, // Aug
    8: { fajr: '04:28', sunrise: '05:47', dhuhr: '11:55', asr: '15:25', maghrib: '18:03', isha: '19:33' }, // Sep
    9: { fajr: '04:44', sunrise: '06:04', dhuhr: '11:46', asr: '15:00', maghrib: '17:27', isha: '18:57' }, // Oct
    10: { fajr: '05:05', sunrise: '06:27', dhuhr: '11:46', asr: '14:46', maghrib: '17:04', isha: '18:34' }, // Nov
    11: { fajr: '05:22', sunrise: '06:46', dhuhr: '11:57', asr: '14:54', maghrib: '17:07', isha: '18:37' }, // Dec
  };

  const dayTimes = times[month] || times[0];
  const dateStr = date.toISOString().split('T')[0];

  const createPrayerTime = (name: string, nameAr: string, time: string): PrayerTime => {
    const [hours, minutes] = time.split(':').map(Number);
    const timestamp = new Date(date);
    timestamp.setHours(hours, minutes, 0, 0);
    return { name, nameAr, time, timestamp };
  };

  return {
    fajr: createPrayerTime('Fajr', 'الفجر', dayTimes.fajr),
    sunrise: createPrayerTime('Sunrise', 'الشروق', dayTimes.sunrise),
    dhuhr: createPrayerTime('Dhuhr', 'الظهر', dayTimes.dhuhr),
    asr: createPrayerTime('Asr', 'العصر', dayTimes.asr),
    maghrib: createPrayerTime('Maghrib', 'المغرب', dayTimes.maghrib),
    isha: createPrayerTime('Isha', 'العشاء', dayTimes.isha),
  };
}

export function getTodayPrayerTimes(): PrayerTimes {
  return getPrayerTimesForDate(new Date());
}

export function getNextPrayer(prayerTimes: PrayerTimes): { prayer: PrayerTime; remaining: string } {
  const now = new Date();
  const prayers = [
    prayerTimes.fajr,
    prayerTimes.sunrise,
    prayerTimes.dhuhr,
    prayerTimes.asr,
    prayerTimes.maghrib,
    prayerTimes.isha,
  ];

  for (const prayer of prayers) {
    if (prayer.timestamp > now) {
      const diff = prayer.timestamp.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return {
        prayer,
        remaining: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      };
    }
  }

  // If all prayers passed, return next day's Fajr
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowPrayers = getPrayerTimesForDate(tomorrow);
  const diff = tomorrowPrayers.fajr.timestamp.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    prayer: tomorrowPrayers.fajr,
    remaining: `${hours}h ${minutes}m`,
  };
}
