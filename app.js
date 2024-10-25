const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config(); // Cargar las variables de entorno

const app = express();
const port = process.env.PORT

// Middleware para parsear JSON
app.use(express.json());

// Ruta POST para enviar correo
app.post('/send-mail', async (req, res) => {
    const { sendto, name, replyTo, ishtml, title, body } = req.body;

    try {
        const response = await axios.post(`https://${process.env.RAPIDAPI_HOST}/`, {
            sendto,
            name,
            replyTo,
            ishtml,
            title,
            body
        }, {
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': process.env.RAPIDAPI_HOST,
                'Content-Type': 'application/json'
            }
        });

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al enviar el correo', error: error.message });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});