require('dotenv').config();
const axios = require('axios');
const emailRepository = require('../repositories/emailRepository');
const { sendToQueue } = require('./rabbitMQConsumer'); //Accede a rabbitMQ

async function getDifusionCampana(id_campana) {
    try {
        const response = await axios.get('http://localhost:3001/getDestDif/' + id_campana);
        return response.data;
    } catch (error) {
        console.error('Error al obtener los destinatarios de difusión:', error);
        throw error;
    }
}

exports.getEnvioDifusion = async (idCampana) => {
    const resultados = [];
    const difusion = await getDifusionCampana(idCampana);

    for (const dest of difusion) {
        try {
            const data = await emailRepository.getEnvioDifusion(dest.id_difusion);
            resultados.push(data);
        } catch (error) {
            console.error('Error al obtener envío:', error);
        }
    }
    return resultados;
};

// Encolar correos en RabbitMQ
exports.enviarCorreos = async ({ idDif, from, to, subject, html }) => {
    const idDifusion = idDif
    console.log("To: " + JSON.stringify(to));
    for (const email of to) {
        await sendToQueue('emailQueue', { from, to: email, subject, html });
        console.log(`Correo encolado para ${email}`);
    }
};
