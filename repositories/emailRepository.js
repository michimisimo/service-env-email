const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const { Resend } = require('resend');

const resendKey = process.env.RESEND_API_KEY;
const resend = new Resend(resendKey);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
        const response = await resend.emails.send({ from, to, subject, html });
        return response;
    } catch (error) {
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

exports.upadateEstadoEnvio = async (id_env) => {
    const { data, error } = await supabase
        .from('envio')
        .insert({ 'id_estado': 2, 'fecha_envio': new Date() })
        .eq('id_env', id_env)
    if (error) throw new Error(error.message);
    return data;

};

