/**
 * arabicParser — Arabic Natural Language Processing engine.
 *
 * Pure function, no side effects, no API calls.
 * Parses Arabic text into structured data using pattern matching
 * and keyword dictionaries.
 *
 * Handles:
 *   - Amounts (Arabic/Western numerals + currency keywords)
 *   - Dates (day names, month names, relative terms, dd/mm patterns)
 *   - Categories (keyword → canonical category mapping)
 *   - Object types (expense / income / task / reminder / subscription / debt)
 */
import { format, addDays, addMonths, endOfMonth, nextDay, setDate } from 'date-fns';

// ── Output types ───────────────────────────────────────────────────────────────

export type CaptureType =
  | 'expense'
  | 'income'
  | 'task'
  | 'reminder'
  | 'subscription'
  | 'debt';

export interface ParsedAmount {
  value:    number;
  currency: string;
  label:    string;    // e.g. "2500 ريال"
}

export interface ParsedDate {
  date:  Date;
  label: string;       // e.g. "5 يوليو", "غداً", "الجمعة"
}

export interface CapturedField {
  key:    string;
  label:  string;      // human-readable name
  value:  string;      // display value
  color:  string;      // tailwind color class
}

export interface ParsedCapture {
  raw:        string;
  type:       CaptureType;
  typeLabel:  string;
  amount:     ParsedAmount | null;
  date:       ParsedDate | null;
  category:   string | null;
  title:      string;
  reminder:   boolean;
  confidence: number;         // 0-100
  fields:     CapturedField[];
}

// ── Arabic constants ───────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  يناير: 0,  جانفي: 0,
  فبراير: 1, فيفري: 1,
  مارس: 2,
  أبريل: 3,  إبريل: 3,
  مايو: 4,
  يونيو: 5,  يونيه: 5,
  يوليو: 6,  يوليه: 6,
  أغسطس: 7,  اغسطس: 7, أكتس: 7,
  سبتمبر: 8,
  أكتوبر: 9,  اكتوبر: 9,
  نوفمبر: 10, نوفمبار: 10,
  ديسمبر: 11, دجنبر: 11,
};

const DAY_MAP: Record<string, number> = {
  الأحد: 0, الاحد: 0,
  الاثنين: 1,
  الثلاثاء: 2,
  الأربعاء: 3, الاربعاء: 3,
  الخميس: 4,
  الجمعة: 5,
  السبت: 6,
};

const CURRENCY_WORDS: Record<string, string> = {
  ريال: 'SAR', 'ر.س': 'SAR', sar: 'SAR',
  دولار: 'USD', '$': 'USD', usd: 'USD',
  درهم: 'AED', aed: 'AED',
  دينار: 'KWD',
  جنيه: 'EGP',
  يورو: 'EUR', euro: 'EUR',
};

// ── Type keywords ──────────────────────────────────────────────────────────────

const TYPE_KEYWORDS: Array<{ words: string[]; type: CaptureType; label: string }> = [
  {
    words: ['سدد', 'دفع', 'ادفع', 'دفعت', 'اشتريت', 'اشتري', 'صرف', 'مصروف',
            'فاتورة', 'إيجار', 'ايجار', 'نفقة', 'مشتريات', 'شراء', 'أنفق'],
    type:  'expense',
    label: 'مصروف',
  },
  {
    words: ['راتب', 'مرتب', 'استلم', 'استلمت', 'تحصيل', 'ربح', 'دخل',
            'عائد', 'بيع', 'بعت', 'حولت لي', 'وصل'],
    type:  'income',
    label: 'دخل',
  },
  {
    words: ['اشتراك', 'اشترك', 'subscription', 'رسوم شهرية', 'رسوم سنوية'],
    type:  'subscription',
    label: 'اشتراك',
  },
  {
    words: ['قسط', 'سداد', 'دين', 'قرض', 'سدد قرض', 'دفع قسط'],
    type:  'debt',
    label: 'سداد دين',
  },
  {
    words: ['تذكير', 'تذكرني', 'ذكرني', 'reminder', 'لا تنسى', 'لا تنسى'],
    type:  'reminder',
    label: 'تذكير',
  },
  {
    words: ['اجتمع', 'اجتماع', 'ارسل', 'أرسل', 'راجع', 'اتصل', 'كلم', 'أكمل',
            'اكمل', 'أنهِ', 'انتهِ', 'تحقق', 'ابدأ', 'خطط', 'جهز', 'أعد'],
    type:  'task',
    label: 'مهمة',
  },
];

