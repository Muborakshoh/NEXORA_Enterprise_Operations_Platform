/**
 * Aggregations Page
 * 
 * Displays and manages data aggregations.
 */

import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAnalytics } from '../../app/providers/AnalyticsProvider';
import { AggregationCard } from '../../shared/components/analytics';
import { Button, Input, Modal } from '../../shared/components/ui';
import type { CreateAggregationRequest, AggregationType } from '../../core/types/analytics';

export function AggregationsPage() {
  const {
    aggregations,
    aggregationsTotal,
    isLoadingAggregations,
    loadAggregations,
    createAggregation,
    deleteAggregation,
    executeAggregation,
  } = useAnalytics();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateAggregationRequest>({
    name: '',
    description: '',
    data_source: '',
    metric: '',
    aggregation_type: 'sum',
  });

  useEffect(() => {
    loadAggregations();
  }, [loadAggregations]);

  const handleCreate = async () => {
    try {
      await createAggregation(formData);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        description: '',
        data_source: '',
        metric: '',
        aggregation_type: 'sum',
      });
    } catch (error) {
      console.error('Failed to create aggregation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this aggregation?')) return;
    
    try {
      await deleteAggregation(id);
    } catch (error) {
      console.error('Failed to delete aggregation:', error);
    }
  };

  const handleExecute = async (id: string) => {
    try {
      const result = await executeAggregation(id);
      alert(`Aggregation executed successfully. Found ${result.data.length} data points.`);
    } catch (error) {
      console.error('Failed to execute aggregation:', error);
    }
  };

  const filteredAggregations = aggregations.filter(aggregation =>
    aggregation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    aggregation.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Aggregations</h1>
          <p className="text-text-muted mt-1">
            Create and manage data aggregations ({aggregationsTotal} total)
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Create Aggregation
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search aggregations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Aggregations Grid */}
      {isLoadingAggregations ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">Loading aggregations...</div>
        </div>
      ) : filteredAggregations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-1 border border-border-subtle rounded-lg">
          <p className="text-text-muted mb-4">No aggregations found</p>
          <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Create First Aggregation
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAggregations.map(aggregation => (
            <AggregationCard 
              key={aggregation.id} 
              aggregation={aggregation}
              onDelete={() => handleDelete(aggregation.id)}
              onExecute={() => handleExecute(aggregation.id)}
            />
          ))}
        </div>
      )}

      {/* Create Aggregation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Aggregation"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Total Revenue"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Aggregation description"
              rows={3}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            />
          </div>
          <Input
            label="Data Source"
            value={formData.data_source}
            onChange={(e) => setFormData({ ...formData, data_source: e.target.value })}
            placeholder="sales_data"
          />
          <Input
            label="Metric"
            value={formData.metric}
            onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
            placeholder="revenue"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Aggregation Type
            </label>
            <select
              value={formData.aggregation_type}
              onChange={(e) => setFormData({ ...formData, aggregation_type: e.target.value as AggregationType })}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            >
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="count">Count</option>
              <option value="min">Minimum</option>
              <option value="max">Maximum</option>
              <option value="group_by">Group By</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} variant="primary" className="flex-1">
              Create Aggregation
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
