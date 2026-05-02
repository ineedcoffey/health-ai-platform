import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../utils/email';
import prisma from '../lib/prisma';

// ============================================================================
// POST /api/auth/forgot-password — Request Password Reset
// SRS FR-07: Secure password recovery via email token
// ============================================================================
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    // Always return the same response to prevent user enumeration (SRS FR-14)
    const genericMessage = "If an account with this email exists, a password reset link has been sent.";

    if (!user) {
      return res.json({ message: genericMessage });
    }

    // Generate secure reset token (32 random bytes → hex string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token and expiry in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_reset_token: resetToken,
        password_reset_expires: resetExpires,
      }
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        role: user.role,
        action_type: 'PASSWORD_RESET_REQUESTED',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown',
        details: 'Password reset link sent to email.'
      }
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.full_name);
    } catch (emailErr) {
      console.error('Failed to send password reset email:', emailErr);
    }

    res.json({ message: genericMessage });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ============================================================================
// POST /api/auth/reset-password — Reset Password with Token
// SRS FR-07: Token-based password reset
// ============================================================================
export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and new password are required." });
  }

  // Password strength check
  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long."
    });
  }

  try {
    // Find user with valid (non-expired) reset token
    const user = await prisma.user.findFirst({
      where: {
        password_reset_token: token,
        password_reset_expires: { gte: new Date() },
      }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token. Please request a new password reset."
      });
    }

    // Hash the new password (bcrypt cost factor 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null,
      }
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        role: user.role,
        action_type: 'PASSWORD_RESET_COMPLETED',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown',
        details: 'Password was successfully reset via email token.'
      }
    });

    res.json({ message: "Password reset successfully! You can now sign in with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error during password reset." });
  }
};
