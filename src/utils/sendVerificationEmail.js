const transporter = require('../config/mailer');

async function sendVerificationEmail(to, verificationToken) {
    const baseUrl = process.env.BASE_URL;

    const verificationUrl = `${baseUrl}/auth/verify?token=${verificationToken}`;

    await transporter.sendMail({
        from: `"Pesito" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Confirma tu registro en Pesito',
        html: `
            <h3>Por favor, haz clic en el siguiente enlace para verificar tu correo electrónico:</h3>
            <a href="${verificationUrl}">Verificar cuenta</a>
        `
    });
}

module.exports = sendVerificationEmail;
