/**
 * Exports Page
 * 
 * Displays and manages data exports.
 */

import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAnalytics } from '../../app/providers/AnalyticsProvider';
import { ExportCard } from '../../shared/components/analytics';
import { Button, Input, Modal } from '../../shared/components/ui';
import type { CreateExportRequest, ExportType, ExportFormat } from '../../core/types/analytics';

export function ExportsPage() {
  const {
    exports: exportsList,
    exportsTotal,
    isLoadingExports,
    loadExports,
    createExport,
    deleteExport,
    downloadExport,
  } = useAnalytics();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateExportRequest>({
    name: '',
    type: 'data',
    format: 'csv',
    data_source: '',
  });

  useEffect(() => {
    loadExports();
  }, [loadExports]);

  const handleCreate = async () => {
    try {
      await createExport(formData);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        type: 'data',
        format: 'csv',
        data_source: '',
      });
    } catch (error) {
      console.error('Failed to create export:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this export?')) return;
    
    try {
      await deleteExport(id);
    } catch (error) {
      console.error('Failed to delete export:', error);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const blob = await downloadExport(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${id}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download export:', error);
    }
  };

  const filteredExports = exportsList.filter(exportItem =>
    exportItem.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Exports</h1>
          <p className="text-text-muted mt-1">
            Manage data exports and downloads ({exportsTotal} total)
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Create Export
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search exports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Exports Grid */}
      {isLoadingExports ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">Loading exports...</div>
        </div>
      ) : filteredExports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-1 border border-border-subtle rounded-lg">
          <p className="text-text-muted mb-4">No exports found</p>
          <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Create First Export
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExports.map(exportItem => (
            <ExportCard 
              key={exportItem.id} 
              exportData={exportItem}
              onDelete={() => handleDelete(exportItem.id)}
              onDownload={() => handleDownload(exportItem.id)}
            />
          ))}
        </div>
      )}

      {/* Create Export Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Export"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Customer Data Export"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ExportType })}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            >
              <option value="data">Data Export</option>
              <option value="report">Report Export</option>
              <option value="dashboard">Dashboard Export</option>
              <option value="custom">Custom Export</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Format
            </label>
            <select
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value as ExportFormat })}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            >
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
              <option value="pdf">PDF</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
            </select>
          </div>
          <Input
            label="Data Source"
            value={formData.data_source}
            onChange={(e) => setFormData({ ...formData, data_source: e.target.value })}
            placeholder="customers"
          />
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} variant="primary" className="flex-1">
              Create Export
            </Button>
            <Button onClick={() => setIsCreateModalOpen(false)} variant="secondary" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
