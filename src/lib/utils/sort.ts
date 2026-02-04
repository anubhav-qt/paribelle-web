/**
 * Sorting utility functions
 */

export type SortOrder = 'asc' | 'desc';

/**
 * Toggle sort configuration for a field
 * @param currentField - Currently sorted field
 * @param newField - New field to sort by
 * @param currentOrder - Current sort order
 * @returns Updated sort configuration
 */
export function toggleSort<T extends string>(
  currentField: T,
  newField: T,
  currentOrder: SortOrder = 'asc'
): { field: T; order: SortOrder } {
  if (currentField === newField) {
    // Toggle order for same field
    return {
      field: newField,
      order: currentOrder === 'asc' ? 'desc' : 'asc'
    };
  } else {
    // New field, default to descending
    return {
      field: newField,
      order: 'desc'
    };
  }
}

/**
 * Generic comparison function for sorting
 * @param a - First value
 * @param b - Second value
 * @param order - Sort order
 * @returns Comparison result (-1, 0, 1)
 */
export function compareValues<T>(a: T, b: T, order: SortOrder = 'asc'): number {
  let comparison = 0;
  
  if (a === null || a === undefined) return order === 'asc' ? 1 : -1;
  if (b === null || b === undefined) return order === 'asc' ? -1 : 1;
  
  if (typeof a === 'string' && typeof b === 'string') {
    comparison = a.localeCompare(b);
  } else if (typeof a === 'number' && typeof b === 'number') {
    comparison = a - b;
  } else if (a instanceof Date && b instanceof Date) {
    comparison = a.getTime() - b.getTime();
  } else {
    comparison = String(a).localeCompare(String(b));
  }
  
  return order === 'asc' ? comparison : -comparison;
}

/**
 * Sort array of objects by field
 * @param items - Array to sort
 * @param field - Field to sort by
 * @param order - Sort order
 * @returns Sorted array
 */
export function sortByField<T extends Record<string, any>>(
  items: T[],
  field: keyof T,
  order: SortOrder = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    return compareValues(a[field], b[field], order);
  });
}

/**
 * Sort array of objects by multiple fields
 * @param items - Array to sort
 * @param fields - Array of fields with their sort orders
 * @returns Sorted array
 */
export function sortByMultipleFields<T extends Record<string, any>>(
  items: T[],
  fields: Array<{ field: keyof T; order: SortOrder }>
): T[] {
  return [...items].sort((a, b) => {
    for (const { field, order } of fields) {
      const comparison = compareValues(a[field], b[field], order);
      if (comparison !== 0) return comparison;
    }
    return 0;
  });
}

/**
 * Get sort icon based on current sort state
 * @param field - Field to check
 * @param currentField - Currently sorted field
 * @param currentOrder - Current sort order
 * @returns Icon indicator ('↑', '↓', or '')
 */
export function getSortIcon<T extends string>(
  field: T,
  currentField: T,
  currentOrder: SortOrder
): string {
  if (field !== currentField) return '';
  return currentOrder === 'asc' ? '↑' : '↓';
}

/**
 * Natural sort for strings with numbers (e.g., "item1", "item2", "item10")
 * @param a - First string
 * @param b - Second string
 * @param order - Sort order
 * @returns Comparison result
 */
export function naturalSort(a: string, b: string, order: SortOrder = 'asc'): number {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base'
  });
  
  const comparison = collator.compare(a, b);
  return order === 'asc' ? comparison : -comparison;
}
