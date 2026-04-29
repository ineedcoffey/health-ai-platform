import 'dotenv/config';
import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/token';
import { isValidEduEmail, isValidRegistrationRole } from '../utils/validation';
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

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password_hash: hashedPassword,
        role: role.toUpperCase() as Role,
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
        details: `New ${user.role} user registered.`
      }
    });

    // FR-14: Generic success message (no information leakage)
    res.status(201).json({
      message: "Registration successful. If this email address is registered, you will receive an email with instructions on how to access your account."
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration." });
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
        profile_completed: user.profile_completed
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};