const nodemailer = require('nodemailer')

let transporter = null

async function getTransporter() {
  if (transporter) return transporter

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  } else {
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
    console.log('\n📧 No SMTP configured — using Ethereal test email.')
    console.log(`📧 Ethereal account: ${testAccount.user}`)
  }

  return transporter
}

async function sendMail({ to, subject, html, text }) {
  const transport = await getTransporter()
  const info = await transport.sendMail({
    from: process.env.SMTP_FROM || '"Thikana" <noreply@thikana.com>',
    to,
    subject,
    html,
    text: text || '',
  })

  if (!process.env.SMTP_HOST) {
    console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
  }

  return info
}

module.exports = { sendMail }
