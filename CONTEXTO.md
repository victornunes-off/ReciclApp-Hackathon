# CONTEXTO — ReciclApp

> Documento vivo. Registra **o estado atual**, **as decisões e o porquê delas** e **o que ficou pendente**.
> Atualizado a cada ajuste no projeto. Última atualização: **16/08/2026**.

Repositório: https://github.com/victornunes-off/ReciclApp-Hackathon
Demo ao vivo: https://victornunes-off.github.io/ReciclApp-Hackathon/

---

## 1. O que é

Protótipo navegável do **ReciclApp** — solução **B2B** que conecta grandes geradores a
catadores autônomos e garante a destinação do material às organizações de catadores de
Porto Velho. Feito para o hackathon **"Origem Limpa: Mais Recicláveis e Menos Rejeito na Fonte"**.

**Posicionamento:** não é "mais um app de reciclagem". É uma plataforma de conexão e gestão
de coletas, com cara de startup de tecnologia e economia circular — não de ONG.

- Mensagem principal: *Conecta. Coleta. Transforma.*
- Mensagem secundária: *O que sobra para você pode gerar valor para alguém.*

**Cliente-alvo:** condomínios, residenciais, empresas e escolas particulares — sempre com CNPJ.
O cliente contrata o serviço e assume, em contrato, o compromisso da **separação primária**
(material limpo e separado nas próprias dependências). Catador e organização usam de graça;
o gerador é o cliente pagante.

---

## 2. Estado atual

### Perfis ativos

| Perfil | Situação | Papel |
|---|---|---|
| **Empresa / Gerador** | ✅ Ativo | Contrata, define frequência, acompanha impacto e selo |
| **Catador** | ✅ Ativo | Fica disponível, vê o mapa, retira o material |
| **Organização** | ✅ Ativo | Pesa o material recebido e **valida** o ciclo |
| **Usuário (B2C)** | ⛔ Removido | Removido de vez no commit `3e15813` — o produto é B2B |

### O ciclo completo

```
CONTRATO         cliente escolhe a frequência (7 / 15 / 30 / 60 dias)
   ↓
MOTOR (invisível) prazo vence → abre ordem de coleta → janela de 5 DIAS ÚTEIS
   ↓
CATADOR          fica disponível → vê o ponto no mapa + rota → aceita → retira + FOTO
   ↓
ORGANIZAÇÃO      recebe, pesa na balança → é a PESAGEM que valida o ciclo
   ↓
CLIENTE          dashboard e Selo de Sustentabilidade atualizados com o peso real
```

O ponto-chave: **a coleta só conta depois de validada na organização**. Peso declarado pelo
catador é estimativa; peso oficial é o da balança da organização.

### Funcionalidades entregues

- Quatro perfis, cada um com navegação inferior própria
- **Contrato recorrente** com frequência alterável a qualquer momento
- **Motor de agendamento** com janela de SLA de 5 dias úteis e contagem regressiva
- **Selo de Sustentabilidade** por volume validado + consistência (retiradas no prazo)
- **Validação por pesagem** na organização, fechando o ciclo
- **Mapa do catador** com pontos dentro da janela e rota traçada (CSS puro)
- Coletas avulsas mantidas: esporádica, evento e grande volume
- **Registro fotográfico em duas etapas** (origem e recolhimento) com comparativo
- Linha do tempo de 5 etapas, notificações simuladas (toast + central)
- Dashboards de impacto com KPIs e barras de materiais em CSS puro
- Relatório de reciclagem com simulação de exportação em PDF
- "Identificar material" — classificação por foto **simulada** (sem IA real)
- Modo demonstração com dados fictícios e gatilho manual de vencimento
- Persistência em `localStorage`

---

## 3. Restrições invioláveis

Só HTML5 semântico, CSS3, JavaScript puro, SVG e APIs nativas do navegador.

**Proibido:** React, Vue, Angular, Svelte, Next, Bootstrap, Tailwind, Material UI, jQuery,
qualquer biblioteca de componentes ou framework CSS/JS, TypeScript, backend, Node como
requisito de execução, banco de dados, Firebase, Supabase, APIs externas.

Abre pelo `index.html` ou por um servidor estático simples. Sem build, sem dependências.

Também: nada de `eval`, nada de senha/token no `localStorage`, nada de dado real de pessoa.
`textContent` em vez de `innerHTML` para qualquer dado dinâmico.

---

## 4. Como rodar

```bash
cd reciclapp
python -m http.server 8000
```

Depois abra `http://localhost:8000`.

⚠️ **O CSS fica em cache agressivo.** Se não vir suas alterações, force com **Ctrl+Shift+R**.

---

## 5. Decisões tomadas (e o porquê)

### 5.1 Formato: sempre smartphone

O app é **sempre** renderizado em 390×844, em qualquer largura de tela.

