# ReciclApp

**Conecta. Coleta. Transforma.**
*O que sobra para você pode gerar valor para alguém.*

Protótipo navegável do ReciclApp — solução **B2B** que conecta grandes geradores (condomínios, residenciais, empresas e escolas com CNPJ) a catadores autônomos, e garante a destinação do material às organizações de catadores de Porto Velho. Desenvolvido para o hackathon **"Origem Limpa: Mais Recicláveis e Menos Rejeito na Fonte"**.

> 📄 **[CONTEXTO.md](CONTEXTO.md)** — estado atual, decisões tomadas (e o porquê), bugs corrigidos e pendências.

> ⚠️ **Este é um protótipo de demonstração (MVP).** Não há backend, banco de dados, autenticação real, pagamentos ou integrações externas. Todos os dados (empresas, catadores, eventos, coletas) são fictícios e usados apenas para fins de apresentação.

---

## Objetivo

Melhorar o aproveitamento e a qualidade dos materiais recicláveis desde a origem, conectando facilmente:

- **Grandes geradores** (condomínios, residenciais, empresas e escolas com CNPJ) que contratam o serviço e assumem, em contrato, a separação primária do material;
- **Catadores autônomos** que recebem as oportunidades no mapa e realizam a retirada;
- **Organizações de catadores** de Porto Velho, que recebem o material, pesam e **validam** o ciclo.

### O ciclo completo

```text
CONTRATO       cliente escolhe a frequência (7 / 15 / 30 / 60 dias)
   ↓
MOTOR          prazo vence → abre a ordem de coleta → janela de 5 DIAS ÚTEIS
   ↓
CATADOR        fica disponível → vê o ponto no mapa + rota → aceita → retira + foto
   ↓
ORGANIZAÇÃO    recebe, pesa na balança → é a PESAGEM que valida o ciclo
   ↓
CLIENTE        dashboard e Selo de Sustentabilidade atualizados com o peso real
```

O ponto-chave: **a coleta só conta depois de validada na organização**. O peso declarado pelo catador é estimativa; o peso oficial é o da balança da organização.

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
│   ├── agenda.js                # Motor de agendamento: frequência e SLA de 5 dias úteis
│   ├── state.js                 # Estado centralizado + persistência em localStorage
│   ├── router.js                 # Navegação entre telas (mostra/oculta seções)
│   ├── components.js              # Componentes de UI reutilizáveis
│   ├── photos.js                   # Captura, compressão e galerias de fotos
│   ├── empresa.js                   # Lógica do perfil Empresa
│   ├── catador.js                    # Lógica do perfil Catador
│   ├── organizacao.js                 # Perfil Organização: pesagem e validação
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

Na tela inicial, escolha um dos perfis. Não há autenticação real — qualquer nome, e-mail válido (formato) e senha com 4+ caracteres são aceitos.

| Perfil | Acesso | Objetivo |
|---|---|---|
| **Empresa / Gerador** | Cliente pagante | Contrato recorrente, coletas avulsas, dashboard, selo e relatórios |
| **Catador** | Gratuito | Ficar disponível, ver o mapa, retirar o material |
| **Organização** | Gratuito | Pesar o material recebido e validar o ciclo |

## Modo demonstração

Na tela inicial, o botão **"Iniciar demonstração"** carrega um cenário pronto — contrato quinzenal ativo, histórico já validado e selo **Ouro** — e loga automaticamente como **Condomínio Parque das Águas**.

### Roteiro sugerido para o pitch (ciclo completo)

1. **Cliente** — no dashboard, mostre o **Selo de Sustentabilidade** e o card do contrato com a frequência vigente. Toque em **Alterar** para exibir as periodicidades e, na mesma tela, use **"Simular vencimento do prazo"** (atalho de demonstração) para o motor abrir a coleta com a janela de 5 dias úteis.
2. **Catador** — saia e entre como *João da Silva* (login já preenchido). A coleta aparece **no mapa com a rota traçada** e com o prazo restante no card. Toque nela → **Aceitar → Iniciar → Registrar**: informe o peso e **tire a foto do material** (obrigatória). Repare que a tela avisa o próximo passo: levar à organização.
3. **Organização** — saia e entre como *Cooperativa Recicla PVH*. A entrega está na fila **"Aguardando pesagem"**, com a foto e o peso declarado pelo catador. Registre o **peso oficial da balança** e confirme.
4. **Cliente de volta** — o dashboard já contabiliza o peso **validado**, o selo se atualiza e a próxima coleta é reagendada automaticamente pela frequência.

O fluxo **avulso** (esporádica, evento e grande volume) continua disponível em **"+ Coleta avulsa"** para demandas pontuais fora do contrato.

## Funcionalidades

- Quatro perfis (Empresa/Gerador, Catador, Organização) com navegação inferior própria.
- **Contrato recorrente** com frequência alterável a qualquer momento (7 / 15 / 30 / 60 dias).
- **Motor de agendamento** que abre a ordem de coleta no vencimento, com janela de **5 dias úteis** e contagem regressiva.
- **Selo de Sustentabilidade** (Bronze → Prata → Ouro → Diamante) por volume validado **e** consistência de retiradas no prazo.
- **Validação por pesagem na organização** — é ela que fecha o ciclo e libera os dados de impacto.
- **Mapa do catador** com os pontos dentro da janela de SLA e rota traçada (CSS puro, sem API de mapas).
- Coletas avulsas mantidas: esporádica, evento e grande volume (orçamento).
- Aceite, início e registro de retirada pelo catador (peso, qualidade e foto).
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
| **Origem** | Cliente / Gerador | Campo *Fotos do material* nos formulários de coleta avulsa |
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

**V3** — relatórios ESG, API pública, integrações corporativas, indicadores avançados, multi-cliente e multi-contrato.

**V4 — Ecopontos (PEV) e mídia:** substituição do armazenamento interno dos clientes por estruturas fixas padronizadas instaladas em condomínios e empresas. Esses ecopontos funcionam também como espaço de mídia: marcas parceiras pagam para definir o design e a comunicação visual da estrutura, criando uma **linha de receita adicional** que alia ESG a publicidade estratégica.

**Também mapeado:** integração com políticas públicas, incentivos fiscais e expansão para outras cidades.

---

*ReciclApp — protótipo desenvolvido para o hackathon "Origem Limpa: Mais Recicláveis e Menos Rejeito na Fonte" (2026).*
