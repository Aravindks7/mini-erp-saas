import { useState, useEffect } from 'react';

const STORAGE_KEY = 'mini-erp-sidebar-collapsed';

export function useSidebarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggle = () => setIsCollapsed((prev) => !prev);

  return { isCollapsed, toggle };
}
