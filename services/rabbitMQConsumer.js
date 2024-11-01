// services/rabbitMQConsumer.js
const amqp = require('amqplib');
const emailRepository = require('../repositories/emailRepository');

let channel;

async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        console.log("Connected to RabbitMQ");
    } catch (error) {
        console.error("Failed to connect to RabbitMQ", error);
    }
}

async function sendToQueue(queue, message) {
    if (!channel) {
        console.error("RabbitMQ channel not initialized");
        return;
    }
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
}

async function processEmail({ from, to, subject, html }) {
    try {
        const response = await emailRepository.enviarCorreo({ from, to, subject, html });
        console.log(`Correo enviado a ${to}`, response);
    } catch (error) {
        console.error(`Error al enviar correo a ${to}:`, error.message);
    }
}

async function consumeQueue(queue) {
    if (!channel) {
        console.error("RabbitMQ channel not initialized");
        return;
    }
    await channel.assertQueue(queue, { durable: true });
    channel.consume(queue, async (msg) => {
        if (msg !== null) {
            const message = JSON.parse(msg.content.toString());
            await processEmail(message);
            channel.ack(msg);
        }
    });
}

// Inicializar conexión y consumidor de la cola
async function initRabbitMQConsumer() {
    await connectRabbitMQ();
    await consumeQueue('emailQueue');
}

module.exports = {
    initRabbitMQConsumer,
    sendToQueue,
};
