const router = require('express').Router();
const { cadastrar, login, logout, sessao, validarCadastro, validarLogin } = require('../controllers/authController');

router.post('/cadastro', validarCadastro, cadastrar);
router.post('/login',    validarLogin,    login);
router.post('/logout',   logout);
router.get('/sessao',    sessao);

module.exports = router;
