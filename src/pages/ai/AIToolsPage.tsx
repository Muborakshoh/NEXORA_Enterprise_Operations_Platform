/**
 * AI Tools Page
 * 
 * Manage AI tools and execute them.
 */

import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAI } from '../../app/providers/AIProvider';
import { ToolCard } from '../../shared/components/ai';
import { Button, Input, Modal } from '../../shared/components/ui';
import type { CreateToolRequest, ToolCategory } from '../../core/types/ai';

export function AIToolsPage() {
  const {
    tools,
    toolsTotal,
    isLoadingTools,
    loadTools,
    createTool,
    deleteTool,
    executeTool,
  } = useAI();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string>('');
  const [formData, setFormData] = useState<CreateToolRequest>({
    name: '',
    description: '',
    category: 'data_query',
    parameters: [],
    return_type: 'object',
  });

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  const handleCreate = async () => {
    try {
      await createTool(formData);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        description: '',
        category: 'data_query',
        parameters: [],
        return_type: 'object',
      });
    } catch (error) {
      console.error('Failed to create tool:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;
    
    try {
      await deleteTool(id);
    } catch (error) {
      console.error('Failed to delete tool:', error);
    }
  };

  const handleExecute = async (id: string) => {
    setSelectedToolId(id);
    setIsExecuteModalOpen(true);
  };

  const handleToolExecution = async () => {
    try {
      const result = await executeTool(selectedToolId, {});
      alert(`Tool executed successfully!\nExecution time: ${result.execution_time_ms}ms`);
      setIsExecuteModalOpen(false);
    } catch (error) {
      console.error('Failed to execute tool:', error);
    }
  };

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Tools</h1>
          <p className="text-text-muted mt-1">
            Manage and execute AI tools ({toolsTotal} total)
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Create Tool
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Tools Grid */}
      {isLoadingTools ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">Loading tools...</div>
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-1 border border-border-subtle rounded-lg">
          <p className="text-text-muted mb-4">No tools found</p>
          <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Create First Tool
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map(tool => (
            <ToolCard 
              key={tool.id} 
              tool={tool}
              onDelete={() => handleDelete(tool.id)}
              onExecute={() => handleExecute(tool.id)}
            />
          ))}
        </div>
      )}

      {/* Create Tool Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Tool"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="query_database"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tool description"
              rows={3}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ToolCategory })}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            >
              <option value="data_query">Data Query</option>
              <option value="analysis">Analysis</option>
              <option value="visualization">Visualization</option>
              <option value="export">Export</option>
              <option value="notification">Notification</option>
              <option value="automation">Automation</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <Input
            label="Return Type"
            value={formData.return_type}
            onChange={(e) => setFormData({ ...formData, return_type: e.target.value })}
            placeholder="object"
          />
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} variant="primary" className="flex-1">
              Create Tool
            </Button>
            <Button onClick={() => setIsCreateModalOpen(false)} variant="secondary" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Execute Tool Modal */}
      <Modal
        isOpen={isExecuteModalOpen}
        onClose={() => setIsExecuteModalOpen(false)}
        title="Execute Tool"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Execute the selected tool with default parameters.
          </p>
          <div className="bg-surface-2 border border-border-subtle rounded-lg p-4">
            <p className="text-xs text-text-muted mb-2">Tool:</p>
            <p className="text-sm text-text-primary font-mono">
              {tools.find(t => t.id === selectedToolId)?.name}
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleToolExecution} variant="primary" className="flex-1">
              Execute
            </Button>
            <Button onClick={() => setIsExecuteModalOpen(false)} variant="secondary" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
