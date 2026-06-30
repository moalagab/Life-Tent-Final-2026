/**
 * GraphPage — Full system relation graph at /graph
 *
 * Shows ALL entity relations for the current user.
 * Includes filter panel (entity types + relation types) and
 * a sidebar with stats + legend.
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { RelationGraph } from '@/components/graph/RelationGraph';
import { useAllRelations, ENTITY_CFG, RELATION_CFG, EntityType, RelationType } from '@/hooks/useEntityRelations';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Network, ChevronRight, Filter, RotateCcw,
} from 'lucide-react';

// ── Filter types ──────────────────────────────────────────────────────────────

const ALL_ENTITY_TYPES: EntityType[]   = ['task','project','goal','area','habit','resource','note'];
const ALL_RELATION_TYPES: RelationType[] = ['contributes_to','blocks','depends_on','parent_of','child_of'];

// ── Legend item ───────────────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

function LegendLine({ color, dash, label }: { color: string; dash?: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="20" height="8" className="shrink-0">
        <line
          x1="0" y1="4" x2="20" y2="4"
          stroke={color} strokeWidth="2"
          strokeDasharray={dash}
        />
      </svg>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GraphPage() {
  const navigate                = useNavigate();
  const { currentLanguage }     = useLanguage();
  const isAr                    = currentLanguage === 'ar';

  const { data: allRelations = [], isLoading } = useAllRelations();

  const [entityFilter,   setEntityFilter]   = useState<Set<EntityType>>(new Set(ALL_ENTITY_TYPES));
  const [relationFilter, setRelationFilter] = useState<Set<RelationType>>(new Set(ALL_RELATION_TYPES));
  const [showFilters,    setShowFilters]    = useState(false);

  // Apply filters
  const filtered = useMemo(() => {
    return allRelations.filter(r =>
      entityFilter.has(r.source_type) &&
      entityFilter.has(r.target_type) &&
      relationFilter.has(r.relation_type),
    );
  }, [allRelations, entityFilter, relationFilter]);

  const toggleEntity = (t: EntityType) => {
    setEntityFilter(prev => {
      const next = new Set(prev);
      if (next.has(t)) { next.delete(t); } else { next.add(t); }
      return next;
    });
  };

  const toggleRelation = (t: RelationType) => {
    setRelationFilter(prev => {
      const next = new Set(prev);
      if (next.has(t)) { next.delete(t); } else { next.add(t); }
      return next;
    });
  };

  const reset = () => {
    setEntityFilter(new Set(ALL_ENTITY_TYPES));
    setRelationFilter(new Set(ALL_RELATION_TYPES));
  };

  const isFiltered = entityFilter.size < ALL_ENTITY_TYPES.length ||
                     relationFilter.size < ALL_RELATION_TYPES.length;

  // Unique entity + relation counts
  const nodeCount = useMemo(() => {
    const ids = new Set<string>();
    filtered.forEach(r => { ids.add(r.source_id); ids.add(r.target_id); });
    return ids.size;
  }, [filtered]);

  return (
    <MainLayout>
      <div className="space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
              <button onClick={() => navigate('/dashboard')} className="hover:text-foreground transition-colors">
                {isAr ? 'الرئيسية' : 'Home'}
              </button>
              <ChevronRight className="w-3 h-3" />
              <span>{isAr ? 'خريطة العلاقات' : 'Relation Graph'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Network className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-foreground">
                  {isAr ? 'خريطة العلاقات' : 'Relation Graph'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? `${nodeCount} عنصر · ${filtered.length} علاقة`
                    : `${nodeCount} nodes · ${filtered.length} relations`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isFiltered && (
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-muted-foreground">
                <RotateCcw className="w-3.5 h-3.5" />
                {isAr ? 'إعادة ضبط' : 'Reset'}
              </Button>
            )}
            <Button
              variant="outline" size="sm"
              onClick={() => setShowFilters(s => !s)}
              className={showFilters ? 'bg-primary/5 border-primary/30' : ''}
            >
              <Filter className="w-3.5 h-3.5 me-1.5" />
              {isAr ? 'تصفية' : 'Filter'}
              {isFiltered && <Badge className="ms-1.5 h-4 text-[9px] px-1">{(ALL_ENTITY_TYPES.length - entityFilter.size) + (ALL_RELATION_TYPES.length - relationFilter.size)}</Badge>}
            </Button>
          </div>
        </div>

        {/* ── Filters ── */}
        {showFilters && (
          <div className="glass-card p-4 space-y-3">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                {isAr ? 'نوع العنصر' : 'Entity type'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_ENTITY_TYPES.map(t => {
                  const ecfg = ENTITY_CFG[t];
                  const on   = entityFilter.has(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleEntity(t)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                        on ? 'border-transparent' : 'border-border bg-background text-muted-foreground opacity-50'
                      }`}
                      style={on ? { background: `${ecfg.color}18`, color: ecfg.color, borderColor: `${ecfg.color}40` } : {}}
                    >
                      {isAr ? ecfg.labelAr : ecfg.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                {isAr ? 'نوع العلاقة' : 'Relation type'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_RELATION_TYPES.map(t => {
                  const rcfg = RELATION_CFG[t];
                  const on   = relationFilter.has(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleRelation(t)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                        on ? 'border-transparent' : 'border-border bg-background text-muted-foreground opacity-50'
                      }`}
                      style={on ? { background: `${rcfg.color}18`, color: rcfg.color, borderColor: `${rcfg.color}40` } : {}}
                    >
                      {isAr ? rcfg.labelAr : rcfg.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Graph ── */}
        {isLoading ? (
          <Skeleton className="w-full rounded-xl" style={{ height: 560 }} />
        ) : (
          <RelationGraph
            relations={filtered}
            height={560}
          />
        )}

        {/* ── Legend ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-4 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {isAr ? 'العناصر' : 'Entity types'}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_ENTITY_TYPES.map(t => (
                <LegendDot key={t} color={ENTITY_CFG[t].color} label={isAr ? ENTITY_CFG[t].labelAr : ENTITY_CFG[t].labelEn} />
              ))}
            </div>
          </div>
          <div className="glass-card p-4 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {isAr ? 'العلاقات' : 'Relation types'}
            </p>
            <div className="space-y-1.5">
              {ALL_RELATION_TYPES.map(t => (
                <LegendLine
                  key={t}
                  color={RELATION_CFG[t].color}
                  dash={RELATION_CFG[t].dash}
                  label={isAr ? RELATION_CFG[t].labelAr : RELATION_CFG[t].labelEn}
                />
              ))}
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
