const router = require('express').Router();
const { autenticado } = require('../middlewares/auth');
const {
  listar, buscarPorId, meus, criar, atualizarStatus, remover, validarAnimal
} = require('../controllers/animaisController');

router.get('/',           listar);
router.get('/meus',       autenticado, meus);
router.get('/:id',        buscarPorId);
router.post('/',          autenticado, validarAnimal, criar);
router.put('/:id/status', autenticado, atualizarStatus);
router.delete('/:id',     autenticado, remover);

module.exports = router;
