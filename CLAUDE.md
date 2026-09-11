@AGENTS.md

# Segundo Cérebro deste projeto

Este repositório (`italoplaylist-maker/distribuidora`) tem uma memória
externa persistente: o vault Obsidian em
`italoplaylist-maker/cerebro-do-brabo`, pasta
`01 - Projetos/Distribuidora/`. Ele guarda contexto, decisões, regras de
negócio e problemas conhecidos que não cabem — ou não deveriam ficar só —
no código.

## Quando consultar

Antes de qualquer tarefa relevante — mudança de estrutura, modelo de
dados, autenticação, autorização, multi-tenancy, ou qualquer coisa que uma
decisão registrada possa afetar — leia, nesta ordem:

1. `01 - Projetos/Distribuidora/Contexto.md`
2. `01 - Projetos/Distribuidora/Arquitetura.md`
3. `01 - Projetos/Distribuidora/Regras de Negocio.md`
4. `01 - Projetos/Distribuidora/Decisoes.md` (e as notas linkadas em
   `03 - Decisoes/` que ela referencia)
5. Busca direcionada em `06 - Bugs e Solucoes` e `02 - Conhecimento` pelo
   sintoma ou tecnologia da tarefa atual.

Se o vault não estiver anexado à sessão, anexe-o (`add_repo` para
`italoplaylist-maker/cerebro-do-brabo`) antes de decidir algo que dependa
dele. Não leia o vault inteiro — busca direcionada por conceito, nunca
como scan geral.

Correção de typo, ajuste de CSS pontual ou renomeação trivial não exige
consulta.

## Hierarquia de verdade

Código real > schema/config do repositório > testes > `Contexto`/
`Arquitetura`/`Regras de Negocio` deste projeto no vault > inferência
própria.

O Segundo Cérebro nunca é autoridade acima do código. Se uma nota
descrever algo que o código atual contradiz, o código vence — e a nota
deve ser corrigida (não silenciosamente: registre o motivo da divergência).

## O que registrar ao final de uma tarefa relevante

Pergunte: isso vale daqui a seis meses? Se sim, registre no lugar certo
(ver Regra 5 do `CLAUDE.md` do vault):

- decisão arquitetural nova ou revogada → `03 - Decisoes/`, linkada em
  `01 - Projetos/Distribuidora/Decisoes.md`;
- regra de negócio descoberta ou definida → linha em
  `01 - Projetos/Distribuidora/Regras de Negocio.md` (ou nota própria em
  `08 - Regras de Negocio/` se for complexa);
- bug com causa raiz não óbvia e sua solução → `06 - Bugs e Solucoes/`;
- mudança estrutural relevante → atualizar `Arquitetura.md`;
- algo que ficou pendente ou fora de escopo → `TODO.md`.

Não registre cada commit, cada ajuste trivial ou cada correção de typo.

**Nunca grave segredo ou credencial no vault** — nem valor, nem hash, nem
fragmento. Se uma decisão envolver onde uma credencial fica configurada,
descreva o mecanismo (variável de ambiente, cofre, etc.), nunca o valor.

## Isolamento entre repositórios

O código do produto vive só neste repositório. A memória vive só no
`cerebro-do-brabo`, pasta `01 - Projetos/Distribuidora/`. Nunca copie o
conteúdo de um repositório inteiro dentro do outro. Uma decisão registrada
aqui como referência (ex.: o padrão de organização do Sistema de Locação)
serve de **modelo de documentação**, não de fonte de regra de negócio para
este projeto.
