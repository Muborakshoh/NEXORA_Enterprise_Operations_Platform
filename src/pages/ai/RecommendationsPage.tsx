/**
 * Recommendations Page
 * 
 * View and manage AI-generated recommendations.
 */

import { useEffect, useState } from 'react';
import { Search, Lightbulb, RefreshCw } from 'lucide-react';
import { useAI } from '../../app/providers/AIProvider';
import { RecommendationCard } from '../../shared/components/ai';
import { Button, Input } from '../../shared/components/ui';

export function RecommendationsPage() {
  const {
    recommendations,
    recommendationsTotal,
    recommendationsSummary,
    isLoadingRecommendations,
    loadRecommendations,
    acceptRecommendation,
    rejectRecommendation,
    markImplemented,
    refreshRecommendations,
  } = useAI();

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleAccept = async (id: string) => {
    try {
      await acceptRecommendation(id);
    } catch (error) {
      console.error('Failed to accept recommendation:', error);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    
    try {
      await rejectRecommendation(id, reason || undefined);
    } catch (error) {
      console.error('Failed to reject recommendation:', error);
    }
  };

  const handleMarkImplemented = async (id: string) => {
    try {
      await markImplemented(id);
    } catch (error) {
      console.error('Failed to mark as implemented:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRecommendations();
      await loadRecommendations();
    } catch (error) {
      console.error('Failed to refresh recommendations:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredRecommendations = recommendations.filter(rec =>
    rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Recommendations</h1>
          <p className="text-text-muted mt-1">
            AI-generated recommendations for your organization ({recommendationsTotal} total)
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          icon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
          disabled={isRefreshing}
        >
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Total</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{recommendationsSummary.total}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">New</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{recommendationsSummary.new}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Accepted</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{recommendationsSummary.accepted}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Rejected</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{recommendationsSummary.rejected}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Implemented</p>
          <p className="text-2xl font-bold text-purple-500 mt-1">{recommendationsSummary.implemented}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search recommendations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Recommendations Grid */}
      {isLoadingRecommendations ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">Loading recommendations...</div>
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-1 border border-border-subtle rounded-lg">
          <Lightbulb className="w-12 h-12 text-text-muted mb-4" />
          <p className="text-text-muted">No recommendations available</p>
          <p className="text-xs text-text-muted mt-2">Click refresh to generate new recommendations</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecommendations.map(recommendation => (
            <RecommendationCard 
              key={recommendation.id} 
              recommendation={recommendation}
              onAccept={() => handleAccept(recommendation.id)}
              onReject={() => handleReject(recommendation.id)}
              onMarkImplemented={() => handleMarkImplemented(recommendation.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
