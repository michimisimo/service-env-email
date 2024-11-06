const express = require('express');
const emailController = require('../controllers/emailController');

const router = express.Router();

router.get('/getEnvDif/:idCampana', emailController.getEnvioDifusion);
router.post('/createEnv/:idDif', emailController.createEnvio);
router.put('/delEnv/:idDif', emailController.deleteEnvio);
router.get('/getReporteEnv/:idCampana', emailController.getReporteEnvio);
router.post('/iniciarEnvioCampana', emailController.iniciarEnvioCampana);

module.exports = router;