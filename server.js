const express = require('express');
const app = express();
const path = require('path');
const mysql = require('mysql2');

// Configuração do banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '249249',
    database: 'lavarapido'
});

// Conectar ao banco de dados
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to MySQL');
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota para página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Porta onde o servidor vai rodar
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
