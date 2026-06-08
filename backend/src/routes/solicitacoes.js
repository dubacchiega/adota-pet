const router = require('express').Router();
const { autenticado } = require('../middlewares/auth');
const { criar, minhas, recebidas, responder, validarSolicitacao } = require('../controllers/solicitacoesController');

router.post('/',          autenticado, validarSolicitacao, criar);
router.get('/minhas',     autenticado, minhas);
router.get('/recebidas',  autenticado, recebidas);
router.put('/:id',        autenticado, responder);

module.exports = router;
