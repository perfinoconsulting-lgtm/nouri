import { Resend } from 'resend';

const resend = new Resend('re_Q4pnmhaX_Jx4MGKWmeix6fKpnoLP19YNg');

resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'perfino.consulting@gmail.com',
  subject: 'Hello World',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
});

console.log('sended');