import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<void> {
  // Check if email configuration is properly set up
  const emailConfig = {
    host: process.env.EMAIL_SERVER_HOST,
    port: process.env.EMAIL_SERVER_PORT,
    secure: process.env.EMAIL_SERVER_SECURE,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  };

  // If not in production and email config is missing, log the email instead of sending
  if (!emailConfig.host || !emailConfig.port || !emailConfig.auth?.user || !emailConfig.auth?.pass) {
    console.log(`[EMAIL LOG] Would send email to: ${to}`);
    console.log(`[EMAIL LOG] Subject: ${subject}`);
    console.log(`[EMAIL LOG] Text: ${text}`);
    console.log(`[EMAIL LOG] HTML: ${html}`);
    
    // In development or testing, if email config is not set up, just return to avoid failures
    if (process.env.NODE_ENV !== 'production') {
      console.log('[EMAIL LOG] Email configuration missing, skipping in development mode');
      return;
    }
  }

  // Create a transporter using environment variables
  const transporter = nodemailer.createTransport({
    host: emailConfig.host || 'smtp.gmail.com',
    port: parseInt(emailConfig.port || '587'),
    secure: emailConfig.secure === 'true',
    auth: {
      user: emailConfig.auth.user,
      pass: emailConfig.auth.pass,
    },
  });

  // Send mail with defined transport object
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"DAVR Recycling" <noreply@davr-recycling.de>',
    to,
    subject,
    text,
    html,
  });
} 