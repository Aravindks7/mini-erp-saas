import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PERMISSIONS } from '@shared/index';

interface PermissionTreeProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
  searchQuery?: string;
}

type PermissionNode = string | { [key: string]: PermissionNode };

/**
 * Utility to get all permission strings (leaves) under a given node.
 * This is used for calculating checked states and performing bulk toggles.
 */
const getAllLeaves = (node: PermissionNode): string[] => {
  if (typeof node === 'string') return [node];
  return Object.values(node).flatMap(getAllLeaves);
};

/**
 * Utility to determine the checked state of a node (true, false, or indeterminate).
 */
const getCheckedState = (node: PermissionNode, selected: string[]): boolean | 'indeterminate' => {
  const leaves = getAllLeaves(node);
  const selectedCount = leaves.filter((leaf) => selected.includes(leaf)).length;
  if (selectedCount === 0) return false;
  if (selectedCount === leaves.length) return true;
  return 'indeterminate';
};

/**
 * Utility to toggle a node and all its children.
 * If targetState is true, all leaf permissions under this node are added.
 * If targetState is false, all leaf permissions under this node are removed.
 */
const toggleNode = (
  node: PermissionNode,
  currentSelected: string[],
  targetState: boolean,
): string[] => {
  const leaves = getAllLeaves(node);
  if (targetState) {
    // Add all leaves if they are not already present
    const newSelection = new Set([...currentSelected, ...leaves]);
    return Array.from(newSelection);
  } else {
    // Remove all leaves
    return currentSelected.filter((p) => !leaves.includes(p));
  }
};

/**
 * A custom basic accordion-style toggle for a module (group of permissions).
 */
const ModuleGroup = ({
  name,
  node,
  selectedPermissions,
  onChange,
  disabled,
  searchQuery = '',
}: {
  name: string;
  node: PermissionNode;
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
  searchQuery?: string;
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  // Auto-expand if there's a search match in this module
  React.useEffect(() => {
    if (searchQuery) {
      setIsOpen(true);
    }
  }, [searchQuery]);

  const id = `module-${name}`;
  const checked = getCheckedState(node, selectedPermissions);

  const handleCheckedChange = (checkedValue: boolean | 'indeterminate') => {
    const targetState = checkedValue === 'indeterminate' ? true : checkedValue;
    onChange(toggleNode(node, selectedPermissions, targetState));
  };

  const label = name.toLowerCase().replace(/_/g, ' ');

  // Filter children based on search query
  const children = typeof node === 'object' ? Object.entries(node) : [];
  const filteredChildren = children.filter(
    ([childName]) =>
      label.includes(searchQuery.toLowerCase()) ||
      childName.toLowerCase().replace(/_/g, ' ').includes(searchQuery.toLowerCase()),
  );

  // If the module name doesn't match and no children match, hide the module
  if (searchQuery && !label.includes(searchQuery.toLowerCase()) && filteredChildren.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col border rounded-md bg-card shadow-sm h-full transition-all duration-200">
      <div
        className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer select-none hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            id={id}
            checked={checked}
            onCheckedChange={handleCheckedChange}
            disabled={disabled}
          />
          <Label htmlFor={id} className="cursor-pointer capitalize font-semibold text-sm">
            {label}
          </Label>
        </div>
        <div className="text-muted-foreground ml-2 shrink-0">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </div>

      {isOpen && filteredChildren.length > 0 && (
        <div className="p-3 border-t bg-card animate-in fade-in slide-in-from-top-1">
          <div className="flex flex-col gap-3 pl-2">
            {filteredChildren.map(([childName, childNode]) => {
              const childId = `perm-${name}-${childName}`;
              const childChecked = getCheckedState(childNode, selectedPermissions);
              const childLabel = childName.toLowerCase().replace(/_/g, ' ');
              return (
                <div key={childName} className="flex items-center space-x-2">
                  <Checkbox
                    id={childId}
                    checked={childChecked}
                    onCheckedChange={(val) => {
                      const targetState = val === 'indeterminate' ? true : val;
                      onChange(toggleNode(childNode, selectedPermissions, targetState));
                    }}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={childId}
                    className="cursor-pointer capitalize text-sm font-normal"
                  >
                    {childLabel}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * PermissionTree component manages granular RBAC permissions.
 * Displays modules in a 3-column grid to maximize space usage.
 */
export const PermissionTree: React.FC<PermissionTreeProps> = ({
  selectedPermissions,
  onChange,
  disabled,
  searchQuery = '',
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(PERMISSIONS).map(([groupName, groupNode]) => (
        <ModuleGroup
          key={groupName}
          name={groupName}
          node={groupNode}
          selectedPermissions={selectedPermissions}
          onChange={onChange}
          disabled={disabled}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
};
