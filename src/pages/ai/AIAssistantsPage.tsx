/**
 * AI Assistants Page
 *
 * Manage AI assistants with API key validation and dynamic model loading.
 */

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Key, ExternalLink, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAI } from '../../app/providers/AIProvider';
import { AssistantCard } from '../../shared/components/ai';
import { Button, Input, Modal } from '../../shared/components/ui';
import type { CreateAssistantRequest } from '../../core/types/ai';

interface AIModelInfo {
  id: string;
  name: string;
  context_window?: number;
}

const API_PROVIDERS = [
  {
    id: 'groq' as const,
    name: 'Groq (Free tier available)',
    docsUrl: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_...',
    keyPrefix: 'gsk_',
    modelsUrl: 'https://api.groq.com/openai/v1/models',
    chatUrl: 'https://api.groq.com/openai/v1/chat/completions',
  },
  {
    id: 'gemini' as const,
    name: 'Google Gemini (Free tier)',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIza...',
    keyPrefix: 'AIza',
    modelsUrl: '',
    chatUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
  },
  {
    id: 'custom' as const,
    name: 'Custom OpenAI-compatible API',
    docsUrl: '',
    keyPlaceholder: 'Enter your API key',
    keyPrefix: '',
    modelsUrl: '',
    chatUrl: '',
  },
];

type ProviderId = typeof API_PROVIDERS[number]['id'];

