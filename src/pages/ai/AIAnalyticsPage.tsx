/**
 * AI Analytics Page
 * 
 * Manage AI-powered analytics and insights.
 */

import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAI } from '../../app/providers/AIProvider';
import { AnalyticsCard } from '../../shared/components/ai';
import { Button, Input, Modal } from '../../shared/components/ui';
import type { CreateAnalyticsRequest, AnalyticsType } from '../../core/types/ai';

export function AIAnalyticsPage() {
  const {
    analytics,
    analyticsTotal,
    isLoadingAnalytics,
    loadAnalytics,
    createAnalytics,
    deleteAnalytics,
    runAnalytics,
  } = useAI();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateAnalyticsRequest>({
    name: '',
    description: '',
    type: 'trend_analysis',
    data_source: '',
    query: {
      metrics: [],
    },
  });

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleCreate = async () => {
    try {
      await createAnalytics(formData);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        description: '',
        type: 'trend_analysis',
        data_source: '',
        query: {
          metrics: [],
        },
      });
    } catch (error) {
      console.error('Failed to create analytics:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this analytics?')) return;
    
    try {
      await deleteAnalytics(id);
    } catch (error) {
      console.error('Failed to delete analytics:', error);
    }
  };

  const handleRun = async (id: string) => {
    try {
      const result = await runAnalytics(id);
      alert(`Analytics executed successfully!\nStatus: ${result.status}`);
    } catch (error) {
      console.error('Failed to run analytics:', error);
    }
  };

  const filteredAnalytics = analytics.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Analytics</h1>
          <p className="text-text-muted mt-1">
            AI-powered analytics and insights ({analyticsTotal} total)
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Create Analytics
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search analytics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Analytics Grid */}
      {isLoadingAnalytics ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">Loading analytics...</div>
        </div>
      ) : filteredAnalytics.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-1 border border-border-subtle rounded-lg">
          <p className="text-text-muted mb-4">No analytics found</p>
          <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Create First Analytics
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnalytics.map(item => (
            <AnalyticsCard 
              key={item.id} 
              analytics={item}
              onDelete={() => handleDelete(item.id)}
              onRun={() => handleRun(item.id)}
            />
          ))}
        </div>
      )}

      {/* Create Analytics Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Analytics"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Sales Trend Analysis"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Analytics description"
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
              onChange={(e) => setFormData({ ...formData, type: e.target.value as AnalyticsType })}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            >
              <option value="trend_analysis">Trend Analysis</option>
              <option value="pattern_detection">Pattern Detection</option>
              <option value="correlation_analysis">Correlation Analysis</option>
              <option value="forecasting">Forecasting</option>
              <option value="segmentation">Segmentation</option>
              <option value="clustering">Clustering</option>
            </select>
          </div>
          <Input
            label="Data Source"
            value={formData.query.metrics.join(', ')}
            onChange={(e) => setFormData({ 
              ...formData, 
              query: { ...formData.query, metrics: e.target.value.split(',').map(m => m.trim()) }
            })}
            placeholder="revenue, customers, orders"
          />
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} variant="primary" className="flex-1">
              Create Analytics
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
