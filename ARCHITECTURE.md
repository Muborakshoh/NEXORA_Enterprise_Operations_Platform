# NEXORA Architecture

## Overview

NEXORA follows a clean architecture pattern with clear separation of concerns, type safety, and scalable design principles.

## Architecture Layers

### 1. Core Layer (`src/core/`)
The core layer contains business logic, types, API clients, and utilities.

#### Types (`src/core/types/`)
- **security.ts**: Security events, audit logs, sessions, suspicious activities
- **analytics.ts**: Dashboards, reports, exports, aggregations, data sources
- **ai.ts**: AI assistants, tools, analytics, anomaly detection, recommendations
- **infrastructure.ts**: Servers, services, Docker, alerts
- **inventory.ts**: Products, warehouses, suppliers, stock
- **finance.ts**: Accounts, transactions, invoices, payments
- **crm.ts**: Customers, leads, deals, pipeline
- **organization.ts**: Organizations, memberships
- **dashboard.ts**: KPIs, activities, attention items
- **identity.ts**: Users, authentication, sessions

#### API Clients (`src/core/api/`)
- **client.ts**: Base HTTP client with authentication
- **security.ts**: Security module API
- **analytics.ts**: Analytics module API
- **ai.ts**: AI module API
- **infrastructure.ts**: Infrastructure module API
- **inventory.ts**: Inventory module API
- **finance.ts**: Finance module API
- **crm.ts**: CRM module API
- **organization.ts**: Organization API
- **dashboard.ts**: Dashboard API
- **identity.ts**: Identity API

#### Utilities (`src/core/utils/`)
- **performance.ts**: Performance optimization (debouncing, throttling, virtual scrolling, caching)
- **security.ts**: Security hardening (CSP, rate limiting, CSRF, sanitization, audit logging)
- **observability.ts**: Monitoring and tracing (logging, metrics, distributed tracing, error tracking)
- **backup.ts**: Backup and recovery (backup manager, recovery points, data migration, integrity checks)

#### Configuration (`src/core/config/`)
- Centralized configuration management
- Environment-specific settings
- Feature flags

### 2. Application Layer (`src/app/`)
The application layer manages global state and cross-cutting concerns.

#### Providers (`src/app/providers/`)
- **SecurityProvider**: Security events, audit, sessions, suspicious activity
- **AnalyticsProvider**: Dashboards, reports, exports, aggregations, data sources
- **AIProvider**: AI assistants, tools, analytics, anomaly detection, recommendations
- **InfrastructureProvider**: Servers, services, containers, alerts
- **InventoryProvider**: Products, warehouses, stock, movements
- **FinanceProvider**: Accounts, transactions, invoices, payments
- **CRMProvider**: Customers, leads, deals, pipeline
- **OrganizationProvider**: Organizations, memberships
- **DashboardProvider**: KPIs, activities, attention items
- **AuthProvider**: Authentication, user management
- **ThemeProvider**: Theme management

### 3. Presentation Layer (`src/pages/`, `src/shared/components/`)
The presentation layer handles UI rendering and user interactions.

