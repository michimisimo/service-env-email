const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const { Resend } = require('resend');

const resendKey = process.env.RESEND_API_KEY;
const resend = new Resend(resendKey);
const axios = require('axios');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rapidApiKey = process.env.RAPIDAPI_KEY;
const rapidApiUrl = process.env.RAPIDAPI_URL;

exports.getEnvioDifusion = async (idDif) => {
    const { data, error } = await supabase
        .from('envio')
        .select("*")
        .eq('id_difusion', idDif);

    if (error) throw new Error(error.message);
    return data;
};

exports.enviarCorreo = async ({ from, to, subject, html }) => {

    try {

        const requestData = {
            sendto: to,
            name: "MassiveTeam",
            replyTo: from,
            ishtml: "false",  // Cambia a "true" si el cuerpo es HTML
            title: subject,
            body: html
        };

        console.log("Request data: " + JSON.stringify(requestData));

        const response = await axios.post(rapidApiUrl, requestData, {
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': 'mail-sender-api1.p.rapidapi.com',
                'x-rapidapi-key': rapidApiKey,  // Asegúrate de mantener la clave segura
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error al enviar correo:", error.response ? error.response.data : error.message);
        throw new Error(error.message);
    }
};

exports.createEnvio = async (idDif) => {
    const { data, error } = await supabase
        .from('envio')
        .insert({ 'id_difusion': idDif })
    if (error) throw new Error(error.message);
    return data;
};

exports.updateEstadoEnvio = async (id_env) => {
    const { data, error } = await supabase
        .from('envio')
        .update({ 'id_estado': 2, 'fecha_envio': new Date() })
        .eq('id_env', id_env)
    if (error) throw new Error(error.message);
    return data;
};

