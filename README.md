# ReciclApp

**Conecta. Coleta. Transforma.**
*O que sobra para você pode gerar valor para alguém.*

Protótipo navegável do ReciclApp — uma plataforma de conexão e gestão de coletas de recicláveis entre usuários, empresas e catadores. Desenvolvido para o hackathon **"Origem Limpa: Mais Recicláveis e Menos Rejeito na Fonte"**.

> 📄 **[CONTEXTO.md](CONTEXTO.md)** — estado atual, decisões tomadas (e o porquê), bugs corrigidos e pendências.

> ⚠️ **Este é um protótipo de demonstração (MVP).** Não há backend, banco de dados, autenticação real, pagamentos ou integrações externas. Todos os dados (empresas, catadores, eventos, coletas) são fictícios e usados apenas para fins de apresentação.

---

## Objetivo

Melhorar o aproveitamento e a qualidade dos materiais recicláveis desde a origem, conectando facilmente:

- **Usuários** que querem descartar materiais esporadicamente;
- **Empresas** que precisam organizar coletas pontuais, para eventos ou grandes volumes (foco comercial do MVP);
- **Catadores** que recebem e realizam as oportunidades de coleta.

O fluxo principal de demonstração mostra a jornada completa: uma empresa solicita a coleta de um evento, um catador aceita e registra o resultado, e a empresa acompanha o impacto em tempo real.

## Tecnologias

Construído **exclusivamente** com tecnologias nativas do navegador:

- HTML5 semântico
- CSS3 (variáveis, grid, flexbox — sem frameworks)
- JavaScript puro (Vanilla JS, sem TypeScript)
- SVG inline para ícones e ilustrações
- `localStorage` para persistência local do protótipo

Nenhuma biblioteca, framework ou dependência externa é utilizada (sem React, Vue, Bootstrap, Tailwind, jQuery, Node.js como requisito de execução, etc.).

## Estrutura de pastas

```text
reciclapp/
│
├── index.html              # Todas as telas do protótipo (SPA por exibição condicional)
├── README.md
│
├── css/
│   ├── variables.css        # Tokens de cor, tipografia, espaçamento
│   ├── base.css              # Reset e estilos base
│   ├── components.css        # Botões, cards, badges, modal, toast, timeline, etc.
│   ├── layout.css            # Estrutura de telas, splash, dashboards
│   └── responsive.css        # Moldura de smartphone em telas grandes
│
├── js/
│   ├── utils.js               # Formatação, validação, helpers de DOM seguro
│   ├── data.js                 # Dados fictícios e constantes de domínio
│   ├── state.js                 # Estado centralizado + persistência em localStorage
│   ├── router.js                 # Navegação entre telas (mostra/oculta seções)
│   ├── components.js              # Componentes de UI reutilizáveis
│   ├── photos.js                   # Captura, compressão e galerias de fotos
│   ├── usuario.js                  # Lógica do perfil Usuário
│   ├── empresa.js                   # Lógica do perfil Empresa
│   ├── catador.js                    # Lógica do perfil Catador
│   └── app.js                         # Inicialização, login simulado, modo demo
│
└── assets/
    ├── icon-light.png        # Favicon/ícone — tema claro (tela off-white, R escuro)
    ├── icon-dark.png         # Favicon/ícone — tema escuro (tela petróleo, R claro)
    ├── logo-on-light.png     # Lockup completo, letra escura — para fundos claros
    └── logo-on-dark.png      # Lockup completo, letra clara — para fundos escuros
```

### Uso dos assets de marca

| Asset | Onde é usado |
|---|---|
| `logo-on-light.png` | Tela inicial e login (fundo off-white) — inclui o nome e a assinatura *Conecta. Coleta. Transforma.* |
| `logo-on-dark.png` | Reservado para peças sobre fundo petróleo/escuro |
| `icon-light.png` | Favicon (tema claro) e `apple-touch-icon` |
| `icon-dark.png` | Favicon quando o navegador está em tema escuro |

O favicon alterna automaticamente conforme o tema do sistema, via `media="(prefers-color-scheme: ...)"` nas tags `<link rel="icon">`.

## Como executar

Não é necessário instalar nada. Duas formas de rodar:

**Opção 1 — Abrir diretamente:**

Abra o arquivo `index.html` no navegador (duplo clique ou arraste para uma aba).

**Opção 2 — Servidor HTTP estático (recomendado):**

Alguns navegadores restringem `localStorage` e leitura de módulos em `file://`. Um servidor local simples resolve isso:

```bash
# Com Python 3 (já instalado na maioria dos sistemas)
cd reciclapp
python -m http.server 8000
```

Depois acesse `http://localhost:8000` no navegador.

Alternativas equivalentes: `npx serve .` ou a extensão "Live Server" do VS Code.

### Formato de tela

O ReciclApp é um **aplicativo mobile** e o protótipo é sempre renderizado nesse formato (390 × 844, viewport lógico padrão de smartphone). Não existe layout de desktop:

- **No celular ou no modo dispositivo do DevTools** (F12 → ícone de dispositivo): o app ocupa a tela inteira, sem moldura.
- **Em uma janela de navegador comum**: o mesmo app aparece centralizado dentro de uma moldura de smartphone sobre fundo escuro — pronto para projetar na apresentação.

Em ambos os casos o conteúdo e a navegação são idênticos: header fixo, corpo rolável e navegação inferior, como num app nativo.

## Perfis disponíveis

Na tela inicial, escolha um dos três perfis. Não há autenticação real — qualquer nome, e-mail válido (formato) e senha com 4+ caracteres são aceitos.

