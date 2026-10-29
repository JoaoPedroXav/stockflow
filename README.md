# StockFlow

Sistema acadêmico de gestão de estoque com interface em português, persistência no Supabase PostgreSQL e cache real no Upstash Redis.

## Problema e objetivo

Pequenos catálogos precisam de uma visão confiável sobre quantidades, valor do estoque e mudanças no saldo. O StockFlow permite manter produtos, registrar entradas e saídas com histórico e consultar indicadores sem substituir o banco de dados por um cache temporário.

> **Uso local:** esta versão não possui autenticação. Execute apenas na sua máquina. Não publique as rotas na internet sem autenticação e autorização.

## Funcionalidades

- Dashboard com total de produtos, unidades, valor em reais, categorias e produtos recentes.
- CRUD de produtos com busca por nome, filtro de categoria, validação e confirmação de exclusão.
- Entradas e saídas de estoque com motivo, saldo anterior, novo saldo e histórico pesquisável.
- Bloqueio de saídas maiores que o saldo disponível; atualização do saldo e registro do histórico na mesma transação.
- Tela Desempenho com tempo de resposta, última consulta e histórico; a API permite demonstrar HIT/MISS, TTL e chave do Redis.
- Contadores persistentes de HITs e MISSes com `INCR` atômico.
- Botões para atualizar a visão e recalcular os indicadores.
- Estados vazios e tratamento explícito de falhas do Supabase ou Redis.

## Tecnologias

Next.js App Router, React, TypeScript, Tailwind CSS, Hugeicons, Instrument Sans, `@supabase/supabase-js`, PostgreSQL no Supabase e `@upstash/redis`. Requer Node.js 22 ou superior.

## Arquitetura

O navegador chama somente as rotas `/api/*` do Next.js. As chaves secretas são usadas exclusivamente nos módulos de servidor. O Supabase mantém os produtos e o histórico de movimentações. O Redis armazena temporariamente o objeto de indicadores em `stockflow:dashboard:v2` por 120 segundos, além dos contadores e metadados de monitoramento.

Na consulta do dashboard, a API faz `GET` no Redis. Uma chave existente produz **HIT**. Sem chave, consulta o Supabase, calcula os indicadores e faz `SET` com expiração de 120 segundos, produzindo **MISS**. Cada resultado incrementa seu contador por `INCR`. Cadastro, edição e exclusão de produtos, além das movimentações, fazem `DEL` na chave após a escrita no Supabase. Se o Redis falhar durante uma consulta, a API consulta diretamente o Supabase e mostra **UNAVAILABLE**; nenhum HIT/MISS fictício é registrado. Se uma escrita no banco ocorrer e a invalidação falhar, a API retorna o resultado salvo com um aviso: o cache anterior pode permanecer até expirar.

Uma função PostgreSQL bloqueia a linha do produto, verifica o saldo, altera a quantidade e insere a movimentação na mesma transação. A edição cadastral do produto não altera a quantidade; para isso, use a tela **Movimentações**. A quantidade inicial informada no cadastro é o saldo de abertura e não gera movimentação retroativa.

As consultas usam `Cache-Control: no-store`, `fetch(..., { cache: 'no-store' })` e rotas dinâmicas para evitar que o cache do Next.js ou do navegador esconda as operações.

## Estrutura

```text
database/schema.sql              Tabela de produtos, RLS e permissões
database/stock_movements.sql     Histórico e função transacional de entrada/saída
src/app/api/products              Rotas de listagem e cadastro
src/app/api/products/[id]         Rotas de edição e exclusão
src/app/api/movements             Rotas de histórico e registro de movimentações
src/app/api/dashboard             Cálculo e cache dos indicadores
src/app/api/cache                 Status e limpeza do cache
src/lib/supabase.ts               Acesso ao PostgreSQL
src/lib/redis.ts                  Acesso ao Upstash Redis
src/lib/dashboard.ts              Cálculo dos indicadores
src/lib/validation.ts             Validações do backend
src/components/stockflow-app.tsx  Interface de produtos e indicadores
src/components/movements-view.tsx Tela e formulário de movimentações
```

