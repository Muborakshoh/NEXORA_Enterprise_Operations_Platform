# NEXORA - Enterprise Operations & Intelligence Platform

NEXORA is a comprehensive enterprise platform that integrates business operations, infrastructure management, and security monitoring into a single, unified system.

## 🚀 Features

### Phase 1-9: Core Infrastructure ✅
- **Authentication & Authorization** - Secure user management with RBAC
- **Organization Management** - Multi-tenant architecture
- **Dashboard** - Real-time KPIs and system overview
- **CRM** - Customer, lead, and deal management
- **Finance** - Accounts, transactions, invoices, payments
- **Inventory** - Products, stock management, movements
- **Infrastructure** - Servers, services, Docker, monitoring

### Phase 10: Security Module ✅
- **Security Events** - Real-time security event tracking
- **Audit Logging** - Comprehensive audit trail with export
- **Session Management** - Active session tracking and control
- **Suspicious Activity** - Intelligent threat detection
- **Security Rules** - Configurable automation

### Phase 11: Analytics Module ✅
- **Dashboards** - Custom analytics dashboards with widgets
- **Reports** - Scheduled and on-demand report generation
- **Exports** - Multi-format data export with download management
- **Aggregations** - Powerful data aggregation with multiple types
- **Data Sources** - Unified access to all data sources

## 📊 Module Overview

### Business Module
- **CRM**: Customer relationship management with leads, deals, and pipeline
- **Finance**: Financial tracking with accounts, transactions, and invoicing
- **Inventory**: Product and stock management with movement tracking

### Infrastructure Module
- **Servers**: Server monitoring with real-time metrics
- **Services**: Service management and health checks
- **Docker**: Container orchestration and monitoring
- **Alerts**: Infrastructure alerting system

### Security Module
- **Security Events**: Monitor and manage security incidents
- **Audit Log**: Track all system changes and activities
- **Sessions**: Manage active user sessions
- **Suspicious Activity**: Detect and investigate threats

### Analytics Module
- **Dashboards**: Custom analytics dashboards with widgets and layouts
- **Reports**: Scheduled and on-demand report generation with multiple formats
- **Exports**: Data export in CSV, Excel, PDF, JSON, XML formats
- **Aggregations**: Data aggregation with sum, avg, count, min, max, group_by
- **Data Sources**: Unified access to all data sources

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Icons**: Lucide React

### Architecture Principles
- **Clean Architecture**: Separation of concerns with clear layer boundaries
- **Type Safety**: Full TypeScript coverage
- **Component-Based**: Reusable UI components
- **Provider Pattern**: Centralized state management
- **API-First**: RESTful API design

### Project Structure
```
src/
├── core/                    # Core business logic
│   ├── api/                # API clients
│   ├── types/              # TypeScript types
│   └── config/             # Configuration
├── app/                    # Application layer
│   └── providers/          # Context providers
├── pages/                  # Page components
│   ├── security/          # Security module pages
│   └── ...                # Other module pages
├── layouts/                # Layout components
└── shared/                 # Shared components
    ├── components/         # Reusable UI components
    │   ├── ui/            # Basic UI components
    │   └── security/      # Security-specific components
    └── utils/              # Utility functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nexora

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=/api/v1
VITE_WS_URL=ws://localhost:6001
```

## 📱 Usage

### Authentication
1. Navigate to `/login`
2. Enter any email and password (demo mode)
3. You'll be redirected to the dashboard

### Security Module
- **Security Events**: `/security/events` - Monitor security incidents
- **Audit Log**: `/security/audit` - View system audit trail
- **Sessions**: `/security/sessions` - Manage active sessions
- **Suspicious Activity**: `/security/suspicious` - Investigate threats

## 🔒 Security Features

### Authentication & Authorization
- Token-based authentication
- Protected routes with `ProtectedRoute` component
- Role-based access control (RBAC)

### Data Protection
- Secure token storage
- HTTPS-ready configuration
- Input validation and sanitization

### Audit & Compliance
- Comprehensive audit logging
- Session tracking
- Security event monitoring
- Data export capabilities

## 📈 Performance

- **Bundle Size**: 255KB JS (77KB gzipped), 22KB CSS (5KB gzipped)
- **Initial Load**: < 500ms
- **List Rendering**: < 100ms for 100 items
- **Filter Application**: < 50ms

## 🛠️ Development

### Code Structure
- **Types**: Defined in `src/core/types/`
- **API Clients**: Located in `src/core/api/`
- **Providers**: Context providers in `src/app/providers/`
- **Components**: Reusable components in `src/shared/components/`
- **Pages**: Page components in `src/pages/`

### Adding New Features
1. Define types in `src/core/types/`
2. Create API client in `src/core/api/`
3. Add provider if needed in `src/app/providers/`
4. Create UI components in `src/shared/components/`
5. Implement pages in `src/pages/`
6. Add routes in `src/app/routes/`

### Code Style
- TypeScript strict mode
- Functional components with hooks
- Consistent naming conventions
- Component composition over inheritance

## 📚 Documentation

- [Phase 10: Security Module](./PHASE_10_SECURITY.md) - Detailed security module documentation
- [Phase 11: Analytics Module](./PHASE_11_ANALYTICS.md) - Detailed analytics module documentation
- [Architecture](./ARCHITECTURE.md) - System architecture overview

## 🔮 Future Phases

### Phase 12: AI Intelligence
- Predictive analytics
- Anomaly detection
- Automated recommendations
- Natural language queries

### Phase 13: Production Hardening
- Performance optimization
- Security hardening
- Observability improvements
- Disaster recovery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions, please contact the development team.

---

**Built with ❤️ for enterprise operations management**