#### Pages (`src/pages/`)
- **security/**: Security events, audit, sessions, suspicious activity
- **infrastructure/**: Servers, services, containers, alerts
- **inventory/**: Products, warehouses, suppliers, stock
- **finance/**: Accounts, transactions, invoices, payments
- **crm/**: Customers, leads, deals, pipeline
- **organization/**: Organizations, members, settings
- **DashboardPage.tsx**: Main dashboard
- **LoginPage.tsx**: Authentication
- **PlaceholderPage.tsx**: Module placeholders

#### Components (`src/shared/components/`)
- **ui/**: Basic UI components (Button, Input, Card, Badge, Spinner, Modal)
- **security/**: Security-specific components
- **infrastructure/**: Infrastructure-specific components
- **inventory/**: Inventory-specific components
- **finance/**: Finance-specific components
- **crm/**: CRM-specific components
- **ProtectedRoute.tsx**: Route protection

#### Layouts (`src/layouts/`)
- **AppLayout.tsx**: Main application layout with sidebar and top bar

## Design Patterns

### 1. Provider Pattern
Used for global state management with React Context API.

```typescript
// Provider definition
export function SecurityProvider({ children }: { children: ReactNode }) {
  const [securityEvents, setSecurityEvents] = useState([]);
  // ... state and methods
  
  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

// Hook for consumption
export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return context;
}
```

### 2. Repository Pattern
API clients act as repositories for data access.

```typescript
export const securityEventsApi = {
  list: (filters?) => apiClient.get('/security/events', { params: filters }),
  get: (id) => apiClient.get(`/security/events/${id}`),
  acknowledge: (id) => apiClient.post(`/security/events/${id}/acknowledge`),
  // ...
};
```

### 3. Component Composition
Components are composed rather than inherited.

```typescript
<SecurityEventCard 
  event={event}
  onAcknowledge={() => handleAcknowledge(event.id)}
  onResolve={() => handleResolve(event.id)}
/>
```

### 4. Type-Driven Development
All data structures are strongly typed.

```typescript
interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  status: SecurityEventStatus;
  // ...
}
```

## Data Flow

### Unidirectional Data Flow
```
User Action → Provider Method → API Client → Backend → Response → State Update → UI Re-render
```

### State Management
1. **Local State**: Component-level state with `useState`
2. **Context State**: Global state with Context API
3. **Server State**: Managed through API clients

## Security Architecture

### Authentication
- Token-based authentication
- Secure token storage
- Automatic token refresh
- Protected routes

### Authorization
- Role-based access control (RBAC)
- Permission-based route protection
- Organization-scoped data access

### Data Protection
- HTTPS-ready configuration
- Input validation
- XSS prevention
- CSRF protection (when backend implemented)

## Performance Optimization

### Code Splitting
- Route-based code splitting with React Router
- Lazy loading for heavy components

### Memoization
- `useMemo` for expensive calculations
- `useCallback` for stable function references
- `React.memo` for component memoization

### Bundle Optimization
- Tree shaking with Vite
- Minimal dependencies
- Optimized imports

## Scalability

### Module-Based Architecture
Each module is self-contained with:
- Types
- API client
- Provider
- Components
- Pages

### Extensibility
- Easy to add new modules
- Consistent patterns across modules
- Reusable components

### Multi-Tenancy
- Organization-scoped data
- Tenant isolation
- Shared resources where appropriate

## AI Module

### Architecture

```
AIProvider
  ↓
AI API (REST)
  ↓
Assistants, Tools, Analytics, Anomaly Detection, Recommendations
  ↓
UI Components (Cards, Chat, Modals)
```

### AI Components

**AssistantCard**
- Assistant name and model
- Capabilities display
- Active/inactive status
- Chat, edit, delete actions

**ToolCard**
- Tool name and category
- Description and parameters
- Enabled/disabled status
- Execute, edit, delete actions

**AnalyticsCard**
- Analytics name and type
- Data source and schedule
- Last run timestamp
- Run, toggle schedule, edit, delete actions

**AnomalyDetectorCard**
- Detector name and algorithm
- Data source and metric
- Sensitivity level
- Toggle, edit, delete actions

**AnomalyCard**
- Anomaly value and expected value
- Deviation percentage
- Severity and status
- Investigate, resolve, false positive actions

**RecommendationCard**
- Recommendation title and description
- Impact and confidence
- Category and type
- Accept, reject, mark implemented actions

### AI Provider

Manages:
- AI assistants with chat functionality
- AI tools with execution
- AI analytics with insights
- Anomaly detectors and anomalies
- Recommendations with workflow
- AI statistics

### AI Features

**AI Assistants**
- Multiple AI models (GPT-4, GPT-3.5, Claude, Gemini)
- Conversation management
- Tool integration
- Custom system prompts

**AI Tools**
- Controlled execution
- Parameter validation
- Execution history
- Multiple categories

**AI Analytics**
- Trend analysis
- Pattern detection
- Correlation analysis
- Forecasting
- Segmentation
- Clustering

**Anomaly Detection**
- Multiple algorithms (statistical, ML, time series, isolation forest, autoencoder)
- Configurable sensitivity
- Real-time detection
- Workflow management

**Recommendations**
- AI-generated insights
- Impact and confidence scoring
- Accept/reject workflow
- Implementation tracking

---

## Testing Strategy

### Unit Tests
- Type definitions
- Utility functions
- API clients

### Integration Tests
- Provider behavior
- Component interactions
- Route protection

### E2E Tests
- User workflows
- Critical paths
- Security scenarios

## Deployment

### Build Process
```bash
npm run build
```

### Output
- Optimized JavaScript bundle
- Minified CSS
- Static assets
- Ready for CDN deployment

### Environment Configuration
- Development: Hot reload, source maps
- Production: Optimized, minified, no source maps

## Monitoring & Observability

### Client-Side
- Error boundaries
- Performance monitoring
- User activity tracking

### Integration Points
- Backend API monitoring
- Security event logging
- Audit trail

## Future Enhancements

### Phase 11: Analytics
- Advanced dashboards
- Custom reports
- Data visualization

### Phase 12: AI
- Predictive analytics
- Anomaly detection
- Automated recommendations

### Phase 13: Production Hardening
- Performance optimization
- Security hardening
- Observability improvements

## Conclusion

NEXORA's architecture is designed for:
- **Maintainability**: Clear separation of concerns
- **Scalability**: Module-based design
- **Type Safety**: Full TypeScript coverage
- **Performance**: Optimized rendering and state management
- **Security**: Comprehensive security measures
- **Extensibility**: Easy to add new features

The architecture follows industry best practices and is ready for enterprise-scale deployment.
