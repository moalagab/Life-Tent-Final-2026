/**
 * RelationEditor — Dialog to add/remove/update relations for an entity.
 *
 * Features:
 *  - Search across all entity types (tasks, projects, goals, areas, habits, resources)
 *  - Select relation type (contributes_to / blocks / depends_on / parent_of / child_of)
 *  - Set weight (1 = strong, 0.1 = weak) via slider
 *  - List & delete existing relations
 *  - Inline weight update
 */
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Trash2, Search, Loader2, ArrowRight, ArrowLeft, Weight } from 'lucide-react';
import {
  EntityRelation, EntityType, RelationType,
  ENTITY_CFG, RELATION_CFG,
  useEntitySearch, useCreateRelation, useDeleteRelation, useUpdateRelationWeight,
  splitRelations,
} from '@/hooks/useEntityRelations';

// ── Relation type selector ─────────────────────────────────────────────────────

const RELATION_OPTIONS: { value: RelationType; labelAr: string; labelEn: string; color: string }[] = [
  { value: 'contributes_to', labelAr: 'يساهم في',   labelEn: 'Contributes to', color: '#22c55e' },
  { value: 'blocks',         labelAr: 'يحجب',       labelEn: 'Blocks',         color: '#ef4444' },
  { value: 'depends_on',     labelAr: 'يعتمد على',  labelEn: 'Depends on',     color: '#f59e0b' },
  { value: 'parent_of',      labelAr: 'أصل لـ',     labelEn: 'Parent of',      color: '#6366f1' },
  { value: 'child_of',       labelAr: 'فرع من',     labelEn: 'Child of',       color: '#8b5cf6' },
];

// ── Relation list item ─────────────────────────────────────────────────────────

interface RelationItemProps {
  relation:   EntityRelation;
  entityId:   string;
  isAr:       boolean;
}

