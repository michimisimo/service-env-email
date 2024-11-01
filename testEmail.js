const emailRepository = require('./repositories/emailRepository'); // Ajusta la ruta

async function testEnviarCorreo() {

    const from = 'test@go-mail.us.to';
    const to = 'mariacalderonq@gmail.com';
    const subject = 'Prueba de Envío de Correo';
    const html = 'Hola, este es un correo de prueba'; // Cuerpo del correo
    const name = 'user2024';
    

    try {
        const response = await emailRepository.enviarCorreo({ name, from, to, subject, html });
        console.log('Correo enviado:', response);
    } catch (error) {
        console.error('Error al enviar el correo:', error.message);
    }
}

testEnviarCorreo();