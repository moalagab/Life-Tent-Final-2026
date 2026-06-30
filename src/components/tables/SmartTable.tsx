import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus, Trash2, Pencil, Check, X, Table2, Settings2,
  GripVertical, Hash, Calendar, AlignLeft, ToggleLeft,
  Link, Mail, ChevronDown, Loader2,
} from 'lucide-react';
import {
  CustomTable, CustomTableRow, TableColumn, ColumnType,
  useCustomTableRows, useCreateTableRow, useUpdateTableRow,
  useDeleteTableRow, useUpdateCustomTable, useDeleteCustomTable,
} from '@/hooks/useCustomTables';
import { useLanguage } from '@/hooks/useLanguage';
const uuidv4 = () => crypto.randomUUID();
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// ── Column type icons ─────────────────────────────────────────────────────────

const COL_ICONS: Record<ColumnType, React.ComponentType<{ className?: string }>> = {
  text:        AlignLeft,
  number:      Hash,
  date:        Calendar,
  select:      ChevronDown,
  multiselect: ChevronDown,
  checkbox:    ToggleLeft,
  url:         Link,
  email:       Mail,
};

const COL_TYPE_LABELS: Record<ColumnType, string> = {
  text: 'نص', number: 'رقم', date: 'تاريخ',
  select: 'قائمة', multiselect: 'متعددة', checkbox: 'صح/خطأ',
  url: 'رابط', email: 'بريد',
};

// ── Cell renderer ─────────────────────────────────────────────────────────────

function CellValue({ column, value }: { column: TableColumn; value: unknown }) {
  if (value == null || value === '') return <span className="text-muted-foreground/40 text-xs italic">—</span>;

  switch (column.type) {
    case 'checkbox':
      return value
        ? <Check className="w-4 h-4 text-success" />
        : <X className="w-4 h-4 text-muted-foreground/40" />;
    case 'date':
      try { return <span className="text-xs">{format(new Date(String(value)), 'dd MMM yyyy', { locale: ar })}</span>; }
      catch { return <span className="text-xs">{String(value)}</span>; }
    case 'select':
      return <Badge variant="secondary" className="text-xs">{String(value)}</Badge>;
    case 'multiselect':
      return (
        <div className="flex flex-wrap gap-1">
          {(Array.isArray(value) ? value : [value]).map((v, i) => (
            <Badge key={i} variant="secondary" className="text-xs">{String(v)}</Badge>
          ))}
        </div>
      );
    case 'url':
      return <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline truncate max-w-[120px] block">{String(value)}</a>;
    default:
      return <span className="text-sm">{String(value)}</span>;
  }
}

// ── Cell editor ───────────────────────────────────────────────────────────────

