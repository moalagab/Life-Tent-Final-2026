import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, 
  Loader2, Download, ArrowRight, X, Settings
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAccounts } from '@/hooks/useFinance';
import { useCategories, useCreateCategory } from '@/hooks/useAdvancedFinance';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  isValid: boolean;
  error?: string;
}

interface CategoryRule {
  id: string;
  pattern: string;
  category: string;
  isActive: boolean;
}

export function DataImport() {
  const { currentLanguage } = useLanguage();
  const language = currentLanguage;
  const { user } = useAuth();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const createCategory = useCreateCategory();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [importProgress, setImportProgress] = useState(0);
  const [importComplete, setImportComplete] = useState(false);

  // Category Rules
  const [rules, setRules] = useState<CategoryRule[]>([
    { id: '1', pattern: 'STC', category: 'Telecom', isActive: true },
    { id: '2', pattern: 'مطعم', category: 'Food', isActive: true },
    { id: '3', pattern: 'restaurant', category: 'Food', isActive: true },
    { id: '4', pattern: 'uber', category: 'Transport', isActive: true },
    { id: '5', pattern: 'كهرباء', category: 'Utilities', isActive: true },
  ]);

  const [newRule, setNewRule] = useState({ pattern: '', category: '' });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setParsedData([]);
    setImportComplete(false);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row
      const dataLines = lines.slice(1);
      
      const parsed: ParsedTransaction[] = dataLines.map(line => {
        const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
        
        // Try to parse different CSV formats
        // Format 1: Date, Description, Amount
        // Format 2: Date, Description, Debit, Credit
        // Format 3: Date, Description, Amount, Type
        
        let date = columns[0] || '';
        let description = columns[1] || '';
        let amount = 0;
        let type: 'income' | 'expense' = 'expense';

        if (columns.length >= 4) {
          // Format with separate debit/credit or amount/type
          const debit = parseFloat(columns[2]) || 0;
          const credit = parseFloat(columns[3]) || 0;
          
          if (debit > 0) {
            amount = debit;
            type = 'expense';
          } else if (credit > 0) {
            amount = credit;
            type = 'income';
          }
        } else if (columns.length >= 3) {
          // Simple format with amount
          amount = Math.abs(parseFloat(columns[2]) || 0);
          type = parseFloat(columns[2]) < 0 ? 'expense' : 'income';
        }

        // Apply category rules
        let category: string | undefined;
        for (const rule of rules.filter(r => r.isActive)) {
          if (description.toLowerCase().includes(rule.pattern.toLowerCase())) {
            category = rule.category;
            break;
          }
        }

        // Validate
        const isValid = !isNaN(new Date(date).getTime()) && amount > 0 && description.length > 0;
        const error = !isValid 
          ? (language === 'ar' ? 'بيانات غير صالحة' : 'Invalid data')
          : undefined;

        return {
          date,
          description,
          amount,
          type,
          category,
          isValid,
          error,
        };
      });

      setParsedData(parsed);
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل في قراءة الملف' : 'Failed to read file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!selectedAccountId || parsedData.length === 0) {
      toast.error(language === 'ar' ? 'يرجى اختيار حساب' : 'Please select an account');
      return;
    }

    const validTransactions = parsedData.filter(t => t.isValid);
    if (validTransactions.length === 0) {
      toast.error(language === 'ar' ? 'لا توجد عمليات صالحة' : 'No valid transactions');
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);

    try {
      for (let i = 0; i < validTransactions.length; i++) {
        const tx = validTransactions[i];
        
        await supabase.from('transactions').insert({
          user_id: user!.id,
          account_id: selectedAccountId,
          date: new Date(tx.date).toISOString().split('T')[0],
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          category: tx.category || null,
        });

        setImportProgress(Math.round(((i + 1) / validTransactions.length) * 100));
      }

      toast.success(
        language === 'ar' 
          ? `تم استيراد ${validTransactions.length} عملية` 
          : `Imported ${validTransactions.length} transactions`
      );
      setImportComplete(true);
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل في الاستيراد' : 'Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddRule = () => {
    if (!newRule.pattern || !newRule.category) return;
    
    setRules([
      ...rules,
      {
        id: Date.now().toString(),
        pattern: newRule.pattern,
        category: newRule.category,
        isActive: true,
      },
    ]);
    setNewRule({ pattern: '', category: '' });
    toast.success(language === 'ar' ? 'تمت إضافة القاعدة' : 'Rule added');
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const downloadTemplate = () => {
    const template = 'Date,Description,Amount,Type\n2024-01-15,Salary,5000,income\n2024-01-16,Groceries,-250,expense';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions-template.csv';
    a.click();
  };

  const validCount = parsedData.filter(t => t.isValid).length;
  const invalidCount = parsedData.filter(t => !t.isValid).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {language === 'ar' ? 'استيراد البيانات' : 'Data Import'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'استيراد العمليات من ملفات CSV' : 'Import transactions from CSV files'}
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="w-4 h-4 me-2" />
          {language === 'ar' ? 'تحميل قالب' : 'Download Template'}
        </Button>
      </div>

      <Tabs defaultValue="import" className="space-y-4">
        <TabsList>
          <TabsTrigger value="import">
            {language === 'ar' ? 'الاستيراد' : 'Import'}
          </TabsTrigger>
          <TabsTrigger value="rules">
            {language === 'ar' ? 'قواعد التصنيف' : 'Category Rules'}
          </TabsTrigger>
        </TabsList>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          {/* File Upload */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'رفع ملف CSV' : 'Upload CSV File'}</CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'صيغة مدعومة: Date, Description, Amount أو Date, Description, Debit, Credit'
                  : 'Supported format: Date, Description, Amount or Date, Description, Debit, Credit'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder={language === 'ar' ? 'اختر الحساب' : 'Select Account'} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div 
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                    "hover:border-primary/50 hover:bg-primary/5"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {isProcessing ? (
                    <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
                  ) : (
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  )}
                  <p className="text-foreground font-medium">
                    {language === 'ar' ? 'اضغط لاختيار ملف' : 'Click to select file'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'ar' ? 'أو اسحب وأفلت هنا' : 'or drag and drop here'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parsed Data Preview */}
          {parsedData.length > 0 && (
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{language === 'ar' ? 'معاينة البيانات' : 'Data Preview'}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-success">
                      <CheckCircle className="w-3 h-3 me-1" />
                      {validCount} {language === 'ar' ? 'صالح' : 'valid'}
                    </Badge>
                    {invalidCount > 0 && (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 me-1" />
                        {invalidCount} {language === 'ar' ? 'غير صالح' : 'invalid'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {parsedData.slice(0, 50).map((tx, index) => (
                      <div 
                        key={index}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          tx.isValid ? "bg-muted/30" : "bg-destructive/10 border border-destructive/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {tx.isValid ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                          <div>
                            <p className="font-medium text-foreground">{tx.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {tx.date} • {tx.category || (language === 'ar' ? 'غير مصنف' : 'Uncategorized')}
                            </p>
                          </div>
                        </div>
                        <div className="text-end">
                          <p className={cn(
                            "font-semibold",
                            tx.type === 'income' ? "text-success" : "text-destructive"
                          )}>
                            {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} SAR
                          </p>
                          {!tx.isValid && (
                            <p className="text-xs text-destructive">{tx.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {importProgress > 0 && importProgress < 100 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{language === 'ar' ? 'جاري الاستيراد...' : 'Importing...'}</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {!importComplete && (
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="gold" 
                      onClick={handleImport}
                      disabled={isProcessing || validCount === 0}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 me-2" />
                      )}
                      {language === 'ar' ? `استيراد ${validCount} عملية` : `Import ${validCount} transactions`}
                    </Button>
                  </div>
                )}

                {importComplete && (
                  <div className="mt-4 p-4 rounded-xl bg-success/10 border border-success/20 text-center">
                    <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                    <p className="font-medium text-success">
                      {language === 'ar' ? 'تم الاستيراد بنجاح!' : 'Import completed successfully!'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {language === 'ar' ? 'قواعد التصنيف التلقائي' : 'Auto-categorization Rules'}
                </div>
              </CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'أضف قواعد لتصنيف العمليات تلقائياً بناءً على الوصف'
                  : 'Add rules to automatically categorize transactions based on description'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add Rule Form */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label className="text-sm text-muted-foreground mb-1 block">
                    {language === 'ar' ? 'النمط' : 'Pattern'}
                  </Label>
                  <Input
                    placeholder={language === 'ar' ? 'مثال: STC' : 'e.g., STC'}
                    value={newRule.pattern}
                    onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-sm text-muted-foreground mb-1 block">
                    {language === 'ar' ? 'الفئة' : 'Category'}
                  </Label>
                  <Input
                    placeholder={language === 'ar' ? 'مثال: اتصالات' : 'e.g., Telecom'}
                    value={newRule.category}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddRule}>
                    {language === 'ar' ? 'إضافة' : 'Add'}
                  </Button>
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-2">
                {rules.map(rule => (
                  <div 
                    key={rule.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{rule.pattern}</Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <Badge>{rule.category}</Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
