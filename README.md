# Desvendando São Paulo Inteligente

### Uma abordagem integrada a dados abertos e D3.JS para a visualização em Smart Cities

## 📜 Sobre o Projeto

Este projeto é um dashboard interativo de visualização de dados focado na análise de ocorrências criminais na cidade de São Paulo. Utilizando dados públicos fornecidos pela Secretaria de Segurança Pública (SSP), a plataforma permite uma exploração rica e detalhada dos padrões de criminalidade, servindo como uma ferramenta de Business Intelligence e análise para o conceito de Cidades Inteligentes (Smart Cities).

O objetivo é transformar dados brutos em insights visuais claros e acessíveis, permitindo que cidadãos, jornalistas e pesquisadores entendam melhor a dinâmica da segurança pública na metrópole.

---

## 🚀 Demo Online

O dashboard está publicado e pode ser acessado ao vivo através do GitHub Pages no seguinte link:

**https://enriqsilv.github.io/desvendando-sao-paulo-inteligente/**

---

## ✨ Funcionalidades

O painel conta com diversas visualizações interconectadas, que se atualizam de acordo com os filtros aplicados:

* **Filtros Dinâmicos:** Permite filtrar os dados por Ano, Mês, Delegacia e Tipo de Ocorrência.
* **KPI Principal:** Um card com o número total de ocorrências, refletindo a seleção atual dos filtros.
* **Top 15 Delegacias:** Gráfico de barras que mostra as delegacias com maior número de registros.
* **Distribuição por Ocorrência:** Gráfico de pizza/donut que exibe a proporção dos principais tipos de crime.
* **Tendência Comparativa Anual:** Gráfico de múltiplas linhas para comparar a sazonalidade das ocorrências ao longo dos anos.
* **Mapa de Calor:** Visualização que cruza Mês e Tipo de Ocorrência, ideal para identificar padrões sazonais.
* **Mapa Geográfico Interativo:** Um mapa de São Paulo com os distritos coloridos por zona (Norte, Sul, etc.) e a localização das delegacias, com zoom e informações ao passar o mouse.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando tecnologias web modernas, com foco na manipulação e visualização de dados no lado do cliente.

* **HTML5:** Estruturação do conteúdo da página.
* **CSS3:** Estilização, layout (CSS Grid) e responsividade.
* **JavaScript (ES6+):** Lógica principal do dashboard e interatividade.
* **D3.js (v7):** A principal biblioteca para a visualização de dados, utilizada para criar todos os gráficos e o mapa.
* **Python com Pandas:** Utilizado em um script auxiliar para a limpeza e transformação inicial dos dados brutos (de formato "wide" para "long").

---

## 📁 Estrutura do Projeto

O projeto está organizado da seguinte forma para manter a clareza e a manutenibilidade:

```
/
│
├── 📜 index.html              (Arquivo principal da página)
│
├── 📁 assets/                 (Recursos estáticos)
│   ├── 💅 css/
│   │   └── style.css
│   └── 🎨 javascript/
│       └── dashboard.js
│
└── 📁 data/                   (Arquivos de dados)
    ├── dados_dashboard_long_format.csv
    └── delegacias_geo.csv
```

---

## ⚙️ Como Executar Localmente

Para rodar este projeto no seu próprio computador, siga os passos abaixo:

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/SEU_NOME_DE_USUARIO/desvendando-sao-paulo-inteligente.git](https://github.com/SEU_NOME_DE_USUARIO/desvendando-sao-paulo-inteligente.git)
    ```

2.  **Navegue até a pasta do projeto:**
    ```bash
    cd desvendando-sao-paulo-inteligente
    ```

3.  **Inicie um servidor local:** O D3.js precisa de um servidor para carregar os arquivos de dados (`.csv`). A forma mais simples é usar o módulo `http.server` do Python.
    ```bash
    # Se você usa Python 3
    python -m http.server

    # Se você usa Python 2
    python -m SimpleHTTPServer
    ```

4.  **Acesse no navegador:** Abra seu navegador e acesse o endereço `http://localhost:8000`.

---
*Este README foi gerado com o auxílio de uma Inteligência Artificial.*
