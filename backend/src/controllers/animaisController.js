const { body, validationResult } = require('express-validator');
const { getPool } = require('../config/db');

const validarAnimal = [
  body('nome').trim().notEmpty().withMessage('Nome do animal é obrigatório.'),
  body('especie').isIn(['cachorro', 'gato', 'outro']).withMessage('Espécie inválida.'),
  body('sexo').isIn(['macho', 'femea']).withMessage('Sexo inválido.'),
];

// GET /api/animais — listar com filtros
async function listar(req, res) {
  try {
    const pool = getPool();
    const { especie, porte, sexo, cidade } = req.query;

    let sql = `
      SELECT a.*, u.nome AS doador_nome, u.cidade, u.telefone
      FROM animais a
      JOIN usuarios u ON u.id = a.usuario_id
      WHERE a.status = 'disponivel'
    `;
    const params = [];

    if (especie) { sql += ' AND a.especie = ?';  params.push(especie); }
    if (porte)   { sql += ' AND a.porte = ?';    params.push(porte); }
    if (sexo)    { sql += ' AND a.sexo = ?';     params.push(sexo); }
    if (cidade)  { sql += ' AND u.cidade LIKE ?'; params.push(`%${cidade}%`); }

    sql += ' ORDER BY a.criado_em DESC';

    const [rows] = await pool.execute(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar animais.' });
  }
}

// GET /api/animais/:id
async function buscarPorId(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT a.*, u.nome AS doador_nome, u.cidade, u.telefone, u.email AS doador_email
       FROM animais a
       JOIN usuarios u ON u.id = a.usuario_id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Animal não encontrado.' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao buscar animal.' });
  }
}

// GET /api/animais/meus — animais do usuário logado
async function meus(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT a.*,
        (SELECT COUNT(*) FROM solicitacoes s WHERE s.animal_id = a.id AND s.status = 'pendente') AS pedidos_pendentes
       FROM animais a
       WHERE a.usuario_id = ?
       ORDER BY a.criado_em DESC`,
      [req.session.usuarioId]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao listar seus animais.' });
  }
}

// POST /api/animais
async function criar(req, res) {
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(400).json({ erros: erros.array() });

  const { nome, especie, raca, idade_anos, sexo, porte, descricao, vacinado, castrado, foto_url } = req.body;

  try {
    const pool = getPool();
    const [result] = await pool.execute(
      `INSERT INTO animais (usuario_id, nome, especie, raca, idade_anos, sexo, porte, descricao, vacinado, castrado, foto_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.session.usuarioId, nome, especie, raca || null, idade_anos || null,
       sexo, porte || null, descricao || null,
       vacinado ? 1 : 0, castrado ? 1 : 0, foto_url || null]
    );
    return res.status(201).json({ mensagem: 'Animal cadastrado com sucesso!', id: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao cadastrar animal.' });
  }
}

// PUT /api/animais/:id/status
async function atualizarStatus(req, res) {
  const { status } = req.body;
  const statusValidos = ['disponivel', 'em_processo', 'adotado'];
  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'UPDATE animais SET status = ? WHERE id = ? AND usuario_id = ?',
      [status, req.params.id, req.session.usuarioId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ erro: 'Animal não encontrado ou sem permissão.' });
    return res.json({ mensagem: 'Status atualizado.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao atualizar status.' });
  }
}

// DELETE /api/animais/:id
async function remover(req, res) {
  try {
    const pool = getPool();
    const [result] = await pool.execute(
      'DELETE FROM animais WHERE id = ? AND usuario_id = ?',
      [req.params.id, req.session.usuarioId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ erro: 'Animal não encontrado ou sem permissão.' });
    return res.json({ mensagem: 'Animal removido.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao remover animal.' });
  }
}

module.exports = { listar, buscarPorId, meus, criar, atualizarStatus, remover, validarAnimal };
