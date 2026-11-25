import nodemailer from 'nodemailer';

/**
 * CCS Email Notification Service
 * Transports official society communications (Welcome credentials, OTP resets).
 */

const getTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    // Return null if credentials are not configured yet
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    auth: { user, pass },
  });
};

/**
 * Send Welcome Email with generated credentials
 */
export const sendWelcomeCredentialsEmail = async ({
  recipientEmail,
  recipientName,
  role,
  plainPassword,
  coordinatorName,
  coordinatorRole,
  coordinatorEmail,
}) => {
  const portalUrl = process.env.APP_URL || 'https://ccs2026.vercel.app/#login';
  const issuer = coordinatorName || 'Society Coordinator';
  const issuerRole = coordinatorRole || 'Student Coordinator';
  const formattedRole = role === 'coordinator' ? 'Student Coordinator' : 'Student Developer / Member';

  const subject = `Welcome to Code & Compute Society (CCS) — Your Account Credentials`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0C10; color: #FFFFFF; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background-color: #12131A; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #E50920 0%, #87000F 100%); padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #FFFFFF; text-transform: uppercase; }
    .header p { margin: 6px 0 0; font-size: 12px; color: rgba(255,255,255,0.85); letter-spacing: 0.5px; }
    .content { padding: 28px 24px; color: #E4E4E7; font-size: 14px; line-height: 1.6; }
    .greeting { font-size: 16px; font-weight: 600; color: #FFFFFF; margin-bottom: 12px; }
    .box { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 18px; margin: 20px 0; font-family: monospace; }
    .box-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .box-row:last-child { border-bottom: none; }
    .label { color: #A1A1AA; font-size: 12px; }
    .value { color: #FFFFFF; font-weight: bold; font-size: 13px; }
    .highlight { color: #FF4D5E; }
    .btn { display: inline-block; background: #E50920; color: #FFFFFF !important; text-decoration: none; font-weight: bold; font-size: 13px; padding: 12px 28px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.8px; margin: 16px 0; }
    .issuer-badge { background: rgba(229, 9, 32, 0.1); border-left: 3px solid #E50920; padding: 12px 14px; border-radius: 6px; margin: 18px 0; font-size: 13px; }
    .footer { text-align: center; padding: 20px; font-size: 11px; color: #71717A; border-top: 1px solid rgba(255,255,255,0.08); background: #0E0F14; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Code &amp; Compute Society</h1>
      <p>Official Society Credential Dispatch</p>
    </div>
    <div class="content">
      <div class="greeting">Hi ${recipientName || 'Member'},</div>
      <p>Welcome to <strong>Code &amp; Compute Society (CCS)</strong>! You have been granted access to the official CCS Engineering Workspace &amp; Student Portal.</p>
      
      <div class="issuer-badge">
        <strong>Authorized By:</strong> ${issuer} (${issuerRole})
        ${coordinatorEmail ? `<br><span style="font-size: 11px; color: #A1A1AA;">Contact: ${coordinatorEmail}</span>` : ''}
      </div>

      <p>Here are your account credentials to access the workspace:</p>

      <div class="box">
        <div class="box-row"><span class="label">Access Level:</span> <span class="value highlight">${formattedRole}</span></div>
        <div class="box-row"><span class="label">Portal URL:</span> <span class="value">${portalUrl}</span></div>
        <div class="box-row"><span class="label">Login Email:</span> <span class="value">${recipientEmail}</span></div>
        <div class="box-row"><span class="label">Initial Password:</span> <span class="value highlight" style="font-size: 15px; letter-spacing: 1px;">${plainPassword}</span></div>
      </div>

      <div style="text-align: center;">
        <a href="${portalUrl}" class="btn" target="_blank">Access CCS Portal</a>
      </div>

      <p style="font-size: 12px; color: #A1A1AA; margin-top: 24px;">
        <em>Security Notice:</em> For your account's protection, please sign in and change your password in your profile settings after your initial login. Never share these credentials with anyone.
      </p>
    </div>
    <div class="footer">
      Code &amp; Compute Society • Building High-Throughput Distributed Systems &amp; Autonomous AI<br>
      Automated credential dispatch on behalf of ${issuer}
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
Hi ${recipientName || 'Member'},

Welcome to Code & Compute Society (CCS)! Your portal credentials have been issued by ${issuer} (${issuerRole}).

Your Account Details:
------------------------------------------
Access Level: ${formattedRole}
Portal URL: ${portalUrl}
Login Email: ${recipientEmail}
Initial Password: ${plainPassword}
------------------------------------------

Please sign in and change your password upon your first login.

Issued by: ${issuer}
Code & Compute Society
`;

  const transporter = getTransporter();

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`📨 [EMAIL DISPATCH SIMULATION - NO SMTP CREDENTIALS SET]`);
    console.log(`To: ${recipientEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Issued by: ${issuer} (${issuerRole})`);
    console.log(`Initial Password: ${plainPassword}`);
    console.log(`======================================================\n`);
    return {
      success: true,
      simulated: true,
      message: `Email preview logged (SMTP_USER/SMTP_PASS not configured). Initial password is: ${plainPassword}`,
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Code & Compute Society" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });
    console.log(`✅ Welcome email successfully sent to ${recipientEmail} (MsgID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${recipientEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};
