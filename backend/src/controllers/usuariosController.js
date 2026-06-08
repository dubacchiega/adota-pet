const { getPool } = require('../config/db');

// GET /api/usuarios/perfil
async function perfil(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, nome, email, telefone, cidade, tipo, criado_em FROM usuarios WHERE id = ?',
      [req.session.usuarioId]
    );
    if (rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro ao buscar perfil.' });
  }
}

module.exports = { perfil };
