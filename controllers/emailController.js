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

exports.createEnvio = async (req, res) => {
    const idDif = parseInt(req.params.idDif, 10);
    try {
        await emailService.createEnvio(idDif);
        res.status(200).json({ message: 'envio creado exitosamente.' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

exports.deleteEnvio = async (req, res) => {
    const { idDif } = req.params;
    try {
        const data = await emailService.deleteEnvio(idDif);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.getReporteEnvio = async (req, res) => {
    const { idCampana } = req.params;
    try {
        const data = await emailService.getReporteEnvio(idCampana);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.iniciarEnvioCampana = async (req, res) => {
    const { campana } = req.body;
    try {
        const data = await emailService.iniciarEnvioCampana(campana);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
