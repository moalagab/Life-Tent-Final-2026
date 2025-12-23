import { Calendar, Clock, MapPin, Video, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  time: string;
  type: 'meeting' | 'task' | 'bill' | 'prayer';
  location?: string;
  isVirtual?: boolean;
}

const mockEvents: Event[] = [
  { id: '1', title: 'Team Standup', time: '10:00 AM', type: 'meeting', isVirtual: true },
  { id: '2', title: 'Dhuhr Prayer', time: '12:14 PM', type: 'prayer' },
  { id: '3', title: 'Client Presentation', time: '2:00 PM', type: 'meeting', location: 'Conference Room A' },
  { id: '4', title: 'Netflix Subscription', time: 'Today', type: 'bill' },
];

const typeConfig = {
  meeting: { icon: Video, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  task: { icon: Calendar, color: 'bg-primary/10 text-primary border-primary/20' },
  bill: { icon: CreditCard, color: 'bg-destructive/10 text-destructive border-destructive/20' },
  prayer: { icon: Clock, color: 'bg-success/10 text-success border-success/20' },
};

export function UpcomingEvents() {
  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">Upcoming</h3>
        <Calendar className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="space-y-3">
        {mockEvents.map((event) => {
          const TypeIcon = typeConfig[event.type].icon;
          
          return (
            <div
              key={event.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:bg-accent/30',
                typeConfig[event.type].color
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                typeConfig[event.type].color.split(' ')[0]
              )}>
                <TypeIcon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{event.time}</span>
                  {event.location && (
                    <>
                      <span>•</span>
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{event.location}</span>
                    </>
                  )}
                  {event.isVirtual && (
                    <>
                      <span>•</span>
                      <Video className="w-3 h-3" />
                      <span>Virtual</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
