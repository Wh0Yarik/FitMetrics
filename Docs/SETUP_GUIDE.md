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

## 3. База данных (PostgreSQL) и хранилище (MinIO)

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

### Хранилище файлов (MinIO)

MinIO запускается рядом с БД и используется для хранения фото (S3-совместимо).

| Параметр | Значение |
| --- | --- |
| **Endpoint** | `http://localhost:9000` |
| **Console** | `http://localhost:9001` |
| **Access Key** | `minioadmin` |
| **Secret Key** | `minioadmin` |
| **Bucket** | `fitmetrics-media` |

### Переменные окружения (.env)
Файл: `packages/api/.env`

```dotenv
S3_ENDPOINT="http://localhost:9000"
S3_REGION="us-east-1"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="fitmetrics-media"
S3_PUBLIC_URL="http://localhost:9000/fitmetrics-media"
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

### Storage
| Метод | Путь | Описание | Доступ |
| --- | --- | --- | --- |
| `POST` | `/api/storage/presign` | Получить presigned URL для загрузки файла | Public |

## 8. Запуск сервисов и приложения

Ниже описаны два сценария: локальная разработка и запуск на сервере (Docker + HTTPS).

### 8.1 Локальная разработка (Mac/Windows)

1.  **База данных и MinIO (Docker)**
    ```bash
    docker-compose up -d
    ```

2.  **Бэкенд (API)**
    ```bash
    cd packages/api
    npm run dev
    ```
    По умолчанию слушает порт **3001** на `0.0.0.0`.

3.  **Мобильное приложение (Expo)**
    В новом окне терминала:
    ```bash
    cd packages/mobile
    npx expo start -c
    ```

### 8.2 Продакшн/сервер (Windows 11 + Docker)

**Где поднимать БД и бэкенд**
- **БД (PostgreSQL) и MinIO** поднимаются на сервере в Docker.
- **Бэкенд (API)** также поднимается на сервере в Docker.
- **Expo** запускается на локальном компьютере разработчика (Mac/PC), не на сервере.

1.  **Подготовка домена и портов**
    - A‑запись домена указывает на публичный IP сервера (например, `api.fitmetrics.ru`).
    - Открыты порты **80/443** на сервере и проброшены на роутере.

2.  **Запуск на сервере**
    ```cmd
    cd C:\Fitmetrics
    docker compose up -d --build
    ```

3.  **Проверка**
    ```cmd
    curl -i https://api.fitmetrics.ru/health
    ```

4.  **Подключение мобильного приложения**
    В `packages/mobile/.env` на машине разработчика:
    ```dotenv
    EXPO_PUBLIC_API_URL=https://api.fitmetrics.ru/api
    ```
    Затем перезапуск Expo:
    ```bash
    cd packages/mobile
    npx expo start -c
    ```

### 8.3 Доставка обновлений на продовый сервер

Рекомендуемый поток обновлений:

1.  **На сервере перейти в папку проекта**
    ```cmd
    cd C:\Fitmetrics
    ```

2.  **Получить последние изменения из Git**
    ```cmd
    git pull
    ```

3.  **Пересобрать и перезапустить контейнеры**
    ```cmd
    docker compose up -d --build
    ```

4.  **Если были изменения схемы БД (Prisma)**
    Выполните миграции:
    ```cmd
    docker exec -i fitmetrics_api npx prisma migrate deploy --schema ./prisma/schema.prisma
    ```

5.  **Проверка после деплоя**
    ```cmd
    curl -i https://api.fitmetrics.ru/health
    ```

Если нужно откатиться:
- Используйте `git log` и `git checkout <commit>` с последующим `docker compose up -d --build`.

### 8.4 Dev build для Android (EAS)

1.  **Логин в EAS**
    ```bash
    eas login
    ```

2.  **Инициализация конфигурации**
    ```bash
    cd packages/mobile
    eas build:configure
    ```

3.  **Сборка dev build**
    ```bash
    eas build --profile development --platform android
    ```

4.  **Установка на устройство**
    - Скачайте APK по ссылке из EAS и установите вручную.
    - Либо используйте `--distribution internal` для внутреннего распространения.


    # Руководство по тестированию и настройке (Setup Guide)

## 1. Тестовые учетные данные

Скрипт посева (`packages/api/prisma/seed.ts`) создает следующих пользователей для тестирования и заполняет данные за последние 2 недели (дневник, анкеты, замеры).
Используйте их для входа в приложение.

| Роль | Email | Пароль | Описание |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@fitmetrics.com` | `admin123` | Администратор системы |
| **Trainer** | `trainer@fitmetrics.com` | `trainer123` | Тренер с подтвержденным статусом |
| **Client** | `client1@fitmetrics.com` | `client123` | Клиент 1, привязан к тренеру выше |
| **Client** | `client2@fitmetrics.com` | `client123` | Клиент 2, привязан к тренеру выше |
| **Client** | `client3@fitmetrics.com` | `client123` | Клиент 3, привязан к тренеру выше |

### Инвайт-код для регистрации
Для тестирования регистрации **нового клиента** используйте следующий код:
*   **Код:** `START2025`
*   **Тренер:** `trainer@fitmetrics.com`

---

## 2. Управление Базой Данных

### Сброс и наполнение данными (Seeding)
Чтобы сбросить базу данных в исходное состояние и создать тестовых пользователей (Внимание: удаляет все существующие данные!):

```bash
# Выполнять из папки packages/api
cd packages/api
npx prisma db seed
```

### Применение миграций
Если вы изменили файл `schema.prisma`, создайте новую миграцию:

```bash
npx prisma migrate dev --name describe_your_changes
```

---

## 3. Запуск проекта

*   **Бэкенд:** `cd packages/api && npm run dev`
    *   Обычно запускается на порту **3001** (если 3000 занят).
    *   Слушает `0.0.0.0` для доступа с внешних устройств.

*   **Мобильное приложение:** `cd packages/mobile && npx expo start -c`
    *   Используйте флаг `-c` для очистки кеша при изменении `.env` или конфигов.

## 9. Устранение неполадок (Troubleshooting)

### Ошибка: Network Error (Axios)
Если приложение не может соединиться с сервером:
1. Убедитесь, что телефон и компьютер в одной Wi-Fi сети.
2. Проверьте IP адрес компьютера (`ifconfig` / `ipconfig`).
3. Обновите `packages/mobile/src/shared/api/client.ts` или `.env`.

### Ошибка: EADDRINUSE (Port 3001)
Порт занят. Найдите процесс и убейте его:
```bash
lsof -i :3001
kill -9 <PID>
```

### Ошибка: Invalid credentials
Если не удается войти:
1. Запустите скрипт посева: `npx ts-node packages/api/prisma/seed.ts`
2. Используйте `client@fitmetrics.com` / `client123`.
