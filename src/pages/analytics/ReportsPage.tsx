/**
 * Reports Page
 * 
 * Displays and manages analytics reports.
 */

import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAnalytics } from '../../app/providers/AnalyticsProvider';
import { ReportCard } from '../../shared/components/analytics';
import { Button, Input, Modal } from '../../shared/components/ui';
import type { CreateReportRequest, ReportType, ReportFormat } from '../../core/types/analytics';

export function ReportsPage() {
  const {
    reports,
    reportsTotal,
    isLoadingReports,
    loadReports,
    createReport,
    deleteReport,
    executeReport,
    toggleReportSchedule,
  } = useAnalytics();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateReportRequest>({
    name: '',
    description: '',
    type: 'on_demand',
    data_source: '',
    query: {
      metrics: [],
      dimensions: [],
    },
    format: ['pdf'],
  });

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleCreate = async () => {
    try {
      await createReport(formData);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        description: '',
        type: 'on_demand',
        data_source: '',
        query: {
          metrics: [],
          dimensions: [],
        },
        format: ['pdf'],
      });
    } catch (error) {
      console.error('Failed to create report:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await deleteReport(id);
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  const handleExecute = async (id: string) => {
    try {
      await executeReport(id);
      alert('Report execution started');
    } catch (error) {
      console.error('Failed to execute report:', error);
    }
  };

  const handleToggleSchedule = async (id: string, enabled: boolean) => {
    try {
      await toggleReportSchedule(id, enabled);
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
          <p className="text-text-muted mt-1">
            Create and manage analytics reports ({reportsTotal} total)
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Create Report
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Reports Grid */}
      {isLoadingReports ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">Loading reports...</div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-1 border border-border-subtle rounded-lg">
          <p className="text-text-muted mb-4">No reports found</p>
          <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Create First Report
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map(report => (
            <ReportCard 
              key={report.id} 
              report={report}
              onDelete={() => handleDelete(report.id)}
              onExecute={() => handleExecute(report.id)}
              onToggleSchedule={() => handleToggleSchedule(report.id, !report.schedule?.enabled)}
            />
          ))}
        </div>
      )}

      {/* Create Report Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Report"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Monthly Sales Report"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Report description"
              rows={3}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ReportType })}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            >
              <option value="on_demand">On Demand</option>
              <option value="scheduled">Scheduled</option>
              <option value="template">Template</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <Input
            label="Data Source"
            value={formData.data_source}
            onChange={(e) => setFormData({ ...formData, data_source: e.target.value })}
            placeholder="sales_data"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Export Formats
            </label>
            <div className="flex gap-2">
              {(['pdf', 'csv', 'excel', 'json'] as ReportFormat[]).map(format => (
                <label key={format} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.format?.includes(format)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ 
                          ...formData, 
                          format: [...(formData.format || []), format] 
                        });
                      } else {
                        setFormData({ 
                          ...formData, 
                          format: formData.format?.filter(f => f !== format) || []
                        });
                      }
                    }}
                    className="rounded border-border-subtle"
                  />
                  <span className="text-sm text-text-primary uppercase">{format}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} variant="primary" className="flex-1">
              Create Report
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
