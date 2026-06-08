const router = require('express').Router();
const { autenticado } = require('../middlewares/auth');
const { perfil } = require('../controllers/usuariosController');

router.get('/perfil', autenticado, perfil);

module.exports = router;
