'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Save, Eye, EyeOff, GripVertical } from 'lucide-react';
import Link from 'next/link';

/** A filter the API derived from the attributes this category's variants carry. */
interface SuggestedFilter {
  id: string;
  label: string;
  type: 'checkbox';
  options: Array<{ value: string; label: string; productCount: number }>;
}

interface FilterOverride {
  id: string;
  label?: string;
  sortOrder?: number;
  hidden?: boolean;
}

/** A row in the editor: a derived filter plus whatever override is on top of it. */
interface EditableFilter {
  id: string;
  label: string;
  options: SuggestedFilter['options'];
  sortOrder: number;
  hidden: boolean;
}

import { Category } from '@/types/product';
import { Loader } from '@/components/ui/Loader';
import { api, errorMessage } from '@/lib/api';

/**
 * Filters are derived live from the catalogue (`product_variants.variant_attributes`)
 * — see Task 8 in the implementation plan. There is no free-text option entry
 * here any more: an admin can only rename a filter, reorder it, or hide it.
 * Typing a brand-new option here used to save silently and then do nothing,
 * because the storefront never read it — options only ever come from what
 * products actually carry.
 */
export default function CategoryFiltersPage() {
  const params = useParams();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [filters, setFilters] = useState<EditableFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [categoryData, suggestionsData] = await Promise.all([
        api.get<Category & { filterConfig?: { filters?: FilterOverride[] } }>(`/categories/${categoryId}`),
        api.get<{ filters: SuggestedFilter[] }>(`/categories/${categoryId}/filter-suggestions`),
      ]);
      setCategory(categoryData);

      const overrides = new Map<string, FilterOverride>();
      for (const o of categoryData.filterConfig?.filters || []) {
        overrides.set(o.id, o);
      }

      const merged: EditableFilter[] = (suggestionsData.filters || []).map((suggested, index) => {
        const override = overrides.get(suggested.id);
        return {
          id: suggested.id,
          label: override?.label || suggested.label,
          options: suggested.options,
          sortOrder: override?.sortOrder ?? index,
          hidden: override?.hidden ?? false,
        };
      });
      merged.sort((a, b) => a.sortOrder - b.sortOrder);
      setFilters(merged);
    } catch (err) {
      console.error('Error loading filters:', err);
      setError(errorMessage(err, 'Failed to load filters'));
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (index: number, patch: Partial<EditableFilter>) => {
    setFilters((current) => current.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const move = (index: number, direction: -1 | 1) => {
    setFilters((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((f, i) => ({ ...f, sortOrder: i }));
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/categories/${categoryId}/filters`, {
        filters: filters.map((f, i) => ({
          id: f.id,
          label: f.label,
          sortOrder: i,
          hidden: f.hidden,
        })),
      });
      setSuccess('Filters saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving filters:', err);
      setError(`Failed to save filters: ${errorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/categories"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Categories"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configure Filters</h1>
                <p className="text-gray-600">Category: {category?.name}</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Filters'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          These filters and their options come from what your products actually carry
          (each variant's attributes). You can rename a filter, reorder it, or hide it —
          options themselves can't be hand-typed here, since a hand-typed option that no
          product has would never match anything on the storefront.
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">
            Filters ({filters.length})
          </h2>

          {filters.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No attributes found on this category's products yet.</p>
              <p className="text-sm mt-2">
                Filters appear automatically once product variants carry attributes
                (e.g. colour, size).
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filters.map((filter, index) => (
                <div
                  key={filter.id}
                  className={`border rounded-lg p-4 flex items-start gap-4 ${filter.hidden ? 'bg-gray-50 opacity-60' : 'bg-white'}`}
                >
                  <div className="flex flex-col items-center gap-1 pt-2 text-gray-400">
                    <GripVertical className="w-4 h-4" />
                    <button
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className="text-xs disabled:opacity-30"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => move(index, 1)}
                      disabled={index === filters.length - 1}
                      className="text-xs disabled:opacity-30"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="text"
                        value={filter.label}
                        onChange={(e) => updateFilter(index, { label: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        placeholder="Display label"
                      />
                      <button
                        onClick={() => updateFilter(index, { hidden: !filter.hidden })}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filter.hidden
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                      >
                        {filter.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {filter.hidden ? 'Hidden' : 'Visible'}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Attribute key: <code className="bg-gray-100 px-1 rounded">{filter.id}</code>
                      {' · '}
                      {filter.options.slice(0, 6).map((o) => `${o.label} (${o.productCount})`).join(', ')}
                      {filter.options.length > 6 && ` +${filter.options.length - 6} more`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
