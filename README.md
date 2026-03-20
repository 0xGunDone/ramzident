# Ramzident

Сайт стоматологической клиники на Next.js с публичной витриной, CMS-админкой и SEO/OG генерацией.

## Технологии

- Next.js (App Router), React, TypeScript
- Prisma + SQLite (текущая БД проекта)
- NextAuth (credentials-based admin auth)
- Tailwind CSS
- Sharp (оптимизация изображений и OG)

## Что есть в проекте

- Публичные страницы: главная, услуги, документы, SEO metadata, sitemap/robots
- Админка `/admin/*`: секции, услуги, врачи, отзывы, FAQ, медиа, настройки
- Загрузка и сжатие изображений
- Генерация статических OG изображений
- AI SEO endpoint для изображений (OpenRouter)

## Локальный запуск

1. Установить зависимости:

```bash
npm install
```

2. Подготовить окружение:

```bash
cp .env.example .env
```

3. Сгенерировать Prisma client и засеять данные:

```bash
npx prisma generate
npm run db:seed
```

4. Запустить dev-сервер:

```bash
npm run dev
```

## Скрипты

- `npm run dev` — локальная разработка
- `npm run build` — production build
- `npm run start` — запуск production build
- `npm run lint` — ESLint
- `npm run test` — unit/smoke tests (Node test runner)
- `npm run db:seed` — заполнение БД стартовыми данными
- `npm run og:generate` — регенерация статических OG-изображений

## Безопасность и API

- Все admin API routes защищены сессией (`withAuth`)
- Для mutating admin API включен in-memory rate-limit
- Для логина включен отдельный rate-limit
- Ошибки API унифицированы и не возвращают внутренние stack trace
- `openRouterApiKey` хранится в БД в зашифрованном виде, если задан `SETTINGS_ENCRYPTION_KEY` (если ключ не задан, значение сохраняется без шифрования)
- В ответе `/api/admin/settings` ключ OpenRouter не возвращается в открытом виде

## Переменные окружения

Минимально важные:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `SITE_URL`
- `NEXTAUTH_SECRET`
- `SETTINGS_ENCRYPTION_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Полный шаблон: [.env.example](./.env.example)

## Тесты и CI

- Локально: `npm run test`
- CI workflow: [/.github/workflows/ci.yml](./.github/workflows/ci.yml)
  - `npm ci`
  - `npm run lint`
  - `npm run test`
  - `npm run build`

## Деплой

Подробная инструкция для production (nginx + systemd): [DEPLOYMENT.md](./DEPLOYMENT.md)
