import nodemailer from 'nodemailer';


export async function sendEmail(email:string, url:string) {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user, 
      pass: testAccount.pass,
    },
  });
 const mailOptions = {
     from: "ivotoci@ivcho.com",
     to: email,
     subject: "Please confirm your email",
     text: "Confirm your email",
     html: `<a href=${url}>${url}</a>`
 }

  const info = await transporter.sendMail(mailOptions);

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}