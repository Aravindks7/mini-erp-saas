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
      <TabsList>
        <TabsTrigger value="list">
          <List className="h-3.5 w-3.5 sm:mr-2" />
          <span className="hidden sm:inline text-xs font-medium">List</span>
        </TabsTrigger>
        <TabsTrigger value="grid">
          <LayoutGrid className="h-3.5 w-3.5 sm:mr-2" />
          <span className="hidden sm:inline text-xs font-medium">Grid</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
