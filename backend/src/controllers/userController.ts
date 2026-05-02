import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// ============================================================================
// GET /api/users/profile — Get current user's profile
// ============================================================================
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        email: true,
        role: true,
        full_name: true,
        city: true,
        country: true,
        institution: true,
        professional_summary: true,
        profile_completed: true,
        is_active: true,
        created_at: true,
        last_login: true
      }
    });

    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error while fetching profile." });
  }
};

// ============================================================================
// PUT /api/users/profile — Update current user's profile
// ============================================================================
export const updateProfile = async (req: Request, res: Response) => {
  const { full_name, city, country, institution, professional_summary } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user?.id },
      data: {
        full_name,
        city,
        country,
        institution,
        professional_summary,
        profile_completed: true
      }
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.id,
        role: req.user!.role,
        action_type: 'PROFILE_UPDATED',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown',
      }
    });

    res.json({ message: "Profile updated successfully.", user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error while updating profile." });
  }
};

// ============================================================================
// POST /api/users/complete-profile — First-Login Profile Completion
// SRS FR-04: Users must complete their profile before accessing platform features
// ============================================================================
export const completeProfile = async (req: Request, res: Response) => {
  const { full_name, institution, city, country, professional_summary } = req.body;

  // Validate all required fields
  if (!full_name?.trim() || !institution?.trim() || !city?.trim() || !country?.trim() || !professional_summary?.trim()) {
    return res.status(400).json({
      message: "All fields are required: full name, institution, city, country, and professional summary."
    });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.profile_completed) {
      return res.status(400).json({ message: "Profile is already completed." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user?.id },
      data: {
        full_name: full_name.trim(),
        institution: institution.trim(),
        city: city.trim(),
        country: country.trim(),
        professional_summary: professional_summary.trim(),
        profile_completed: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        full_name: true,
        city: true,
        country: true,
        institution: true,
        professional_summary: true,
        profile_completed: true,
      }
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.id,
        role: req.user!.role,
        action_type: 'PROFILE_COMPLETED',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown',
        details: 'User completed their profile for the first time.'
      }
    });

    res.json({
      message: "Profile completed successfully! Welcome to Health AI.",
      user: updatedUser
    });
  } catch (error) {
    console.error("Complete profile error:", error);
    res.status(500).json({ message: "Server error while completing profile." });
  }
};

// ============================================================================
// DELETE /api/users/me — GDPR: Delete Account & Purge Data
// SRS NFR-08 (GDPR Compliance)
// Cascading deletion order: AI Analyses → Notifications → Activity Logs →
//   Meeting Requests → Posts → User
// ============================================================================
export const deleteAccount = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Log the deletion BEFORE deleting (so we have a record)
    // Note: We store minimal info since user data will be purged
    await prisma.activityLog.create({
      data: {
        user_id: userId,
        role: user.role,
        action_type: 'ACCOUNT_DELETED_GDPR',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown',
        details: `User ${user.email} requested GDPR account deletion.`
      }
    });

    // Cascade delete all related data in correct order
    // 1. Delete AI Analyses
    await prisma.aIAnalysis.deleteMany({ where: { user_id: userId } });

    // 2. Delete Notifications
    await prisma.notification.deleteMany({ where: { user_id: userId } });

    // 3. Delete Meeting Requests (both as requester and as post owner)
    //    First: requests made by this user
    await prisma.meetingRequest.deleteMany({ where: { requester_id: userId } });
    //    Second: requests on this user's posts
    const userPostIds = await prisma.post.findMany({
      where: { user_id: userId },
      select: { id: true }
    });
    if (userPostIds.length > 0) {
      await prisma.meetingRequest.deleteMany({
        where: { post_id: { in: userPostIds.map(p => p.id) } }
      });
    }

    // 4. Delete AI Analyses linked to user's posts
    if (userPostIds.length > 0) {
      await prisma.aIAnalysis.deleteMany({
        where: { post_id: { in: userPostIds.map(p => p.id) } }
      });
    }

    // 5. Delete Posts
    await prisma.post.deleteMany({ where: { user_id: userId } });

    // 6. Delete Activity Logs (including the one we just created)
    await prisma.activityLog.deleteMany({ where: { user_id: userId } });

    // 7. Finally, delete the User
    await prisma.user.delete({ where: { id: userId } });

    res.json({
      message: "Your account and all associated data have been permanently deleted in compliance with GDPR."
    });
  } catch (error) {
    console.error("GDPR delete account error:", error);
    res.status(500).json({ message: "Server error while deleting account." });
  }
};

// ============================================================================
// GET /api/users/me/export — GDPR: Export All User Data as JSON
// SRS NFR-08 (GDPR Compliance — Right to Data Portability)
// ============================================================================
export const exportData = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    // Fetch all user data with relations
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        full_name: true,
        city: true,
        country: true,
        institution: true,
        professional_summary: true,
        profile_completed: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        last_login: true,
        posts: {
          include: {
            meeting_requests: {
              select: {
                id: true,
                status: true,
                nda_accepted: true,
                proposed_time_slots: true,
                selected_time_slot: true,
                decline_reason: true,
                created_at: true,
                requester: {
                  select: { full_name: true, email: true }
                }
              }
            }
          }
        },
        meeting_requests: {
          include: {
            post: {
              select: {
                id: true,
                title: true,
                working_domain: true,
                user: {
                  select: { full_name: true, email: true }
                }
              }
            }
          }
        },
        activity_logs: true,
        notifications: true
      }
    });

    if (!userData) {
      return res.status(404).json({ message: "User not found." });
    }

    // Activity log
    await prisma.activityLog.create({
      data: {
        user_id: userId,
        role: req.user!.role,
        action_type: 'DATA_EXPORT_GDPR',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown',
      }
    });

    // Return as downloadable JSON
    const exportPayload = {
      exported_at: new Date().toISOString(),
      platform: "HEALTH AI Co-Creation & Innovation Platform",
      gdpr_notice: "This file contains all personal data associated with your account, exported in compliance with GDPR Article 20 (Right to Data Portability).",
      data: userData
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="health-ai-data-export-${userId}.json"`);
    res.json(exportPayload);
  } catch (error) {
    console.error("GDPR data export error:", error);
    res.status(500).json({ message: "Server error while exporting data." });
  }
};