// ── Category keywords ─────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Array<{ words: string[]; category: string; label: string }> = [
  { words: ['إيجار', 'ايجار', 'سكن', 'شقة', 'مكتب', 'إيجار مكتب'], category: 'housing',       label: 'سكن/إيجار'    },
  { words: ['طعام', 'أكل', 'اكل', 'مطعم', 'غداء', 'عشاء', 'فطور', 'بقالة', 'سوبر ماركت'], category: 'food', label: 'طعام' },
  { words: ['كهرباء', 'ماء', 'غاز', 'فاتورة', 'مياه', 'خدمات'], category: 'utilities',   label: 'فواتير'       },
  { words: ['موبايل', 'جوال', 'اتصال', 'اتصالات', 'انترنت', 'نت'], category: 'telecom',     label: 'اتصالات'      },
  { words: ['دواء', 'طبيب', 'مستشفى', 'صيدلية', 'صحة', 'عيادة'], category: 'health',       label: 'صحة'          },
  { words: ['سيارة', 'وقود', 'بنزين', 'غاز سيارة', 'تاكسي', 'أوبر', 'كريم', 'مواصلات'], category: 'transport', label: 'مواصلات' },
  { words: ['تعليم', 'كورس', 'دورة', 'دراسة', 'جامعة', 'مدرسة', 'كتب'], category: 'education',  label: 'تعليم'        },
  { words: ['ترفيه', 'نتفليكس', 'سينما', 'ألعاب', 'اشتراك ترفيه'], category: 'entertainment',label: 'ترفيه'        },
  { words: ['تأمين', 'بوليصة', 'تأمين صحي', 'تأمين سيارة'], category: 'insurance',    label: 'تأمين'        },
  { words: ['راتب', 'مرتب', 'أجر', 'حافز'], category: 'salary',       label: 'راتب'         },
  { words: ['استثمار', 'أسهم', 'صندوق', 'عقار'], category: 'investment',   label: 'استثمار'      },
  { words: ['هدية', 'هدايا', 'مناسبة'], category: 'gifts',         label: 'هدايا'        },
  { words: ['لبس', 'ملابس', 'أحذية', 'إكسسوار'], category: 'clothing',      label: 'ملابس'        },
];

// ── Arabic numeral normalization ───────────────────────────────────────────────

const ARABIC_TO_WESTERN: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

function normalizeNumerals(text: string): string {
  return text.replace(/[٠-٩]/g, d => ARABIC_TO_WESTERN[d] ?? d);
}

// ── Amount parsing ─────────────────────────────────────────────────────────────

function parseAmount(text: string): { amount: ParsedAmount; raw: string } | null {
  const normalized = normalizeNumerals(text);
  // Match: number (with optional thousands comma) optionally followed by currency
  const pattern = /(\d{1,3}(?:[,،]\d{3})*(?:\.\d+)?)\s*(ريال|ر\.س|دولار|\$|درهم|دينار|جنيه|يورو|SAR|USD|AED)?/gi;
  let best: { amount: ParsedAmount; raw: string } | null = null;
  let bestValue = 0;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(normalized)) !== null) {
    const numStr  = match[1].replace(/[,،]/g, '');
    const value   = parseFloat(numStr);
    if (isNaN(value) || value <= 0) continue;

    const currWord = match[2]?.toLowerCase().trim() ?? '';
    const currency = Object.entries(CURRENCY_WORDS).find(
      ([k]) => k.toLowerCase() === currWord,
    )?.[1] ?? 'SAR';

    // Check if there's a currency keyword nearby in original text (within 5 chars)
    const startIdx  = match.index;
    const endIdx    = match.index + match[0].length;
    const nearby    = normalized.slice(Math.max(0, startIdx - 5), endIdx + 10);
    const hasCurrKey = Object.keys(CURRENCY_WORDS).some(k =>
      nearby.toLowerCase().includes(k.toLowerCase()),
    );

    if (value > bestValue && (hasCurrKey || match[2])) {
      bestValue = value;
      const rawLabel = match[2]
        ? `${value.toLocaleString('ar')} ${match[2]}`
        : `${value.toLocaleString('ar')} ${currency}`;
      best = {
        amount: { value, currency, label: rawLabel },
        raw:    match[0],
      };
    } else if (!best && value > 0) {
      // Still capture even without currency keyword for large numbers
      best = {
        amount: { value, currency: 'SAR', label: `${value.toLocaleString('ar')}` },
        raw:    match[0],
      };
    }
  }

  return best;
}

// ── Date parsing ──────────────────────────────────────────────────────────────

