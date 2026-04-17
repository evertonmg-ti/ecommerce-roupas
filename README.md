# Fashion Commerce Platform

Monorepo de e-commerce para loja de roupas com frontend e backend separados, foco em performance, arquitetura modular, painel administrativo e responsividade.

## Stack sugerida

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: NestJS + TypeScript
- Banco: PostgreSQL
- ORM: Prisma
- Cache e filas: Redis
- Infra local: PostgreSQL + Redis

## Estrutura

- `frontend`: vitrine, login, painel administrativo e componentes reutilizaveis
- `backend`: API modular com autenticacao, produtos, usuarios e pedidos
- `infra`: servicos auxiliares e configuracao de proxy
- `docs`: visao geral da arquitetura

## Proximos passos

1. Instalar dependencias com `pnpm install`
2. Subir PostgreSQL e Redis localmente
3. Configurar `.env` no frontend e backend
4. Rodar `pnpm dev`

## Producao em Linux

- Rode build e runtime diretamente no servidor Linux com `Node.js`, `pnpm`, `systemd` e `nginx`
- Copie os exemplos de ambiente de `frontend` e `backend` e ajuste os valores
- Guia completo em `docs/deploy-linux.md`