function CellEditor({
  column, value, onChange, onBlur,
}: { column: TableColumn; value: unknown; onChange: (v: unknown) => void; onBlur: () => void }) {
  switch (column.type) {
    case 'checkbox':
      return (
        <button
          onClick={() => { onChange(!value); onBlur(); }}
          className="flex items-center justify-center w-full h-8"
        >
          {value ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-muted-foreground/40" />}
        </button>
      );
    case 'date':
      return <Input type="date" value={String(value ?? '')} onChange={e => onChange(e.target.value)} onBlur={onBlur} autoFocus className="h-8 text-xs" />;
    case 'number':
      return <Input type="number" value={String(value ?? '')} onChange={e => onChange(Number(e.target.value))} onBlur={onBlur} autoFocus className="h-8 text-xs" />;
    case 'select':
      return (
        <Select value={String(value ?? '')} onValueChange={v => { onChange(v); onBlur(); }}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="اختر..." />
          </SelectTrigger>
          <SelectContent>
            {(column.options ?? []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    default:
      return <Input value={String(value ?? '')} onChange={e => onChange(e.target.value)} onBlur={onBlur} autoFocus className="h-8 text-xs" dir="auto" />;
  }
}

// ── Column Settings Dialog ─────────────────────────────────────────────────────

function ColumnSettingsDialog({
  open, onClose, columns, onSave, isAr,
}: {
  open: boolean;
  onClose: () => void;
  columns: TableColumn[];
  onSave: (cols: TableColumn[]) => void;
  isAr: boolean;
}) {
  const [cols, setCols] = useState<TableColumn[]>(columns);
  const [newName, setNewName]   = useState('');
  const [newType, setNewType]   = useState<ColumnType>('text');
  const [newOptions, setNewOptions] = useState('');

  const addColumn = () => {
    if (!newName.trim()) return;
    const col: TableColumn = {
      id: uuidv4(),
      name: newName.trim(),
      type: newType,
      options: (newType === 'select' || newType === 'multiselect')
        ? newOptions.split(',').map(s => s.trim()).filter(Boolean)
        : undefined,
    };
    setCols(prev => [...prev, col]);
    setNewName(''); setNewOptions('');
  };

  const removeColumn = (id: string) => setCols(prev => prev.filter(c => c.id !== id));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            {isAr ? 'إدارة الأعمدة' : 'Manage Columns'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Existing columns */}
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {cols.map(col => {
              const Icon = COL_ICONS[col.type];
              return (
                <div key={col.id} className="flex items-center gap-2 p-2 rounded-xl bg-muted/30">
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                  <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1">{col.name}</span>
                  <Badge variant="outline" className="text-[10px]">{COL_TYPE_LABELS[col.type]}</Badge>
                  <button onClick={() => removeColumn(col.id)} className="text-muted-foreground/40 hover:text-destructive">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
            {cols.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">{isAr ? 'لا توجد أعمدة' : 'No columns yet'}</p>
            )}
          </div>

          {/* Add new column */}
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">{isAr ? 'عمود جديد' : 'New column'}</p>
            <div className="flex gap-2">
              <Input
                placeholder={isAr ? 'اسم العمود...' : 'Column name...'} dir="auto"
                value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addColumn()}
                className="flex-1 h-9"
              />
              <Select value={newType} onValueChange={v => setNewType(v as ColumnType)}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COL_TYPE_LABELS) as ColumnType[]).map(t => (
                    <SelectItem key={t} value={t}>{COL_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={addColumn} className="h-9 px-3">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {(newType === 'select' || newType === 'multiselect') && (
              <Input
                placeholder={isAr ? 'خيارات مفصولة بفاصلة: خيار1, خيار2' : 'Options comma-separated: opt1, opt2'}
                value={newOptions} onChange={e => setNewOptions(e.target.value)}
                className="h-9 text-xs" dir="auto"
              />
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={() => { onSave(cols); onClose(); }} className="flex-1">
              <Check className="w-4 h-4 me-2" />
              {isAr ? 'حفظ الأعمدة' : 'Save Columns'}
            </Button>
            <Button variant="outline" onClick={onClose}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main SmartTable ───────────────────────────────────────────────────────────

interface SmartTableProps {
  table: CustomTable;
  onDelete?: () => void;
}

export function SmartTable({ table, onDelete }: SmartTableProps) {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';

  const [editingCell, setEditingCell]   = useState<{ rowId: string; colId: string } | null>(null);
  const [pendingData, setPendingData]   = useState<Record<string, unknown>>({});
  const [colSettingsOpen, setColSettingsOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal]         = useState(table.title);

  const { data: rows = [], isLoading } = useCustomTableRows(table.id);
  const createRow    = useCreateTableRow();
  const updateRow    = useUpdateTableRow();
  const deleteRow    = useDeleteTableRow();
  const updateTable  = useUpdateCustomTable();
  const deleteTable  = useDeleteCustomTable();

  const handleAddRow = async () => {
    try {
      await createRow.mutateAsync({ table_id: table.id, data: {}, position: rows.length });
    } catch { toast.error(isAr ? 'خطأ في الإضافة' : 'Add error'); }
  };

  const handleCellSave = async (rowId: string, colId: string, value: unknown) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    const newData = { ...row.data, [colId]: value };
    try {
      await updateRow.mutateAsync({ id: rowId, table_id: table.id, data: newData });
    } catch { toast.error(isAr ? 'خطأ في الحفظ' : 'Save error'); }
    setEditingCell(null);
    setPendingData({});
  };

  const handleSaveColumns = async (cols: TableColumn[]) => {
    try {
      await updateTable.mutateAsync({ id: table.id, columns: cols });
      toast.success(isAr ? 'تم حفظ الأعمدة' : 'Columns saved');
    } catch { toast.error(isAr ? 'خطأ' : 'Error'); }
  };

  const handleSaveTitle = async () => {
    if (!titleVal.trim()) return;
    try { await updateTable.mutateAsync({ id: table.id, title: titleVal.trim() }); }
    catch { toast.error('Error'); }
    setEditingTitle(false);
  };

  const handleDeleteTable = async () => {
    try {
      await deleteTable.mutateAsync(table.id);
      toast.success(isAr ? 'تم حذف الجدول' : 'Table deleted');
      onDelete?.();
    } catch { toast.error(isAr ? 'خطأ' : 'Error'); }
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Table header bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/20 border-b border-border/40">
        <span className="text-xl">{table.icon}</span>
        {editingTitle ? (
          <div className="flex items-center gap-1.5 flex-1">
            <Input value={titleVal} onChange={e => setTitleVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveTitle()} className="h-7 text-sm font-semibold" dir="auto" autoFocus />
            <button onClick={handleSaveTitle} className="text-success"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setEditingTitle(false)} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <button onClick={() => setEditingTitle(true)} className="font-semibold text-sm hover:text-primary transition-colors flex-1 text-start">
            {table.title}
          </button>
        )}
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" variant="ghost" onClick={() => setColSettingsOpen(true)} className="h-7 gap-1 text-xs">
            <Settings2 className="w-3.5 h-3.5" />
            {isAr ? 'الأعمدة' : 'Columns'}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDeleteTable} className="h-7 text-destructive hover:bg-destructive/10">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Table */}
      {table.columns.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <Table2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{isAr ? 'أضف أعمدة للبدء' : 'Add columns to get started'}</p>
          <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => setColSettingsOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            {isAr ? 'إضافة أعمدة' : 'Add Columns'}
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                {table.columns.map(col => {
                  const Icon = COL_ICONS[col.type];
                  return (
                    <th key={col.id} className="px-3 py-2 text-start font-medium text-xs text-muted-foreground whitespace-nowrap" style={{ minWidth: col.width ?? 140 }}>
                      <span className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3" />
                        {col.name}
                      </span>
                    </th>
                  );
                })}
                <th className="px-2 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={table.columns.length + 1} className="text-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : (
                <>
                  {rows.map(row => (
                    <tr key={row.id} className="border-b border-border/20 hover:bg-muted/10 group">
                      {table.columns.map(col => {
                        const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
                        const cellVal = isEditing ? (pendingData[col.id] ?? row.data[col.id]) : row.data[col.id];

                        return (
                          <td
                            key={col.id}
                            className="px-3 py-2 cursor-pointer"
                            onClick={() => {
                              if (!isEditing) {
                                setEditingCell({ rowId: row.id, colId: col.id });
                                setPendingData({ [col.id]: row.data[col.id] });
                              }
                            }}
                          >
                            {isEditing ? (
                              <CellEditor
                                column={col}
                                value={cellVal}
                                onChange={v => setPendingData(prev => ({ ...prev, [col.id]: v }))}
                                onBlur={() => handleCellSave(row.id, col.id, pendingData[col.id] ?? row.data[col.id])}
                              />
                            ) : (
                              <CellValue column={col} value={cellVal} />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2">
                        <button
                          onClick={() => deleteRow.mutateAsync({ id: row.id, table_id: table.id }).catch(() => toast.error('Error'))}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Add row */}
                  <tr>
                    <td colSpan={table.columns.length + 1} className="px-3 py-2">
                      <button
                        onClick={handleAddRow}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {isAr ? 'إضافة سطر' : 'Add row'}
                      </button>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ColumnSettingsDialog
        open={colSettingsOpen}
        onClose={() => setColSettingsOpen(false)}
        columns={table.columns}
        onSave={handleSaveColumns}
        isAr={isAr}
      />
    </div>
  );
}

// ── SmartTablesSection (used inside workspace tabs) ───────────────────────────

import {
  useCustomTables as useCustomTablesHook,
  useCreateCustomTable, EntityType,
} from '@/hooks/useCustomTables';

interface SmartTablesSectionProps {
  entityType: EntityType;
  entityId: string;
}

export function SmartTablesSection({ entityType, entityId }: SmartTablesSectionProps) {
  const { currentLanguage } = useLanguage();
  const isAr = currentLanguage === 'ar';
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon]   = useState('📊');

  const { data: tables = [], isLoading } = useCustomTablesHook({ entity_type: entityType, entity_id: entityId });
  const createTable = useCreateCustomTable();

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await createTable.mutateAsync({ title: newTitle.trim(), icon: newIcon, entity_type: entityType, entity_id: entityId, columns: [] });
      setNewTitle(''); setCreating(false);
      toast.success(isAr ? 'تم إنشاء الجدول' : 'Table created');
    } catch { toast.error(isAr ? 'خطأ' : 'Error'); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">{isAr ? 'الجداول الذكية' : 'Smart Tables'}</p>
        <Button variant="gold" size="sm" onClick={() => setCreating(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          {isAr ? 'جدول جديد' : 'New Table'}
        </Button>
      </div>

      {creating && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder={isAr ? 'اسم الجدول...' : 'Table name...'}
              value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              dir="auto" className="flex-1"
            />
            <Input value={newIcon} onChange={e => setNewIcon(e.target.value)} className="w-16 text-center text-lg" maxLength={2} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={createTable.isPending}>
              {createTable.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {isAr ? 'إنشاء' : 'Create'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCreating(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          </div>
        </div>
      )}

      {tables.length === 0 && !creating ? (
        <div className="text-center py-12 text-muted-foreground">
          <Table2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">{isAr ? 'لا توجد جداول بعد' : 'No tables yet'}</p>
          <p className="text-xs mt-1 max-w-xs mx-auto">
            {isAr ? 'أنشئ جداول مخصصة لتتبع أي بيانات تحتاجها' : 'Create custom tables to track any data you need'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tables.map(t => <SmartTable key={t.id} table={t} />)}
        </div>
      )}
    </div>
  );
}
