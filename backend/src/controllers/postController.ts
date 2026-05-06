import { Request, Response } from 'express';
import { PostStatus, ConfidentialityLevel, CollaborationType, ProjectStage } from '@prisma/client';
import prisma from '../lib/prisma';
import { analyzePost } from '../utils/aiService';

// ============================================================================
// POST /api/posts — Create a new post
// SRS FR-15, FR-17, FR-18
// ============================================================================
export const createPost = async (req: Request, res: Response) => {
  const {
    title,
    working_domain,
    required_expertise,
    short_explanation,
    confidentiality_level,
    healthcare_expertise_needed,
    high_level_idea,
    desired_technical_expertise,
    level_of_commitment,
    collaboration_type,
    project_stage,
    city,
    country,
    expiry_date,
    auto_close_enabled,
    status
  } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    // Validate required fields
    if (!title || !working_domain || !required_expertise) {
      return res.status(400).json({ message: "Title, working domain, and required expertise are required." });
    }

    const post = await prisma.post.create({
      data: {
        user_id: req.user.id,
        title,
        working_domain,
        required_expertise,
        short_explanation: short_explanation || null,
        confidentiality_level: (confidentiality_level as ConfidentialityLevel) || 'PUBLIC_PITCH',
        status: (status as PostStatus) || 'DRAFT',
        city: city || "Online",
        country: country || "Not specified",
        healthcare_expertise_needed: healthcare_expertise_needed || null,
        high_level_idea: high_level_idea || null,
        desired_technical_expertise: desired_technical_expertise || null,
        level_of_commitment: level_of_commitment || null,
        collaboration_type: (collaboration_type as CollaborationType) || 'ADVISOR',
        project_stage: (project_stage as ProjectStage) || 'IDEA',
        expiry_date: expiry_date ? new Date(expiry_date) : null,
        auto_close_enabled: auto_close_enabled || false,
      }
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        user_id: req.user.id,
        role: req.user.role,
        action_type: 'POST_CREATED',
        target_entity_id: post.id,
        target_entity_type: 'Post',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown',
      }
    });

    // Trigger AI analysis in background when post is published as ACTIVE
    if (post.status === 'ACTIVE') {
      analyzePost(post.id, req.user.id, {
        title: post.title,
        working_domain: post.working_domain,
        short_explanation: post.short_explanation,
        required_expertise: post.required_expertise,
        collaboration_type: post.collaboration_type,
        project_stage: post.project_stage,
      }).catch(err => console.error('[AI] Background analysis failed:', err.message));
    }

    res.status(201).json({ message: "Post created successfully.", post });
  } catch (error: any) {
    console.error("Create post error:", error);
    res.status(500).json({ message: "Failed to create post.", error: error.message });
  }
};

// ============================================================================
// GET /api/posts — Get all posts with optional filters
// Supports: status, domain, expertise, city, country, project_stage
// ============================================================================
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const {
      status,
      working_domain,
      required_expertise,
      city,
      country,
      project_stage
    } = req.query;

    const where: any = {
      status: (status as string) || 'ACTIVE',
    };

    if (working_domain) where.working_domain = { contains: working_domain as string };
    if (required_expertise) where.required_expertise = { contains: required_expertise as string };
    if (city) where.city = { contains: city as string };
    if (country) where.country = { contains: country as string };
    if (project_stage) where.project_stage = project_stage as ProjectStage;

    const posts = await prisma.post.findMany({
      where,
      include: {
        user: {
          select: { id: true, full_name: true, institution: true, role: true, city: true, country: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ message: "Failed to fetch posts." });
  }
};

// ============================================================================
// GET /api/posts/my-posts — Get current user's posts (all statuses)
// ============================================================================
export const getMyPosts = async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      where: { user_id: req.user!.id },
      include: {
        meeting_requests: {
          select: { id: true, status: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    console.error("Get my posts error:", error);
    res.status(500).json({ message: "Failed to fetch your posts." });
  }
};

// ============================================================================
// GET /api/posts/:postId — Get a single post by ID
// ============================================================================
export const getPostById = async (req: Request, res: Response) => {
  const postId = req.params.postId as string;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: { id: true, full_name: true, institution: true, role: true, city: true, country: true }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    res.json(post);
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ message: "Failed to fetch post." });
  }
};

