# 🐾 Adota Pet

> Plataforma web de adoção responsável de animais — conectando quem quer adotar a quem precisa de um lar.

---

## 🎯 O Problema que Resolvemos

Milhões de animais vivem em situação de abandono no Brasil. Ao mesmo tempo, muitas pessoas que desejam adotar não encontram canais confiáveis, e quem precisa colocar um animal para adoção não tem visibilidade. O **Adota Pet** centraliza esse processo: qualquer pessoa pode cadastrar animais disponíveis ou buscar um novo companheiro, com um fluxo de solicitação estruturado que incentiva a adoção responsável.

---

## ✨ Funcionalidades

- **Cadastro e login** de usuários (adotantes e doadores)
- **Listagem de animais** disponíveis com filtros (espécie, porte, sexo, cidade)
- **Cadastro de animais** por doadores com foto, descrição e informações de saúde
- **Solicitação de adoção** com formulário de perfil do adotante
- **Painel do usuário**: gerenciar animais, aprovar/recusar solicitações, acompanhar pedidos enviados
- **Autenticação segura** com sessões, bcrypt e proteções contra ataques comuns

---

## 🛠️ Stack Tecnológica

| Camada     | Tecnologia                                      |
|------------|-------------------------------------------------|
| Front-end  | HTML5 semântico, CSS3 (mobile-first), JavaScript (vanilla) |
| Back-end   | Node.js 20 + Express 4                         |
| Banco      | MySQL 8.0 via mysql2                            |
| Segurança  | bcryptjs · helmet · express-rate-limit · express-session |
| Validação  | express-validator (server-side) + JS (client-side) |
| Infra      | Docker + Docker Compose                         |
| Deploy     | Render (app) + Railway (banco)                  |

---

## 📁 Estrutura do Projeto

```
adota-pet/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js                  # Entry point, middlewares, rotas
│       ├── config/
│       │   ├── db.js                  # Pool de conexão MySQL
│       │   └── migrate.js             # Script: npm run db:migrate
│       ├── controllers/
│       │   ├── authController.js      # Cadastro, login, logout, sessão
│       │   ├── animaisController.js   # CRUD de animais
│       │   ├── solicitacoesController.js # Criar, responder solicitações
│       │   └── usuariosController.js  # Perfil do usuário
│       ├── middlewares/
│       │   └── auth.js                # Middleware de sessão
│       └── routes/
│           ├── auth.js
│           ├── animais.js
│           ├── solicitacoes.js
│           └── usuarios.js
│
└── frontend/
    ├── index.html                     # Página principal / listagem
    ├── css/
    │   └── style.css                  # Design responsivo mobile-first
    ├── js/
    │   ├── api.js                     # Utilitários de fetch + sessão
    │   ├── auth.js                    # Login e cadastro
    │   ├── animais.js                 # Listagem e filtros
    │   ├── animal.js                  # Detalhe + solicitação
    │   └── painel.js                  # Dashboard do usuário
    └── pages/
        ├── login.html
        ├── cadastro.html
        ├── animal.html
        └── painel.html
```

---

## 🗄️ Banco de Dados

Três tabelas relacionadas:

```
usuarios (id, nome, email, senha_hash, telefone, cidade, tipo, criado_em)
    │
    ├──< animais (id, usuario_id*, nome, especie, raca, idade_anos,
    │            sexo, porte, descricao, vacinado, castrado, foto_url,
    │            status, criado_em)
    │                │
    └──< solicitacoes (id, animal_id*, adotante_id*, mensagem,
                       tem_outros_pets, tem_criancas, tipo_moradia,
                       status, criado_em)
```

*Queries com JOIN cobrem a listagem de animais com dados do doador e as solicitações com dados do adotante e do animal.*

---

## 🚀 Executar Localmente

### Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose instalados

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/adota-pet.git
cd adota-pet

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env se quiser mudar senhas/ports

# 3. Suba todos os serviços
docker-compose up --build

# 4. (Primeira vez) Rode as migrações em outro terminal
docker-compose exec backend npm run db:migrate

# 5. Acesse
# http://localhost:3000
```

### Comandos úteis

```bash
# Parar os containers
docker-compose down

# Ver logs do backend
docker-compose logs -f backend

# Recriar o banco do zero
docker-compose down -v && docker-compose up --build
docker-compose exec backend npm run db:migrate
```

---

## 🌐 Deploy

| Serviço  | Plataforma | Observação                          |
|----------|------------|-------------------------------------|
| Aplicação| Render     | Deploy automático via GitHub        |
| Banco    | Railway    | MySQL — string de conexão no `.env` |

### Variáveis de ambiente no Render

Configure as mesmas variáveis do `.env.example` no painel do Render, apontando `DB_HOST` para a URL do Railway.

---

## 🔒 Segurança implementada

- Senhas com `bcryptjs` (custo 10)
- `helmet()` com Content Security Policy
- `express-rate-limit` (100 req/15min geral, 20 req/15min em rotas de auth)
- Sessões HTTP-only com `express-session`
- Queries parametrizadas com `?` (sem SQL injection)
- `.env` nunca versionado; `.env.example` com valores fictícios

---

## 👥 Equipe

| Nome | Responsabilidade |
|------|-----------------|
| Integrante 1 | Backend — autenticação e rotas |
| Integrante 2 | Backend — animais e solicitações |
| Integrante 3 | Frontend — páginas e CSS |
| Integrante 4 | Banco de dados e Docker |
| Integrante 5 | Deploy, README e LinkedIn |

---

## 📄 Licença

MIT — livre para uso educacional.
