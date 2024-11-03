const emailService = require('../services/emailService')

exports.getEnvioDifusion = async (req, res) => {
    const { idCampana } = req.params;
    try {
        const data = await emailService.getEnvioDifusion(idCampana);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.enviarCorreos = async (req, res) => {
    const { idDif, from, to, subject, html } = req.body;
    console.log("To controller: " + JSON.stringify(to));

    try {
        const responses = await emailService.enviarCorreos({ idDif, from, to, subject, html });
        res.status(200).json(responses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al enviar los correos' });
    }
}

exports.createEnvio = async (req, res) => {
    const idDif = parseInt(req.params.idDif, 10);
    try {
        await emailService.createEnvio(idDif);
        res.status(200).json({ message: 'envio creado exitosamente.' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}