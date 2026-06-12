/**
 * ShareProjectSheet — invite collaborators to a project by email.
 *
 * Usage:
 *   <ShareProjectSheet projectId={project.id} projectTitle={project.title} />
 *
 * The trigger button can be any element — wrap it with <ShareProjectSheet> and
 * pass the project's id/title.
 */
import { useState } from 'react';
import { Users, UserPlus, Trash2, Crown, Eye, Pen, Loader2, Share2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useProjectMembers, useInviteProjectMember, useRemoveProjectMember,
} from '@/hooks/useProjectSharing';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface Props {
  projectId:    string;
  projectTitle: string;
  /** Optional trigger element — defaults to a Share button */
  trigger?:     React.ReactNode;
}

const ROLE_ICONS = {
  editor: <Pen className="w-3 h-3" />,
  viewer: <Eye className="w-3 h-3" />,
};

export function ShareProjectSheet({ projectId, projectTitle, trigger }: Props) {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  const [email, setEmail]     = useState('');
  const [role,  setRole]      = useState<'editor' | 'viewer'>('viewer');
  const [open,  setOpen]      = useState(false);

  const { data: members = [], isLoading }           = useProjectMembers(open ? projectId : undefined);
  const { mutateAsync: invite,  isPending: inviting } = useInviteProjectMember(projectId);
  const { mutateAsync: remove,  isPending: removing } = useRemoveProjectMember(projectId);

  const handleInvite = async () => {
    if (!email.trim()) return;
    await invite({ email, role });
    setEmail('');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
            {isAr ? 'مشاركة' : 'Share'}
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] flex flex-col">
        <SheetHeader className="shrink-0 pb-3">
          <SheetTitle className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-primary" />
            {isAr ? `مشاركة "${projectTitle}"` : `Share "${projectTitle}"`}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pb-6">

          {/* ── Invite form ── */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {isAr ? 'دعوة عبر البريد الإلكتروني' : 'Invite by email'}
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder={isAr ? 'البريد الإلكتروني…' : 'Email address…'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleInvite(); }}
                className="flex-1"
                dir="ltr"
              />
              <Select value={role} onValueChange={(v) => setRole(v as 'editor' | 'viewer')}>
                <SelectTrigger className="w-28 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      {isAr ? 'مشاهدة' : 'Viewer'}
                    </span>
                  </SelectItem>
                  <SelectItem value="editor">
                    <span className="flex items-center gap-1.5">
                      <Pen className="w-3.5 h-3.5" />
                      {isAr ? 'تحرير' : 'Editor'}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleInvite}
                disabled={!email.trim() || inviting}
                size="icon"
                className="shrink-0"
                aria-label={isAr ? 'دعوة' : 'Invite'}
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* ── Members list ── */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {isAr ? 'الأعضاء الحاليون' : 'Current members'}
            </p>

            {/* Owner row (always at top) */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/40">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Crown className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {isAr ? 'أنت (المالك)' : 'You (Owner)'}
                </p>
              </div>
            </div>

            {isLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {members.map(member => (
              <div key={member.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate font-mono text-xs">
                    {member.user_id.slice(0, 8)}…
                  </p>
                </div>
                <span className={cn(
                  'flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full',
                  member.role === 'editor'
                    ? 'bg-blue-500/15 text-blue-500'
                    : 'bg-muted text-muted-foreground',
                )}>
                  {ROLE_ICONS[member.role]}
                  {isAr
                    ? (member.role === 'editor' ? 'محرر' : 'مشاهد')
                    : (member.role === 'editor' ? 'Editor' : 'Viewer')}
                </span>
                {/* Only owner can remove (user_id check) */}
                {member.user_id !== user?.id && (
                  <button
                    onClick={() => remove(member.user_id)}
                    disabled={removing}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label={isAr ? 'إزالة' : 'Remove'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {!isLoading && members.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isAr ? 'لا يوجد أعضاء بعد' : 'No members yet'}
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