## Instalação e execução no Windows

1. Instale [Node.js 22 ou superior](https://nodejs.org/).
2. Abra o PowerShell na pasta do projeto e execute `npm install`.
3. Copie `.env.example` para `.env.local` com `Copy-Item .env.example .env.local`.
4. Configure os quatro valores descritos abaixo.
5. Execute `npm run dev` e abra `http://localhost:3000`.
6. Para validar a compilação: `npm run typecheck`, `npm run lint` e `npm run build`.

### Supabase

1. Crie um projeto em [Supabase](https://supabase.com/dashboard).
2. No **SQL Editor**, execute [database/schema.sql](database/schema.sql) e, em seguida, [database/stock_movements.sql](database/stock_movements.sql). Em um projeto que já possui `products`, execute apenas o segundo arquivo.
3. Em **Project Settings → API Keys**, copie a URL do projeto para `SUPABASE_URL` e a **secret key** para `SUPABASE_SECRET_KEY`. Use a chave secreta atual, que assume o papel `service_role`; não use uma chave publishable.
4. Confira que a tabela `public.products` está disponível na Data API. Se o projeto desabilita a exposição automática de novas tabelas, confirme a exposição de `public` nas configurações da Data API; o SQL concede à tabela apenas `SELECT`, `INSERT`, `UPDATE` e `DELETE` para `service_role`.

Os scripts habilitam RLS e revogam acesso de `anon` e `authenticated`. Nenhuma policy pública é criada. A secret key contorna RLS, por isso deve permanecer no servidor. A função `register_stock_movement` pode ser chamada apenas pelo papel `service_role`.

### Upstash Redis

1. Crie um banco Redis em [Upstash](https://console.upstash.com/redis).
2. Abra a seção **REST API** do banco e copie a URL REST para `UPSTASH_REDIS_REST_URL` e o token REST para `UPSTASH_REDIS_REST_TOKEN`.
3. Reinicie `npm run dev` após alterar `.env.local`.

Exemplo do arquivo, sem valores reais:

```dotenv
SUPABASE_URL=
SUPABASE_SECRET_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Nunca coloque essas variáveis com prefixo `NEXT_PUBLIC_`, publique `.env.local` ou cole os valores em capturas de tela.

## Por que usar Redis?

Os indicadores exigem ler os produtos e calcular totais. Redis evita repetir a consulta e o cálculo enquanto os dados estão estáveis. O TTL limita a vida do resultado e a invalidação por `DEL` garante que a próxima consulta reflita alterações e movimentações. O PostgreSQL continua sendo a fonte principal; os produtos e o histórico nunca são armazenados somente em cache.

## Demonstração e testes de integração

Com as credenciais configuradas e os dois serviços acessíveis:

1. Abra `/products`, cadastre um produto e confirme a linha na tabela `products` do Supabase.
2. Recarregue a página: o produto deve continuar na lista.
3. Edite nome ou preço e confirme a alteração no Supabase.
4. Abra **Movimentações**, registre uma entrada e uma saída com motivos diferentes. Confira saldo anterior e novo saldo no histórico e na tabela `stock_movements` do Supabase. Uma saída acima do saldo deve ser rejeitada.
5. Abra a tela **Desempenho** e mostre o tempo de resposta e o histórico de consultas. **Recalcular agora** gera uma atualização completa; **Atualizar visão** logo em seguida usa o resumo pronto.
6. Registre outra movimentação e confira que o dashboard é recalculado com o novo saldo.
7. Exclua o produto e confirme que ele desapareceu no Supabase; o histórico preserva o nome registrado.
8. Nas ferramentas do navegador, verifique que nenhuma chave secreta aparece no código, respostas ou requisições do frontend.

Sem credenciais reais, é possível verificar compilação, tipos e lint; a persistência e o comportamento real do cache exigem as contas Supabase e Upstash configuradas.
