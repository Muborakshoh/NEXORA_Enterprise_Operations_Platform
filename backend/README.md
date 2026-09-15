# NEXORA Backend - Laravel API

Backend для NEXORA - Enterprise Operations & Intelligence Platform, построенный на PHP 8.4+ и Laravel 11.

## 🚀 Технологии

- **PHP 8.4+**
- **Laravel 11**
- **PostgreSQL 16**
- **Redis**
- **RabbitMQ**
- **Docker & Docker Compose**

## 📦 Установка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd nexora
```

### 2. Настройка окружения

```bash
# Копировать .env.example в .env
cp backend/.env.example backend/.env

# Сгенерировать APP_KEY
cd backend
php artisan key:generate
```

### 3. Запуск через Docker

```bash
# Вернуться в корень проекта
cd ..

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

### 5. Оптимизация для production

```bash
# Очистить кэш
docker-compose exec app php artisan config:clear
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan route:clear

# Оптимизировать для production
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan view:cache
```

## 🔧 Конфигурация

### Переменные окружения (.env)

```env
# Application
APP_NAME=NEXORA
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=nexora
DB_USERNAME=nexora
DB_PASSWORD=secret

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# Frontend
FRONTEND_URL=http://localhost:5173
```

## 📚 API Endpoints

### Authentication

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "organization_name": "Acme Corp"
}
```

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

```http
GET /api/v1/auth/user
Authorization: Bearer {token}
```

### CRM - Customers

```http
GET /api/v1/customers
Authorization: Bearer {token}
```

```http
POST /api/v1/customers
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "status": "prospect"
}
```

```http
GET /api/v1/customers/{id}
Authorization: Bearer {token}
```

```http
PUT /api/v1/customers/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe Updated",
  "status": "active"
}
```

```http
DELETE /api/v1/customers/{id}
Authorization: Bearer {token}
```

### Finance - Transactions

```http
GET /api/v1/transactions
Authorization: Bearer {token}
```

```http
POST /api/v1/transactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "account_id": "uuid",
  "type": "income",
  "amount": 1000.00,
  "currency": "USD",
  "description": "Payment received",
  "date": "2024-01-15"
}
```

### Inventory - Products

```http
GET /api/v1/products
Authorization: Bearer {token}
```

```http
POST /api/v1/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "sku": "PROD-001",
  "name": "Product Name",
  "cost_price": 50.00,
  "selling_price": 100.00,
  "unit": "pcs"
}
```

### Infrastructure - Servers

```http
GET /api/v1/servers
Authorization: Bearer {token}
```

```http
POST /api/v1/servers
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Production Server",
  "hostname": "prod-01.example.com",
  "ip_address": "192.168.1.100",
  "os": "Ubuntu",
  "os_version": "22.04",
  "provider": "aws",
  "specs": {
    "cpu_cores": 8,
    "ram_gb": 32,
    "disk_gb": 500
  }
}
```

### Security - Events

```http
GET /api/v1/security/events
Authorization: Bearer {token}
```

```http
POST /api/v1/security/events/{id}/acknowledge
Authorization: Bearer {token}
```

```http
POST /api/v1/security/events/{id}/resolve
Authorization: Bearer {token}
Content-Type: application/json

{
  "resolution": "Issue resolved"
}
```

## 🗄️ Структура базы данных

### Модули

1. **Identity** - Пользователи, организации, аутентификация
2. **CRM** - Клиенты, лиды, сделки
3. **Finance** - Счета, транзакции, инвойсы, платежи
4. **Inventory** - Продукты, склады, поставщики, остатки
5. **Infrastructure** - Серверы, сервисы, Docker контейнеры
6. **Security** - События безопасности, аудит, сессии

### Основные таблицы

- `organizations` - Организации
- `users` - Пользователи
- `customers` - Клиенты
- `leads` - Лиды
- `deals` - Сделки
- `accounts` - Финансовые счета
- `transactions` - Транзакции
- `invoices` - Инвойсы
- `payments` - Платежи
- `products` - Продукты
- `warehouses` - Склады
- `stock` - Остатки
- `servers` - Серверы
- `services` - Сервисы
- `docker_containers` - Docker контейнеры
- `security_events` - События безопасности
- `audit_logs` - Аудит логи

## 🧪 Тестирование

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
# Просмотр логов приложения
docker-compose logs -f app

# Просмотр логов Nginx
docker-compose logs -f nginx

# Просмотр логов PostgreSQL
docker-compose logs -f postgres
```

### Очереди

```bash
# Проверить статус очередей
docker-compose exec app php artisan queue:monitor

# Перезапустить worker
docker-compose restart worker
```

## 🚀 Production Deployment

### 1. Настройка окружения

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.nexora.io
```

### 2. Оптимизация

```bash
# Оптимизировать автозагрузку
composer install --optimize-autoloader --no-dev

# Кэшировать конфигурацию
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 3. Безопасность

- Включить HTTPS
- Настроить firewall
- Обновить `.env` с production значениями
- Включить rate limiting
- Настроить CORS для production домена

### 4. Мониторинг

- Настроить health checks
- Настроить алерты
- Настроить backup базы данных
- Настроить логирование

## 📝 Документация API

API документация доступна через Swagger/OpenAPI:

```bash
# Сгенерировать документацию
docker-compose exec app php artisan l5-swagger:generate
```

Документация будет доступна по адресу: `http://localhost:8000/api/documentation`

## 🛠️ Разработка

### Полезные команды

```bash
# Создать модель
php artisan make:model ModelName -mcr

# Создать контроллер
php artisan make:controller ControllerName --api

# Создать миграцию
php artisan make:migration create_table_name_table

# Создать сеeder
php artisan make:seeder SeederName

# Создать тест
php artisan make:test TestName
```

### Code Style

```bash
# Проверить код
./vendor/bin/pint --test

# Исправить код
./vendor/bin/pint
```

### Static Analysis

```bash
# Запустить PHPStan
./vendor/bin/phpstan analyse
```

## 📦 Зависимости

### Основные

- `laravel/framework` - Laravel фреймворк
- `laravel/sanctum` - API аутентификация
- `predis/predis` - Redis клиент
- `php-amqplib/php-amqplib` - RabbitMQ клиент
- `spatie/laravel-permission` - Роли и разрешения
- `spatie/laravel-activitylog` - Activity logging

### Dev

- `phpunit/phpunit` - Тестирование
- `larastan/larastan` - Static analysis
- `laravel/pint` - Code style
- `pestphp/pest` - Testing framework

## 🔐 Безопасность

- Все пароли хэшируются с использованием bcrypt
- API аутентификация через Laravel Sanctum
- CORS настроен для frontend домена
- Rate limiting для API endpoints
- Валидация всех входных данных
- Защита от SQL injection (Eloquent ORM)
- Защита от XSS (Blade templates)
- CSRF protection для web routes

## 📄 Лицензия

MIT License

## 👥 Команда

- Backend Development
- API Design
- Database Architecture
- Security Implementation

## 📞 Поддержка

Для вопросов и поддержки:
- Email: support@nexora.io
- Documentation: https://docs.nexora.io

---

**NEXORA Backend** - Enterprise Operations & Intelligence Platform
