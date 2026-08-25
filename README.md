# Distribuidora SaaS

Plataforma SaaS multiempresa para gestão de distribuidoras: vendas (PDV), estoque, compras, financeiro, caixa, clientes, fornecedores, entregas, relatórios e um painel de Super Admin para administrar a plataforma (empresas, planos, assinaturas, métricas).

## Stack

- **Next.js 16** (App Router, Server Actions) + **TypeScript** + **React 19**
- **PostgreSQL** + **Prisma 6**
- **NextAuth v5** (Credentials) para autenticação
- **Tailwind CSS v4** + componentes próprios no estilo shadcn/ui
- **Zod** + **React Hook Form** para validação de formulários
- **Vitest** para testes
- PWA (manifest + service worker) com fila offline para vendas

## Arquitetura multi-tenant

- Banco compartilhado (`Shared Database + Tenant Isolation`): toda entidade de negócio tem `companyId`.
- O tenant nunca é confiado a partir do cliente: `lib/tenant/tenant-context.ts#getCurrentTenant()` resolve a empresa a partir da sessão autenticada (NextAuth), nunca de um parâmetro enviado pelo frontend.
- Toda consulta/ação de servidor filtra explicitamente por `companyId`; um registro de outra empresa retorna "não encontrado" (nunca vaza dados).
- Permissões por papel (`ADMINISTRADOR`, `GERENTE`, `VENDEDOR`, `ESTOQUISTA`, `FINANCEIRO`, `MOTORISTA`) em `lib/permissions/`, verificadas no servidor em toda Server Action (`requirePermission`/`requireRead`).
- Super Admin (`UserType.SUPER_ADMIN`) não pertence a nenhuma empresa e administra a plataforma em `/admin` (visual distinto do painel da empresa).

## Rodando localmente

```bash
# 1. Banco de dados
createdb distribuidora
cp .env.example .env # ajuste DATABASE_URL se necessário

# 2. Instalar dependências
npm install

# 3. Rodar migrations
npx prisma migrate deploy

# 4. Popular dados de demonstração (3 empresas, planos, super admin)
npm run db:seed

# 5. Rodar em desenvolvimento
npm run dev
```

> Este ambiente sandbox não permite `prisma migrate dev` (requer TTY). Para novas alterações de schema use `scripts/migrate.sh <nome>`, que gera e aplica a migration de forma não interativa.

### Login de demonstração

Todas as senhas de demonstração são `Demo@123`.

| Papel | E-mail |
|---|---|
| Super Admin (`/admin/login`) | `italoplaylist@gmail.com` |
| Administrador (Distribuidora Silva, plano Professional) | `administrador@prof1.com` |
| Administrador (Atacado Rio, plano Starter, em trial) | `administrador@start2.com` |
| Administrador (Premium Distribuidora, plano Premium) | `administrador@premium3.com` |

Cada empresa também possui usuários `gerente`, `vendedor`, `estoquista`, `financeiro` e `motorista` seguindo o mesmo padrão de e-mail (`<papel>@<slug><n>.com`).

## Scripts

```bash
npm run dev         # desenvolvimento
npm run build        # build de produção
npm run lint          # eslint
npm run typecheck   # tsc --noEmit
npm run test          # vitest (inclui testes de isolamento multi-tenant)
npm run db:seed     # popular dados de demonstração
```

## Estrutura

```text
app/
  admin/(protected)/   painel Super Admin (dashboard, empresas, planos, assinaturas, auditoria)
  admin/login/         login exclusivo do Super Admin
  dashboard/           painel da empresa (vendas, estoque, compras, financeiro, entregas, relatórios, configurações)
  api/                 rotas de API (NextAuth, webhook de pagamento)
features/              lógica de cada módulo: queries, server actions e componentes de UI
lib/
  auth/                 configuração do NextAuth
  tenant/                 resolução de tenant a partir da sessão + erros padronizados
  permissions/          permissões por papel + guards de servidor
  payments/              interface PaymentProvider (desacoplada de gateway específico)
  audit/                    gravação de auditoria
prisma/                schema, migrations e seed de demonstração
tests/                    testes de permissões e isolamento multi-tenant
```

## Deploy com Docker

O `Dockerfile` (multi-stage: build com devDependencies + runtime enxuto) espera três variáveis de build/runtime:

```bash
docker build \
  --build-arg DATABASE_URL="postgresql://..." \
  --build-arg NEXTAUTH_SECRET="..." \
  --build-arg NEXTAUTH_URL="https://seu-dominio.com" \
  -t distribuidora .

docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://seu-dominio.com" \
  distribuidora
```

No boot do container, `npx prisma migrate deploy` roda automaticamente antes do `next start` — seguro de repetir a cada deploy, pois é um no-op quando o schema já está em dia. Nenhuma página consulta o banco durante o build (todas as rotas que leem dados são `export const dynamic = "force-dynamic"` ou já dinâmicas por padrão), então o `DATABASE_URL` de build não precisa apontar para um banco já migrado/alcançável — ele só é usado caso algum código toque o Prisma durante o build.

## Preparado para o futuro

- **Pagamentos**: `lib/payments/provider.ts` define uma interface `PaymentProvider` (hoje com um provider manual/demo); plugar Stripe, Mercado Pago ou Asaas é implementar essa interface, sem tocar no restante da aplicação.
- **Webhooks**: `app/api/webhooks/payment/route.ts` já valida assinatura antes de processar qualquer payload.
- **Offline**: `lib/offline/sales-queue.ts` guarda vendas feitas sem conexão e sincroniza automaticamente quando a internet volta.
