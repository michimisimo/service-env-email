require('dotenv').config();
const axios = require('axios');
const emailRepository = require('../repositories/emailRepository');
const { sendToQueue } = require('./rabbitMQConsumer'); //Accede a rabbitMQ
/* const SCHEDULE_INTERVAL = 60000; // 1 minuto */
/* const momentTimezone = require("moment-timezone"); */

//Devuelve arreglo de tipo difusion[] de una campaña (id_difusion, rut destinatario, id_campaña)
async function getDifusionCampana(id_campana) {
    try {
        const response = await axios.get('http://service-gest-dif:3003/getDestDif/' + id_campana);
        return response.data;
    } catch (error) {
        console.error('Error al obtener los destinatarios de difusión:', error);
        throw error;
    }
}

//Devuelve arreglo de tipo destinatario[] de una campaña
async function getDestinatariosCampana(id_campana) {
    try {
        const response = await axios.get('http://service-gest-dif:3003/getDetDif/' + id_campana);
        return response.data;
    } catch (error) {
        console.error('Error al obtener los destinatarios de difusión:', error);
        throw error;
    }
}

exports.getEnvioDifusion = async (idCampana) => {
    const resultados = [];
    //Devuelve arreglo de tipo difusion[] de una campaña (id_difusion, rut destinatario, id_campaña)
    const difusion = await getDifusionCampana(idCampana);

    for (const dest of difusion) {
        try {
            //Devuelve objeto de tipo envio de una difusion (id_envio, id_estado, id_difusion, fecha_envio)
            const data = await emailRepository.getEnvioDifusion(dest.id_difusion);
            resultados.push(data);
        } catch (error) {
            console.error('Error al obtener envío:', error);
        }
    }
    //Devuelve un arreglo de tipo envio[] de una campaña
    return resultados;
};

async function enviarCorreo({ from, to, subject, html, idEnv }) {
    try {
        await sendToQueue('emailQueue', { from, to, subject, html, idEnv });
        console.log(`Correo encolado para ${to}`);
    } catch (error) {
        console.error('Error al encolar el correo:', error);
    }
}

//crea un envio para la difusion
exports.createEnvio = async (idDif) => {
    const data = emailRepository.createEnvio(idDif);
    return data;
}

exports.deleteEnvio = async (idDifusion) => {
    const data = await emailRepository.deleteEnvio(idDifusion);
    return data;
};


/* exports.saveReporte = async (reporte) => {
    try {
        const resultado = await emailRepository.saveReporte(reporte);
        console.log("Reporte guardado");
        return resultado;
    } catch (error) {
        console.error("Error al crear el reporte:", error);
        throw error;
    }
};

exports.getReporteEnvio = async (idCampana) => {
    try {
        const data = await emailRepository.getReporteEnvio(idCampana);
        return data;
    } catch (error) {
        console.error("Error al obtener el reporte de envío:", error);
        throw new Error(error.message);
    }
}; */

/* exports.startScheduler = () => {
    setInterval(async () => {
        try {
            // Obtener todas las campañas
            const campanas = await axios.get('http://service-gest-cam:3001/getCampanas/');

            for (const campana of campanas.data) {
                if (campana.id_estado === 3) {
                    console.log("Se encontró una campaña pendiente");
                    const { id_campana, fecha_programada, hora_programada } = campana;

                    const [horas, minutos] = hora_programada.split(':');
                    const fechaYHoraProgramada = momentTimezone.tz(`${fecha_programada} ${horas}:${minutos}`, "America/Santiago");
                    const nowInChile = momentTimezone.tz("America/Santiago");

                    if (nowInChile.isSame(fechaYHoraProgramada, 'minute')) {
                        console.log(`Iniciando envío para campaña ID: ${id_campana}`);
                        await axios.get('http://service-env-email:3002/iniciarEnvioCampana', campana);
                    }
                    else {
                        console.log("Esta campaña no está programada para este minuto");
                    }
                } else {
                    console.log("No hay campaña para este minuto");
                }
            }
        } catch (error) {
            console.error('Error en el scheduler de envíos:', error);
        }
    }, SCHEDULE_INTERVAL);
}; */


