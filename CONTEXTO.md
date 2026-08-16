# CONTEXTO — ReciclApp

> Documento vivo. Registra **o estado atual**, **as decisões e o porquê delas** e **o que ficou pendente**.
> Atualizado a cada ajuste no projeto. Última atualização: **16/08/2026**.

Repositório: https://github.com/victornunes-off/ReciclApp-Hackathon

---

## 1. O que é

Protótipo navegável do **ReciclApp** — plataforma de conexão e gestão de coletas de recicláveis.
Feito para o hackathon **"Origem Limpa: Mais Recicláveis e Menos Rejeito na Fonte"**.

**Posicionamento:** não é "mais um app de reciclagem". É uma plataforma de conexão e gestão
de coletas, com cara de startup de tecnologia e economia circular — não de ONG.

- Mensagem principal: *Conecta. Coleta. Transforma.*
- Mensagem secundária: *O que sobra para você pode gerar valor para alguém.*

**Foco comercial do MVP:** empresas, eventos e grandes volumes (é onde está a sustentabilidade
financeira). O catador usa de graça; a empresa é o cliente pagante.

---

## 2. Estado atual

### Perfis ativos

| Perfil | Situação | Observação |
|---|---|---|
| **Empresa** | ✅ Ativo | Fluxo principal do pitch |
| **Catador** | ✅ Ativo | Recebe, aceita e registra coletas |
| **Usuário** | ⛔ Desativado | Comentado no `index.html` (commits `0b60616`, `2261c8f`) |

### Fluxo principal (o do pitch)

```
Empresa → Nova coleta → Evento → preenche + FOTO na origem → solicita
   ↓
Catador → vê a oportunidade (com a foto) → aceita → inicia
   ↓
Catador → registra 326 kg + qualidade Excelente (94%) + FOTO no recolhimento
   ↓
Empresa → dashboard atualizado + comparativo fotográfico Origem × Coleta + relatório
```

Números do roteiro: **326 kg / 94% de qualidade**. A opção "Excelente" foi calibrada
para exatamente 94% para bater com o pitch.

### Funcionalidades entregues

- Três perfis com navegação inferior própria (o de Usuário está desativado)
- Coleta esporádica, para evento e de grande volume (orçamento)
- Aceite → início → registro de coleta pelo catador
- **Registro fotográfico em duas etapas** (origem e recolhimento) com comparativo
- Linha do tempo de status, notificações simuladas (toast + central)
- Dashboards de impacto com KPIs e barras de materiais em CSS puro
- Relatório de reciclagem com simulação de exportação em PDF
- "Identificar material" — classificação por foto **simulada** (sem IA real)
- Mapa estilizado em CSS (sem API de mapas)
- Modo demonstração com dados fictícios
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

### 5.7 Modo demonstração

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

---

## 7. Pendências e pontos de atenção

### 7.1 Resíduo da desativação do perfil Usuário ⚠️

O perfil foi desativado **comentando** o botão do splash e as telas `screen-user-home` e
`screen-user-profile`. Verificado no navegador: **funciona e degrada bem** — quem tivesse
sessão antiga como `usuario` cai no splash com um aviso no console, sem tela branca.

Mas ficou resíduo:

- **9 telas de usuário continuam vivas no DOM** (`user-materials`, `user-quantity`,
  `user-photos`, `user-location`, `user-confirm`, `user-tracking`, `user-result`,
  `user-collections`, `user-impact`) — inalcançáveis pela interface, mas carregadas.
- **`js/usuario.js` continua sendo carregado** e registrando handlers.
- A navegação inferior dessas telas ainda aponta para `user-home` / `user-profile`,
  que não existem mais.
- Console mostra `Tela não encontrada: user-home` em sessões antigas.
- **Comentário HTML é frágil aqui:** comentários não aninham. Hoje funciona por sorte
  (o primeiro `-->` encontrado fecha no lugar certo). Se alguém inserir um comentário
  dentro do bloco comentado, o HTML quebra.

**Decisão pendente:** remover de vez (HTML + `usuario.js` + referências em `app.js`) ou
reativar. Enquanto estiver comentado, convém não mexer dentro do bloco.

### 7.2 GitHub Pages não ativado

O projeto é estático e o repositório é público, então dá para ter link ao vivo para os
jurados abrirem no celular:

```bash
gh api -X POST repos/victornunes-off/ReciclApp-Hackathon/pages -f "source[branch]=main" -f "source[path]=/"
```

Ficaria em `https://victornunes-off.github.io/ReciclApp-Hackathon/`. Não ativado ainda.

### 7.3 Campo estruturado de acondicionamento

Hoje o "modo de acondicionamento" é comprovado **pela foto**. Não existe campo estruturado
(ex.: *sacos / caixas / fardos / solto*). Se virar dado filtrável no relatório, é fácil
acrescentar — foi deixado de fora de propósito para não ampliar escopo.

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
