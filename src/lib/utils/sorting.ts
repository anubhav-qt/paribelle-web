/**
 * Generic sorting utilities for tables
 */

export type SortOrder = 'asc' | 'desc';

/**
 * Toggle sort order or set new sort field
 */
export function handleSortChange<T extends string>(
  currentField: T,
  newField: T,
  currentOrder: SortOrder,
  defaultOrder: SortOrder = 'asc'
): { field: T; order: SortOrder } {
  if (currentField === newField) {
    // Toggle order if same field
    return {
      field: currentField,
      order: currentOrder === 'asc' ? 'desc' : 'asc',
    };
  } else {
    // Set new field with default order
    return {
      field: newField,
      order: defaultOrder,
    };
  }
}

/**
 * Get sort indicator icon
 */
export function getSortIcon(
  currentField: string,
  targetField: string,
  order: SortOrder
): string {
  if (currentField === targetField) {
    return order === 'asc' ? '↑' : '↓';
  }
  return '';
}

/**
 * Generic compare function for sorting
 */
export function compareValues(
  a: any,
  b: any,
  order: SortOrder
): number {
  let comparison = 0;

  if (typeof a === 'string' && typeof b === 'string') {
    comparison = a.localeCompare(b);
  } else if (typeof a === 'number' && typeof b === 'number') {
    comparison = a - b;
  } else if (a instanceof Date && b instanceof Date) {
    comparison = a.getTime() - b.getTime();
  } else {
    // Fallback to string comparison
    comparison = String(a).localeCompare(String(b));
  }

  return order === 'asc' ? comparison : -comparison;
}

/**
 * Get CSS classes for sortable table header
 */
export function getSortableHeaderClass(active: boolean = false): string {
  const baseClass = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors';
  return active ? `${baseClass} bg-gray-100` : baseClass;
}
