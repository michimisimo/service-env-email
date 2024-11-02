// services/rabbitMQConsumer.js
const amqp = require('amqplib');
const emailRepository = require('../repositories/emailRepository');

let channel;

// Inicializar conexión y consumidor de la cola
//Esta función se encarga de establecer la conexión con RabbitMQ y de empezar a consumir mensajes de la cola llamada emailQueue.
async function initRabbitMQConsumer() {
    await connectRabbitMQ();
    await consumeQueue('emailQueue');
}

//Establece una conexión con el servidor RabbitMQ. Si la conexión es exitosa, crea un canal que se usará para enviar y recibir mensajes.
async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        console.log("Connected to RabbitMQ");

        // Asegurarse de que la cola existe al conectar
        await channel.assertQueue('emailQueue', { durable: true });
    } catch (error) {
        console.error("Failed to connect to RabbitMQ", error);
    }
}

//Esta función envía un mensaje a una cola especificada. Aquí, message es el objeto que contiene los datos del correo.
//Uso: Se llama desde el servicio que gestiona el envío de correos, en el que se iteran los destinatarios y se encolan correos para cada uno.
async function sendToQueue(queue, message) {
    if (!channel) {
        console.error("RabbitMQ channel not initialized");
        return;
    }
    await channel.assertQueue(queue, { durable: true }); // Asegura que la cola existe
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
}

//Esta función establece un consumidor para la cola. Cuando un mensaje es recibido, lo procesa.
//Escucha la Cola: Se asegura de que la cola existe y luego comienza a consumir mensajes.
//Procesa el Mensaje: Cuando recibe un mensaje (msg), lo convierte de un Buffer a un objeto JavaScript y llama a processEmail(message).
async function consumeQueue(queue) {
    if (!channel) {
        console.error("RabbitMQ channel not initialized");
        return;
    }
    await channel.assertQueue(queue, { durable: true }); // Asegura que la cola existe
    channel.consume(queue, async (msg) => {
        if (msg !== null) {
            const message = JSON.parse(msg.content.toString());
            await processEmail(message);
            channel.ack(msg); // Acknowledge the message
        }
    });
}

//Esta función maneja el envío real del correo electrónico.
//Uso de Parámetros: Los parámetros from, to, subject, y html provienen del mensaje que fue encolado anteriormente. 
//Aquí es donde se utiliza la información que fue enviada a la cola.
async function processEmail({ from, to, subject, html }) {
    try {
        const response = await emailRepository.enviarCorreo({ from, to, subject, html });
        console.log(`Correo enviado a ${to}`, response);
    } catch (error) {
        console.error(`Error al enviar correo a ${to}:`, error.message);
    }
}

//Esto permite que las funciones initRabbitMQConsumer y sendToQueue sean accesibles desde otros archivos de tu aplicación. 
//Es una forma de encapsular la lógica de RabbitMQ en un módulo que puede ser importado y utilizado en otras partes del código.
module.exports = {
    initRabbitMQConsumer,
    sendToQueue,
};