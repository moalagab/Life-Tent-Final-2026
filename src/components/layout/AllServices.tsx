/**
 * AllServices — All Services screen
 */
import {
  BookOpen, Calendar, Repeat, CheckSquare, Timer, Film,
  Target, FolderKanban, Wallet, User, Settings, LogOut, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type React from 'react';
import { useLanguage } from '@/hooks/useLanguage';

interface Module {
  id: string;
  path: string;
  labelAr: string;
  labelEn: string;
  Icon: LucideIcon;
  hue: string;
}

const MODULES: Module[] = [
  { id: 'knowledge', path: '/knowledge', labelAr: 'المعرفة',   labelEn: 'Knowledge', Icon: BookOpen,    hue: 'var(--lt-hue-know)'   },
  { id: 'calendar',  path: '/calendar',  labelAr: 'التقويم',   labelEn: 'Calendar',  Icon: Calendar,    hue: 'var(--lt-hue-cal)'    },
  { id: 'habits',    path: '/habits',    labelAr: 'العادات',   labelEn: 'Habits',    Icon: Repeat,      hue: 'var(--lt-hue-habit)'  },
  { id: 'tasks',     path: '/tasks',     labelAr: 'المهام',    labelEn: 'Tasks',     Icon: CheckSquare, hue: 'var(--lt-hue-task)'   },
  { id: 'pomodoro',  path: '/pomodoro',  labelAr: 'بومودورو',  labelEn: 'Pomodoro',  Icon: Timer,       hue: 'var(--lt-hue-pomo)'   },
  { id: 'studio',    path: '/studio',    labelAr: 'الاستوديو', labelEn: 'Studio',    Icon: Film,        hue: 'var(--lt-hue-studio)' },
  { id: 'goals',     path: '/goals',     labelAr: 'الأهداف',   labelEn: 'Goals',     Icon: Target,      hue: 'var(--lt-hue-goal)'   },
  { id: 'projects',  path: '/projects',  labelAr: 'المشاريع',  labelEn: 'Projects',  Icon: FolderKanban,hue: 'var(--lt-hue-proj)'   },
  { id: 'finance',   path: '/finance',   labelAr: 'المالية',   labelEn: 'Finance',   Icon: Wallet,      hue: 'var(--lt-hue-money)'  },
];

interface Props {
  activeIds?: Set<string>;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function AllServices({ activeIds, onClose, onNavigate, onLogout }: Props) {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  const visibleModules = activeIds
    ? MODULES.filter(m => activeIds.has(m.id))
    : MODULES;

  return (
    <section className="lt-sheet" dir={isAr ? 'rtl' : 'ltr'} aria-label={isAr ? 'جميع الخدمات' : 'All Services'}>
      <div className="lt-grabber" />

      <header className="lt-head">
        <button className="lt-close" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Close'}>
          <X size={22} strokeWidth={2} />
        </button>
        <div className="lt-titles">
          <h1>{isAr ? 'جميع الخدمات' : 'All Services'}</h1>
          <p>
            <span className="lt-num">{visibleModules.length}</span> {isAr ? 'وحدة نشطة' : 'active modules'}
          </p>
        </div>
      </header>

      <div className="lt-grid">
        {visibleModules.map(({ id, path, labelAr, labelEn, Icon }) => (
          <button
            key={id}
            className="lt-mod"
            onClick={() => onNavigate(path)}
          >
            <span className="lt-ic">
              <Icon size={26} strokeWidth={2} />
            </span>
            <span className="lt-mod-label">{isAr ? labelAr : labelEn}</span>
          </button>
        ))}
      </div>

      <div className="lt-acc-label">{isAr ? 'الحساب' : 'Account'}</div>
      <div className="lt-acc-row">
        <button
          className="lt-acc"
          onClick={() => onNavigate('/profile')}
        >
          <span className="lt-acc-ic">
            <User size={21} strokeWidth={2} />
          </span>
          <b>{isAr ? 'ملفي الشخصي' : 'My Profile'}</b>
        </button>
        <button
          className="lt-acc"
          onClick={() => onNavigate('/settings')}
        >
          <span className="lt-acc-ic">
            <Settings size={21} strokeWidth={2} />
          </span>
          <b>{isAr ? 'الإعدادات' : 'Settings'}</b>
        </button>
      </div>

      <div className="lt-divider" />

      <button className="lt-logout" onClick={onLogout}>
        <span>{isAr ? 'تسجيل الخروج' : 'Sign out'}</span>
        <span className="lt-logout-ic">
          <LogOut size={22} strokeWidth={2.2} />
        </span>
      </button>
    </section>
  );
}
