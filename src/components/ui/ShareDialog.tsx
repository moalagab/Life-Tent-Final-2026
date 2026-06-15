import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, UserPlus, X, Link2, Users, Eye, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useProjectMembers,
  useInviteProjectMember,
  useRemoveProjectMember,
  ProjectMember,
} from '@/hooks/useProjectSharing';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  projectName?: string;
}

const ROLES = [
  { value: 'viewer', label: 'مشاهد', icon: Eye, description: 'يمكنه المشاهدة فقط' },
  { value: 'editor', label: 'محرر', icon: Edit2, description: 'يمكنه التعديل والإضافة' },
] as const;

export function ShareDialog({ open, onOpenChange, projectId, projectName }: ShareDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');

  const { data: members, isLoading } = useProjectMembers(projectId);
  const invite = useInviteProjectMember(projectId);
  const remove = useRemoveProjectMember(projectId);

  const handleInvite = async () => {
    if (!email.trim() || !email.includes('@')) return;
    await invite.mutateAsync({ email, role });
    setEmail('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleInvite();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            مشاركة المشروع
          </DialogTitle>
          {projectName && (
            <DialogDescription>{projectName}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Invite Input */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">دعوة شخص جديد</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="البريد الإلكتروني..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                dir="ltr"
                className="flex-1 h-10"
                disabled={invite.isPending}
              />
              <Select value={role} onValueChange={(v) => setRole(v as 'viewer' | 'editor')}>
                <SelectTrigger className="w-28 h-10 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex items-center gap-1.5">
                        <r.icon className="w-3.5 h-3.5" />
                        {r.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-10 gap-1.5 shrink-0"
                onClick={handleInvite}
                disabled={invite.isPending || !email.trim()}
              >
                {invite.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                دعوة
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {ROLES.find(r => r.value === role)?.description}
            </p>
          </div>

          {/* Members List */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
              الأعضاء الحاليون
              {members && members.length > 0 && (
                <Badge variant="secondary" className="text-xs">{members.length}</Badge>
              )}
            </p>

            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : members && members.length > 0 ? (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {members.map((member: ProjectMember) => {
                  const initials = member.user_id.slice(0, 2).toUpperCase();
                  const roleInfo = ROLES.find(r => r.value === member.role);
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30"
                    >
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-mono truncate" dir="ltr">
                          {member.user_id}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {roleInfo && <roleInfo.icon className="w-3 h-3 text-muted-foreground" />}
                          <span className="text-xs text-muted-foreground">{roleInfo?.label}</span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs shrink-0',
                          member.role === 'editor' ? 'border-primary/40 text-primary' : 'border-border',
                        )}
                      >
                        {roleInfo?.label}
                      </Badge>
                      <button
                        onClick={() => remove.mutate(member.user_id)}
                        disabled={remove.isPending}
                        className="text-muted-foreground/60 hover:text-destructive transition-colors p-1"
                      >
                        {remove.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">لم تتم مشاركة هذا المشروع بعد</p>
              </div>
            )}
          </div>

          {/* Copy Link hint */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/20 border border-border/50">
            <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground flex-1">
              المشاركة تتطلب أن يكون المستخدم مسجلاً في النظام
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
