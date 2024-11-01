const express = require('express');
const emailController = require('../controllers/emailController');

const router = express.Router();

router.get('/getEnvDif', emailController.getEnvioDifusion);
router.post('/envMails', emailController.enviarCorreos);
router.post('/createEnv/:idDif', emailController.createEnvio);

module.exports = router;