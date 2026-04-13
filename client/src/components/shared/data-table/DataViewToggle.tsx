'use no memo';

import { LayoutGrid, List } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DataViewToggleProps {
  viewMode: 'list' | 'grid';
  onViewModeChange: (view: 'list' | 'grid') => void;
}

export function DataViewToggle({ viewMode, onViewModeChange }: DataViewToggleProps) {
  return (
    <Tabs value={viewMode} onValueChange={(value) => onViewModeChange(value as 'list' | 'grid')}>
      <TabsList className="grid w-24 sm:w-40 grid-cols-2 h-8 p-1">
        <TabsTrigger value="list" className="px-2 sm:px-3 h-6">
          <List className="h-3.5 w-3.5 sm:mr-2" />
          <span className="hidden sm:inline text-xs font-medium">List</span>
        </TabsTrigger>
        <TabsTrigger value="grid" className="px-2 sm:px-3 h-6">
          <LayoutGrid className="h-3.5 w-3.5 sm:mr-2" />
          <span className="hidden sm:inline text-xs font-medium">Grid</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
