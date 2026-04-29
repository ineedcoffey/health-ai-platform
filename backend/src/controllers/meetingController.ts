import { Request, Response } from 'express';
import { MeetingStatus } from '@prisma/client';
import prisma from '../lib/prisma';

// ============================================================================
// POST /api/meetings — Create a meeting request
// SRS FR-25, FR-26
// ============================================================================
export const createMeetingRequest = async (req: Request, res: Response) => {
  const { post_id, nda_accepted, proposed_time_slots } = req.body;

  try {
    // Prevent duplicate requests
    const existingRequest = await prisma.meetingRequest.findFirst({
      where: {
        post_id,
        requester_id: req.user!.id
      }
    });

    if (existingRequest) {
      return res.status(400).json({ message: "You have already sent a request for this post." });
    }

    const post = await prisma.post.findUnique({ where: { id: post_id } });
    if (!post) return res.status(404).json({ message: "Post not found." });

    // Cannot request meeting on own post
    if (post.user_id === req.user!.id) {
      return res.status(400).json({ message: "You cannot request a meeting for your own post." });
    }

    const request = await prisma.meetingRequest.create({
      data: {
        post_id,
        requester_id: req.user!.id,
        nda_accepted,
        proposed_time_slots,
        status: 'PENDING'
      }
    });

    // Activity Log
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.id,
        action_type: 'MEETING_REQUEST_CREATED',
        role: req.user!.role,
        target_entity_id: request.id,
        target_entity_type: 'MeetingRequest',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown'
      }
    });

    res.status(201).json({ message: "Meeting request sent successfully.", request });
  } catch (error) {
    console.error("Create meeting request error:", error);
    res.status(500).json({ message: "Server error while sending meeting request." });
  }
};

// ============================================================================
// GET /api/meetings/my-requests — Get incoming & outgoing meeting requests
// ============================================================================
export const getMyRequests = async (req: Request, res: Response) => {
  try {
    // Incoming: requests on my posts from other users
    const incoming = await prisma.meetingRequest.findMany({
      where: {
        post: { user_id: req.user!.id }
      },
      include: {
        post: true,
        requester: { select: { full_name: true, role: true, email: true, institution: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    // Outgoing: requests I sent to other users' posts
    const outgoing = await prisma.meetingRequest.findMany({
      where: {
        requester_id: req.user!.id
      },
      include: {
        post: {
          include: { user: { select: { full_name: true, role: true, institution: true } } }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ incoming, outgoing });
  } catch (error) {
    console.error("Get meeting requests error:", error);
    res.status(500).json({ message: "Error fetching requests." });
  }
};

// ============================================================================
// PUT /api/meetings/:requestId — Update meeting status (Accept/Decline)
// SRS FR-27, FR-28
// ============================================================================
export const updateMeetingStatus = async (req: Request, res: Response) => {
  const requestId = req.params.requestId as string;
  const { status, decline_reason, selected_time_slot } = req.body;

  try {
    const request: any = await prisma.meetingRequest.findUnique({
      where: { id: requestId } as any,
      include: { post: true }
    });

    if (!request || request.post.user_id !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to update this request." });
    }

    const updatedRequest = await prisma.meetingRequest.update({
      where: { id: requestId } as any,
      data: {
        status: status as MeetingStatus,
        decline_reason,
        selected_time_slot: selected_time_slot ? new Date(selected_time_slot) : undefined
      }
    });

    // Activity Log
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.id,
        action_type: `MEETING_REQUEST_${status}`,
        role: req.user!.role,
        target_entity_id: requestId,
        target_entity_type: 'MeetingRequest',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown'
      }
    });

    res.json({ message: `Request ${status.toLowerCase()}.`, updatedRequest });
  } catch (error) {
    console.error("Update meeting status error:", error);
    res.status(500).json({ message: "Server error while updating request." });
  }
};

// ============================================================================
// PUT /api/meetings/:requestId/cancel — Cancel a pending/scheduled meeting
// SRS FR-30
// ============================================================================
export const cancelMeetingRequest = async (req: Request, res: Response) => {
  const requestId = req.params.requestId as string;

  try {
    const request: any = await prisma.meetingRequest.findUnique({
      where: { id: requestId } as any,
      include: { post: true }
    });

    if (!request) {
      return res.status(404).json({ message: "Meeting request not found." });
    }

    // Only the requester or post owner can cancel
    const isRequester = request.requester_id === req.user!.id;
    const isPostOwner = request.post.user_id === req.user!.id;

    if (!isRequester && !isPostOwner) {
      return res.status(403).json({ message: "Not authorized to cancel this request." });
    }

    // Can only cancel PENDING or SCHEDULED meetings
    if (!['PENDING', 'SCHEDULED', 'ACCEPTED'].includes(request.status)) {
      return res.status(400).json({ message: `Cannot cancel a request with status '${request.status}'.` });
    }

    const updatedRequest = await prisma.meetingRequest.update({
      where: { id: requestId } as any,
      data: { status: 'CANCELLED' }
    });

    // Activity Log
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.id,
        action_type: 'MEETING_REQUEST_CANCELLED',
        role: req.user!.role,
        target_entity_id: requestId,
        target_entity_type: 'MeetingRequest',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown'
      }
    });

    res.json({ message: "Meeting request cancelled.", updatedRequest });
  } catch (error) {
    console.error("Cancel meeting request error:", error);
    res.status(500).json({ message: "Server error while cancelling request." });
  }
};