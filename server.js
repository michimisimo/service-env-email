const express = require('express');
const cors = require('cors');
const usuarioRoutes = require('./Routes/emailRoutes');

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// Usar las rutas
app.use('/', usuarioRoutes);

app.listen(port, () => {
    console.log(`service running on port ${port}`);
});
