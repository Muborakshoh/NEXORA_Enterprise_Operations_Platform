# NEXORA - Enterprise Operations & Intelligence Platform

**Полнофункциональная enterprise платформа для управления бизнесом, инфраструктурой и безопасностью.**

![NEXORA](https://img.shields.io/badge/version-1.0.0-blue)
![PHP](https://img.shields.io/badge/PHP-8.4+-purple)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Laravel](https://img.shields.io/badge/Laravel-11-red)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Обзор

NEXORA объединяет все аспекты управления enterprise операцией в единую платформу:

- **Business** - CRM, Finance, Inventory
- **Infrastructure** - Servers, Docker, Monitoring
- **Security** - Events, Audit, Sessions
- **Analytics** - Dashboards, Reports
- **AI** - Assistant, Anomaly Detection, Recommendations

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│              TypeScript + Tailwind CSS                   │
│         Vite + React Router + Context API                │
└─────────────────────────────────────────────────────────┘
                           ↓
                    REST API (JSON)
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  Backend (Laravel)                       │
│              PHP 8.4+ / Laravel 11                       │
│         Sanctum + PostgreSQL + Redis                     │
└─────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
   PostgreSQL          Redis            RabbitMQ
   (Database)         (Cache)          (Queue)
```

## 🚀 Быстрый старт

### Требования

- Docker & Docker Compose
- Node.js 18+ (для локальной разработки)
- PHP 8.4+ (для локальной разработки)

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd nexora
```

### 2. Настройка окружения

```bash
# Backend
cp backend/.env.example backend/.env
cd backend
php artisan key:generate
cd ..

# Frontend (опционально для локальной разработки)
cp .env.example .env
```

### 3. Запуск через Docker

```bash
# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps
```

### 4. Инициализация базы данных

```bash
# Выполнить миграции
docker-compose exec app php artisan migrate

# Запустить сидеры (опционально)
docker-compose exec app php artisan db:seed
```

### 5. Доступ к приложению

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/v1
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

## 📦 Структура проекта

```
nexora/
├── backend/                    # Laravel Backend
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/
│   │   │       └── Api/V1/    # API Controllers
│   │   └── Models/            # Eloquent Models
│   ├── config/                # Configuration files
│   ├── database/
│   │   └── migrations/        # Database migrations
│   ├── routes/
│   │   └── api.php           # API routes
│   ├── docker/               # Docker configs
│   ├── Dockerfile
│   └── README.md
│
├── src/                       # React Frontend
│   ├── app/
│   │   └── providers/        # Context providers
│   ├── core/
│   │   ├── api/             # API clients
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utilities
│   ├── pages/               # Page components
│   ├── shared/              # Shared components
│   └── layouts/             # Layout components
│
├── docker-compose.yml        # Docker orchestration
├── README.md                 # This file
└── docs/                     # Documentation
```

## 🎨 Модули

### 1. Identity & Organization

- ✅ Регистрация и аутентификация
- ✅ Управление организациями
- ✅ Multi-tenancy
- ✅ Роли и разрешения

### 2. CRM

- ✅ Управление клиентами
- ✅ Лиды и сделки
- ✅ Pipeline
- ✅ Timeline

### 3. Finance

- ✅ Финансовые счета
- ✅ Транзакции
- ✅ Инвойсы
- ✅ Платежи

### 4. Inventory

- ✅ Продукты
- ✅ Склады
- ✅ Поставщики
- ✅ Остатки и движения

### 5. Infrastructure

- ✅ Серверы
- ✅ Сервисы
- ✅ Docker контейнеры
- ✅ Мониторинг и алерты

### 6. Security

- ✅ События безопасности
- ✅ Аудит логи
- ✅ Сессии пользователей
- ✅ Подозрительная активность

### 7. Analytics

- ✅ Дашборды
- ✅ Отчеты
- ✅ Экспорт данных
- ✅ Агрегации

### 8. AI

- ✅ AI Assistant
- ✅ Инструменты
- ✅ AI Analytics
- ✅ Обнаружение аномалий
- ✅ Рекомендации

## 🔐 Аутентификация

### Регистрация

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "organization_name": "Acme Corp"
  }'
```

### Вход

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Использование токена

```bash
curl -X GET http://localhost:8000/api/v1/customers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📚 API Документация

### Основные endpoints

#### CRM
- `GET /api/v1/customers` - Список клиентов
- `POST /api/v1/customers` - Создать клиента
- `GET /api/v1/customers/{id}` - Получить клиента
- `PUT /api/v1/customers/{id}` - Обновить клиента
- `DELETE /api/v1/customers/{id}` - Удалить клиента

#### Finance
- `GET /api/v1/transactions` - Список транзакций
- `POST /api/v1/transactions` - Создать транзакцию
- `GET /api/v1/transactions/{id}` - Получить транзакцию

#### Inventory
- `GET /api/v1/products` - Список продуктов
- `POST /api/v1/products` - Создать продукт
- `GET /api/v1/products/{id}` - Получить продукт

#### Infrastructure
- `GET /api/v1/servers` - Список серверов
- `POST /api/v1/servers` - Создать сервер
- `GET /api/v1/servers/{id}` - Получить сервер

#### Security
- `GET /api/v1/security/events` - Список событий безопасности
- `POST /api/v1/security/events/{id}/acknowledge` - Подтвердить событие
- `POST /api/v1/security/events/{id}/resolve` - Закрыть событие

Полная документация API доступна в `backend/README.md`

## 🛠️ Разработка

### Frontend

```bash
# Установить зависимости
npm install

# Запустить dev server
npm run dev

# Собрать для production
npm run build

# Запустить тесты
npm test
```

### Backend

```bash
# Установить зависимости
cd backend
composer install

# Запустить миграции
php artisan migrate

# Запустить dev server
php artisan serve

# Запустить тесты
php artisan test
```

### Docker

```bash
# Запустить все сервисы
docker-compose up -d

# Остановить все сервисы
docker-compose down

# Просмотр логов
docker-compose logs -f app

# Выполнить команду в контейнере
docker-compose exec app php artisan migrate
```

## 🧪 Тестирование

### Frontend

```bash
# Запустить все тесты
npm test

# Запустить с покрытием
npm run test:coverage

# Запустить в watch mode
npm run test:watch
```

### Backend

```bash
# Запустить все тесты
docker-compose exec app php artisan test

# Запустить с покрытием
docker-compose exec app php artisan test --coverage

# Запустить конкретный тест
docker-compose exec app php artisan test --filter CustomerControllerTest
```

## 📊 Мониторинг

### Логи

```bash
# Frontend логи
npm run dev

# Backend логи
docker-compose logs -f app

# Nginx логи
docker-compose logs -f nginx

# Database логи
docker-compose logs -f postgres
```

### Health Checks

```bash
# Проверить backend
curl http://localhost:8000/api/health

# Проверить database
docker-compose exec postgres pg_isready

# Проверить Redis
docker-compose exec redis redis-cli ping
```

## 🚀 Production Deployment

### 1. Настройка окружения

```env
# Backend .env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.nexora.io

# Database
DB_PASSWORD=strong_password_here

# Redis
REDIS_PASSWORD=strong_password_here

# RabbitMQ
RABBITMQ_PASSWORD=strong_password_here
```

### 2. Оптимизация

```bash
# Backend оптимизация
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan view:cache

# Frontend сборка
npm run build
```

### 3. Безопасность

- ✅ Включить HTTPS
- ✅ Настроить firewall
- ✅ Обновить все пароли
- ✅ Включить rate limiting
- ✅ Настроить CORS
- ✅ Включить backup

### 4. Мониторинг

- Настроить health checks
- Настроить алерты
- Настроить backup базы данных
- Настроить логирование

## 📖 Документация

- [Backend Documentation](backend/README.md)
- [Frontend Documentation](src/README.md)
- [API Documentation](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🔒 Безопасность

- ✅ Password hashing (bcrypt)
- ✅ API authentication (Sanctum)
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection protection (Eloquent)
- ✅ XSS protection (Blade)
- ✅ CSRF protection

## 📈 Performance

### Frontend
- Bundle size: ~350KB (gzipped: ~95KB)
- Initial load: < 500ms
- Time to interactive: < 1s

### Backend
- API response time: < 200ms
- Database queries: Optimized with indexes
- Caching: Redis for frequently accessed data

## 🤝 Вклад в проект

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE) для деталей

## 👥 Команда

- **Backend Development** - PHP/Laravel
- **Frontend Development** - React/TypeScript
- **Database Architecture** - PostgreSQL
- **Security Implementation** - Authentication & Authorization
- **DevOps** - Docker & Deployment

## 📞 Поддержка

- **Email**: support@nexora.io
- **Documentation**: https://docs.nexora.io
- **Issues**: https://github.com/your-org/nexora/issues

## 🎯 Roadmap

### Phase 14: Advanced Features
- Real-time collaboration
- Advanced analytics dashboards
- Mobile app development
- API gateway implementation
- Microservices architecture

### Phase 15: Enterprise Features
- Multi-region deployment
- Advanced RBAC
- Compliance reporting
- Advanced audit trails
- Enterprise SSO integration

## 🌟 Особенности

- ✅ **Modular Architecture** - Чистая архитектура с разделением на модули
- ✅ **Type Safety** - Full TypeScript coverage
- ✅ **API First** - RESTful API design
- ✅ **Multi-tenancy** - Поддержка нескольких организаций
- ✅ **Real-time** - WebSocket support (готово к внедрению)
- ✅ **Scalable** - Designed for scale
- ✅ **Secure** - Enterprise-grade security
- ✅ **Testable** - Comprehensive test coverage
- ✅ **Documented** - Full documentation

---

**NEXORA** - Enterprise Operations & Intelligence Platform

Сделано с ❤️ для enterprise операций
