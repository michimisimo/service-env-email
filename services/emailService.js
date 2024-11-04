require('dotenv').config();
const axios = require('axios');
const emailRepository = require('../repositories/emailRepository');
const { sendToQueue } = require('./rabbitMQConsumer'); //Accede a rabbitMQ
const SCHEDULE_INTERVAL = 60000; // 1 minuto
const moment = require('moment');
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

// Función para iniciar el scheduler
exports.startScheduler = () => {
    setInterval(async () => {
        try {
            //  Obtener todas las campañas
            const campanas = await axios.get('http://service-gest-cam:3001/getCampanas/');            

            // Obtener la fecha y hora actuales
            const now = new Date();

            for (const campana of campanas.data) {
                //Filtrar las campañas pendientes de envío
                if (campana.id_estado === 3){
                    console.log("Se encontró una campaña pendiente")
                    const { id_campana, fecha_programada, hora_programada } = campana;

                    // Extraer solo la parte de horas y minutos
                    const [horas, minutos] = hora_programada.split(':');
                            
                    // Combinar fecha_programada y hora_programada para crear un objeto de Date
                    const fechaYHoraProgramada = momentTimezone.tz(`${fecha_programada} ${horas}:${minutos}`, "America/Santiago");            
                    const nowInChile = momentTimezone.tz("America/Santiago");                   

                    if (nowInChile.isSame(fechaYHoraProgramada, 'minute'))
                        {
                        console.log(`Iniciando envío para campaña ID: ${id_campana}`);

                        //Obtener lista difusion
                        const listDif = await getDifusionCampana(id_campana);

                        //Obtener lista envios
                        const listEnv = await this.getEnvioDifusion(id_campana);
                        console.log("Lista envio: ",listEnv);

                        //Obtener lista correos de destinatarios
                        const destinatariosCampana = await getDestinatariosCampana(id_campana);  //Devuelve un arreglo de tipo destinatario[] de la campaña   
                        console.log("Destinatarios campaña: ",destinatariosCampana)                    
                                                
                        //Obtener remitente, asunto y contenido de correo
                        const emailData = await axios.get(`http://service-gest-cam:3001/getEmailCampana/${id_campana}`);                         
                        const correoRemitente = emailData.data[0].correo_remitente;
                        const asunto = emailData.data[0].asunto;
                        const contenido = emailData.data[0].contenido;
                        console.log("correo remitente: ",correoRemitente, ", asunto: ", asunto, ", contenido: ",contenido) 


                        for (const destinatario of destinatariosCampana){

                            //Obtener difusion
                            const difusion = listDif.find(difusion => difusion.rut === destinatario.rut);
                            console.log("Difusion: ", difusion)

                            //Obtener envio
                            const envio = listEnv.find(envio => envio[0].id_difusion === difusion.id_difusion); 
                            const idEnvio = envio[0].id_envio;  
                            console.log("Envío: ", envio, ", ID envio: ",idEnvio)                               

                            //Obtener email destinatario
                            const emailDest = destinatario.email;       
                            console.log("Email: ", emailDest)    

                            // Llama a enviarCorreos para encolar el envío de correos
                            console.log("Enviando correo")
                            await this.enviarCorreo({
                                from: correoRemitente, 
                                to: emailDest,
                                subject: asunto,
                                html: contenido,
                                idEnv: idEnvio
                            });
                            /* if estado correos != 4 !=3 then   */
                            /* await axios.patch('http://service-gest-cam:3001/updateEstadoCampana/' + id_campana); //Cambia a 'terminada' usando id_campana */
                        } 
                        
                    } else{
                        console.log("Esta campaña no está programada para este minuto")
                    }
                } else{
                    console.log("No hay campaña para este minuto")
                }          
            }
        } catch (error) {
            console.error('Error en el scheduler de envíos:', error);
        }
    }, SCHEDULE_INTERVAL);
};