- No celular / modo dispositivo do DevTools → ocupa a tela inteira.
- Em janela de navegador comum → o mesmo app centralizado numa **moldura de smartphone**.

**Por quê:** o produto é mobile. Ter um layout de desktop diferente confundia a demonstração.
Isso **contraria as seções 29 e 34 do briefing original**, que pediam sidebar no desktop —
foi uma decisão consciente, a pedido. A sidebar foi removida do HTML.

Sem "dynamic island" decorativa na moldura (removida a pedido).

### 5.2 Arquitetura de shell nativo

`header fixo → corpo rolável → navegação inferior fixa`. Quem rola é o `.screen-body`,
não a página.

**Por quê:** a navegação era `position: fixed`, o que a fazia vazar para fora da moldura no
desktop. A tentativa seguinte com `position: sticky` também falhou (a nav ficava 6px abaixo
do scrollport por causa da interação com o flex). A solução correta foi tirar header e nav
da área de rolagem — que é como um app nativo funciona de verdade.

Toasts e modais são `position: absolute` **dentro** do `.app-shell`, senão cobririam a
página inteira em vez de só o aparelho.

### 5.3 Fotos comprimidas antes de salvar

Toda foto é redimensionada para **720px no maior lado** e recomprimida em **JPEG 0.72**
antes de virar data URL.

**Por quê:** uma única foto de celular (vários MB) estoura a cota do `localStorage` na
primeira tentativa. Medido: 2000×1500 PNG (236 KB) → 720×540 JPEG (87 KB).

Limite de 3 fotos por etapa.

### 5.4 Cota de armazenamento com plano B

Se o `setItem` estourar a cota, o app **descarta as fotos da coleta concluída mais antiga**
e tenta de novo, em vez de perder o estado inteiro. A coleta afetada recebe a flag
`photosDiscarded`.

**Por quê:** perder o estado todo no meio de uma apresentação seria fatal; perder uma foto
antiga não é.

### 5.5 Foto obrigatória só no recolhimento

- Na **solicitação**: opcional (tem botão "Pular por enquanto").
- No **recolhimento pelo catador**: **obrigatória**.

**Por quê:** a foto do recolhimento é a evidência que valida o índice de qualidade (IQC).
Exigir na solicitação criaria atrito e travaria a demonstração.

### 5.6 Assets de marca extraídos dos SVGs

Os quatro SVGs enviados eram, na verdade, **recortes de uma mesma folha PNG de 1438×1094
embutida em base64** — cada arquivo carregava ~1 MB duplicado (3,9 MB no total).

Foram extraídos os recortes reais e otimizados para **~300 KB no total**:

| Arquivo | Uso |
|---|---|
| `logo-on-light.png` | Splash e login (fundo claro) — inclui a assinatura |
| `logo-on-dark.png` | Reservado para peças sobre fundo escuro |
| `icon-light.png` | Favicon (tema claro) e `apple-touch-icon` |
| `icon-dark.png` | Favicon (tema escuro) |

O favicon alterna sozinho conforme o tema do sistema, via `media="(prefers-color-scheme: ...)"`.

O lockup completo já traz a assinatura *Conecta. Coleta. Transforma.*, então a linha de
tagline separada foi removida do splash para não duplicar.

### 5.7 Contrato recorrente convivendo com coleta avulsa

O contrato recorrente é o modelo principal, mas **esporádica, evento e grande volume
continuam existindo** como pedido extra.

**Por quê:** serviços B2B reais têm recorrência *e* demanda pontual, e manter os fluxos
avulsos preserva o roteiro de pitch já pronto (Expo Rondônia). Coletas geradas pelo contrato
são marcadas com `origin: 'contrato'`; as demais, `origin: 'avulsa'`.

### 5.8 Quem valida é a organização, não o catador

A retirada pelo catador leva a coleta ao status `retirado`, **não** a conclui. O ciclo só
fecha quando a organização registra o peso na balança (`validado`).

**Por quê:** é o que garante rastreabilidade e impede que o volume seja autodeclarado por
quem coleta. Impacto, relatório, selo e ganhos do catador contam apenas peso validado —
`weightValidated`, não `weightFinal`.

### 5.9 Selo de Sustentabilidade: volume **e** consistência

Quatro níveis — Bronze, Prata (500 kg / 60%), Ouro (1500 kg / 80%) e Diamante (3000 kg / 90%).
A segunda métrica é o percentual de retiradas feitas dentro da janela de SLA.

**Por quê:** premiar só volume beneficiaria o gerador grande e desleixado. Exigir consistência
alinha o selo ao objetivo do desafio — qualidade na origem, não só quantidade.

### 5.10 Gatilho manual de vencimento (demonstração)

Na tela de frequência há um botão **"Simular vencimento do prazo"**, marcado como demonstração.

