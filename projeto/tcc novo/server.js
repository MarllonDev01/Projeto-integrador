const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('./database'); // Conexão com o banco de dados
const app = express();

app.use(express.json());

// Função para gerar um token único
function gerarToken() {
    return crypto.randomBytes(20).toString('hex');
}

// Rota para solicitar alteração de senha
app.post('/solicitar-alteracao-senha', async (req, res) => {
    const { usuarioId, email } = req.body;

    // Gera um token único para o link de confirmação
    const token = gerarToken();
    
    // Salva o token no banco de dados, junto com a expiração
    await pool.query('UPDATE usuarios SET token_senha = ?, token_senha_expiracao = ? WHERE id = ?', [
        token, new Date(Date.now() + 3600000), usuarioId // O token expira em 1 hora
    ]);

    // Configuração do serviço de envio de e-mail
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'seuemail@gmail.com', // Seu e-mail de envio
            pass: 'suaSenha', // Sua senha ou app password do Gmail
        },
    });

    const mailOptions = {
        from: 'seuemail@gmail.com',
        to: email, // Substitua pelo e-mail do usuário
        subject: 'Alteração de Senha',
        text: `Você solicitou alteração de senha. Clique no link abaixo para confirmar:\n\n
        http://seusite.com/alterar-senha?token=${token}`,
    };

    // Enviar e-mail
    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (error) {
        console.error("Erro ao enviar e-mail: ", error);
        res.json({ success: false });
    }
});

// Rota para alterar a senha
app.post('/alterar-senha', async (req, res) => {
    const { token, novaSenha } = req.body;

    // Verifica se o token é válido e se não expirou
    const [result] = await pool.query('SELECT * FROM usuarios WHERE token_senha = ? AND token_senha_expiracao > NOW()', [token]);

    if (result.length > 0) {
        // Se o token for válido, altera a senha do usuário
        const hashedSenha = await bcrypt.hash(novaSenha, 10); // Criptografando a nova senha com bcrypt

        await pool.query('UPDATE usuarios SET senha = ?, token_senha = NULL, token_senha_expiracao = NULL WHERE id = ?', [
            hashedSenha, result[0].id
        ]);
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Token inválido ou expirado.' });
    }
});

// Inicia o servidor na porta 3000
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
