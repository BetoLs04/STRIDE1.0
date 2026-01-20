const express = require('express');
const cors = require('cors');
require('dotenv').config();
const universityRoutes = require('./routes/universityRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logs
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Rutas
app.use('/api/university', universityRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: 'API Sistema Universitario STRIDE',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.listen(PORT, () => {
    console.log(`🎓 Sistema Universitario corriendo en http://localhost:${PORT}`);
});