**Por quê:** o motor depende de datas reais. Sem esse atalho, seria impossível mostrar o ciclo
completo numa apresentação de 5 minutos sem esperar dias.

### 5.11 Cenário carrega sozinho (sem botão de demonstração)

O botão "Iniciar demonstração" foi removido do splash. O cenário (contrato quinzenal,
histórico validado, selo Ouro) é semeado **automaticamente** na primeira abertura, ou
sempre que o armazenamento estiver vazio.

**Por quê:** o botão poluía a tela inicial. Mas sem ele o app abriria sem contrato, sem
histórico e sem selo — nada para demonstrar. Semear na inicialização resolve os dois lados.
Para recomeçar do zero, limpe o armazenamento do navegador.

### 5.12 Sem barra de rolagem, rolagem por toque

Barras de rolagem ocultas globalmente (`scrollbar-width: none` + `::-webkit-scrollbar`),
mantendo a rolagem funcional.

**Por quê:** barra de rolagem visível denuncia "página web". O protótipo precisa parecer
um app nativo.

### 5.13 Gráfico do dashboard

Colunas dos últimos 6 meses de material **validado**, acima dos KPIs.

Decisões, seguindo boas práticas de visualização:

- **Série única → sem legenda.** O título já diz o que está plotado; uma legenda de um
  item só repetiria o título.
- **Rótulo apenas no mês corrente.** Número em cada coluna vira ruído e não é lido; os
  demais valores ficam no eixo, no toque e na tabela oculta.
- **Cores validadas por script, não no olho.** Turquesa nas colunas e petróleo no mês
  corrente — ambos com contraste ≥ 3:1 sobre a superfície. A alternativa em lima foi
  **descartada**: o validador apontou ΔE 14,6 contra o turquesa, abaixo do piso de 15,
  ou seja, difícil de distinguir mesmo com visão normal.
- **Colunas de no máximo 24 px**, topo arredondado em 4 px, base reta, 2 px de respiro
  entre elas e grade em fio de 1 px, recessiva.
- Cada coluna é um `<button>` — tocável, focável por teclado e com `aria-label`. Uma
  tabela visualmente oculta garante acesso aos números por leitor de tela.

O gráfico é alimentado pelos dados reais do estado: ao validar uma coleta, a coluna do
mês corrente cresce na hora (verificado: 44 kg → 318 kg).

### 5.14 Navegação inferior legível para baixa visão

Ícones de 26 px com traço 2,1, rótulos de 12 px semibold e cor `--color-nav-inactive`
(#3A4A44) — contraste **9,36:1** sobre o branco, contra ~5,6:1 de antes com traço fino.
O item ativo ganha ainda um marcador lima no topo.

**Por quê:** o ícone inativo parecia desligado. Além do contraste, o estado ativo não pode
depender só de cor — daí o marcador.

### 5.15 Modo demonstração

O botão "Iniciar demonstração" carrega o cenário e já entra como **Empresa Verde Ltda.**
Ao trocar de perfil, o formulário de login vem **pré-preenchido** com a persona daquele
perfil — só apertar Entrar.

**Por quê:** sem backend não dá para ter duas sessões simultâneas. A troca manual de perfil
é a forma de demonstrar o repasse empresa → catador → empresa, e o pré-preenchimento tira
o atrito de digitar no meio do pitch.

---

## 6. Bugs encontrados e corrigidos

| # | Problema | Causa |
|---|---|---|
| 1 | Ícones dos cards de perfil descentralizados | `.profile-option span` (0,1,1) vencia `.profile-option-icon` (0,1,0) e forçava `display:block` no container do ícone. Corrigido escopando em `.profile-option-text` |
| 2 | 23 ícones (setas de voltar, sinos) esticados | Os SVGs não tinham atributo `width` **nem** regra CSS, então preenchiam o botão de 40×40. Corrigido com `.header-back svg { width:22px }` |
| 3 | Nome da empresa apagado ao marcar material | O toggle re-executa o render do formulário, que reescrevia o campo. Corrigido com `prefillIfEmpty()` |
| 4 | `frame-ancestors` ignorado | Essa diretiva de CSP só funciona via header HTTP, não em `<meta>`. Removida |
| 5 | Opções de qualidade não re-renderizavam | `arguments.callee` dentro de arrow function. Extraído para função nomeada |
| 6 | Moldura do smartphone ultrapassava a janela | O cálculo de altura não descontava o padding do body. Corrigido com `min()` |
| 7 | Nome da empresa apagado ao marcar material (2ª ocorrência) | Mesmo padrão do #3, agora no formulário de grande volume. Unificado em `prefillIfEmpty()` |
| 8 | Data da retirada exibida como ISO cru | `formatDate()` só tratava `YYYY-MM-DD` e concatenava `T00:00:00`, gerando data inválida com ISO completo. Passou a detectar se já há hora |

---

## 7. Pendências e pontos de atenção

### 7.1 Onboarding B2B ainda não implementado

O contrato existe no estado (`appState.contract`) e é criado pela semente de demonstração,
mas **não há tela de contratação**: cadastro com CNPJ, escolha do tipo de gerador
(condomínio / residencial / empresa / escola) e aceite do compromisso de separação primária.
Foi deliberadamente adiado nesta rodada.

### 7.2 Feriados não entram no cálculo de dias úteis

`addBusinessDays()` pula apenas sábado e domingo. Feriados nacionais e de Rondônia
contariam como dia útil. Aceitável no protótipo; num sistema real exigiria calendário.

### 7.3 Um contrato por vez

O protótipo assume **um único cliente com um contrato** (`appState.contract`). Multi-cliente
exigiria mover o contrato para uma coleção indexada por cliente.

### 7.4 Favicon do tema escuro

As três tags `<link rel="icon">` apontam para `icon-light.png` — inclusive a de
`prefers-color-scheme: dark`. Ou seja, `icon-dark.png` está no repositório mas nunca é usado.
Se foi intencional, dá para remover o arquivo; se não, basta apontar a tag escura para ele.

### 7.5 GitHub Pages ativo

Demo publicada em https://victornunes-off.github.io/ReciclApp-Hackathon/ (branch `main`,
raiz, HTTPS forçado). Verificado no ar: ciclo completo funcionando, console limpo.