function parseDate(text: string): { date: ParsedDate; raw: string } | null {
  const normalized = normalizeNumerals(text);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. "غداً" / "غداﹰ" / "بكرة"
  if (/غدا|غدً|غد\b|بكر[ةه]/.test(text)) {
    const d = addDays(today, 1);
    return { date: { date: d, label: 'غداً' }, raw: 'غداً' };
  }

  // 2. "بعد غد" / "بعد بكرة"
  if (/بعد غد|بعد بكر/.test(text)) {
    const d = addDays(today, 2);
    return { date: { date: d, label: 'بعد غد' }, raw: 'بعد غد' };
  }

  // 3. "نهاية الشهر"
  if (/نهاية الشهر|آخر الشهر|نهاية الشهر/.test(text)) {
    const d = endOfMonth(today);
    return { date: { date: d, label: 'نهاية الشهر' }, raw: 'نهاية الشهر' };
  }

  // 4. "الأسبوع القادم" / "الأسبوع المقبل"
  if (/الأسبوع القادم|الأسبوع المقبل|الأسبوع الجاي/.test(text)) {
    const d = addDays(today, 7);
    return { date: { date: d, label: 'الأسبوع القادم' }, raw: 'الأسبوع القادم' };
  }

  // 5. "الشهر القادم" / "الشهر المقبل"
  if (/الشهر القادم|الشهر المقبل|الشهر الجاي/.test(text)) {
    const d = addMonths(today, 1);
    return { date: { date: d, label: 'الشهر القادم' }, raw: 'الشهر القادم' };
  }

  // 6. Named day of week: "يوم الجمعة" / "الجمعة"
  for (const [dayName, dayNum] of Object.entries(DAY_MAP)) {
    const re = new RegExp(`(يوم\\s+)?${dayName}`, 'u');
    if (re.test(text)) {
      const d = nextDay(today, dayNum as 0|1|2|3|4|5|6);
      return {
        date: { date: d, label: dayName },
        raw: dayName,
      };
    }
  }

  // 7. "يوم X شهر" e.g. "يوم 5 يوليو"
  for (const [monthName, monthIdx] of Object.entries(MONTH_MAP)) {
    const re = new RegExp(`(?:يوم\\s+)?(\\d{1,2})\\s+${monthName}`, 'u');
    const m  = normalized.match(re);
    if (m) {
      const day = parseInt(m[1], 10);
      const yr  = today.getFullYear();
      let d = new Date(yr, monthIdx, day);
      if (d < today) d = new Date(yr + 1, monthIdx, day);
      const label = `${day} ${monthName}`;
      return { date: { date: d, label }, raw: m[0] };
    }
    // Without "يوم" prefix
    const re2 = new RegExp(`(\\d{1,2})\\s+${monthName}`, 'u');
    const m2  = normalized.match(re2);
    if (m2) {
      const day = parseInt(m2[1], 10);
      const yr  = today.getFullYear();
      let d = new Date(yr, monthIdx, day);
      if (d < today) d = new Date(yr + 1, monthIdx, day);
      const label = `${day} ${monthName}`;
      return { date: { date: d, label }, raw: m2[0] };
    }
  }

  // 8. "يوم X" (bare day number, assume current or next month)
  const dayMatch = normalized.match(/(?:يوم|تاريخ)\s+(\d{1,2})/);
  if (dayMatch) {
    const day = parseInt(dayMatch[1], 10);
    if (day >= 1 && day <= 31) {
      let d = setDate(today, day);
      if (d <= today) d = setDate(addMonths(today, 1), day);
      return {
        date: { date: d, label: `يوم ${day}` },
        raw: dayMatch[0],
      };
    }
  }

  // 9. "dd/mm" or "dd/mm/yyyy"
  const slashMatch = normalized.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (slashMatch) {
    const day   = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10) - 1;
    const yr    = slashMatch[3]
      ? parseInt(slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3], 10)
      : today.getFullYear();
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      let d = new Date(yr, month, day);
      if (d < today && !slashMatch[3]) d = new Date(yr + 1, month, day);
      return {
        date: { date: d, label: `${day}/${month + 1}` },
        raw: slashMatch[0],
      };
    }
  }

  return null;
}

// ── Category parsing ──────────────────────────────────────────────────────────

function parseCategory(text: string): { category: string; label: string } | null {
  const lower = text.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.words.some(w => lower.includes(w.toLowerCase()))) {
      return { category: entry.category, label: entry.label };
    }
  }
  return null;
}

// ── Type parsing ──────────────────────────────────────────────────────────────

