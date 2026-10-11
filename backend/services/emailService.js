import crypto from 'crypto';
import { config } from '../config/index.js';
import { tokenRepository } from '../repositories/tokenRepository.js';

export const emailService = {
  getTemplateWrapper(title, content) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F8FC; margin: 0; padding: 20px; color: #172033; }
    .card { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E7EAF0; box-shadow: 0 4px 12px rgba(16,24,40,0.05); overflow: hidden; }
    .header { background: #5B5FEF; padding: 32px 32px; color: #FFFFFF; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px; font-size: 15px; line-height: 1.6; color: #172033; }
    .btn { display: inline-block; background-color: #5B5FEF; color: #FFFFFF !important; font-weight: 600; font-size: 15px; text-decoration: none; padding: 12px 28px; border-radius: 10px; margin: 20px 0; }
    .footer { padding: 24px 32px; background: #F7F8FC; border-top: 1px solid #E7EAF0; font-size: 12px; color: #667085; text-align: center; }
    .code-box { background: #F7F8FC; border: 1px dashed #E7EAF0; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 14px; word-break: break-all; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>NEXUS ACADEMY</h1>
      <p>Modern Learning & Engineering Excellence</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Nexus Institute of Advanced Technology. All rights reserved.</p>
      <p>Support: support@nexuslms.io &bull; Automated System Notice &bull; Do not reply</p>
    </div>
  </div>
</body>
</html>
    `;
  },

  async sendEmail({ to, subject, templateName, contentHtml }) {
    const emailId = crypto.randomUUID();
    const finalHtml = this.getTemplateWrapper(subject, contentHtml);

    // Save to outbox for inspection, tracking, and demo accessibility
    await tokenRepository.saveEmailOutbox({
      id: emailId,
      toEmail: to,
      subject,
      templateName,
      htmlBody: finalHtml
    });

    console.log(`\x1b[35m[EMAIL DISPATCH]\x1b[0m To: ${to} | Subject: "${subject}" | Template: ${templateName}`);
    return { success: true, emailId };
  },

  async sendAccountActivationEmail({ to, studentName, studentId, courseName, activationToken }) {
    const activationUrl = `${config.appUrl}/activate-account/${activationToken}`;
    const content = `
      <h2 style="margin-top:0; color:#172033; font-size:20px;">Welcome to Nexus Academy, ${studentName}! 👋</h2>
      <p>Your student profile has been provisioned by the academic administration.</p>
      <div style="background:#F7F8FC; border-radius:8px; padding:16px; margin:16px 0;">
        <p style="margin:4px 0;"><strong>Student ID:</strong> <span style="font-family:monospace; color:#5B5FEF;">${studentId}</span></p>
        <p style="margin:4px 0;"><strong>Enrolled Course:</strong> ${courseName}</p>
        <p style="margin:4px 0;"><strong>Registered Email:</strong> ${to}</p>
      </div>
      <p>To activate your student account and establish your secure password, click the button below:</p>
      <div style="text-align: center;">
        <a href="${activationUrl}" class="btn">Activate Student Account</a>
      </div>
      <p style="font-size:13px; color:#667085;">Link valid for 48 hours. If the button doesn't work, copy and paste this link into your browser:</p>
      <div class="code-box">${activationUrl}</div>
      <p style="font-size:13px; color:#DC2626;"><strong>Security Notice:</strong> The academy administration will never ask for your password.</p>
    `;

    return this.sendEmail({
      to,
      subject: 'Activate Your Student Account — Nexus Academy',
      templateName: 'ACCOUNT_ACTIVATION',
      contentHtml: content
    });
  },

  async sendPasswordResetEmail({ to, name, resetToken }) {
    const resetUrl = `${config.appUrl}/reset-password/${resetToken}`;
    const content = `
      <h2 style="margin-top:0; color:#172033; font-size:20px;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password for your Nexus Academy account.</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset My Password</a>
      </div>
      <p style="font-size:13px; color:#667085;">This link will expire in 60 minutes. If you did not request a password reset, you can safely ignore this email.</p>
      <div class="code-box">${resetUrl}</div>
    `;

    return this.sendEmail({
      to,
      subject: 'Password Reset Request — Nexus Academy',
      templateName: 'PASSWORD_RESET',
      contentHtml: content
    });
  },

  async sendLiveClassReminder({ to, name, sessionTitle, startTime, instructorName }) {
    const content = `
      <h2 style="margin-top:0; color:#172033; font-size:20px;">Upcoming Live Class Reminder 🔴</h2>
      <p>Hello ${name},</p>
      <p>Your scheduled live session is starting soon:</p>
      <div style="background:#F7F8FC; border-radius:8px; padding:16px; margin:16px 0;">
        <p style="margin:4px 0;"><strong>Session:</strong> ${sessionTitle}</p>
        <p style="margin:4px 0;"><strong>Instructor:</strong> ${instructorName}</p>
        <p style="margin:4px 0;"><strong>Start Time:</strong> ${startTime}</p>
      </div>
      <div style="text-align: center;">
        <a href="${config.appUrl}/student/live-classes" class="btn">Go to Live Classes</a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `Upcoming Live Class: ${sessionTitle}`,
      templateName: 'LIVE_CLASS_REMINDER',
      contentHtml: content
    });
  },

  async sendCertificateIssued({ to, name, courseTitle, certificateNumber }) {
    const verifyUrl = `${config.appUrl}/verify-certificate/${certificateNumber}`;
    const content = `
      <h2 style="margin-top:0; color:#172033; font-size:20px;">Congratulations! Certificate Issued 🎓</h2>
      <p>Hello ${name},</p>
      <p>You have successfully completed <strong>${courseTitle}</strong> and met all academic requirements.</p>
      <div style="background:#F7F8FC; border-radius:8px; padding:16px; margin:16px 0;">
        <p style="margin:4px 0;"><strong>Certificate ID:</strong> <span style="font-family:monospace; color:#5B5FEF;">${certificateNumber}</span></p>
        <p style="margin:4px 0;"><strong>Course:</strong> ${courseTitle}</p>
      </div>
      <div style="text-align: center;">
        <a href="${verifyUrl}" class="btn">Verify & View Certificate</a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `Certificate Awarded — ${courseTitle}`,
      templateName: 'CERTIFICATE_ISSUED',
      contentHtml: content
    });
  }
};
