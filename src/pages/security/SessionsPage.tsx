/**
 * Sessions Page
 * 
 * Displays and manages user sessions.
 */

import { useEffect, useState } from 'react';
import { Search, LogOut } from 'lucide-react';
import { useSecurity } from '../../app/providers/SecurityProvider';
import { SessionCard } from '../../shared/components/security';
import { Button, Input } from '../../shared/components/ui';

export function SessionsPage() {
  const {
    sessions,
    sessionsTotal,
    sessionsSummary,
    isLoadingSessions,
    loadSessions,
    revokeSession,
    revokeAllOtherSessions,
  } = useSecurity();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevoke = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;
    
    try {
      await revokeSession(sessionId);
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!confirm('Are you sure you want to revoke all other sessions? This will log you out from all other devices.')) return;
    
    try {
      await revokeAllOtherSessions();
    } catch (error) {
      console.error('Failed to revoke all other sessions:', error);
    }
  };

  const filteredSessions = sessions.filter(session => {
    return session.browser.toLowerCase().includes(searchQuery.toLowerCase()) ||
           session.os.toLowerCase().includes(searchQuery.toLowerCase()) ||
           session.ip_address.includes(searchQuery) ||
           session.device_type.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Active Sessions</h1>
          <p className="text-text-muted mt-1">
            Manage your active sessions ({sessionsTotal} total)
          </p>
        </div>
        {sessionsSummary.active > 1 && (
          <Button 
            variant="secondary" 
            onClick={handleRevokeAllOthers}
            icon={<LogOut className="w-4 h-4" />}
          >
            Revoke All Others
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Total Sessions</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{sessionsSummary.total}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Active</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{sessionsSummary.active}</p>
        </div>
        <div className="bg-surface-1 border border-border-subtle rounded-lg p-4">
          <p className="text-sm text-text-muted">Current</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{sessionsSummary.current}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Sessions Grid */}
      {isLoadingSessions ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">Loading sessions...</div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-1 border border-border-subtle rounded-lg">
          <p className="text-text-muted">No sessions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map(session => (
            <SessionCard 
              key={session.id} 
              session={session}
              onRevoke={() => handleRevoke(session.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
