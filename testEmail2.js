const emailService = require('./services/emailService')

async function testEnviarCorreo() {

    const idDif = 0;
    const from = 'test@go-mail.us.to';
    const to = ['mariacalderonq@gmail.com'];
    const subject = 'Prueba de Envío de Correo';
    const html = 'Hola, este es un correo de prueba'; // Cuerpo del correo
    

    try {
        const response = await emailService.enviarCorreos({ idDif, from, to, subject, html });
        console.log('Correo enviado:', response);
    } catch (error) {
        console.error('Error al enviar el correo:', error.message);
    }
}

testEnviarCorreo();