function parseType(text: string): { type: CaptureType; label: string } {
  const lower = text.toLowerCase();
  for (const entry of TYPE_KEYWORDS) {
    if (entry.words.some(w => lower.includes(w.toLowerCase()))) {
      return { type: entry.type, label: entry.label };
    }
  }
  // Default: if there's an amount → expense; otherwise → task
  return { type: 'expense', label: 'مصروف' };
}

// ── Title extraction ──────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'يوم', 'في', 'من', 'إلى', 'على', 'مع', 'و', 'أو', 'ثم', 'هذا', 'هذه',
  'الـ', 'لـ', 'بـ', 'لا', 'ما', 'لم', 'لن', 'قد', 'كان',
  'سيتم', 'سيكون', 'يتم', 'يكون',
]);

function extractTitle(
  text: string,
  consumedPatterns: string[],
): string {
  let cleaned = text;
  // Remove consumed patterns
  consumedPatterns.forEach(p => {
    if (p) cleaned = cleaned.replace(p, '');
  });
  // Remove type keywords
  TYPE_KEYWORDS.forEach(entry => {
    entry.words.forEach(w => {
      cleaned = cleaned.replace(new RegExp(`\\b${w}\\b`, 'gi'), '');
    });
  });
  // Remove currency words
  Object.keys(CURRENCY_WORDS).forEach(w => {
    cleaned = cleaned.replace(new RegExp(w, 'gi'), '');
  });
  // Remove isolated numbers
  cleaned = cleaned.replace(/\b\d+\b/g, '');
  // Remove Arabic numerals
  cleaned = cleaned.replace(/[٠-٩]+/g, '');
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  // Remove leading/trailing punctuation
  cleaned = cleaned.replace(/^[،,.؛:]+|[،,.؛:]+$/g, '').trim();

  return cleaned || text.trim();
}

// ── Type → color mapping ──────────────────────────────────────────────────────

const TYPE_COLOR: Record<CaptureType, string> = {
  expense:      'bg-red-500/15 text-red-500 border-red-500/20',
  income:       'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
  task:         'bg-blue-500/15 text-blue-500 border-blue-500/20',
  reminder:     'bg-purple-500/15 text-purple-500 border-purple-500/20',
  subscription: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
  debt:         'bg-orange-500/15 text-orange-500 border-orange-500/20',
};

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseArabicCapture(raw: string): ParsedCapture {
  const text     = raw.trim();
  const consumed: string[] = [];

  // 1. Type
  const { type, label: typeLabel } = parseType(text);

  // 2. Amount
  const amountResult = parseAmount(text);
  if (amountResult) consumed.push(amountResult.raw);

  // 3. Date
  const dateResult = parseDate(text);
  if (dateResult) consumed.push(dateResult.raw);

  // 4. Category
  const catResult = parseCategory(text);

  // 5. Title
  const title = extractTitle(text, consumed);

  // 6. Reminder: auto-suggest if has a future date and is a financial type
  const reminder =
    dateResult !== null &&
    dateResult.date.date > new Date() &&
    (type === 'expense' || type === 'debt' || type === 'subscription');

  // 7. Confidence
  let confidence = 20; // base
  if (amountResult) confidence += 30;
  if (dateResult)   confidence += 25;
  if (catResult)    confidence += 15;
  if (type !== 'expense') confidence += 10; // explicit non-default type
  confidence = Math.min(95, confidence);

  // 8. Fields display
  const fields: CapturedField[] = [];

  fields.push({
    key:   'type',
    label: 'النوع',
    value: typeLabel,
    color: TYPE_COLOR[type],
  });

  if (amountResult) {
    fields.push({
      key:   'amount',
      label: 'المبلغ',
      value: amountResult.amount.label,
      color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20',
    });
  }

  if (dateResult) {
    fields.push({
      key:   'date',
      label: 'التاريخ',
      value: dateResult.date.label,
      color: 'bg-blue-500/15 text-blue-500 border-blue-500/20',
    });
  }

  if (catResult) {
    fields.push({
      key:   'category',
      label: 'الفئة',
      value: catResult.label,
      color: 'bg-violet-500/15 text-violet-500 border-violet-500/20',
    });
  }

  if (reminder) {
    fields.push({
      key:   'reminder',
      label: 'تذكير',
      value: 'قبل يوم',
      color: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
    });
  }

  return {
    raw,
    type,
    typeLabel,
    amount:   amountResult?.amount ?? null,
    date:     dateResult?.date ?? null,
    category: catResult?.category ?? null,
    title:    title || text,
    reminder,
    confidence,
    fields,
  };
}
