require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const morgan  = require('morgan');
const path    = require('path');
const cors    = require('cors');

const authRoutes    = require('./routes/auth');
const animaisRoutes = require('./routes/animais');
const solicitacoesRoutes = require('./routes/solicitacoes');
const usuariosRoutes = require('./routes/usuarios');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Segurança ─────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      imgSrc:     ["'self'", "data:", "https:"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
    },
  },
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
app.use(limiter);

// Rate limit mais estrito para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { erro: 'Muitas tentativas de login. Aguarde 15 minutos.' },
});

// ── Sessão ────────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  },
}));

// ── Middlewares gerais ────────────────────────────────────────────────────────
app.use(morgan('dev'));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Arquivos estáticos (frontend) ─────────────────────────────────────────────
const publicPath = path.resolve('/app/public');
app.use(express.static(publicPath));

// ── Rotas da API ──────────────────────────────────────────────────────────────
app.use('/api/auth',         authLimiter, authRoutes);
app.use('/api/animais',      animaisRoutes);
app.use('/api/solicitacoes', solicitacoesRoutes);
app.use('/api/usuarios',     usuariosRoutes);

// ── Rota raiz: serve o frontend ───────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ── Error handler global ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`\n🐾 Adota Pet rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
