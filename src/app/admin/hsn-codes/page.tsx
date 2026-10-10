'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Pencil, Plus, Trash2, Upload } from 'lucide-react';

import { confirmDialog, promptDialog, toast } from '@/components/admin/pom/dialogs';
import { CenteredSpinner, Empty, Notice, PageHeader, SearchBox } from '@/components/admin/pom/ui';
import { api, errorMessage } from '@/lib/api';
import { isSuperAdmin } from '@/lib/auth';

interface HsnCode {
  id: string;
  code: string;
  description: string;
  /** A Postgres numeric, so it arrives as a string ("5.00"). */
  recommendedGstRate: number | string;
  updatedAt: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  total?: number;
  source?: string;
  errors?: string[];
}

const RATE_SUGGESTIONS = ['0', '3', '5', '18', '40'];
const rate = (h: HsnCode) => Number(h.recommendedGstRate);

const TEMPLATE_CSV =
  'HSN Code,Description,GST Rate\n' +
  '6204,"Women\'s suits, ensembles, dresses, skirts",5\n' +
  '6211,"Track suits, ski suits and other garments",5\n' +
  '7117,"Imitation jewellery",3\n';

/**
 * A reference list of HSN codes and the GST rate each carries. Products keep
 * their own HSN code and GST rate; invoices print those, not this list.
 */
export default function HsnCodesPage() {
  const [codes, setCodes] = useState<HsnCode[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<'upload' | 'preset' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const superAdmin = useMemo(() => isSuperAdmin(), []);

  const load = async () => {
    try {
      setCodes(await api.get<HsnCode[]>('/hsn-codes'));
    } catch (e) {
      setLoadError(errorMessage(e, 'Could not load the HSN codes.'));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!codes || !q) return codes ?? [];
    return codes.filter((h) => h.code.includes(q) || h.description.toLowerCase().includes(q));
  }, [codes, query]);

  async function edit(existing?: HsnCode) {
    const values = await promptDialog({
      title: existing ? `Edit HSN ${existing.code}` : 'Add an HSN code',
      confirmText: existing ? 'Save' : 'Add',
      fields: [
        { name: 'code', label: 'HSN code', placeholder: '6204', required: true, defaultValue: existing?.code, hint: '4 to 8 digits.' },
        {
          name: 'description',
          label: 'Description',
          required: true,
          multiline: true,
          defaultValue: existing?.description,
        },
        {
          name: 'gstRate',
          label: 'GST rate (%)',
          required: true,
          defaultValue: existing ? String(rate(existing)) : '5',
          suggestions: RATE_SUGGESTIONS,
          hint: 'Check it against the current CBIC rate schedule.',
        },
      ],
    });
    if (!values) return;

    const body = {
      code: values.code.replace(/\s+/g, ''),
      description: values.description.trim(),
      gstRate: Number(values.gstRate),
    };
    if (!/^\d{4,8}$/.test(body.code)) return toast.error('An HSN code is 4 to 8 digits.');
    if (!Number.isFinite(body.gstRate) || body.gstRate < 0 || body.gstRate > 40) {
      return toast.error('The GST rate is a percentage from 0 to 40.');
    }

    try {
      if (existing) await api.put(`/hsn-codes/${existing.id}`, body);
      else await api.post('/hsn-codes', body);
      toast.success(existing ? 'HSN code saved.' : 'HSN code added.');
      await load();
    } catch (e) {
      toast.error(errorMessage(e, 'Could not save the HSN code.'));
    }
  }

  async function remove(h: HsnCode) {
    const ok = await confirmDialog({
      title: `Delete HSN ${h.code}?`,
      message: 'Products filed under it keep their code and GST rate.',
      confirmText: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/hsn-codes/${h.id}`);
      toast.success('HSN code deleted.');
      await load();
    } catch (e) {
      toast.error(errorMessage(e, 'Could not delete the HSN code.'));
    }
  }

  async function upload(file: File) {
    setBusy('upload');
    try {
      const form = new FormData();
      form.append('file', file);
      const result = await api.upload<ImportResult>('/hsn-codes/import', form);
      toast.success(`Imported ${result.imported} codes${result.skipped ? `, skipped ${result.skipped}` : ''}.`);
      await load();
    } catch (e) {
      toast.error(errorMessage(e, 'Could not import that file.'));
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function importPreset() {
    const ok = await confirmDialog({
      title: 'Import the official HSN codes?',
      message: 'Fetches the CBIC schedule from cbic-gst.gov.in. Codes already here are overwritten with its description and rate.',
      confirmText: 'Import',
    });
    if (!ok) return;
    setBusy('preset');
    try {
      const result = await api.post<ImportResult>('/hsn-codes/import-preset');
      toast.success(`Imported ${result.imported} of ${result.total ?? result.imported} codes.`);
      await load();
    } catch (e) {
      toast.error(errorMessage(e, 'The import failed.'));
    } finally {
      setBusy(null);
    }
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hsn-codes-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loadError) return <Notice tone="danger">{loadError}</Notice>;
  if (!codes) return <CenteredSpinner />;

  return (
    <div className="mx-auto max-w-5xl pb-10">
      <PageHeader
        title="HSN codes"
        hint="A reference for the HSN code and GST rate you enter on each product."
        actions={
          <>
            <button type="button" className="btn" onClick={downloadTemplate}>
              <Download className="h-4 w-4" /> Template
            </button>
            <button type="button" className="btn" onClick={() => fileRef.current?.click()} disabled={busy !== null}>
              <Upload className="h-4 w-4" /> {busy === 'upload' ? 'Uploading...' : 'Upload sheet'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
              }}
            />
            {superAdmin ? (
              <button type="button" className="btn" onClick={importPreset} disabled={busy !== null}>
                {busy === 'preset' ? 'Importing...' : 'Import CBIC list'}
              </button>
            ) : null}
            <button type="button" className="btn btn-blue" onClick={() => edit()}>
              <Plus className="h-4 w-4" /> Add code
            </button>
          </>
        }
      />

      <SearchBox value={query} onChange={setQuery} placeholder="Search by code or description" className="mb-4" />

      <div className="panel overflow-hidden">
        {shown.length === 0 ? (
          <Empty
            title={query ? 'No HSN codes match.' : 'No HSN codes yet.'}
            hint={query ? undefined : 'Add one, or upload a sheet with the columns HSN Code, Description and GST Rate.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                  <th className="text-right">GST</th>
                  <th>Updated</th>
                  <th className="w-px" />
                </tr>
              </thead>
              <tbody>
                {shown.map((h) => (
                  <tr key={h.id}>
                    <td className="font-mono text-[13px]">{h.code}</td>
                    <td className="max-w-[28rem] text-[13px]">{h.description}</td>
                    <td className="text-right tabular-nums">{rate(h)}%</td>
                    <td className="muted whitespace-nowrap text-[13px]">{new Date(h.updatedAt).toLocaleDateString('en-IN')}</td>
                    <td className="whitespace-nowrap text-right">
                      <button type="button" className="btn btn-white px-2" onClick={() => edit(h)} aria-label={`Edit ${h.code}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      {superAdmin ? (
                        <button
                          type="button"
                          className="btn btn-white ml-1 px-2"
                          onClick={() => remove(h)}
                          aria-label={`Delete ${h.code}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