export function AIAssistantsPage() {
  const {
    assistants,
    assistantsTotal,
    isLoadingAssistants,
    loadAssistants,
    createAssistant,
    deleteAssistant,
    updateAssistant,
  } = useAI();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('groq');
  const [apiKey, setApiKey] = useState('');
  const [keyStatus, setKeyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [keyError, setKeyError] = useState('');
  const [availableModels, setAvailableModels] = useState<AIModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const [formData, setFormData] = useState<CreateAssistantRequest>({
    name: '',
    description: '',
    model: '',
    capabilities: ['chat', 'analysis'],
    provider: 'groq' as 'groq' | 'gemini' | 'custom',
    api_key: '',
    config: {
      temperature: 0.7,
      max_tokens: 2048,
      context_window: 10,
      tools_enabled: true,
    },
  });

  useEffect(() => {
    loadAssistants();
  }, [loadAssistants]);

  const provider = API_PROVIDERS.find(p => p.id === selectedProvider) || API_PROVIDERS[0];

  // Validate API key by fetching models
  const validateApiKey = useCallback(async () => {
    if (!apiKey.trim()) {
      setKeyStatus('invalid');
      setKeyError('Please enter an API key');
      return;
    }

    setKeyStatus('checking');
    setKeyError('');
    setIsLoadingModels(true);

    try {
      let models: AIModelInfo[] = [];

      if (selectedProvider === 'groq') {
        const response = await fetch(provider.modelsUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}: Invalid API key`);
        }

        const data = await response.json();
        models = (data.data || [])
          .filter((m: any) => m.object === 'model' && m.active !== false)
          .map((m: any) => ({
            id: m.id,
            name: m.id,
            context_window: m.context_window,
          }))
          .sort((a: AIModelInfo, b: AIModelInfo) => a.name.localeCompare(b.name));
      } else if (selectedProvider === 'gemini') {
        // Gemini doesn't have a models endpoint with key auth, use known models
        models = [
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Free)' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
          { id: 'gemini-pro', name: 'Gemini Pro' },
        ];
        // Validate key with a simple request
        const testUrl = `${provider.chatUrl}/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const testResponse = await fetch(testUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] }),
        });
        if (!testResponse.ok) {
          const err = await testResponse.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${testResponse.status}: Invalid API key`);
        }
      } else {
        // Custom — user enters model manually
        models = [];
      }

      setAvailableModels(models);
      setKeyStatus('valid');

      // Auto-select first model
      if (models.length > 0 && !formData.model) {
        setFormData(prev => ({ ...prev, model: models[0].id, api_key: apiKey }));
      }
    } catch (err: any) {
      setKeyStatus('invalid');
      setKeyError(err.message || 'Failed to validate API key');
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [apiKey, selectedProvider, provider, formData.model]);

  const handleProviderChange = (pid: ProviderId) => {
    setSelectedProvider(pid);
    setApiKey('');
    setKeyStatus('idle');
    setKeyError('');
    setAvailableModels([]);
    setFormData(prev => ({
      ...prev,
      provider: pid,
      model: '',
      api_key: '',
    }));
  };

  const handleCreate = async () => {
    try {
      await createAssistant({ ...formData, api_key: apiKey, provider: selectedProvider });
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create assistant:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      model: '',
      capabilities: ['chat', 'analysis'],
      provider: 'groq' as 'groq' | 'gemini' | 'custom',
      api_key: '',
      config: {
        temperature: 0.7,
        max_tokens: 2048,
        context_window: 10,
        tools_enabled: true,
      },
    });
    setApiKey('');
    setKeyStatus('idle');
    setKeyError('');
    setAvailableModels([]);
    setSelectedProvider('groq');
  };

  const filteredAssistants = assistants.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canCreate = formData.name.trim() && formData.model && keyStatus === 'valid';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Assistants</h1>
          <p className="text-text-muted mt-1">
            Manage AI assistants and API keys ({assistantsTotal} total)
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Create Assistant
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Key className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-text-primary font-medium">Free AI API Providers</p>
            <p className="text-sm text-text-secondary mt-1">
              Groq offers a free tier with fast inference. Get your key at{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
                className="text-blue-500 hover:underline inline-flex items-center gap-1">
                console.groq.com <ExternalLink className="w-3 h-3" />
              </a>
              {' '}or use{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                className="text-blue-500 hover:underline inline-flex items-center gap-1">
                Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search assistants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Assistants Grid */}
      {isLoadingAssistants ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">Loading assistants...</div>
        </div>
      ) : filteredAssistants.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-1 border border-border-subtle rounded-lg">
          <p className="text-text-muted mb-4">No assistants found</p>
          <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Create First Assistant
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssistants.map(assistant => (
            <AssistantCard
              key={assistant.id}
              assistant={assistant}
              onChat={() => window.location.href = `/ai/assistant?assistant=${assistant.id}`}
              onDelete={() => {
                if (confirm('Delete this assistant?')) deleteAssistant(assistant.id);
              }}
              onEdit={() => updateAssistant(assistant.id, { is_active: !assistant.is_active })}
            />
          ))}
        </div>
      )}

      {/* Create Assistant Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); resetForm(); }}
        title="Create AI Assistant"
        size="lg"
      >
        <div className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              AI Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value as ProviderId)}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            >
              {API_PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My Assistant"
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What this assistant does"
              rows={2}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
            />
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-text-primary">
                API Key
              </label>
              {provider.docsUrl && (
                <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1">
                  Get key <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setKeyStatus('idle');
                  setKeyError('');
                }}
                placeholder={provider.keyPlaceholder}
                disabled={keyStatus === 'checking'}
                className={`flex-1 px-3 py-2 bg-surface-2 border rounded-lg text-text-primary focus:outline-none font-mono text-sm ${
                  keyStatus === 'valid' ? 'border-green-500' :
                  keyStatus === 'invalid' ? 'border-red-500' :
                  'border-border-subtle focus:border-accent-500'
                }`}
              />
              <Button
                onClick={validateApiKey}
                disabled={keyStatus === 'checking' || !apiKey.trim()}
                variant="secondary"
                className="whitespace-nowrap"
              >
                {keyStatus === 'checking' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : keyStatus === 'valid' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  'Check Key'
                )}
              </Button>
            </div>
            {keyStatus === 'invalid' && keyError && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 text-red-500" />
                <p className="text-xs text-red-500">{keyError}</p>
              </div>
            )}
            {keyStatus === 'valid' && (
              <div className="flex items-center gap-1 mt-1">
                <Check className="w-3 h-3 text-green-500" />
                <p className="text-xs text-green-500">API key is valid. {availableModels.length} models available.</p>
              </div>
            )}
            <p className="text-xs text-text-muted mt-1">
              Your API key is stored securely and never leaves your server.
            </p>
          </div>

          {/* Model Selection */}
          {selectedProvider === 'custom' ? (
            <Input
              label="Model ID"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="llama-3.1-70b, gpt-4, etc."
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Model {isLoadingModels && <Loader2 className="w-3 h-3 inline animate-spin ml-1" />}
              </label>
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                disabled={keyStatus !== 'valid' || availableModels.length === 0}
                className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500 disabled:opacity-50"
              >
                <option value="">{keyStatus === 'valid' ? 'Select a model' : 'Validate API key first'}</option>
                {availableModels.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}{m.context_window ? ` (${m.context_window.toLocaleString()} ctx)` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Capabilities */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Capabilities
            </label>
            <div className="flex flex-wrap gap-2">
              {(['chat', 'analysis', 'prediction', 'data_query', 'report_generation'] as const).map(cap => (
                <button
                  key={cap}
                  onClick={() => {
                    const caps = formData.capabilities?.includes(cap)
                      ? formData.capabilities.filter(c => c !== cap)
                      : [...(formData.capabilities || []), cap];
                    setFormData({ ...formData, capabilities: caps });
                  }}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    formData.capabilities?.includes(cap)
                      ? 'border-accent-500 bg-accent-500/10 text-accent-500'
                      : 'border-border-subtle text-text-muted hover:border-text-muted'
                  }`}
                >
                  {cap.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} variant="primary" className="flex-1" disabled={!canCreate}>
              Create Assistant
            </Button>
            <Button onClick={() => { setIsCreateModalOpen(false); resetForm(); }} variant="secondary" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
