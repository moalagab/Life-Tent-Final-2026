/**
 * RelationGraph — ReactFlow-powered entity relation graph.
 *
 * Two modes:
 *   "ego"  (entityId provided) — radial layout, center = focused entity
 *   "full" (no entityId)       — cluster layout, grouped by entity type
 *
 * Edge styles per relation type (contributes_to/blocks/depends_on/parent_of/child_of)
 * Node styles per entity type with icon + color
 */
import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node, Edge, Controls, MiniMap, Background,
  MarkerType, Handle, Position, BackgroundVariant,
  useNodesState, useEdgesState,
  ReactFlowProvider,
  type NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, FolderKanban, Target, BookOpen,
  Repeat, Database, FileText, HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EntityRelation, EntityType, ENTITY_CFG, RELATION_CFG,
} from '@/hooks/useEntityRelations';

// ── Node icons ─────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<EntityType, typeof CheckSquare> = {
  task:     CheckSquare,
  project:  FolderKanban,
  goal:     Target,
  area:     BookOpen,
  habit:    Repeat,
  resource: Database,
  note:     FileText,
};

// ── Custom node ────────────────────────────────────────────────────────────────

interface NodeData {
  label:      string;
  entityType: EntityType;
  route?:     string;
  isCenter?:  boolean;
}

