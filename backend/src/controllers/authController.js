const bcrypt   = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getPool } = require('../config/db');

// ── Validações ────────────────────────────────────────────────────────────────
const validarCadastro = [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório.'),
  body('email').isEmail().normalizeEmail().withMessage('E-mail inválido.'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres.'),
  body('tipo').isIn(['adotante', 'doador']).withMessage('Tipo inválido.'),
];

const validarLogin = [
  body('email').isEmail().normalizeEmail().withMessage('E-mail inválido.'),
  body('senha').notEmpty().withMessage('Senha é obrigatória.'),
];

// ── Cadastro ──────────────────────────────────────────────────────────────────
async function cadastrar(req, res) {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(400).json({ erros: erros.array() });
  }

  const { nome, email, senha, telefone, cidade, tipo } = req.body;

  try {
    const pool = getPool();

    const [existente] = await pool.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );
    if (existente.length > 0) {
      return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const [result] = await pool.execute(
      `INSERT INTO usuarios (nome, email, senha_hash, telefone, cidade, tipo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nome, email, senhaHash, telefone || null, cidade || null, tipo]
    );

    req.session.usuarioId = result.insertId;
    req.session.usuarioNome = nome;
    req.session.usuarioTipo = tipo;

    return res.status(201).json({
      mensagem: 'Cadastro realizado com sucesso!',
      usuario: { id: result.insertId, nome, email, tipo },
    });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    return res.status(500).json({ erro: 'Erro ao cadastrar usuário.' });
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function login(req, res) {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(400).json({ erros: erros.array() });
  }

  const { email, senha } = req.body;

  try {
    const pool = getPool();

    const [rows] = await pool.execute(
      'SELECT id, nome, email, senha_hash, tipo FROM usuarios WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const usuario = rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    req.session.usuarioId   = usuario.id;
    req.session.usuarioNome = usuario.nome;
    req.session.usuarioTipo = usuario.tipo;

    return res.json({
      mensagem: 'Login realizado com sucesso!',
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo },
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ erro: 'Erro ao fazer login.' });
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ erro: 'Erro ao fazer logout.' });
    res.clearCookie('connect.sid');
    return res.json({ mensagem: 'Logout realizado com sucesso.' });
  });
}

// ── Sessão atual ──────────────────────────────────────────────────────────────
function sessao(req, res) {
  if (req.session && req.session.usuarioId) {
    return res.json({
      logado: true,
      usuario: {
        id:   req.session.usuarioId,
        nome: req.session.usuarioNome,
        tipo: req.session.usuarioTipo,
      },
    });
  }
  return res.json({ logado: false });
}

module.exports = { cadastrar, login, logout, sessao, validarCadastro, validarLogin };
