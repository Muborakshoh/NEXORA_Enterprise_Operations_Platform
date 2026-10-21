/**
 * App Layout
 *
 * Main application layout with sidebar, top bar, notifications and user menu.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Settings, ChevronRight } from 'lucide-react';
import { apiClient } from '../core/api/client';
import { Outlet } from 'react-router-dom';

interface AppUser {
  id: string;
  name: string;
  email: string;
}

interface SecurityEvent {
  id: string;
  title: string;
  severity: string;
  created_at: string;
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/security/events': 'Security Events',
    '/security/audit': 'Audit Log',
    '/security/sessions': 'Sessions',
    '/security/suspicious': 'Suspicious Activity',
    '/analytics/dashboards': 'Analytics Dashboards',
    '/analytics/reports': 'Reports',
    '/analytics/exports': 'Exports',
    '/analytics/aggregations': 'Aggregations',
    '/ai/assistants': 'AI Assistants',
    '/ai/assistant': 'AI Assistant',
    '/ai/tools': 'AI Tools',
    '/ai/analytics': 'AI Analytics',
    '/ai/anomaly-detection': 'Anomaly Detection',
    '/ai/recommendations': 'Recommendations',
  };
  return titles[pathname] || 'NEXORA';
}

function getInitials(name: string): string {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);

  const [user, setUser] = useState<AppUser | null>(null);
  const [notifications, setNotifications] = useState<SecurityEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load user
  const loadUser = useCallback(async () => {
    try {
      const response = await apiClient.get<AppUser>('/auth/user');
      setUser(response.data);
    } catch {
      // User not authenticated, redirect to login
    }
  }, []);

  // Load notifications (critical + high security events)
  const loadNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get<{ events: SecurityEvent[] }>(
        '/security/events?severity=critical,high&per_page=5'
      );
      setNotifications(response.data.events || []);
      setUnreadCount(response.data.events?.length || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    loadUser();
    loadNotifications();
  }, [loadUser, loadNotifications]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore error
    }
    localStorage.removeItem('token');
    navigate('/login');
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  const navLinkClass = (path: string) =>
    `flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
      location.pathname === path
        ? 'text-text-primary bg-surface-2 font-medium'
        : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
    }`;

  const sectionTitleClass = 'px-3 text-xs font-semibold text-text-muted uppercase tracking-wider';

  return (
    <div className="flex h-screen bg-surface-0">
      {/* Sidebar */}
      <aside
        className={`${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 bg-surface-1 border-r border-border-subtle transition-transform duration-200 lg:translate-x-0 lg:static`}
      >
        <div className="p-4">
          <h1 className="text-xl font-bold text-text-primary">NEXORA</h1>
          <p className="text-xs text-text-muted">Enterprise Operations Platform</p>
        </div>
        <nav className="mt-6 px-2 overflow-y-auto h-[calc(100%-5rem)]">
          <div className="space-y-1">
            <Link to="/" className={navLinkClass('/')} onClick={() => setIsMobileMenuOpen(false)}>
              Dashboard
            </Link>

            <div className="pt-4">
              <p className={sectionTitleClass}>Security</p>
              <div className="mt-2 space-y-1">
                <Link to="/security/events" className={navLinkClass('/security/events')} onClick={() => setIsMobileMenuOpen(false)}>
                  Security Events
                </Link>
                <Link to="/security/audit" className={navLinkClass('/security/audit')} onClick={() => setIsMobileMenuOpen(false)}>
                  Audit Log
                </Link>
                <Link to="/security/sessions" className={navLinkClass('/security/sessions')} onClick={() => setIsMobileMenuOpen(false)}>
                  Sessions
                </Link>
                <Link to="/security/suspicious" className={navLinkClass('/security/suspicious')} onClick={() => setIsMobileMenuOpen(false)}>
                  Suspicious Activity
                </Link>
              </div>
            </div>

            <div className="pt-4">
              <p className={sectionTitleClass}>Analytics</p>
              <div className="mt-2 space-y-1">
                <Link to="/analytics/dashboards" className={navLinkClass('/analytics/dashboards')} onClick={() => setIsMobileMenuOpen(false)}>
                  Dashboards
                </Link>
                <Link to="/analytics/reports" className={navLinkClass('/analytics/reports')} onClick={() => setIsMobileMenuOpen(false)}>
                  Reports
                </Link>
                <Link to="/analytics/exports" className={navLinkClass('/analytics/exports')} onClick={() => setIsMobileMenuOpen(false)}>
                  Exports
                </Link>
                <Link to="/analytics/aggregations" className={navLinkClass('/analytics/aggregations')} onClick={() => setIsMobileMenuOpen(false)}>
                  Aggregations
                </Link>
              </div>
            </div>

            <div className="pt-4">
              <p className={sectionTitleClass}>AI</p>
              <div className="mt-2 space-y-1">
                <Link to="/ai/assistant" className={navLinkClass('/ai/assistant')} onClick={() => setIsMobileMenuOpen(false)}>
                  AI Assistant
                </Link>
                <Link to="/ai/tools" className={navLinkClass('/ai/tools')} onClick={() => setIsMobileMenuOpen(false)}>
                  Tools
                </Link>
                <Link to="/ai/analytics" className={navLinkClass('/ai/analytics')} onClick={() => setIsMobileMenuOpen(false)}>
                  AI Analytics
                </Link>
                <Link to="/ai/anomaly-detection" className={navLinkClass('/ai/anomaly-detection')} onClick={() => setIsMobileMenuOpen(false)}>
                  Anomaly Detection
                </Link>
                <Link to="/ai/recommendations" className={navLinkClass('/ai/recommendations')} onClick={() => setIsMobileMenuOpen(false)}>
                  Recommendations
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-surface-1 border-b border-border-subtle flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-text-primary truncate">{pageTitle}</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors"
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileOpen(false);
                }}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-surface-1 border border-border-subtle rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                    <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        className="text-xs text-accent-500 hover:text-accent-600"
                        onClick={markAllAsRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-text-muted">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((event) => (
                        <div
                          key={event.id}
                          className="px-4 py-3 border-b border-border-subtle last:border-0 hover:bg-surface-2 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                event.severity === 'critical'
                                  ? 'bg-red-500'
                                  : event.severity === 'high'
                                  ? 'bg-orange-500'
                                  : 'bg-yellow-500'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-primary truncate">{event.title}</p>
                              <p className="text-xs text-text-muted mt-0.5">
                                {new Date(event.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-border-subtle">
                    <Link
                      to="/security/events"
                      className="flex items-center justify-center gap-1 text-xs text-accent-500 hover:text-accent-600"
                      onClick={() => setIsNotificationsOpen(false)}
                    >
                      View all events
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                }}
                aria-label="Profile menu"
              >
                <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user ? getInitials(user.name) : 'A'}
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-surface-1 border border-border-subtle rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-subtle">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center text-white text-base font-medium">
                        {user ? getInitials(user.name) : 'A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {user?.name || 'Admin User'}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          {user?.email || 'admin@nexora.local'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/profile');
                      }}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/settings');
                      }}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </div>
                  <div className="border-t border-border-subtle py-1">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
