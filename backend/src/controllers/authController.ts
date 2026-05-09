import 'dotenv/config';
import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateToken } from '../utils/token';
import { isValidEduEmail, isValidRegistrationRole } from '../utils/validation';
import { sendVerificationEmail } from '../utils/email';
import prisma from '../lib/prisma';

// ============================================================================
// POST /api/auth/register — User Registration
// SRS FR-01, FR-03, FR-06, FR-13, FR-14
// ============================================================================
export const register = async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  // ── Input validation ──────────────────────────────────────────────────
  if (!email || !password || !role) {
    return res.status(400).json({
      message: "All fields are required: email, password, and role."
    });
  }

  // FR-03: Strict .edu email enforcement
  if (!isValidEduEmail(email)) {
    return res.status(400).json({
      message: "Invalid email format. Only users with a valid academic email address (.edu or .edu.*) are authorized to register on this platform."
    });
  }

  // FR-01: Role must be ENGINEER or HEALTHCARE (ADMIN cannot self-register)
  if (!isValidRegistrationRole(role)) {
    return res.status(400).json({
      message: "Invalid role selection. Please choose either 'ENGINEER' or 'HEALTHCARE'."
    });
  }

  // Password strength check
  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long."
    });
  }

  try {
    // Check for existing user
    const userExists = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (userExists) {
      return res.status(400).json({ message: "This email is already registered." });
    }

    // FR-06: Password hashing with bcrypt (cost factor 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token (secure random 32 bytes → hex)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password_hash: hashedPassword,
        role: role.toUpperCase() as Role,
        is_email_verified: false,
        email_verification_token: verificationToken,
        email_verification_expires: verificationExpires,
      }
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        role: user.role,
        action_type: 'USER_REGISTERED',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown',
        details: `New ${user.role} user registered. Verification email sent.`
      }
    });

    // DEV: Print verification link directly in terminal for easy access
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    console.log(`\n🔗 ─── VERIFICATION LINK (DEV) ───────────────────────────────`);
    console.log(`   User: ${user.email}`);
    console.log(`   Link: ${clientUrl}/verify-email?token=${verificationToken}`);
    console.log(`───────────────────────────────────────────────────────────────\n`);

    // Send verification email (non-blocking — don't fail registration if email fails)
    sendVerificationEmail(user.email, verificationToken).catch((emailErr) => {
      console.error('Failed to send verification email:', emailErr);
    });

    // FR-14: Generic success message (no information leakage)
    res.status(201).json({
      message: "Registration successful! A verification link has been sent to your email. Please verify your email before logging in.",
      dev_verification_link: `${clientUrl}/verify-email?token=${verificationToken}`
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// ============================================================================
// GET /api/auth/verify-email?token=xxx — Email Verification
// ============================================================================
export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: "Verification token is required." });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        email_verification_token: token,
        email_verification_expires: { gte: new Date() }, // Token must not be expired
      }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification link. Please request a new one."
      });
    }

    // Mark email as verified and clear the token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        is_email_verified: true,
        email_verification_token: null,
        email_verification_expires: null,
      }
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        role: user.role,
        action_type: 'EMAIL_VERIFIED',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown',
        details: 'Email address verified successfully.'
      }
    });

    res.json({ message: "Email verified successfully! You can now sign in." });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Server error during email verification." });
  }
};

// ============================================================================
// POST /api/auth/resend-verification — Resend Verification Email
// ============================================================================
export const resendVerification = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    // Always return success to prevent user enumeration
    if (!user || user.is_email_verified) {
      return res.json({
        message: "If this email is registered and unverified, a new verification link has been sent."
      });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verification_token: verificationToken,
        email_verification_expires: verificationExpires,
      }
    });

    // DEV: Print verification link directly in terminal for easy access
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    console.log(`\n🔗 ─── RESENT VERIFICATION LINK (DEV) ────────────────────────`);
    console.log(`   User: ${user.email}`);
    console.log(`   Link: ${clientUrl}/verify-email?token=${verificationToken}`);
    console.log(`───────────────────────────────────────────────────────────────\n`);

    sendVerificationEmail(user.email, verificationToken, user.full_name).catch((emailErr) => {
      console.error('Failed to resend verification email:', emailErr);
    });

    res.json({
      message: "If this email is registered and unverified, a new verification link has been sent.",
      dev_verification_link: `${clientUrl}/verify-email?token=${verificationToken}`
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ============================================================================
// POST /api/auth/login — User Login
// SRS FR-10, FR-12
// ============================================================================
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    // FR-12: Generic error message to prevent user enumeration
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Check if account is suspended
    if (!user.is_active) {
      return res.status(403).json({
        message: "Your account has been suspended. Please contact support."
      });
    }

    // Check if email is verified
    if (!user.is_email_verified) {
      return res.status(403).json({
        message: "Please verify your email address before signing in. Check your inbox for the verification link.",
        code: "EMAIL_NOT_VERIFIED"
      });
    }

    // Generate JWT (1 hour expiry — SDD Section 7)
    const token = generateToken(user.id, user.role);

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        user_id: user.id,
        role: user.role,
        action_type: 'USER_LOGIN',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown',
      }
    });

    // FR-10: Success response with token and user data
    res.json({
      message: "Login successful. Welcome back!",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        profile_completed: user.profile_completed,
        is_email_verified: user.is_email_verified
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};