function RelationItem({ relation, entityId, isAr }: RelationItemProps) {
  const deleteRel    = useDeleteRelation();
  const updateWeight = useUpdateRelationWeight();
  const [w, setW]    = useState(relation.weight);

  const isOutgoing = relation.source_id === entityId;
  const rcfg = RELATION_CFG[relation.relation_type];
  const connectedLabel = isOutgoing ? relation.target_label : relation.source_label;
  const connectedType  = isOutgoing ? relation.target_type  : relation.source_type;
  const ecfg = ENTITY_CFG[connectedType] ?? ENTITY_CFG.task;

  const handleDelete = () => {
    deleteRel.mutate(
      { id: relation.id, sourceId: relation.source_id, targetId: relation.target_id },
      { onSuccess: () => toast(isAr ? 'تم حذف العلاقة' : 'Relation removed') },
    );
  };

  const handleWeightChange = (val: number[]) => {
    const nw = val[0];
    setW(nw);
    updateWeight.mutate({
      id: relation.id, weight: nw,
      sourceId: relation.source_id, targetId: relation.target_id,
    });
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/30 border border-border/40">
      <div className="flex items-center gap-2">
        {/* Direction indicator */}
        <div
          className="shrink-0 p-1 rounded-lg"
          style={{ background: `${rcfg?.color}18` }}
        >
          {isOutgoing
            ? <ArrowRight className="w-3 h-3" style={{ color: rcfg?.color }} />
            : <ArrowLeft  className="w-3 h-3" style={{ color: rcfg?.color }} />}
        </div>

        {/* Relation type badge */}
        <Badge
          variant="outline"
          className="text-[10px] px-2 py-0.5 border"
          style={{ color: rcfg?.color, borderColor: `${rcfg?.color}40` }}
        >
          {isAr ? rcfg?.labelAr : rcfg?.labelEn}
        </Badge>

        {/* Connected entity */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${ecfg.color}18`, color: ecfg.color }}
          >
            {isAr ? ecfg.labelAr : ecfg.labelEn}
          </span>
          <span className="text-xs font-medium truncate">{connectedLabel}</span>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleteRel.isPending}
          className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          {deleteRel.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
        </button>
      </div>

      {/* Weight slider */}
      <div className="flex items-center gap-2 px-1">
        <Weight className="w-3 h-3 text-muted-foreground shrink-0" />
        <Slider
          min={0.1} max={1} step={0.1}
          value={[w]}
          onValueChange={handleWeightChange}
          className="flex-1"
        />
        <span className="text-[10px] font-mono text-muted-foreground w-6 text-end">{w.toFixed(1)}</span>
      </div>
    </div>
  );
}

// ── Main dialog ────────────────────────────────────────────────────────────────

interface RelationEditorProps {
  open:        boolean;
  onOpenChange: (v: boolean) => void;
  entityId:    string;
  entityType:  EntityType;
  entityLabel: string;
  relations:   EntityRelation[];
  isAr?:       boolean;
}

export function RelationEditor({
  open, onOpenChange,
  entityId, entityType, entityLabel,
  relations,
  isAr = true,
}: RelationEditorProps) {
  const [query,        setQuery]        = useState('');
  const [relationType, setRelationType] = useState<RelationType>('contributes_to');
  const [weight,       setWeight]       = useState(1.0);

  const { data: searchResults = [], isLoading: searching } = useEntitySearch(query);
  const createRel = useCreateRelation();

  const { outgoing, incoming } = splitRelations(entityId, relations);

  const handleCreate = (target: { id: string; type: EntityType; title: string }) => {
    createRel.mutate(
      {
        source_id:    entityId,
        source_type:  entityType,
        source_label: entityLabel,
        target_id:    target.id,
        target_type:  target.type,
        target_label: target.title,
        relation_type: relationType,
        weight,
      },
      {
        onSuccess: () => {
          toast(isAr ? 'تم إنشاء العلاقة' : 'Relation created');
          setQuery('');
        },
        onError: (e: Error) => {
          if (e.message?.includes('unique') || e.message?.includes('duplicate')) {
            toast.error(isAr ? 'هذه العلاقة موجودة بالفعل' : 'Relation already exists');
          } else {
            toast.error(e.message);
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: `${ENTITY_CFG[entityType]?.color}20` }}
            >
              <span className="text-xs font-black" style={{ color: ENTITY_CFG[entityType]?.color }}>R</span>
            </div>
            {isAr ? 'إدارة العلاقات' : 'Manage Relations'}
            <span className="text-xs text-muted-foreground font-normal ms-1">— {entityLabel}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pe-1">
          <div className="space-y-5 pt-1">

            {/* ── Add new relation ── */}
            <section className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {isAr ? 'إضافة علاقة جديدة' : 'Add new relation'}
              </p>

              {/* Relation type select */}
              <Select value={relationType} onValueChange={v => setRelationType(v as RelationType)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATION_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: o.color }} />
                        {isAr ? o.labelAr : o.labelEn}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Weight */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12">{isAr ? 'القوة' : 'Weight'}</span>
                <Slider
                  min={0.1} max={1} step={0.1}
                  value={[weight]}
                  onValueChange={v => setWeight(v[0])}
                  className="flex-1"
                />
                <span className="text-xs font-mono text-muted-foreground w-8 text-end">{weight.toFixed(1)}</span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder={isAr ? 'ابحث عن مهمة، هدف، مشروع...' : 'Search task, goal, project...'}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="ps-9 h-9 text-sm"
                />
              </div>

              {/* Results */}
              {searching && (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {searchResults
                    .filter(r => r.id !== entityId)
                    .map(result => {
                      const ecfg = ENTITY_CFG[result.type];
                      const alreadyLinked = relations.some(
                        r => (r.source_id === result.id || r.target_id === result.id) &&
                             r.relation_type === relationType,
                      );
                      return (
                        <button
                          key={result.id}
                          disabled={createRel.isPending || alreadyLinked}
                          onClick={() => handleCreate({ id: result.id, type: result.type, title: result.title })}
                          className={cn(
                            'w-full flex items-center gap-2.5 p-2.5 rounded-xl text-start',
                            'transition-colors border border-transparent',
                            alreadyLinked
                              ? 'opacity-40 cursor-not-allowed bg-muted/20'
                              : 'hover:bg-muted/40 hover:border-border/50',
                          )}
                        >
                          <span
                            className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: `${ecfg?.color}18`, color: ecfg?.color }}
                          >
                            {isAr ? ecfg?.labelAr : ecfg?.labelEn}
                          </span>
                          <span className="text-sm font-medium flex-1 truncate">{result.title}</span>
                          {result.subtitle && (
                            <span className="text-[10px] text-muted-foreground shrink-0">{result.subtitle}</span>
                          )}
                          {alreadyLinked && (
                            <Badge variant="outline" className="text-[9px] shrink-0">
                              {isAr ? 'مرتبط' : 'linked'}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                </div>
              )}
            </section>

            {/* ── Existing relations ── */}
            {relations.length > 0 && (
              <>
                <Separator />
                <section className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {isAr ? 'العلاقات الحالية' : 'Current relations'}
                    <span className="ms-2 font-normal normal-case">({relations.length})</span>
                  </p>

                  {outgoing.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        {isAr ? 'صادرة' : 'Outgoing'}
                      </p>
                      {outgoing.map(r => (
                        <RelationItem key={r.id} relation={r} entityId={entityId} isAr={isAr} />
                      ))}
                    </div>
                  )}

                  {incoming.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <ArrowLeft className="w-3 h-3" />
                        {isAr ? 'واردة' : 'Incoming'}
                      </p>
                      {incoming.map(r => (
                        <RelationItem key={r.id} relation={r} entityId={entityId} isAr={isAr} />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {isAr ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
