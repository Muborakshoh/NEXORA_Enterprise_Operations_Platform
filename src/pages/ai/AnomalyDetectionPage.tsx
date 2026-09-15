/**
 * Anomaly Detection Page
 * 
 * Manage anomaly detectors and view detected anomalies.
 */

import { useEffect, useState } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { useAI } from '../../app/providers/AIProvider';
import { AnomalyDetectorCard, AnomalyCard } from '../../shared/components/ai';
import { Button, Input, Modal } from '../../shared/components/ui';
import type { CreateAnomalyDetectorRequest, AnomalyAlgorithm } from '../../core/types/ai';

export function AnomalyDetectionPage() {
  const {
    detectors,
    detectorsTotal,
    anomalies,
    anomaliesTotal,
    anomaliesSummary,
    isLoadingDetectors,
    isLoadingAnomalies,
    loadDetectors,
    loadAnomalies,
    createDetector,
    deleteDetector,
    toggleDetector,
    resolveAnomaly,
    updateAnomalyStatus,
  } = useAI();

  const [activeTab, setActiveTab] = useState<'detectors' | 'anomalies'>('detectors');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateAnomalyDetectorRequest>({
    name: '',
    description: '',
    data_source: '',
    metric: '',
    algorithm: 'statistical',
    config: {
      sensitivity: 'medium',
      window_size: 24,
    },
  });

  useEffect(() => {
    loadDetectors();
    loadAnomalies();
  }, [loadDetectors, loadAnomalies]);

  const handleCreate = async () => {
    try {
      await createDetector(formData);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        description: '',
        data_source: '',
        metric: '',
        algorithm: 'statistical',
        config: {
          sensitivity: 'medium',
          window_size: 24,
        },
      });
    } catch (error) {
      console.error('Failed to create detector:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this detector?')) return;
    
    try {
      await deleteDetector(id);
    } catch (error) {
      console.error('Failed to delete detector:', error);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await toggleDetector(id, enabled);
    } catch (error) {
      console.error('Failed to toggle detector:', error);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveAnomaly(id);
    } catch (error) {
      console.error('Failed to resolve anomaly:', error);
    }
  };

  const handleMarkFalsePositive = async (id: string) => {
    try {
      await updateAnomalyStatus(id, 'false_positive');
    } catch (error) {
      console.error('Failed to mark as false positive:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Anomaly Detection</h1>
          <p className="text-text-muted mt-1">
            Detect and manage anomalies in your data
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Create Detector
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Detectors</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{detectorsTotal}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Anomalies</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{anomaliesTotal}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Detected</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{anomaliesSummary.detected}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Investigating</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{anomaliesSummary.investigating}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Confirmed</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{anomaliesSummary.confirmed}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Resolved</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{anomaliesSummary.resolved}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('detectors')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'detectors'
              ? 'text-accent-500 border-b-2 border-accent-500'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Detectors ({detectorsTotal})
        </button>
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'anomalies'
              ? 'text-accent-500 border-b-2 border-accent-500'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Anomalies ({anomaliesTotal})
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'detectors' ? (
        isLoadingDetectors ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-text-muted">Loading detectors...</div>
          </div>
        ) : detectors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-surface-1 border border-border-subtle rounded-lg">
            <p className="text-text-muted mb-4">No detectors found</p>
            <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
              Create First Detector
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {detectors.map(detector => (
              <AnomalyDetectorCard 
                key={detector.id} 
                detector={detector}
                onDelete={() => handleDelete(detector.id)}
                onToggle={() => handleToggle(detector.id, !detector.enabled)}
              />
            ))}
          </div>
        )
      ) : (
        isLoadingAnomalies ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-text-muted">Loading anomalies...</div>
          </div>
        ) : anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-surface-1 border border-border-subtle rounded-lg">
            <AlertTriangle className="w-12 h-12 text-green-500 mb-4" />
            <p className="text-text-muted">No anomalies detected</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map(anomaly => (
              <AnomalyCard 
                key={anomaly.id} 
                anomaly={anomaly}
                onResolve={() => handleResolve(anomaly.id)}
                onMarkFalsePositive={() => handleMarkFalsePositive(anomaly.id)}
              />
            ))}
          </div>
        )
      )}

      {/* Create Detector Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Anomaly Detector"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="CPU Usage Detector"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detector description"
              rows={3}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            />
          </div>
          <Input
            label="Data Source"
            value={formData.data_source}
            onChange={(e) => setFormData({ ...formData, data_source: e.target.value })}
            placeholder="server_metrics"
          />
          <Input
            label="Metric"
            value={formData.metric}
            onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
            placeholder="cpu_usage"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Algorithm
            </label>
            <select
              value={formData.algorithm}
              onChange={(e) => setFormData({ ...formData, algorithm: e.target.value as AnomalyAlgorithm })}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            >
              <option value="statistical">Statistical</option>
              <option value="machine_learning">Machine Learning</option>
              <option value="time_series">Time Series</option>
              <option value="isolation_forest">Isolation Forest</option>
              <option value="autoencoder">Autoencoder</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Sensitivity
            </label>
            <select
              value={formData.config?.sensitivity}
              onChange={(e) => setFormData({ 
                ...formData, 
                config: { ...formData.config!, sensitivity: e.target.value as any }
              })}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} variant="primary" className="flex-1">
              Create Detector
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