| Perfil | Acesso | Objetivo |
|---|---|---|
| **Usuário** | Gratuito | Solicitar coletas esporádicas pessoais |
| **Empresa** | Cliente pagante (MVP comercial) | Coleta esporádica, eventos e grandes volumes, com dashboard e relatórios |
| **Catador** | Gratuito | Receber, aceitar e registrar oportunidades de coleta |

## Modo demonstração

Na tela inicial, o botão **"Iniciar demonstração"** carrega um cenário pronto e loga automaticamente como **Empresa Verde Ltda.**, ideal para apresentações.

Fluxo sugerido para o pitch (empresa → catador → empresa):

1. Como Empresa Verde Ltda., toque em **Nova coleta → Coleta para evento** e solicite a coleta da *Expo Rondônia 2026*. **Anexe uma foto do material** — é ela que documenta a condição na origem.
2. Toque em **Sair e trocar de perfil**, escolha **Catador** — o formulário de login já vem preenchido com "João da Silva" (modo demo). Basta tocar em **Entrar**.
3. Na tela inicial do catador, toque na oportunidade da Empresa Verde: repare que **a foto enviada pela empresa aparece antes do aceite**. Siga em **Aceitar coleta → Iniciar coleta → Registrar coleta**. Informe o peso (ex.: 326), a qualidade (Excelente) e **tire a foto do material recolhido** (obrigatória).
4. Troque novamente para o perfil **Empresa** — o dashboard, o relatório e o acompanhamento já refletem o resultado, agora com o **comparativo fotográfico Origem × Coleta** comprovando o índice de qualidade.

Esse é o mesmo roteiro descrito no pitch: uma operação de ~300 kg que retorna 326 kg com 94% de qualidade.

O fluxo do **Usuário** (materiais → quantidade → local → confirmação) é independente e avança automaticamente pelos status da coleta (solicitada → catador encontrado → em andamento → concluída) para permitir uma demonstração rápida sem precisar trocar de perfil.

## Funcionalidades

- Três perfis completos (Usuário, Empresa, Catador) com navegação inferior por perfil.
- Solicitação de coleta esporádica (usuário e empresa), coleta para eventos e coleta de grandes volumes (orçamento).
- Aceite, início e registro de coleta pelo catador (peso e qualidade).
- **Registro fotográfico em duas etapas** — foto na origem (solicitação) e foto no recolhimento (catador), com comparativo lado a lado para validar qualidade, volume e acondicionamento.
- Acompanhamento com linha do tempo de status e notificações simuladas (toast + central de notificações).
- Dashboards de impacto (usuário e empresa) com KPIs e distribuição de materiais em barras (CSS puro, sem bibliotecas de gráfico).
- Relatório de reciclagem com simulação de exportação em PDF.
- Tela "Identificar material" — simulação de classificação por foto (sem visão computacional real).
- Mapa estilizado em CSS (sem APIs externas de mapas).
- Modo demonstração com dados fictícios pré-carregados.
- Persistência local via `localStorage` (sem dados sensíveis).
- Validação de formulários com mensagens compreensíveis e sem perda de dados preenchidos.
- Estados de vazio, carregamento, sucesso e erro em toda a aplicação.

## Registro fotográfico (evidência do IQC)

As fotos são a prova visual por trás do Índice de Qualidade da Coleta. São capturadas em dois momentos:

| Momento | Quem | Onde |
|---|---|---|
| **Origem** | Usuário / Empresa | Etapa "Mostre como o material está" (usuário) e campo *Fotos do material* nos formulários da empresa |
| **Recolhimento** | Catador | Tela *Registrar coleta* — **obrigatória**, pois é o que valida o peso e a qualidade informados |

O catador vê a foto da origem antes de aceitar (para saber o que esperar) e novamente na hora de registrar (como referência de comparação). Empresa e usuário veem o comparativo **Origem × Coleta** na tela de acompanhamento. Qualquer foto pode ser tocada para abrir ampliada.

**Detalhes técnicos:** até 3 fotos por etapa. Cada imagem é redimensionada para no máximo 720 px no maior lado e recomprimida em JPEG (~85 KB) antes de virar data URL — sem isso, uma única foto de celular estouraria a cota do `localStorage`. Se ainda assim a cota estourar, as fotos das coletas mais antigas são descartadas automaticamente para que o restante do estado continue sendo salvo. Em celulares, o botão *Tirar foto* abre a câmera direto; *Escolher da galeria* usa os arquivos do aparelho.

## Limitações do MVP

- Não há backend, banco de dados ou autenticação real — dados vivem apenas no `localStorage` do navegador.
- Geolocalização, mapas e classificação de materiais por foto (IA) são **simulados**.
- As fotos ficam apenas no navegador (`localStorage`), comprimidas. Não há upload, armazenamento em nuvem nem análise automática das imagens — na V2 elas alimentariam a validação de qualidade por visão computacional.
- Valores financeiros (ganhos do catador, orçamentos) são demonstrativos, sem cálculo real de precificação.
- Exportação de relatório em PDF não é gerada de fato.
- Todos os nomes, empresas, eventos e endereços são fictícios.

## Roadmap futuro

**V2** — backend, banco de dados, autenticação real, geolocalização real, notificações push/WhatsApp, visão computacional real, pagamentos, avaliação de catadores, cooperativas.

**V3** — integração com organizações de catadores, relatórios ESG, API pública, integrações corporativas, indicadores avançados.

**V4** — integração com políticas públicas, incentivos fiscais, expansão para outras cidades, integração com ecopontos e PEVs.

---

*ReciclApp — protótipo desenvolvido para o hackathon "Origem Limpa: Mais Recicláveis e Menos Rejeito na Fonte" (2026).*
