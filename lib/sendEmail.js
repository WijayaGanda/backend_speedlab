const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // 1. Buat Transporter (Konfigurasi layanan email)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Nodemailer sudah tahu port & host untuk Gmail
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 2. Tentukan isi email (Mail Options)
    const mailOptions = {
      from: `"Speedlab Support" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      // html: options.htmlMessage, // Bisa juga kirim template HTML agar lebih cantik
    };

    // 3. Kirim Email
    await transporter.sendMail(mailOptions);
    console.log(`Email berhasil dikirim ke: ${options.email}`);
  } catch (error) {
    console.error("Gagal mengirim email:", error);
    throw new Error("Email tidak terkirim");
  }
};

module.exports = sendEmail;