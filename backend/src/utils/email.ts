import nodemailer from 'nodemailer';

// ============================================================================
// Email Service — Nodemailer Configuration
// Uses Ethereal Email for development (captures emails at ethereal.email)
// In production, replace with a real SMTP provider (SendGrid, AWS SES, etc.)
// ============================================================================

let transporter: nodemailer.Transporter | null = null;

/**
 * Initializes the Nodemailer transporter.
 * Creates an Ethereal test account if SMTP env vars are not configured.
 */
const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (transporter) return transporter;

  // Check if real SMTP credentials are configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: Create Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Ethereal Email account created for development:');
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    console.log('   View sent emails at: https://ethereal.email');
  }

  return transporter;
};

/**
 * Base URL for frontend links in emails.
 */
const getClientUrl = (): string => {
  return process.env.CLIENT_URL || 'http://localhost:5173';
};

// ============================================================================
// Send Email Verification
// ============================================================================
export const sendVerificationEmail = async (
  email: string,
  token: string,
  fullName?: string | null
): Promise<void> => {
  const transport = await getTransporter();
  const clientUrl = getClientUrl();
  const verifyLink = `${clientUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Health AI Platform" <noreply@healthai.edu>`,
    to: email,
    subject: '✅ Verify Your Email — Health AI Platform',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', -apple-system, sans-serif; background: #0a0b0f; color: #f1f5f9; padding: 40px 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #06b6d4); padding: 12px 24px; border-radius: 12px; font-size: 1.25rem; font-weight: 700; color: white; letter-spacing: -0.02em;">
            ⚕ Health AI
          </div>
        </div>

        <h1 style="font-size: 1.5rem; font-weight: 700; text-align: center; margin-bottom: 8px; color: #f1f5f9;">
          Verify Your Email Address
        </h1>
        <p style="text-align: center; color: #94a3b8; margin-bottom: 32px; font-size: 0.95rem;">
          ${fullName ? `Hi ${fullName},` : 'Hi there,'} thank you for registering on the Health AI Co-Creation & Innovation Platform.
        </p>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${verifyLink}" 
             style="display: inline-block; padding: 14px 36px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);">
            Verify Email
          </a>
        </div>

        <p style="color: #64748b; font-size: 0.85rem; text-align: center; margin-bottom: 24px;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${verifyLink}" style="color: #818cf8; word-break: break-all;">${verifyLink}</a>
        </p>

        <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; text-align: center;">
          <p style="color: #64748b; font-size: 0.78rem;">
            This link will expire in <strong style="color: #94a3b8;">24 hours</strong>. 
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  const info = await transport.sendMail(mailOptions);
  console.log(`📧 Verification email sent to ${email}`);

  // Log Ethereal preview URL in development
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`   Preview URL: ${previewUrl}`);
  }
};

// ============================================================================
// Send Password Reset Email
// ============================================================================
export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  fullName?: string | null
): Promise<void> => {
  const transport = await getTransporter();
  const clientUrl = getClientUrl();
  const resetLink = `${clientUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Health AI Platform" <noreply@healthai.edu>`,
    to: email,
    subject: '🔐 Password Reset Request — Health AI Platform',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', -apple-system, sans-serif; background: #0a0b0f; color: #f1f5f9; padding: 40px 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #06b6d4); padding: 12px 24px; border-radius: 12px; font-size: 1.25rem; font-weight: 700; color: white; letter-spacing: -0.02em;">
            ⚕ Health AI
          </div>
        </div>

        <h1 style="font-size: 1.5rem; font-weight: 700; text-align: center; margin-bottom: 8px; color: #f1f5f9;">
          Reset Your Password
        </h1>
        <p style="text-align: center; color: #94a3b8; margin-bottom: 32px; font-size: 0.95rem;">
          ${fullName ? `Hi ${fullName},` : 'Hi there,'} we received a request to reset your password.
        </p>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${resetLink}" 
             style="display: inline-block; padding: 14px 36px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);">
            Reset Password
          </a>
        </div>

        <p style="color: #64748b; font-size: 0.85rem; text-align: center; margin-bottom: 24px;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${resetLink}" style="color: #818cf8; word-break: break-all;">${resetLink}</a>
        </p>

        <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; text-align: center;">
          <p style="color: #64748b; font-size: 0.78rem;">
            This link will expire in <strong style="color: #94a3b8;">1 hour</strong>. 
            If you didn't request a password reset, please ignore this email — your password will remain unchanged.
          </p>
        </div>
      </div>
    `,
  };

  const info = await transport.sendMail(mailOptions);
  console.log(`📧 Password reset email sent to ${email}`);

  // Log Ethereal preview URL in development
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`   Preview URL: ${previewUrl}`);
  }
};
