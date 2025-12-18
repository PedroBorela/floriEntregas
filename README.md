# Floricultura - Sistema de Gerenciamento de Pedidos

Este projeto é uma aplicação web desenvolvida para auxiliar no gerenciamento de pedidos de uma floricultura. O sistema permite o cadastro de entregas e retiradas, impressão de cupons fiscais e visualização de um histórico de pedidos.

## Funcionalidades

- **Formulário de Entrega**: Cadastro completo de pedidos para entrega, incluindo dados do cliente, destinatário, endereço e forma de pagamento.
- **Formulário de Retirada**: Cadastro de pedidos para retirada na loja.
- **Impressão de Cupom**: Geração automática de cupom fiscal para impressão.
- **Histórico de Pedidos**: Visualização de todos os pedidos realizados, separados por data (hoje e anteriores).
- **Integração com Banco de Dados**: Todos os pedidos são salvos em um banco de dados MongoDB.

## Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express
- **Banco de Dados**: MongoDB

## Pré-requisitos

Para rodar este projeto em seu computador, você precisará ter instalado:

1.  **Node.js**: [Download Node.js](https://nodejs.org/) (Recomendado versão LTS).
2.  **MongoDB**: [Download MongoDB Community Server](https://www.mongodb.com/try/download/community).
    - Certifique-se de que o MongoDB esteja instalado e rodando na porta padrão (`27017`).

## Como Rodar a Aplicação

Siga o passo a passo abaixo para configurar e executar o projeto:

### 1. Instalação

1.  Baixe ou clone este projeto para uma pasta em seu computador.
2.  Abra o terminal (Prompt de Comando ou PowerShell) e navegue até a pasta do projeto.
3.  Instale as dependências do projeto executando o seguinte comando:

    ```bash
    npm install
    ```

### 2. Executando o Servidor

1.  Certifique-se de que o serviço do MongoDB está em execução.
2.  No terminal, dentro da pasta do projeto, inicie o servidor backend com o comando:

    ```bash
    npm start
    ```
    
    Ou alternativamente:
    ```bash
    node server.js
    ```

3.  Você verá a mensagem: `Server is running on http://localhost:3000` e `MongoDB connected successfully`.

### 3. Acessando o Sistema

O sistema é composto por arquivos HTML estáticos que se comunicam com o servidor.

1.  Vá até a pasta do projeto.
2.  Abra o arquivo `form.html` no seu navegador (Chrome, Edge, Firefox, etc.) para acessar o formulário de entregas.
3.  Você pode navegar entre as páginas "Entrega", "Retirada" e "Pedidos" através do menu superior.

## Estrutura do Projeto

- `server.js`: Arquivo principal do servidor backend.
- `form.html`: Página do formulário de entrega.
- `formRetirada.html`: Página do formulário de retirada.
- `pedidos.html`: Página de listagem de pedidos.
- `script.js`: Lógica do formulário de entrega.
- `pedidos.js`: Lógica da listagem de pedidos.
- `style.css` / `pedidos.css`: Estilos da aplicação.