// Función para iniciar el envío de una campaña
exports.iniciarEnvioCampana = async (campana) => {

    let correoRemitente = ''
    let asunto = ''
    let contenido = ''

    // Crear el objeto de reporte
    const reporte = {
        id_campana: campana.id_campana,
        nombre_campana: campana.nombre,
        fecha_programada: campana.fecha_programada,
        hora_programada: campana.hora_programada,
        fecha_envio: null,
        destinatarios_totales: 0,
        correos_enviados: 0,
        correos_fallidos: 0,
        contenido: null,
        asunto: null,
        remitente: null,
        lista_destinatarios: [],
        errores: []
    };

    try {
        // Cambiar estado de campaña a 'en proceso'
        console.log("Cambiando estado de campaña a en proceso");
        await axios.patch(`http://service-gest-cam:3001/updateEstadoCampana/${campana.id_campana}`, { id_estado: 2 });

        // Obtener remitente, asunto y contenido de correo
        const emailData = await axios.get(`http://service-gest-cam:3001/getEmailCampana/${campana.id_campana}`);

        if (emailData && emailData.data && emailData.data.length > 0) {
            correoRemitente = emailData.data[0].correo_remitente;
            asunto = emailData.data[0].asunto;
            contenido = emailData.data[0].contenido;

            // Actualizar el reporte con los datos del correo
            reporte.contenido = contenido;
            reporte.asunto = asunto;
            reporte.remitente = correoRemitente;
        } else {
            throw new Error("No se encontraron datos del correo para la campaña.");
        }

        // Obtener lista de difusión y destinatarios
        const listDif = await getDifusionCampana(campana.id_campana);
        const destinatariosCampana = await getDestinatariosCampana(campana.id_campana);
        const listEnv = await this.getEnvioDifusion(campana.id_campana);

        reporte.destinatarios_totales = destinatariosCampana.length;

        // Enviar correos a cada destinatario
        for (const destinatario of destinatariosCampana) {
            const difusion = listDif.find(d => d.rut === destinatario.rut);
            const envio = listEnv.find(e => e[0].id_difusion === difusion.id_difusion);
            const idEnvio = envio[0].id_envio;
            const emailDest = destinatario.email;

            try {
                console.log(`Enviando correo a ${emailDest}`);
                await enviarCorreo({
                    from: correoRemitente,
                    to: emailDest,
                    subject: asunto,
                    html: contenido,
                    idEnv: idEnvio
                });

                reporte.correos_enviados++;
                reporte.lista_destinatarios.push(emailDest);
            } catch (error) {
                console.error(`Error al enviar correo a ${emailDest}:`, error);
                reporte.correos_fallidos++;
                reporte.errores.push(`Error al enviar correo a ${emailDest}: ${error.message}, Stack: ${error.stack || 'No stack trace available'}`);
            }
        }

        // Cambiar estado de campaña según resultados
        if (reporte.correos_enviados > 0) {
            reporte.fecha_envio = new Date();
            console.log("Cambiando estado de campaña a terminada");
            await axios.patch('http://service-gest-cam:3001/updateEstadoCampana/' + campana.id_campana, { id_estado: 1 });
        } else {
            console.log("No se enviaron correos, cambiando estado a fallida.");
            await axios.patch('http://service-gest-cam:3001/updateEstadoCampana/' + campana.id_campana, { id_estado: 4 });
        }
        try {
            console.log("Almacenando reporte final...");
            const response = await axios.post('http://service-reportes:3004/saveReporte', {
                ...reporte,
                lista_destinatarios: JSON.stringify(reporte.lista_destinatarios),
                errores: JSON.stringify(reporte.errores)
            });

            console.log("Reporte guardado con éxito:", response.data);
        } catch (error) {
            console.error("Error al guardar el reporte:", error);
            if (error.response) {
                console.error("Respuesta del servidor:", error.response.data);
            }
        }

    } catch (error) {
        console.error("Error durante el proceso de envío:", error);
        await axios.post('http://service-gest-cam:3001/updateEstadoCampana/' + campana.id_campana, { id_estado: 4 });
    }
};
