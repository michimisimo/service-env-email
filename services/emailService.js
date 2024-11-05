require('dotenv').config();
const axios = require('axios');
const emailRepository = require('../repositories/emailRepository');
const { sendToQueue } = require('./rabbitMQConsumer'); //Accede a rabbitMQ
const SCHEDULE_INTERVAL = 60000; // 1 minuto
const momentTimezone = require("moment-timezone");

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

// Encolar correos en RabbitMQ
exports.enviarCorreo = async ({ from, to, subject, html, idEnv}) => {
    await sendToQueue('emailQueue', { from, to, subject, html, idEnv});
    console.log(`Correo encolado para ${to}`); 
};

//crea un envio para la difusion
exports.createEnvio = async (idDif) => {
    const data = emailRepository.createEnvio(idDif);
    return data;
}

exports.deleteEnvio = async (idDifusion) => {
    const data = await emailRepository.deleteEnvio(idDifusion);
    return data;
};


exports.saveReporte = async (reporte) => {
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
};

exports.startScheduler = () => {
    setInterval(async () => {
        try {
            // Obtener todas las campañas
            const campanas = await axios.get('http://service-gest-cam:3001/getCampanas/');

            for (const campana of campanas.data) {
                if (campana.id_estado === 3) {
                    console.log("Se encontró una campaña pendiente");
                    const { id_campana, fecha_programada, hora_programada, nombre } = campana;

                    const [horas, minutos] = hora_programada.split(':');
                    const fechaYHoraProgramada = momentTimezone.tz(`${fecha_programada} ${horas}:${minutos}`, "America/Santiago");
                    const nowInChile = momentTimezone.tz("America/Santiago");

                    if (nowInChile.isSame(fechaYHoraProgramada, 'minute')) {
                        console.log(`Iniciando envío para campaña ID: ${id_campana}`);

                        // Crear el objeto de reporte
                        const reporte = {
                            id_campana: id_campana,
                            nombre_campana: nombre, 
                            fecha_programada: fecha_programada,
                            hora_programada: hora_programada,
                            fecha_envio: null,
                            destinatarios_totales: 0,
                            correos_enviados: 0,
                            correos_fallidos: 0,
                            contenido: null, // Asignar más tarde
                            asunto: null, // Asignar más tarde
                            remitente: null, // Asignar más tarde
                            lista_destinatarios: [],
                            errores: []
                        };

                        // Cambiar estado de campaña a 'en proceso'
                        console.log("Cambiando estado de campaña a en proceso")
                        await axios.patch('http://service-gest-cam:3001/updateEstadoCampana/' + id_campana, {
                            id_estado: 2
                        });

                        // Obtener remitente, asunto y contenido de correo
                        const emailData = await axios.get(`http://service-gest-cam:3001/getEmailCampana/${id_campana}`);
                        const correoRemitente = emailData.data[0].correo_remitente;
                        const asunto = emailData.data[0].asunto;
                        const contenido = emailData.data[0].contenido;

                        // Actualizar el reporte con los datos del correo
                        reporte.contenido = contenido;
                        reporte.asunto = asunto;
                        reporte.remitente = correoRemitente;

                        //Obtener lista difusion
                        const listDif = await getDifusionCampana(id_campana);

                        // Obtener lista destinatarios
                        const destinatariosCampana = await getDestinatariosCampana(id_campana);

                        //Obtener lista envios
                        const listEnv = await this.getEnvioDifusion(id_campana);

                        reporte.destinatarios_totales = destinatariosCampana.length; // Total de destinatarios

                        for (const destinatario of destinatariosCampana) {

                            //Obtener difusion
                            const difusion = listDif.find(difusion => difusion.rut === destinatario.rut);

                            //Obtener envio
                            const envio = listEnv.find(envio => envio[0].id_difusion === difusion.id_difusion); 
                            const idEnvio = envio[0].id_envio;     

                            const emailDest = destinatario.email;

                            try {
                                console.log("Enviando correo");
                                await this.enviarCorreo({
                                    from: correoRemitente,
                                    to: emailDest,
                                    subject: asunto,
                                    html: contenido,
                                    idEnv: idEnvio
                                });

                                reporte.correos_enviados++; // Incrementar contador de correos enviados
                                reporte.lista_destinatarios.push(emailDest); // Agregar destinatario a la lista
                            } catch (error) {
                                console.error(`Error al enviar correo a ${emailDest}:`, error);
                                reporte.correos_fallidos++; // Incrementar contador de correos fallidos
                                reporte.errores.push(`Error al enviar correo a ${emailDest}: ${error.message}`); // Registrar error
                            }
                        }

                        // Cambiar estado de campaña a 'terminada' si se envió al menos un correo
                        if (reporte.correos_enviados > 0) {
                            // Actualizar la fecha de envío
                            reporte.fecha_envio = new Date(); // Asigna la fecha actual

                            console.log("Cambiando estado de campaña a terminada")
                            await axios.patch('http://service-gest-cam:3001/updateEstadoCampana/' + id_campana, {
                                id_estado: 1
                            });
                            console.log("Campaña terminada");

                            console.log("Almacenando reporte final");
                            // Almacenar el reporte en base de datos
                            await this.saveReporte({
                                ...reporte,
                                lista_destinatarios: JSON.stringify(reporte.lista_destinatarios),
                                errores: JSON.stringify(reporte.errores)
                            });

                        }
                    } else {
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
};
