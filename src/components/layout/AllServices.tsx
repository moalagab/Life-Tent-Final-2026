/**
 * AllServices — شاشة "جميع الخدمات"
 * تستخدم كلاسات life-tent-theme.css (.lt-*) مع توكنات --lt-* كمصدر وحيد للألوان.
 */
import {
  BookOpen, Calendar, Repeat, CheckSquare, Timer, Film,
  Target, FolderKanban, Wallet, User, Settings, LogOut, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type React from 'react';

interface Module {
  id: string;
  path: string;
  labelAr: string;
  Icon: LucideIcon;
  hue: string;
}

const MODULES: Module[] = [
  { id: 'knowledge', path: '/knowledge', labelAr: 'المعرفة',   Icon: BookOpen,    hue: 'var(--lt-hue-know)'   },
  { id: 'calendar',  path: '/calendar',  labelAr: 'التقويم',   Icon: Calendar,    hue: 'var(--lt-hue-cal)'    },
  { id: 'habits',    path: '/habits',    labelAr: 'العادات',   Icon: Repeat,      hue: 'var(--lt-hue-habit)'  },
  { id: 'tasks',     path: '/tasks',     labelAr: 'المهام',    Icon: CheckSquare, hue: 'var(--lt-hue-task)'   },
  { id: 'pomodoro',  path: '/pomodoro',  labelAr: 'بومودورو',  Icon: Timer,       hue: 'var(--lt-hue-pomo)'   },
  { id: 'studio',    path: '/studio',    labelAr: 'الاستوديو', Icon: Film,        hue: 'var(--lt-hue-studio)' },
  { id: 'goals',     path: '/goals',     labelAr: 'الأهداف',   Icon: Target,      hue: 'var(--lt-hue-goal)'   },
  { id: 'projects',  path: '/projects',  labelAr: 'المشاريع',  Icon: FolderKanban,hue: 'var(--lt-hue-proj)'   },
  { id: 'finance',   path: '/finance',   labelAr: 'المالية',   Icon: Wallet,      hue: 'var(--lt-hue-money)'  },
];

interface Props {
  /** IDs النشطة — يُرسَل من useModuleAccess */
  activeIds?: Set<string>;
  onClose: () => void;
  /** يستقبل المسار الكامل مثل '/knowledge' */
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function AllServices({ activeIds, onClose, onNavigate, onLogout }: Props) {
  const visibleModules = activeIds
    ? MODULES.filter(m => activeIds.has(m.id))
    : MODULES;

  return (
    <section className="lt-sheet" dir="rtl" aria-label="جميع الخدمات">
      <div className="lt-grabber" />

      <header className="lt-head">
        <button className="lt-close" onClick={onClose} aria-label="إغلاق">
          <X size={22} strokeWidth={2} />
        </button>
        <div className="lt-titles">
          <h1>جميع الخدمات</h1>
          <p>
            <span className="lt-num">{visibleModules.length}</span> وحدة نشطة
          </p>
        </div>
      </header>

      <div className="lt-grid">
        {visibleModules.map(({ id, path, labelAr, Icon }) => (
          <button
            key={id}
            className="lt-mod"
            onClick={() => onNavigate(path)}
          >
            <span className="lt-ic">
              <Icon size={26} strokeWidth={2} />
            </span>
            <span className="lt-mod-label">{labelAr}</span>
          </button>
        ))}
      </div>

      <div className="lt-acc-label">الحساب</div>
      <div className="lt-acc-row">
        <button
          className="lt-acc"
          onClick={() => onNavigate('/profile')}
        >
          <span className="lt-acc-ic">
            <User size={21} strokeWidth={2} />
          </span>
          <b>ملفي الشخصي</b>
        </button>
        <button
          className="lt-acc"
          onClick={() => onNavigate('/settings')}
        >
          <span className="lt-acc-ic">
            <Settings size={21} strokeWidth={2} />
          </span>
          <b>الإعدادات</b>
        </button>
      </div>

      <div className="lt-divider" />

      <button className="lt-logout" onClick={onLogout}>
        <span>تسجيل الخروج</span>
        <span className="lt-logout-ic">
          <LogOut size={22} strokeWidth={2.2} />
        </span>
      </button>
    </section>
  );
}
