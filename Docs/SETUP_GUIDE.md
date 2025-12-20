# Документация по настройке и запуску FitMetrics

## 1. Предварительные требования
- **Node.js**: Версия 20.0.0 или выше (LTS).
- **Docker & Docker Compose**: Для запуска базы данных.
- **npm**: Пакетный менеджер.

## 2. Установка зависимостей
Выполните в корне проекта:
```bash
npm install
```

## 3. База данных (PostgreSQL)

Мы используем PostgreSQL 16, запущенный в Docker контейнере.

### Учетные данные (Local Development)
Эти данные заданы в `docker-compose.yml`.

| Параметр | Значение |
| --- | --- |
| **Host** | `localhost` |
| **Port** | `5432` |
| **User** | `fit_user` |
| **Password** | `password` |
| **Database** | `fitmetrics` |

### Строка подключения (.env)
Файл: `packages/api/.env`

```dotenv
DATABASE_URL="postgresql://fit_user:password@localhost:5432/fitmetrics?schema=public"
```

### Управление контейнером
```bash
# Запуск базы данных в фоне
docker-compose up -d

# Остановка
docker-compose down

# Полный сброс (с удалением данных)
docker-compose down -v
```

## 4. Работа с Prisma ORM

### Основные команды
Все команды выполняются из корня проекта или папки `packages/api`.

1.  **Генерация клиента** (после любых изменений в `schema.prisma`):
    ```bash
    npx prisma generate --schema=./packages/api/prisma/schema.prisma
    ```

2.  **Миграции** (применение изменений схемы к БД):
    ```bash
    cd packages/api && npx prisma migrate dev --name <название_миграции>
    ```

3.  **Просмотр данных (Prisma Studio)**:
    ```bash
    cd packages/api && npx prisma studio
    ```

4.  **Проверка подключения**:
    ```bash
    npx tsx packages/api/src/lib/check-db-connection.ts
    ```

## 5. История изменений (Log)
- **Инициализация**: Настроен монорепозиторий.
- **БД**: Подключен PostgreSQL через Docker.
- **ORM**: Настроена Prisma, создана схема (User, Client, Trainer, etc.).
- **Миграции**: Применена начальная миграция `init`.
- **Тест**: Проверено соединение с БД, загружены тестовые данные.

## 6. Структура проекта (Backend API)

Проект следует архитектуре **Controller-Service-Repository**:

- **`src/controllers/`**: Обработка HTTP запросов (req/res), валидация данных (Zod), вызов сервисов.
- **`src/services/`**: Бизнес-логика приложения, работа с базой данных (Prisma).
- **`src/routes/`**: Определение маршрутов (endpoints) и связывание их с контроллерами.
- **`src/schemas/`**: Схемы валидации данных (Zod).
- **`src/lib/`**: Инфраструктурный код и утилиты (DB client, Logger, JWT).
- **`src/middleware/`**: Промежуточное ПО (Error handling, Auth, Logging).

## 7. Реализованные API Endpoints

### Аутентификация (Auth)
| Метод | Путь | Описание | Доступ |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register-trainer` | Регистрация нового тренера | Public |
| `POST` | `/api/auth/login` | Вход в систему (получение токенов) | Public |
| `POST` | `/api/auth/register-client` | Регистрация клиента по инвайт-коду | Public |

### Инвайты (Invites)
| Метод | Путь | Описание | Доступ |
| --- | --- | --- | --- |
| `POST` | `/api/invites` | Генерация кода для приглашения клиента | Trainer |

### Health Check
| Метод | Путь | Описание | Доступ |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Проверка статуса сервера | Public |