Atenção para a apresentação: **cada origem tem seu próprio `localStorage`**. O cenário do
Pages é independente do que você tenha no Live Server ou no `file://`. Use sempre a mesma
origem ao ensaiar e ao apresentar.

Cada `git push` na `main` republica o site automaticamente (leva ~1 minuto).

### 7.6 Campo estruturado de acondicionamento

Hoje o "modo de acondicionamento" é comprovado **pela foto**. Não existe campo estruturado
(ex.: *sacos / caixas / fardos / solto*). Se virar dado filtrável no relatório, é fácil
acrescentar — foi deixado de fora de propósito para não ampliar escopo.

---

## 7-A. Roadmap de expansão (documentado, não implementado)

**Ecopontos (PEV):** substituir o armazenamento interno do cliente por estruturas fixas
padronizadas instaladas em condomínios e empresas.

**Publicidade institucional:** esses ecopontos funcionam também como mídia — marcas pagam
para definir o design e a comunicação visual da estrutura, criando uma linha de receita
adicional que alia ESG a publicidade estratégica.

---

## 8. Limitações do MVP (por design)

- Sem backend, banco ou autenticação real — tudo vive no `localStorage`.
- Geolocalização, mapa e classificação de material por foto são **simulados**.
- Valores financeiros (ganhos do catador, orçamento) são demonstrativos.
- Exportação de PDF não gera arquivo.
- Todos os nomes, empresas, eventos e endereços são fictícios.

---

## 9. Histórico

| Data | O que mudou |
|---|---|
| 16/08/2026 | Protótipo inicial: 3 perfis, ~35 telas, fluxo completo do pitch, README |
| 16/08/2026 | Assets reais de marca (favicons claro/escuro + lockups); remoção do SVG placeholder |
| 16/08/2026 | Formato travado em smartphone; sidebar de desktop removida; shell de app nativo; correção dos ícones descentralizados e esticados |
| 16/08/2026 | Registro fotográfico em duas etapas + comparativo Origem × Coleta + compressão e plano B de cota |
| 16/08/2026 | Repositório público criado e publicado |
| 16/08/2026 | Perfil Usuário desativado (comentado) — commits `0b60616`, `2261c8f`, `c5961bb` |
| 16/08/2026 | Criação deste documento de contexto |
| 16/08/2026 | Perfil Usuário **removido de vez** (`3e15813`): −642 linhas, CSS órfão limpo, init resiliente a perfil descontinuado |
| 16/08/2026 | GitHub Pages ativado — demo ao vivo publicada e verificada |
| 16/08/2026 | Splash sem botão de demo (cenário automático), sem barra de rolagem, gráfico mensal no dashboard e navegação inferior legível para baixa visão |
| 16/08/2026 | Pivô B2B: contrato recorrente + motor de SLA de 5 dias úteis, perfil Organização com validação por pesagem, Selo de Sustentabilidade e mapa do catador com rota |

---

## 10. Manutenção deste documento

A cada ajuste no projeto, atualizar:

1. **Seção 2** se mudar o estado ou os perfis ativos
2. **Seção 5** se a mudança envolver uma decisão com trade-off — registrar **o porquê**,
   não só o quê
3. **Seção 6** se for correção de bug — registrar a **causa raiz**
4. **Seção 7** se abrir ou fechar pendência
5. **Seção 9** sempre — uma linha no histórico
6. A data no topo
