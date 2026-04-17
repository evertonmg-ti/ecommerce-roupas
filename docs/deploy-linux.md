# Deploy Linux

## Objetivo

Executar o projeto diretamente em um servidor Linux, com build nativo e servicos gerenciados pelo sistema operacional.

## Requisitos

- Ubuntu 22.04+ ou outra distribuicao Linux equivalente
- Node.js 20+
- pnpm 10+
- PostgreSQL
- Redis
- nginx
- systemd

## Estrutura recomendada no servidor

```text
/var/www/ecommerce
  backend
  frontend
```

## Instalacao base no Linux

```bash
sudo apt update
sudo apt install -y nginx redis-server postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
sudo corepack prepare pnpm@10.0.0 --activate
```

## Copia do projeto

Copie apenas o codigo-fonte para o servidor Linux. Nao copie `node_modules`, `.next` ou `dist` vindos do Windows.

## Backend

1. Copie `backend/.env.production.example` para `backend/.env`
2. Ajuste `DATABASE_URL`, segredos JWT e `CORS_ORIGIN`
3. Instale dependencias e gere o Prisma Client

```bash
cd /var/www/ecommerce
pnpm install
pnpm --filter @fashion-commerce/backend prisma:generate
pnpm --filter @fashion-commerce/backend prisma:migrate:deploy
pnpm --filter @fashion-commerce/backend build
```

## Frontend

1. Copie `frontend/.env.production.example` para `frontend/.env.production`
2. Ajuste `NEXT_PUBLIC_API_URL`
3. Gere o build

```bash
cd /var/www/ecommerce
pnpm --filter @fashion-commerce/frontend build
```

## Start manual para teste

Em um terminal:

```bash
cd /var/www/ecommerce/backend
pnpm start:prod
```

Em outro terminal:

```bash
cd /var/www/ecommerce/frontend
pnpm start
```

## Portas usadas

- Frontend: `127.0.0.1:3000`
- Backend: `127.0.0.1:4000`
- nginx publico: `80` e futuramente `443`

## nginx

Use o arquivo [infra/nginx/ecommerce.conf](/c:/projetos/ecommerce/infra/nginx/ecommerce.conf:1) como base.

Exemplo de instalacao:

```bash
sudo cp /var/www/ecommerce/infra/nginx/ecommerce.conf /etc/nginx/sites-available/ecommerce
sudo ln -s /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/ecommerce
sudo nginx -t
sudo systemctl reload nginx
```

## systemd

Use estes arquivos como base:

- [infra/systemd/ecommerce-backend.service](/c:/projetos/ecommerce/infra/systemd/ecommerce-backend.service:1)
- [infra/systemd/ecommerce-frontend.service](/c:/projetos/ecommerce/infra/systemd/ecommerce-frontend.service:1)

Instalacao:

```bash
sudo cp /var/www/ecommerce/infra/systemd/ecommerce-backend.service /etc/systemd/system/
sudo cp /var/www/ecommerce/infra/systemd/ecommerce-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ecommerce-backend ecommerce-frontend
sudo systemctl start ecommerce-backend ecommerce-frontend
```

## Ordem recomendada de deploy

1. Atualizar codigo no servidor
2. Rodar `pnpm install`
3. Rodar `pnpm --filter @fashion-commerce/backend prisma:generate`
4. Rodar `pnpm --filter @fashion-commerce/backend prisma:migrate:deploy`
5. Rodar `pnpm build:prod`
6. Reiniciar servicos com `sudo systemctl restart ecommerce-backend ecommerce-frontend`
7. Recarregar `nginx`

## Quando publicar novas rotas ou formularios admin

- Rebuild do backend: `pnpm --filter @fashion-commerce/backend build`
- Rebuild do frontend: `pnpm --filter @fashion-commerce/frontend build`
- Reinicio dos servicos: `sudo systemctl restart ecommerce-backend ecommerce-frontend`

## Observacoes

- O projeto fica compativel com Linux desde que o install e o build sejam feitos no proprio servidor Linux.
- O backend e o frontend nao devem ficar expostos diretamente na internet; o `nginx` deve ficar na frente.
- Para HTTPS, o passo natural depois e configurar `certbot` ou outro terminador TLS no `nginx`.
- Se quiser zero-downtime mais tarde, podemos trocar o `systemd` puro por `pm2` ou por um pipeline de deploy com health check.
- O painel admin agora usa login real no frontend com sessao em cookie HTTP-only.