// ============================================================================
// PUT /api/posts/:postId — Update a post (owner only)
// ============================================================================
export const updatePost = async (req: Request, res: Response) => {
  const postId = req.params.postId as string;

  try {
    const existingPost = await prisma.post.findUnique({ where: { id: postId } });

    if (!existingPost) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (existingPost.user_id !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to edit this post." });
    }

    const {
      title,
      working_domain,
      required_expertise,
      short_explanation,
      confidentiality_level,
      healthcare_expertise_needed,
      high_level_idea,
      desired_technical_expertise,
      level_of_commitment,
      collaboration_type,
      project_stage,
      city,
      country,
      expiry_date,
      auto_close_enabled
    } = req.body;

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        working_domain,
        required_expertise,
        short_explanation,
        confidentiality_level: confidentiality_level as ConfidentialityLevel,
        healthcare_expertise_needed,
        high_level_idea,
        desired_technical_expertise,
        level_of_commitment,
        collaboration_type: collaboration_type as CollaborationType,
        project_stage: project_stage as ProjectStage,
        city,
        country,
        expiry_date: expiry_date ? new Date(expiry_date) : null,
        auto_close_enabled,
      }
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.id,
        role: req.user!.role,
        action_type: 'POST_UPDATED',
        target_entity_id: postId,
        target_entity_type: 'Post',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown',
      }
    });

    // Re-trigger AI analysis on content update (background, non-blocking)
    if (updatedPost.status === 'ACTIVE') {
      analyzePost(postId, req.user!.id, {
        title: updatedPost.title,
        working_domain: updatedPost.working_domain,
        short_explanation: updatedPost.short_explanation,
        required_expertise: updatedPost.required_expertise,
        collaboration_type: updatedPost.collaboration_type,
        project_stage: updatedPost.project_stage,
      }).catch(err => console.error('[AI] Background re-analysis failed:', err.message));
    }

    res.json({ message: "Post updated successfully.", post: updatedPost });
  } catch (error: any) {
    console.error("Update post error:", error);
    res.status(500).json({ message: "Failed to update post.", error: error.message });
  }
};

// ============================================================================
// PATCH /api/posts/:postId/status — Update post status
// Allowed transitions: DRAFT→ACTIVE, ACTIVE→ARCHIVED, ACTIVE→PARTNER_FOUND, etc.
// ============================================================================
export const updatePostStatus = async (req: Request, res: Response) => {
  const postId = req.params.postId as string;
  const { status } = req.body;

  try {
    const existingPost = await prisma.post.findUnique({ where: { id: postId } });

    if (!existingPost) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (existingPost.user_id !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to change this post's status." });
    }

    // Validate the status value
    const validStatuses: PostStatus[] = ['DRAFT', 'ACTIVE', 'MEETING_SCHEDULED', 'PARTNER_FOUND', 'EXPIRED', 'REMOVED', 'ARCHIVED'];
    if (!validStatuses.includes(status as PostStatus)) {
      return res.status(400).json({ message: `Invalid status: ${status}` });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { status: status as PostStatus }
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.id,
        role: req.user!.role,
        action_type: `POST_STATUS_${status}`,
        target_entity_id: postId,
        target_entity_type: 'Post',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown',
      }
    });

    // Trigger AI analysis when post is published (DRAFT → ACTIVE)
    if (status === 'ACTIVE' && updatedPost.ai_score === null) {
      analyzePost(postId, req.user!.id, {
        title: updatedPost.title,
        working_domain: updatedPost.working_domain,
        short_explanation: updatedPost.short_explanation,
        required_expertise: updatedPost.required_expertise,
        collaboration_type: updatedPost.collaboration_type,
        project_stage: updatedPost.project_stage,
      }).catch(err => console.error('[AI] Background publish analysis failed:', err.message));
    }

    res.json({ message: `Post status updated to ${status}.`, post: updatedPost });
  } catch (error: any) {
    console.error("Update post status error:", error);
    res.status(500).json({ message: "Failed to update post status.", error: error.message });
  }
};