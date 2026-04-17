# Setup local

## Requisitos

- Node.js 20+
- pnpm 10+
- PostgreSQL
- Redis

## Banco e cache local

1. Inicie o PostgreSQL local na porta `5432`
2. Inicie o Redis local na porta `6379`

## Backend

1. Copie `backend/.env.example` para `backend/.env`
2. Execute `pnpm install`
3. Rode `pnpm --filter @fashion-commerce/backend prisma:generate`
4. Rode `pnpm --filter @fashion-commerce/backend prisma:migrate`
5. Rode `pnpm --filter @fashion-commerce/backend prisma:seed`
6. Inicie com `pnpm --filter @fashion-commerce/backend dev`

## Frontend

1. Copie `frontend/.env.example` para `frontend/.env.local`
2. Inicie com `pnpm --filter @fashion-commerce/frontend dev`
3. Para a vitrine publica usar produtos reais, mantenha o backend ativo em `NEXT_PUBLIC_API_URL`

## Credencial inicial

- Email: `admin@fashionstore.com`
- Senha: `admin123`
  Troque essa senha apos o primeiro acesso administrativo.
