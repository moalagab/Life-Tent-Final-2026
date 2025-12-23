import { MainLayout } from '@/components/layout/MainLayout';
import { 
  Wallet, TrendingUp, TrendingDown, CreditCard, Building2, 
  PiggyBank, ArrowUpRight, ArrowDownRight, Plus, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const currencies = ['SAR', 'USD', 'AED', 'KWD'];

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

const recentTransactions: Transaction[] = [
  { id: '1', description: 'Salary Deposit', amount: 35000, type: 'income', category: 'Income', date: 'Dec 15' },
  { id: '2', description: 'Netflix Subscription', amount: -65, type: 'expense', category: 'Entertainment', date: 'Dec 14' },
  { id: '3', description: 'Grocery Shopping', amount: -450, type: 'expense', category: 'Food', date: 'Dec 14' },
  { id: '4', description: 'Freelance Project', amount: 5000, type: 'income', category: 'Freelance', date: 'Dec 12' },
  { id: '5', description: 'Electricity Bill', amount: -320, type: 'expense', category: 'Utilities', date: 'Dec 10' },
];

const subscriptions = [
  { name: 'Netflix', amount: 65, nextBilling: 'Dec 24', logo: '🎬' },
  { name: 'Spotify', amount: 35, nextBilling: 'Dec 28', logo: '🎵' },
  { name: 'iCloud', amount: 15, nextBilling: 'Jan 2', logo: '☁️' },
  { name: 'Gym Membership', amount: 250, nextBilling: 'Jan 5', logo: '💪' },
];

export default function Finance() {
  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Finance</h1>
            <p className="text-muted-foreground mt-1">Advanced wealth management dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button variant="gold" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Net Worth', value: 'SAR 245,780', change: '+12.5%', trend: 'up', icon: Wallet, color: 'primary' },
          { label: 'Monthly Income', value: 'SAR 42,000', change: '+8.2%', trend: 'up', icon: TrendingUp, color: 'success' },
          { label: 'Monthly Expenses', value: 'SAR 18,420', change: '-5.2%', trend: 'down', icon: TrendingDown, color: 'destructive' },
          { label: 'Savings Rate', value: '56%', change: '+3.1%', trend: 'up', icon: PiggyBank, color: 'primary' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                stat.color === 'primary' && 'bg-primary/10',
                stat.color === 'success' && 'bg-success/10',
                stat.color === 'destructive' && 'bg-destructive/10'
              )}>
                <stat.icon className={cn(
                  'w-5 h-5',
                  stat.color === 'primary' && 'text-primary',
                  stat.color === 'success' && 'text-success',
                  stat.color === 'destructive' && 'text-destructive'
                )} />
              </div>
              <span className={cn(
                'flex items-center gap-1 text-xs font-medium',
                stat.trend === 'up' ? 'text-success' : 'text-destructive'
              )}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
            <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'
                  )}>
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="w-5 h-5 text-success" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.category} • {tx.date}</p>
                  </div>
                </div>
                <span className={cn(
                  'text-sm font-bold',
                  tx.type === 'income' ? 'text-success' : 'text-destructive'
                )}>
                  {tx.type === 'income' ? '+' : ''}{tx.amount.toLocaleString()} SAR
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscriptions */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-foreground">Subscriptions</h3>
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div key={sub.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sub.logo}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">Next: {sub.nextBilling}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {sub.amount} SAR
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monthly Total</span>
              <span className="font-bold gold-text">
                {subscriptions.reduce((acc, s) => acc + s.amount, 0)} SAR
              </span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
