import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// ============================================================================
// GET /api/admin/stats — Dashboard overview statistics
// ============================================================================
export const getStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalPosts,
      activePosts,
      draftPosts,
      archivedPosts,
      removedPosts,
      totalMeetings,
      pendingMeetings,
      completedMeetings,
      engineers,
      healthcarePros,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { is_active: true } }),
      prisma.user.count({ where: { is_active: false } }),
      prisma.post.count(),
      prisma.post.count({ where: { status: 'ACTIVE' } }),
      prisma.post.count({ where: { status: 'DRAFT' } }),
      prisma.post.count({ where: { status: 'ARCHIVED' } }),
      prisma.post.count({ where: { status: 'REMOVED' } }),
      prisma.meetingRequest.count(),
      prisma.meetingRequest.count({ where: { status: 'PENDING' } }),
      prisma.meetingRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.user.count({ where: { role: 'ENGINEER' } }),
      prisma.user.count({ where: { role: 'HEALTHCARE' } }),
    ]);

    res.json({
      users: { total: totalUsers, active: activeUsers, suspended: suspendedUsers, engineers, healthcarePros },
      posts: { total: totalPosts, active: activePosts, draft: draftPosts, archived: archivedPosts, removed: removedPosts },
      meetings: { total: totalMeetings, pending: pendingMeetings, completed: completedMeetings },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics.' });
  }
};

// ============================================================================
// GET /api/admin/posts — Get all posts (all statuses) for moderation
// ============================================================================
export const getAllPostsAdmin = async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: { id: true, full_name: true, email: true, role: true, institution: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    console.error('Admin get posts error:', error);
    res.status(500).json({ message: 'Failed to fetch posts.' });
  }
};

// ============================================================================
// PATCH /api/admin/posts/:postId/remove — Remove a post (moderation)
// ============================================================================
export const removePost = async (req: Request, res: Response) => {
  const postId = req.params.postId as string;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    await prisma.post.update({
      where: { id: postId },
      data: { status: 'REMOVED' }
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.id,
        role: req.user!.role,
        action_type: 'ADMIN_POST_REMOVED',
        target_entity_id: postId,
        target_entity_type: 'Post',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown',
        details: `Admin removed post: ${post.title}`,
      }
    });

    res.json({ message: 'Post has been removed.' });
  } catch (error) {
    console.error('Admin remove post error:', error);
    res.status(500).json({ message: 'Failed to remove post.' });
  }
};

// ============================================================================
// GET /api/admin/users — Get all users for management
// ============================================================================
export const getAllUsersAdmin = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        institution: true,
        city: true,
        country: true,
        is_active: true,
        profile_completed: true,
        created_at: true,
        last_login: true,
        _count: {
          select: { posts: true, meeting_requests: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
};

// ============================================================================
// PATCH /api/admin/users/:userId/suspend — Suspend a user (set is_active = false)
// ============================================================================
export const suspendUser = async (req: Request, res: Response) => {
  const userId = req.params.userId as string;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Toggle suspension
    const newStatus = !user.is_active;

    await prisma.user.update({
      where: { id: userId },
      data: { is_active: newStatus }
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.id,
        role: req.user!.role,
        action_type: newStatus ? 'ADMIN_USER_REACTIVATED' : 'ADMIN_USER_SUSPENDED',
        target_entity_id: userId,
        target_entity_type: 'User',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown',
        details: `Admin ${newStatus ? 'reactivated' : 'suspended'} user: ${user.email}`,
      }
    });

    res.json({
      message: `User has been ${newStatus ? 'reactivated' : 'suspended'}.`,
      is_active: newStatus
    });
  } catch (error) {
    console.error('Admin suspend user error:', error);
    res.status(500).json({ message: 'Failed to update user status.' });
  }
};

// ============================================================================
// GET /api/admin/logs — Get audit/activity logs
// ============================================================================
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.activityLog.findMany({
      include: {
        user: {
          select: { full_name: true, email: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 500 // Limit to last 500 entries
    });
    res.json(logs);
  } catch (error) {
    console.error('Admin get logs error:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs.' });
  }
};

// ============================================================================
// GET /api/admin/logs/csv — Download audit logs as CSV
// ============================================================================
export const downloadLogsCSV = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.activityLog.findMany({
      include: {
        user: {
          select: { full_name: true, email: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Build CSV
    const header = 'ID,Timestamp,User Email,User Name,Role,Action Type,Target Entity ID,Target Type,Result Status,IP Address,Details\n';
    const rows = logs.map((log: any) =>
      [
        log.id,
        log.timestamp?.toISOString() || '',
        `"${log.user?.email || ''}"`,
        `"${log.user?.full_name || ''}"`,
        log.role || '',
        log.action_type || '',
        log.target_entity_id || '',
        log.target_entity_type || '',
        log.result_status || '',
        log.ip_address || '',
        `"${(log.details || '').replace(/"/g, '""')}"`,
      ].join(',')
    ).join('\n');

    const csv = header + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Admin CSV export error:', error);
    res.status(500).json({ message: 'Failed to export audit logs.' });
  }
};
