import { useState } from 'react';
import { Tag, Plus, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

const DEFAULT_GENRES = {
  ar: [
    'رواية', 'علمي', 'تاريخ', 'سيرة ذاتية', 'دين', 'فلسفة', 
    'تطوير الذات', 'أعمال', 'خيال علمي', 'غموض', 'رعب', 'كوميديا',
    'دراما', 'وثائقي', 'أكشن', 'رومانسية'
  ],
  en: [
    'Fiction', 'Science', 'History', 'Biography', 'Religion', 'Philosophy',
    'Self-Help', 'Business', 'Sci-Fi', 'Mystery', 'Horror', 'Comedy',
    'Drama', 'Documentary', 'Action', 'Romance'
  ]
};

interface GenreFilterProps {
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
  availableGenres?: string[];
}

export function GenreFilter({ selectedGenres, onGenresChange, availableGenres }: GenreFilterProps) {
  const { currentLanguage } = useLanguage();
  const [customGenre, setCustomGenre] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const defaultGenres = DEFAULT_GENRES[currentLanguage as 'ar' | 'en'] || DEFAULT_GENRES.en;
  const allGenres = [...new Set([...defaultGenres, ...(availableGenres || [])])];

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onGenresChange(selectedGenres.filter(g => g !== genre));
    } else {
      onGenresChange([...selectedGenres, genre]);
    }
  };

  const addCustomGenre = () => {
    if (customGenre.trim() && !selectedGenres.includes(customGenre.trim())) {
      onGenresChange([...selectedGenres, customGenre.trim()]);
      setCustomGenre('');
    }
  };

  const clearAll = () => {
    onGenresChange([]);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Tag className="w-4 h-4" />
          {currentLanguage === 'ar' ? 'التصنيفات' : 'Genres'}
          {selectedGenres.length > 0 && (
            <Badge variant="secondary" className="ms-1 rounded-full px-1.5 py-0 text-xs">
              {selectedGenres.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">
              {currentLanguage === 'ar' ? 'اختر التصنيفات' : 'Select Genres'}
            </h4>
            {selectedGenres.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 px-2 text-xs">
                {currentLanguage === 'ar' ? 'مسح الكل' : 'Clear all'}
              </Button>
            )}
          </div>

          {/* Selected Genres */}
          {selectedGenres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedGenres.map(genre => (
                <Badge 
                  key={genre} 
                  variant="default" 
                  className="gap-1 cursor-pointer"
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                  <X className="w-3 h-3" />
                </Badge>
              ))}
            </div>
          )}

          {/* Available Genres */}
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {allGenres.filter(g => !selectedGenres.includes(g)).map(genre => (
              <Badge 
                key={genre} 
                variant="outline" 
                className={cn(
                  'cursor-pointer hover:bg-primary/10 transition-colors',
                )}
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </Badge>
            ))}
          </div>

          {/* Add Custom Genre */}
          <div className="flex gap-2">
            <Input
              value={customGenre}
              onChange={(e) => setCustomGenre(e.target.value)}
              placeholder={currentLanguage === 'ar' ? 'تصنيف مخصص...' : 'Custom genre...'}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && addCustomGenre()}
            />
            <Button size="icon" variant="ghost" onClick={addCustomGenre} disabled={!customGenre.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface GenreSelectorProps {
  value: string;
  onChange: (genre: string) => void;
}

export function GenreSelector({ value, onChange }: GenreSelectorProps) {
  const { currentLanguage } = useLanguage();
  const [customGenre, setCustomGenre] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const defaultGenres = DEFAULT_GENRES[currentLanguage as 'ar' | 'en'] || DEFAULT_GENRES.en;

  const selectGenre = (genre: string) => {
    onChange(genre);
    setIsOpen(false);
  };

  const addAndSelectCustom = () => {
    if (customGenre.trim()) {
      onChange(customGenre.trim());
      setCustomGenre('');
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Tag className="w-4 h-4" />
          {value || (currentLanguage === 'ar' ? 'اختر التصنيف' : 'Select genre')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {defaultGenres.map(genre => (
              <Badge 
                key={genre} 
                variant={value === genre ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => selectGenre(genre)}
              >
                {value === genre && <Check className="w-3 h-3 me-1" />}
                {genre}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={customGenre}
              onChange={(e) => setCustomGenre(e.target.value)}
              placeholder={currentLanguage === 'ar' ? 'مخصص...' : 'Custom...'}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && addAndSelectCustom()}
            />
            <Button size="icon" variant="ghost" onClick={addAndSelectCustom}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
