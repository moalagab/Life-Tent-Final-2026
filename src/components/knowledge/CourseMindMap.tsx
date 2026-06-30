import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useLanguage } from '@/hooks/useLanguage';
import { Course } from '@/hooks/useKnowledge';
import { CourseLesson, CourseNote, CourseFlashcard } from '@/hooks/useCourseStudy';

interface CourseMindMapProps {
  course: Course;
  lessons?: CourseLesson[];
  notes?: CourseNote[];
  flashcards?: CourseFlashcard[];
}

/**
 * Mind map of the course: root → lessons → (lesson notes + lesson flashcards).
 * Unattached notes/flashcards branch directly off the course root.
 */
export function CourseMindMap({ course, lessons = [], notes = [], flashcards = [] }: CourseMindMapProps) {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const COL_LESSON = 320;
    const COL_DETAIL = 640;
    const ROW = 110;

    // Root
    nodes.push({
      id: 'course',
      position: { x: 0, y: 0 },
      data: { label: course.title },
      type: 'input',
      sourcePosition: Position.Right,
      style: {
        background: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        border: '2px solid hsl(var(--primary))',
        borderRadius: 12,
        padding: 12,
        fontWeight: 700,
        minWidth: 200,
      },
    });

    const sortedLessons = [...lessons].sort(
      (a, b) => (a.order_index || 0) - (b.order_index || 0)
    );

    // Unattached items go below lessons
    const orphanNotes = notes.filter((n) => !n.lesson_id);
    const orphanFlashcards = flashcards.filter((f) => !f.lesson_id);
    const orphanRows = orphanNotes.length + orphanFlashcards.length;

    const totalRows = Math.max(sortedLessons.length, 1) + orphanRows;
    const startY = -((totalRows - 1) * ROW) / 2;

    sortedLessons.forEach((lesson, i) => {
      const lessonY = startY + i * ROW;
      nodes.push({
        id: `lesson-${lesson.id}`,
        position: { x: COL_LESSON, y: lessonY },
        data: {
          label: `${i + 1}. ${lesson.title}${
            lesson.is_completed ? ' ✓' : ''
          }`,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          background: lesson.is_completed
            ? 'hsl(var(--success) / 0.15)'
            : 'hsl(var(--card))',
          color: 'hsl(var(--foreground))',
          border: `1px solid hsl(var(--${
            lesson.is_completed ? 'success' : 'border'
          }))`,
          borderRadius: 10,
          padding: 8,
          fontSize: 13,
          maxWidth: 240,
        },
      });
      edges.push({
        id: `e-course-lesson-${lesson.id}`,
        source: 'course',
        target: `lesson-${lesson.id}`,
        type: 'smoothstep',
        animated: !lesson.is_completed,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: 'hsl(var(--primary) / 0.5)' },
      });

      const lessonNotes = notes.filter((n) => n.lesson_id === lesson.id);
      const lessonCards = flashcards.filter((f) => f.lesson_id === lesson.id);
      const childCount = lessonNotes.length + lessonCards.length;
      const childStartY = lessonY - ((childCount - 1) * 50) / 2;
      let childIdx = 0;

      lessonNotes.forEach((note) => {
        const id = `note-${note.id}`;
        nodes.push({
          id,
          position: { x: COL_DETAIL, y: childStartY + childIdx * 50 },
          data: { label: `📝 ${note.title}` },
          targetPosition: Position.Left,
          style: {
            background: 'hsl(var(--muted) / 0.6)',
            color: 'hsl(var(--foreground))',
            border: '1px dashed hsl(var(--border))',
            borderRadius: 8,
            padding: 6,
            fontSize: 11,
            maxWidth: 200,
          },
        });
        edges.push({
          id: `e-${lesson.id}-${id}`,
          source: `lesson-${lesson.id}`,
          target: id,
          style: { stroke: 'hsl(var(--muted-foreground) / 0.4)' },
        });
        childIdx++;
      });

      lessonCards.forEach((card) => {
        const id = `card-${card.id}`;
        nodes.push({
          id,
          position: { x: COL_DETAIL, y: childStartY + childIdx * 50 },
          data: {
            label: `💡 ${card.question.slice(0, 40)}${
              card.question.length > 40 ? '…' : ''
            }`,
          },
          targetPosition: Position.Left,
          style: {
            background: 'hsl(var(--accent) / 0.2)',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--accent))',
            borderRadius: 8,
            padding: 6,
            fontSize: 11,
            maxWidth: 200,
          },
        });
        edges.push({
          id: `e-${lesson.id}-${id}`,
          source: `lesson-${lesson.id}`,
          target: id,
          style: { stroke: 'hsl(var(--accent) / 0.5)' },
        });
        childIdx++;
      });
    });

    // Orphan items
    let orphanY = startY + sortedLessons.length * ROW;
    [...orphanNotes.map((n) => ({ kind: 'note' as const, item: n })),
     ...orphanFlashcards.map((f) => ({ kind: 'card' as const, item: f }))]
      .forEach(({ kind, item }) => {
        const id =
          kind === 'note' ? `note-${item.id}` : `card-${item.id}`;
        const label =
          kind === 'note'
            ? `📝 ${(item as CourseNote).title}`
            : `💡 ${(item as CourseFlashcard).question.slice(0, 40)}`;
        nodes.push({
          id,
          position: { x: COL_LESSON, y: orphanY },
          data: { label },
          targetPosition: Position.Left,
          style: {
            background: 'hsl(var(--muted) / 0.5)',
            color: 'hsl(var(--foreground))',
            border: '1px dashed hsl(var(--border))',
            borderRadius: 8,
            padding: 6,
            fontSize: 12,
            maxWidth: 240,
          },
        });
        edges.push({
          id: `e-course-${id}`,
          source: 'course',
          target: id,
          style: { stroke: 'hsl(var(--muted-foreground) / 0.3)' },
        });
        orphanY += ROW * 0.6;
      });

    return { nodes, edges };
  }, [course.title, lessons, notes, flashcards]);

  if (lessons.length === 0 && notes.length === 0 && flashcards.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        {isAr
          ? 'أضف دروسًا وملاحظات وبطاقات لتظهر الخريطة الذهنية للدورة.'
          : 'Add lessons, notes, and flashcards to see the course mind map.'}
      </div>
    );
  }

  return (
    <div
      className="glass-card overflow-hidden"
      style={{ height: 'min(70vh, 600px)', width: '100%' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        zoomOnScroll
      >
        <Background color="hsl(var(--muted-foreground) / 0.2)" gap={20} />
        <Controls
          showInteractive={false}
          className="!bg-card !border-border !rounded-lg"
        />
        <MiniMap
          pannable
          zoomable
          maskColor="hsl(var(--background) / 0.6)"
          className="!bg-card !border !border-border !rounded-lg"
        />
      </ReactFlow>
    </div>
  );
}