function EntityNode({ data }: NodeProps<NodeData>) {
  const navigate = useNavigate();
  const cfg  = ENTITY_CFG[data.entityType] ?? ENTITY_CFG.task;
  const Icon = TYPE_ICONS[data.entityType] ?? HelpCircle;

  return (
    <div
      onClick={() => data.route && navigate(data.route)}
      title={data.label}
      className={cn(
        'relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2',
        'min-w-[100px] max-w-[160px] text-center cursor-pointer',
        'transition-shadow hover:shadow-lg select-none',
        data.isCenter && 'ring-2 ring-offset-2',
      )}
      style={{
        borderColor:     cfg.color,
        background:      `${cfg.color}18`,
        boxShadow:       data.isCenter ? `0 0 0 3px ${cfg.color}30` : undefined,
        ringColor:       cfg.color,
      }}
    >
      <Handle type="target" position={Position.Top}    style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${cfg.color}25` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
      </div>

      <p className="text-[11px] font-bold leading-tight line-clamp-2" style={{ color: cfg.color }}>
        {data.label}
      </p>
      <span
        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
        style={{ background: `${cfg.color}20`, color: cfg.color }}
      >
        {cfg.labelAr}
      </span>
    </div>
  );
}

const NODE_TYPES = { entity: EntityNode };

// ── Layout algorithms ─────────────────────────────────────────────────────────

function radialLayout(
  centerNode: Node,
  otherNodes: Node[],
  radius = 220,
): Node[] {
  const cx = 400;
  const cy = 280;
  const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);

  const positioned = otherNodes.map((n, i) => ({
    ...n,
    position: {
      x: cx + radius * Math.cos(angleStep * i - Math.PI / 2) - 60,
      y: cy + radius * Math.sin(angleStep * i - Math.PI / 2) - 40,
    },
  }));

  return [{ ...centerNode, position: { x: cx - 60, y: cy - 40 } }, ...positioned];
}

const TYPE_ORDER: EntityType[] = ['goal', 'project', 'area', 'task', 'habit', 'resource', 'note'];

function clusterLayout(nodes: Node[]): Node[] {
  const groups: Record<string, Node[]> = {};
  nodes.forEach(n => {
    const t = (n.data as NodeData).entityType;
    if (!groups[t]) groups[t] = [];
    groups[t].push(n);
  });

  const result: Node[] = [];
  const cols = 3;
  const colW = 300;
  const rowH = 140;
  let col = 0;
  let row = 0;

  TYPE_ORDER.forEach(type => {
    const group = groups[type] ?? [];
    if (group.length === 0) return;
    group.forEach((n, i) => {
      result.push({
        ...n,
        position: {
          x: col * colW + (i % 2) * 140,
          y: row * rowH + Math.floor(i / 2) * rowH,
        },
      });
    });
    col++;
    if (col >= cols) { col = 0; row += Math.ceil(group.length / 2) + 1; }
  });

  return result;
}

// ── Builder ───────────────────────────────────────────────────────────────────

function buildGraph(
  relations: EntityRelation[],
  centerEntityId?: string,
  centerEntityType?: EntityType,
  centerLabel?: string,
): { nodes: Node[]; edges: Edge[] } {
  const nodeMap = new Map<string, Node>();
  const edges: Edge[] = [];

  // Build edges + collect node stubs
  relations.forEach(rel => {
    const srcKey = rel.source_id;
    const tgtKey = rel.target_id;
    const rcfg   = RELATION_CFG[rel.relation_type];

    if (!nodeMap.has(srcKey)) {
      const ecfg = ENTITY_CFG[rel.source_type];
      nodeMap.set(srcKey, {
        id:       srcKey,
        type:     'entity',
        position: { x: 0, y: 0 },
        data: {
          label:      rel.source_label || rel.source_type,
          entityType: rel.source_type,
          isCenter:   srcKey === centerEntityId,
          route:      srcKey !== centerEntityId
            ? `${ecfg?.routePrefix ?? ''}/${srcKey}`
            : undefined,
        },
      });
    }

    if (!nodeMap.has(tgtKey)) {
      const ecfg = ENTITY_CFG[rel.target_type];
      nodeMap.set(tgtKey, {
        id:       tgtKey,
        type:     'entity',
        position: { x: 0, y: 0 },
        data: {
          label:      rel.target_label || rel.target_type,
          entityType: rel.target_type,
          isCenter:   tgtKey === centerEntityId,
          route:      tgtKey !== centerEntityId
            ? `${ecfg?.routePrefix ?? ''}/${tgtKey}`
            : undefined,
        },
      });
    }

    // Stroke width scales with weight (0.1–1 → 1–4px)
    const strokeW = Math.round(1 + (rel.weight ?? 1) * 3);

    edges.push({
      id:       rel.id,
      source:   srcKey,
      target:   tgtKey,
      label:    rcfg?.labelAr ?? rel.relation_type,
      animated: rcfg?.animated ?? false,
      style: {
        stroke:           rcfg?.color ?? '#888',
        strokeWidth:      strokeW,
        strokeDasharray:  rcfg?.dash,
      },
      labelStyle:  { fontSize: 9, fill: rcfg?.color ?? '#888', fontWeight: 700 },
      labelBgStyle: { fill: 'var(--background,#fff)', fillOpacity: 0.85 },
      markerEnd: {
        type:      MarkerType.ArrowClosed,
        color:     rcfg?.color ?? '#888',
        width:     14,
        height:    14,
      },
    });
  });

  // Inject center node if it has no relations yet
  if (centerEntityId && !nodeMap.has(centerEntityId) && centerEntityType) {
    nodeMap.set(centerEntityId, {
      id:       centerEntityId,
      type:     'entity',
      position: { x: 0, y: 0 },
      data: { label: centerLabel ?? '', entityType: centerEntityType, isCenter: true },
    });
  }

  const rawNodes = Array.from(nodeMap.values());

  // Apply layout
  let positionedNodes: Node[];
  if (centerEntityId) {
    const center = rawNodes.find(n => n.id === centerEntityId);
    const others = rawNodes.filter(n => n.id !== centerEntityId);
    positionedNodes = center
      ? radialLayout(center, others, Math.max(180, others.length * 35))
      : rawNodes;
  } else {
    positionedNodes = clusterLayout(rawNodes);
  }

  return { nodes: positionedNodes, edges };
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyGraph({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="5"  r="2.5" /><circle cx="19" cy="16" r="2.5" /><circle cx="5"  cy="16" r="2.5" />
          <line x1="12" y1="7.5" x2="19" y2="13.5" /><line x1="12" y1="7.5" x2="5" y2="13.5" />
        </svg>
      </div>
      <div>
        <p className="font-bold text-sm text-foreground">لا توجد علاقات بعد</p>
        <p className="text-xs text-muted-foreground mt-0.5">اربط هذا العنصر بمهام، أهداف، مشاريع وأكثر</p>
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="text-xs text-primary font-semibold hover:underline"
        >
          + أضف علاقة
        </button>
      )}
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

interface RelationGraphProps {
  /** If provided, renders ego-network (radial) centred on this entity */
  entityId?:    string;
  entityType?:  EntityType;
  entityLabel?: string;
  /** Pre-fetched relations to render */
  relations:    EntityRelation[];
  height?:      number;
  /** Callback when user wants to add a relation (triggers RelationEditor) */
  onAddRelation?: () => void;
  /** Hide controls / minimap (use true for embedded cards) */
  compact?: boolean;
}

function RelationGraphInner({
  entityId, entityType, entityLabel,
  relations, height = 400, onAddRelation, compact = false,
}: RelationGraphProps) {
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(relations, entityId, entityType, entityLabel),
    [relations, entityId, entityType, entityLabel],
  );

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  // Re-sync when relations change
  const { nodes: freshNodes, edges: freshEdges } = useMemo(
    () => buildGraph(relations, entityId, entityType, entityLabel),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [relations.length, entityId],
  );

  const syncedNodes = freshNodes.length > 0 ? freshNodes : nodes;
  const syncedEdges = freshEdges.length > 0 ? freshEdges : edges;

  const onNodesChangeCb  = useCallback(onNodesChange, [onNodesChange]);
  const onEdgesChangeCb  = useCallback(onEdgesChange, [onEdgesChange]);

  if (relations.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-muted/10 rounded-xl border border-dashed border-border">
        <EmptyGraph onAdd={onAddRelation} />
      </div>
    );
  }

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-border bg-muted/5">
      <ReactFlow
        nodes={syncedNodes}
        edges={syncedEdges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChangeCb}
        onEdgesChange={onEdgesChangeCb}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-30" />
        {!compact && <Controls showInteractive={false} className="!bottom-3 !left-3" />}
        {!compact && (
          <MiniMap
            nodeColor={n => {
              const t = (n.data as NodeData)?.entityType;
              return ENTITY_CFG[t]?.color ?? '#888';
            }}
            className="!bottom-3 !right-3 opacity-80"
            maskColor="rgba(0,0,0,0.1)"
          />
        )}
      </ReactFlow>
    </div>
  );
}

export function RelationGraph(props: RelationGraphProps) {
  return (
    <ReactFlowProvider>
      <RelationGraphInner {...props} />
    </ReactFlowProvider>
  );
}
