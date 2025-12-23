import { Plus, FileText, Target, Wallet, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const actions = [
  { icon: Plus, label: 'New Task', color: 'bg-primary/10 text-primary hover:bg-primary/20' },
  { icon: FileText, label: 'Quick Note', color: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' },
  { icon: Target, label: 'Add Goal', color: 'bg-success/10 text-success hover:bg-success/20' },
  { icon: Wallet, label: 'Log Expense', color: 'bg-destructive/10 text-destructive hover:bg-destructive/20' },
  { icon: Calendar, label: 'Schedule', color: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20' },
  { icon: Sparkles, label: 'AI Assist', color: 'bg-gradient-gold text-primary-foreground hover:shadow-gold-glow' },
];

export function QuickActions() {
  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ${action.color}`}
          >
            <action.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
