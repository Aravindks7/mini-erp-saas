import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PERMISSIONS } from '@shared/index';
import { cn } from '@/lib/utils';

interface PermissionTreeProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
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
 * Recursive tree item representing a single node or leaf in the PERMISSIONS hierarchy.
 */
const TreeItem = ({
  name,
  node,
  selectedPermissions,
  onChange,
  disabled,
  depth = 0,
  path = '',
}: {
  name: string;
  node: PermissionNode;
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
  depth?: number;
  path?: string;
}) => {
  const fullPath = path ? `${path}.${name}` : name;
  const id = `perm-${fullPath}`;
  const checked = getCheckedState(node, selectedPermissions);
  const isLeaf = typeof node === 'string';

  const handleCheckedChange = (checkedValue: boolean | 'indeterminate') => {
    // When a user clicks a checkbox, Radix calls onCheckedChange with the new boolean state.
    // We treat 'indeterminate' as true to ensure we always pass a boolean to toggleNode.
    const targetState = checkedValue === 'indeterminate' ? true : checkedValue;
    onChange(toggleNode(node, selectedPermissions, targetState));
  };

  // Convert key names (e.g., "CUSTOMERS", "READ") to friendly labels ("customers", "read")
  const label = name.toLowerCase().replace(/_/g, ' ');

  return (
    <div className={cn('flex flex-col gap-3', depth > 0 && 'ml-6')}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={handleCheckedChange}
          disabled={disabled}
        />
        <Label
          htmlFor={id}
          className={cn(
            'cursor-pointer capitalize text-sm leading-none',
            !isLeaf && 'font-semibold',
          )}
        >
          {label}
        </Label>
      </div>
      {!isLeaf && (
        <div className="flex flex-col gap-3 mt-1 border-l pl-4 ml-1.5 border-muted">
          {Object.entries(node).map(([childName, childNode]) => (
            <TreeItem
              key={childName}
              name={childName}
              node={childNode}
              selectedPermissions={selectedPermissions}
              onChange={onChange}
              disabled={disabled}
              depth={depth + 1}
              path={fullPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * PermissionTree component manages granular RBAC permissions in a hierarchical tree view.
 * It supports recursive selection, indeterminate states, and granular leaf toggling.
 */
export const PermissionTree: React.FC<PermissionTreeProps> = ({
  selectedPermissions,
  onChange,
  disabled,
}) => {
  return (
    <div className="space-y-6">
      {Object.entries(PERMISSIONS).map(([groupName, groupNode]) => (
        <TreeItem
          key={groupName}
          name={groupName}
          node={groupNode}
          selectedPermissions={selectedPermissions}
          onChange={onChange}
          disabled={disabled}
        />
      ))}
    </div>
  );
};
