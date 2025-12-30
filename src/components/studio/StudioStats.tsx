import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, Film, TrendingUp, Award, Calendar } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useMediaItems } from '@/hooks/useMedia';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function StudioStats() {
  const { currentLanguage } = useLanguage();
  const { data: mediaItems } = useMediaItems();

  const stats = useMemo(() => {
    if (!mediaItems) return null;

    const currentYear = new Date().getFullYear();
    
    // Books completed by month
    const monthlyBooks = Array(12).fill(0);
    const monthlyMovies = Array(12).fill(0);
    
    mediaItems.forEach(item => {
      if (item.status === 'completed' && item.end_date) {
        const endDate = new Date(item.end_date);
        if (endDate.getFullYear() === currentYear) {
          const month = endDate.getMonth();
          if (item.type === 'book') {
            monthlyBooks[month]++;
          } else if (item.type === 'movie' || item.type === 'series') {
            monthlyMovies[month]++;
          }
        }
      }
    });

    // Genre distribution
    const genreCount: Record<string, number> = {};
    mediaItems.forEach(item => {
      const genre = item.genre || (currentLanguage === 'ar' ? 'غير مصنف' : 'Uncategorized');
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });

    const genreData = Object.entries(genreCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Status distribution
    const statusCount = {
      completed: 0,
      in_progress: 0,
      want: 0,
    };

    mediaItems.forEach(item => {
      if (item.status && item.status in statusCount) {
        statusCount[item.status as keyof typeof statusCount]++;
      }
    });

    const months = currentLanguage === 'ar' 
      ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const chartData = months.map((month, index) => ({
      month,
      books: monthlyBooks[index],
      movies: monthlyMovies[index],
    }));

    return {
      totalBooks: mediaItems.filter(i => i.type === 'book').length,
      totalMovies: mediaItems.filter(i => i.type === 'movie' || i.type === 'series').length,
      completedThisYear: mediaItems.filter(i => {
        if (i.status !== 'completed' || !i.end_date) return false;
        return new Date(i.end_date).getFullYear() === currentYear;
      }).length,
      avgRating: mediaItems.filter(i => i.rating).reduce((acc, i) => acc + (i.rating || 0), 0) / 
                 (mediaItems.filter(i => i.rating).length || 1),
      chartData,
      genreData,
      statusCount,
    };
  }, [mediaItems, currentLanguage]);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          value={stats.totalBooks}
          label={currentLanguage === 'ar' ? 'كتب' : 'Books'}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <StatCard
          icon={Film}
          value={stats.totalMovies}
          label={currentLanguage === 'ar' ? 'أفلام ومسلسلات' : 'Movies & Series'}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={TrendingUp}
          value={stats.completedThisYear}
          label={currentLanguage === 'ar' ? 'مكتمل هذا العام' : 'Completed This Year'}
          color="text-green-500"
          bg="bg-green-500/10"
        />
        <StatCard
          icon={Award}
          value={stats.avgRating.toFixed(1)}
          label={currentLanguage === 'ar' ? 'متوسط التقييم' : 'Avg Rating'}
          color="text-purple-500"
          bg="bg-purple-500/10"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Progress Chart */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              {currentLanguage === 'ar' ? 'التقدم الشهري' : 'Monthly Progress'}
            </h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorBooks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMovies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="books" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorBooks)"
                  name={currentLanguage === 'ar' ? 'كتب' : 'Books'}
                />
                <Area 
                  type="monotone" 
                  dataKey="movies" 
                  stroke="hsl(var(--chart-2))" 
                  fillOpacity={1} 
                  fill="url(#colorMovies)"
                  name={currentLanguage === 'ar' ? 'أفلام' : 'Movies'}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">
                {currentLanguage === 'ar' ? 'كتب' : 'Books'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(var(--chart-2))]" />
              <span className="text-xs text-muted-foreground">
                {currentLanguage === 'ar' ? 'أفلام' : 'Movies'}
              </span>
            </div>
          </div>
        </div>

        {/* Genre Distribution */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">
            {currentLanguage === 'ar' ? 'توزيع التصنيفات' : 'Genre Distribution'}
          </h3>
          <div className="h-48 flex items-center justify-center">
            {stats.genreData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.genreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.genreData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">
                {currentLanguage === 'ar' ? 'لا توجد بيانات' : 'No data'}
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {stats.genreData.slice(0, 4).map((genre, index) => (
              <div key={genre.name} className="flex items-center gap-1.5">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-muted-foreground">{genre.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-foreground mb-4">
          {currentLanguage === 'ar' ? 'نظرة عامة على الحالة' : 'Status Overview'}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <StatusBar 
            label={currentLanguage === 'ar' ? 'مكتمل' : 'Completed'}
            value={stats.statusCount.completed}
            total={Object.values(stats.statusCount).reduce((a, b) => a + b, 0)}
            color="bg-green-500"
          />
          <StatusBar 
            label={currentLanguage === 'ar' ? 'قيد القراءة' : 'In Progress'}
            value={stats.statusCount.in_progress}
            total={Object.values(stats.statusCount).reduce((a, b) => a + b, 0)}
            color="bg-blue-500"
          />
          <StatusBar 
            label={currentLanguage === 'ar' ? 'أريد قراءته' : 'Want to Read'}
            value={stats.statusCount.want}
            total={Object.values(stats.statusCount).reduce((a, b) => a + b, 0)}
            color="bg-amber-500"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  color, 
  bg 
}: { 
  icon: React.ElementType; 
  value: number | string; 
  label: string; 
  color: string; 
  bg: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', bg)}>
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusBar({ 
  label, 
  value, 
  total, 
  color 
}: { 
  label: string; 
  value: number; 
  total: number; 
  color: string;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
