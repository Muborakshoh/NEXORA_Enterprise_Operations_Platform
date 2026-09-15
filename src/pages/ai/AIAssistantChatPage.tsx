/**
 * AI Assistant Chat Page
 * 
 * Chat interface for AI assistants.
 */

import React, { useEffect, useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useAI } from '../../app/providers/AIProvider';
import { Button, Input } from '../../shared/components/ui';
import type { AIMessage } from '../../core/types/ai';

export function AIAssistantChatPage() {
  const { assistants, loadAssistants, sendMessage } = useAI();
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAssistants();
  }, [loadAssistants]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedAssistantId) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessage(selectedAssistantId, inputMessage, conversationId);
      setMessages(prev => [...prev, response.message]);
      if (!conversationId) {
        setConversationId(response.conversation_id);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedAssistant = assistants.find(a => a.id === selectedAssistantId);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Assistant</h1>
          <p className="text-text-muted mt-1">Chat with AI assistants</p>
        </div>
        <div>
          <select
            value={selectedAssistantId}
            onChange={(e) => {
              setSelectedAssistantId(e.target.value);
              setMessages([]);
              setConversationId(undefined);
            }}
            className="px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-accent-500"
          >
            <option value="">Select assistant</option>
            {assistants.filter(a => a.is_active).map(assistant => (
              <option key={assistant.id} value={assistant.id}>
                {assistant.name} ({assistant.model})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedAssistantId ? (
        <div className="flex-1 flex items-center justify-center bg-surface-1 border border-border-subtle rounded-lg">
          <div className="text-center">
            <Bot className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">Select an assistant to start chatting</p>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-surface-1 border border-border-subtle rounded-lg p-4 mb-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Bot className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-muted">Start a conversation with {selectedAssistant?.name}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role !== 'user' && (
                      <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-purple-500" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-accent-500 text-white'
                          : 'bg-surface-2 text-text-primary'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-text-muted'}`}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="bg-surface-2 rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 px-3 py-2 bg-surface-2 border border-border-subtle rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-500 resize-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              icon={<Send className="w-4 h-4" />}
            >
              Send
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
