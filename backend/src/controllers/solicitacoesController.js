const { body, validationResult } = require('express-validator');
const { getPool } = require('../config/db');

const validarSolicitacao = [
  body('animal_id').isInt({ min: 1 }).withMessage('Animal inválido.'),
  body('tipo_moradia')
    .isIn(['casa_com_quintal', 'casa_sem_quintal', 'apartamento'])
    .withMessage('Tipo de moradia inválido.'),
];

// POST /api/solicitacoes
async function criar(req, res) {
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(400).json({ erros: erros.array() });

  const { animal_id, mensagem, tem_outros_pets, tem_criancas, tipo_moradia } = req.body;
  const adotante_id = req.session.usuarioId;

  try {
    const pool = getPool();

    // Verifica se o animal existe e está disponível
    const [animal] = await pool.execute(
      'SELECT id, usuario_id, status FROM animais WHERE id = ?',
      [animal_id]
    );
    if (animal.length === 0) return res.status(404).json({ erro: 'Animal não encontrado.' });
    if (animal[0].status !== 'disponivel') return res.status(409).json({ erro: 'Animal não está disponível para adoção.' });
    if (animal[0].usuario_id === adotante_id) return res.status(409).json({ erro: 'Você não pode adotar seu próprio animal.' });

    const [result] = await pool.execute(
      `INSERT INTO solicitacoes (animal_id, adotante_id, mensagem, tem_outros_pets, tem_criancas, tipo_moradia)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [animal_id, adotante_id, mensagem || null,
       tem_outros_pets ? 1 : 0, tem_criancas ? 1 : 0, tipo_moradia]
    );

    return res.status(201).json({ mensagem: 'Solicitação enviada com sucesso!', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Você já enviou uma solicitação para este animal.' });
    }
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao enviar solicitação.' });
  }
}

// GET /api/solicitacoes/minhas — solicitações que o adotante enviou
async function minhas(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT s.*, a.nome AS animal_nome, a.especie, a.foto_url,
              u.nome AS doador_nome, u.cidade
       FROM solicitacoes s
       JOIN animais  a ON a.id = s.animal_id
       JOIN usuarios u ON u.id = a.usuario_id
       WHERE s.adotante_id = ?
       ORDER BY s.criado_em DESC`,
      [req.session.usuarioId]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao buscar suas solicitações.' });
  }
}

// GET /api/solicitacoes/recebidas — pedidos para animais do doador
async function recebidas(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT s.*, a.nome AS animal_nome, a.especie, a.foto_url,
              u.nome AS adotante_nome, u.email AS adotante_email, u.telefone AS adotante_telefone, u.cidade AS adotante_cidade
       FROM solicitacoes s
       JOIN animais  a ON a.id = s.animal_id
       JOIN usuarios u ON u.id = s.adotante_id
       WHERE a.usuario_id = ?
       ORDER BY s.criado_em DESC`,
      [req.session.usuarioId]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao buscar solicitações recebidas.' });
  }
}

// PUT /api/solicitacoes/:id — aprovar ou recusar
async function responder(req, res) {
  const { status } = req.body;
  if (!['aprovada', 'recusada'].includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }

  try {
    const pool = getPool();

    // Confirma que a solicitação pertence a um animal do usuário logado
    const [rows] = await pool.execute(
      `SELECT s.id, s.animal_id FROM solicitacoes s
       JOIN animais a ON a.id = s.animal_id
       WHERE s.id = ? AND a.usuario_id = ?`,
      [req.params.id, req.session.usuarioId]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Solicitação não encontrada ou sem permissão.' });

    await pool.execute('UPDATE solicitacoes SET status = ? WHERE id = ?', [status, req.params.id]);

    // Se aprovada, marca o animal como adotado
    if (status === 'aprovada') {
      await pool.execute(
        'UPDATE animais SET status = ? WHERE id = ?',
        ['adotado', rows[0].animal_id]
      );
    }

    return res.json({ mensagem: `Solicitação ${status} com sucesso.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao responder solicitação.' });
  }
}

module.exports = { criar, minhas, recebidas, responder, validarSolicitacao };
