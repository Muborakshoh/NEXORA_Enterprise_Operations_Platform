/**
 * Dashboards Page
 * 
 * Displays and manages analytics dashboards.
 */

import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAnalytics } from '../../app/providers/AnalyticsProvider';
import { DashboardCard } from '../../shared/components/analytics';
import { Button, Input, Modal } from '../../shared/components/ui';
import type { CreateDashboardRequest } from '../../core/types/analytics';

export function DashboardsPage() {
  const {
    dashboards,
    dashboardsTotal,
    isLoadingDashboards,
    loadDashboards,
    createDashboard,
    deleteDashboard,
    setDefaultDashboard,
  } = useAnalytics();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateDashboardRequest>({
    name: '',
    description: '',
    widgets: [],
    is_default: false,
  });

  useEffect(() => {
    loadDashboards();
  }, [loadDashboards]);

  const handleCreate = async () => {
    try {
      await createDashboard(formData);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        description: '',
        widgets: [],
        is_default: false,
      });
    } catch (error) {
      console.error('Failed to create dashboard:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return;
    
    try {
      await deleteDashboard(id);
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultDashboard(id);
    } catch (error) {
      console.error('Failed to set default dashboard:', error);
    }
  };

  const filteredDashboards = dashboards.filter(dashboard =>
    dashboard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dashboard.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboards</h1>
          <p className="text-text-muted mt-1">
            Create and manage custom analytics dashboards ({dashboardsTotal} total)
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Create Dashboard
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search dashboards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Dashboards Grid */}
      {isLoadingDashboards ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">Loading dashboards...</div>
        </div>
      ) : filteredDashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-1 border border-border-subtle rounded-lg">
          <p className="text-text-muted mb-4">No dashboards found</p>
          <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Create First Dashboard
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDashboards.map(dashboard => (
            <DashboardCard 
              key={dashboard.id} 
              dashboard={dashboard}
              onDelete={() => handleDelete(dashboard.id)}
              onSetDefault={() => handleSetDefault(dashboard.id)}
            />
          ))}
        </div>
      )}

      {/* Create Dashboard Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Dashboard"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Sales Dashboard"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Dashboard description"
              rows={3}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="rounded border-border-subtle"
            />
            <label htmlFor="is_default" className="text-sm text-text-primary">
              Set as default dashboard
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} variant="primary" className="flex-1">
              Create Dashboard
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
