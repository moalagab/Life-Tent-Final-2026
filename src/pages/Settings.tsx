import { MainLayout } from '@/components/layout/MainLayout';
import { User, Bell, Globe, Shield, Palette, Database, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsSections = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Manage your account information' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure alerts and reminders' },
  { id: 'language', label: 'Language & Region', icon: Globe, description: 'Arabic/English, Hijri/Gregorian dates' },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield, description: 'Manage your data and access' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme and display preferences' },
  { id: 'data', label: 'Data & Sync', icon: Database, description: 'Backup and export your data' },
];

export default function Settings() {
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your LIFE TENT preferences</p>
        </div>

        <div className="space-y-4">
          {settingsSections.map((section) => (
            <div
              key={section.id}
              className="glass-card p-5 hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <section.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {section.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* Version Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">LIFE TENT v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">Built with ❤️ for the Middle East</p>
        </div>
      </div>
    </MainLayout>
  );
}
