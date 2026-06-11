import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { User, Bell, Globe, Shield, Palette, Database, ChevronDown, ChevronUp, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { DataSyncSettings } from '@/components/settings/DataSyncSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { LanguageSettings } from '@/components/settings/LanguageSettings';

type SectionId = 'profile' | 'notifications' | 'language' | 'appearance' | 'privacy' | 'data';

export default function Settings() {
  const { t } = useLanguage();
  const [expandedSection, setExpandedSection] = useState<SectionId | null>('profile');

  const settingsSections: { id: SectionId; label: string; icon: typeof User; description: string; gradient: string }[] = [
    { 
      id: 'profile', 
      label: t('settings.profile'), 
      icon: User, 
      description: t('settings.profileDesc'),
      gradient: 'from-blue-500/20 to-cyan-500/20'
    },
    { 
      id: 'notifications', 
      label: t('settings.notifications'), 
      icon: Bell, 
      description: t('settings.notificationsDesc'),
      gradient: 'from-primary/20/20 to-orange-500/20'
    },
    { 
      id: 'language', 
      label: t('settings.language'), 
      icon: Globe, 
      description: t('settings.languageDesc'),
      gradient: 'from-emerald-500/20 to-teal-500/20'
    },
    { 
      id: 'appearance', 
      label: t('settings.appearance'), 
      icon: Palette, 
      description: t('settings.appearanceDesc'),
      gradient: 'from-purple-500/20 to-pink-500/20'
    },
    { 
      id: 'privacy', 
      label: t('settings.privacy'), 
      icon: Shield, 
      description: t('settings.privacyDesc'),
      gradient: 'from-red-500/20 to-rose-500/20'
    },
    { 
      id: 'data', 
      label: t('settings.dataSync'), 
      icon: Database, 
      description: t('settings.dataSyncDesc'),
      gradient: 'from-indigo-500/20 to-violet-500/20'
    },
  ];

  const toggleSection = (id: SectionId) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const renderSectionContent = (id: SectionId) => {
    switch (id) {
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'language':
        return <LanguageSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'data':
        return <DataSyncSettings />;
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-sm">
            <SettingsIcon className="w-5 h-5 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">{t('settings.title')}</h1>
            <p className="text-[11px] text-muted-foreground">{t('settings.subtitle')}</p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {settingsSections.map((section, index) => (
            <div 
              key={section.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div 
                className={cn(
                  "glass-card overflow-hidden transition-all duration-300",
                  expandedSection === section.id && "ring-2 ring-primary/20"
                )}
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={expandedSection === section.id}
                  aria-controls={`settings-section-${section.id}`}
                  className="w-full p-5 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                    section.gradient
                  )}>
                    <section.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="flex-1 text-start">
                    <h3 className="font-semibold text-foreground">
                      {section.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <div className={cn(
                    "w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center transition-transform duration-300",
                    expandedSection === section.id && "rotate-180"
                  )}>
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>

                {/* Section Content */}
                <div
                  id={`settings-section-${section.id}`}
                  role="region"
                  aria-labelledby={`settings-btn-${section.id}`}
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    expandedSection === section.id ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="p-5 pt-0 border-t border-border/50">
                    <div className="pt-5">
                      {renderSectionContent(section.id)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center py-6 border-t border-border/50">
          <p className="text-sm font-medium text-foreground">{t('settings.version')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('settings.madeWith')}</p>
        </div>
      </div>
    </MainLayout>
  );
}
