const express = require('express');
const emailController = require('../controllers/emailController');

const router = express.Router();

router.get('/getEnvDif/:idCampana', emailController.getEnvioDifusion);
router.post('/envMails', emailController.enviarCorreos);
router.post('/createEnv/:idDif', emailController.createEnvio);
router.patch('/updateEstEnv/:id', emailController.updateEstadoEnvio);
router.put('/delEnv/:idDif', emailController.deleteEnvio);
router.get('/getReporteEnv/:idCampana', emailController.getReporteEnvio);


module.exports = router;