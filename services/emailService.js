require('dotenv').config();
const axios = require('axios');
const emailRepository = require('../repositories/emailRepository')

async function getDifusionCampana(id_campana) {
    try {
        const response = await axios.get('http://localhost:3001/getDestDif')
        return response.data;
    } catch (error) {
        console.error('Error al obtener los destinatarios difuson:', error);
        throw error;
    }
}

exports.getEnvioDifusion = async (idCampana) => {
    const resultados = [];

    const difusion = getDifusionCampana(idCampana)
    console.log(difusion)
    for (const dest of difusion) {
        try {
            const data = await emailRepository.getEnvioDifusion(dest.id_difusion)
            resultados.push(data)
        } catch (error) {
            console.error('Error al obtener envio:', error);
        }
    }
    return resultados
};


exports.enviarCorreos = async ({ from, to, subject, html }) => {
    const responses = [];

    for (const email of to) {
        try {
            const response = await emailRepository.enviarCorreo({ from, to: email, subject, html });
            responses.push(response);
        } catch (error) {
            console.error(`Error al enviar a ${email}: ${error.message}`);
            responses.push({ email, error: error.message });
        }
    }

    return responses;
};

exports.createEnvio = async (idDif) => {
    const data = await emailRepository.createEnvio(idDif);
    return data;
};
