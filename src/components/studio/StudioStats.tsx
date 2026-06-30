import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  BookOpen, Film, TrendingUp, Award, Calendar, Mic2, Star,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useMediaItems } from '@/hooks/useMedia';
import { cn } from '@/lib/utils';

const PIE_COLORS = [
  'hsl(var(--primary))',
  '#f43f5e',
  '#f97316',
  '#8b5cf6',
  '#10b981',
];

export function StudioStats() {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const { data: mediaItems } = useMediaItems();

  const stats = useMemo(() => {
    if (!mediaItems) return null;
    const year = new Date().getFullYear();

    const monthlyBooks  = Array(12).fill(0);
    const monthlyMovies = Array(12).fill(0);

    mediaItems.forEach(item => {
      if (item.status === 'completed' && item.end_date) {
        const d = new Date(item.end_date);
        if (d.getFullYear() === year) {
          const m = d.getMonth();
          if (item.type === 'book') monthlyBooks[m]++;
          else if (item.type === 'movie' || item.type === 'series') monthlyMovies[m]++;
        }
      }
    });

    const genreCount: Record<string, number> = {};
    mediaItems.forEach(item => {
      const g = item.genre || (isAr ? 'غير مصنف' : 'Uncategorized');
      genreCount[g] = (genreCount[g] || 0) + 1;
    });
    const genreData = Object.entries(genreCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const statusCount = { completed: 0, in_progress: 0, want: 0 };
    mediaItems.forEach(item => {
      if (item.status && item.status in statusCount)
        statusCount[item.status as keyof typeof statusCount]++;
    });

    const ratedItems = mediaItems.filter(i => i.rating && i.rating > 0);
    const avgRating = ratedItems.length
      ? ratedItems.reduce((acc, i) => acc + (i.rating || 0), 0) / ratedItems.length
      : 0;

    const months = isAr
      ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    return {
      totalBooks:   mediaItems.filter(i => i.type === 'book').length,
      totalMovies:  mediaItems.filter(i => ['movie','series'].includes(i.type)).length,
      totalPodcasts:mediaItems.filter(i => ['podcast','article'].includes(i.type)).length,
      completedThisYear: mediaItems.filter(i =>
        i.status === 'completed' && i.end_date &&
        new Date(i.end_date).getFullYear() === year
      ).length,
      avgRating,
      chartData: months.map((month, i) => ({
        month, books: monthlyBooks[i], movies: monthlyMovies[i],
      })),
      genreData,
      statusCount,
      total: mediaItems.length,
    };
  }, [mediaItems, isAr]);

  if (!stats) return null;

  const total = Object.values(stats.statusCount).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          icon={BookOpen}
          value={stats.totalBooks}
          label={isAr ? 'كتب' : 'Books'}
          iconCls="text-blue-500"
          bgCls="bg-blue-500/12"
        />
        <KpiCard
          icon={Film}
          value={stats.totalMovies}
          label={isAr ? 'أفلام ومسلسلات' : 'Movies & Series'}
          iconCls="text-rose-500"
          bgCls="bg-rose-500/12"
        />
        <KpiCard
          icon={Mic2}
          value={stats.totalPodcasts}
          label={isAr ? 'بودكاست ومقالات' : 'Podcasts & Articles'}
          iconCls="text-violet-500"
          bgCls="bg-violet-500/12"
        />
        <KpiCard
          icon={TrendingUp}
          value={stats.completedThisYear}
          label={isAr ? 'مكتمل هذا العام' : 'Done This Year'}
          iconCls="text-green-500"
          bgCls="bg-green-500/12"
        />
      </div>

      {/* ── Status overview ── */}
      <div className="rounded-2xl border border-border/50 bg-card/60 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          {isAr ? 'توزيع الحالة' : 'Status Breakdown'}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <StatusPill
            label={isAr ? 'مكتمل' : 'Completed'}
            value={stats.statusCount.completed}
            total={total}
            color="bg-green-500"
            textColor="text-green-600"
          />
          <StatusPill
            label={isAr ? 'جاري' : 'In Progress'}
            value={stats.statusCount.in_progress}
            total={total}
            color="bg-blue-500"
            textColor="text-blue-600"
          />
          <StatusPill
            label={isAr ? 'لاحقًا' : 'Want to'}
            value={stats.statusCount.want}
            total={total}
            color="bg-amber-500"
            textColor="text-amber-600"
          />
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Monthly progress */}
        <div className="rounded-2xl border border-border/50 bg-card/60 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-primary/12 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {isAr ? 'التقدم الشهري' : 'Monthly Progress'}
            </h3>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBooks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gMovies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '10px',
                    fontSize: '11px',
                  }}
                />
                <Area type="monotone" dataKey="books" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#gBooks)" name={isAr ? 'كتب' : 'Books'} />
                <Area type="monotone" dataKey="movies" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#gMovies)" name={isAr ? 'أفلام' : 'Movies'} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-5 mt-2">
            <Legend color="hsl(var(--primary))" label={isAr ? 'كتب' : 'Books'} />
            <Legend color="#f43f5e" label={isAr ? 'أفلام' : 'Movies'} />
          </div>
        </div>

        {/* Genre distribution */}
        <div className="rounded-2xl border border-border/50 bg-card/60 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-violet-500/12 flex items-center justify-center">
              <Award className="w-4 h-4 text-violet-500" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {isAr ? 'التصنيفات' : 'Genres'}
            </h3>
          </div>

          {stats.genreData.length > 0 ? (
            <>
              <div className="h-36 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.genreData}
                      cx="50%" cy="50%"
                      innerRadius={36} outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {stats.genreData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '10px',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {stats.genreData.map((g, i) => (
                  <div key={g.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-[10px] text-muted-foreground">{g.name} ({g.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-36 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">{isAr ? 'لا توجد بيانات' : 'No data yet'}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Average rating ── */}
      {stats.avgRating > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card/60 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/12 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500/30" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.avgRating.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">{isAr ? 'متوسط التقييم من 5 نجوم' : 'Average rating out of 5'}</p>
          </div>
          <div className="flex items-center gap-0.5 ms-auto">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn('w-4 h-4', i < Math.round(stats.avgRating) ? 'text-amber-400 fill-amber-400' : 'text-muted/50')}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */
function KpiCard({
  icon: Icon, value, label, iconCls, bgCls,
}: {
  icon: React.ElementType; value: number; label: string; iconCls: string; bgCls: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-4">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', bgCls)}>
        <Icon className={cn('w-4.5 h-4.5', iconCls)} strokeWidth={1.8} />
      </div>
      <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{label}</p>
    </div>
  );
}

function StatusPill({
  label, value, total, color, textColor,
}: {
  label: string; value: number; total: number; color: string; textColor: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="rounded-xl bg-muted/40 p-3 text-center">
      <p className={cn('text-xl font-bold leading-none', textColor)}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1 mb-2">{label}</p>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[9px] text-muted-foreground/60 mt-1">{pct}%</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
