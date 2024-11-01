const express = require('express');
const cors = require('cors');
const usuarioRoutes = require('./Routes/emailRoutes');
const { initRabbitMQConsumer } = require('./services/rabbitMQConsumer');

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// Iniciar RabbitMQ y el consumidor
initRabbitMQConsumer().catch(console.error);

// Usar las rutas
app.use('/', usuarioRoutes);

app.listen(port, () => {
    console.log(`Service running on port ${port}`);
});

