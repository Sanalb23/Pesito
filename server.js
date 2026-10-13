const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Le decimos a Express que sirva todos los archivos estáticos desde la raíz de tu proyecto
app.use(express.static(path.join(__dirname)));

// Ruta de prueba para asegurarnos que levanta bien
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`¡Servidor local andando en http://localhost:${PORT}`);
});