// ============================================================================
// HEALTH AI — AI Analysis Controller (Step 11)
// Endpoints for triggering and fetching AI insights
// ============================================================================

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { analyzePost } from '../utils/aiService';

// ============================================================================
// POST /api/posts/:postId/analyze — Manually trigger AI analysis
// Owner-only: re-analyze a post to regenerate insights
// ============================================================================
export const triggerAIAnalysis = async (req: Request, res: Response) => {
  const postId = req.params.postId as string;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Only the post owner can re-trigger analysis
    if (post.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the post owner can trigger AI analysis.' });
    }

    // Trigger analysis
    const result = await analyzePost(postId, req.user.id, {
      title: post.title,
      working_domain: post.working_domain,
      short_explanation: post.short_explanation,
      required_expertise: post.required_expertise,
      collaboration_type: post.collaboration_type,
      project_stage: post.project_stage,
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        user_id: req.user.id,
        role: req.user.role,
        action_type: 'AI_ANALYSIS_TRIGGERED',
        target_entity_id: postId,
        target_entity_type: 'Post',
        result_status: 'SUCCESS',
        ip_address: req.ip || 'unknown',
        details: `AI analysis regenerated. Score: ${result.match_score}`,
      },
    });

    res.json({
      message: 'AI analysis completed successfully.',
      ai_score: result.match_score,
      ai_insight: result.ai_recommendation,
    });
  } catch (error: any) {
    console.error('AI analysis trigger error:', error);
    res.status(500).json({ message: 'Failed to run AI analysis.', error: error.message });
  }
};

// ============================================================================
// GET /api/posts/:postId/ai-insight — Get AI insight for a post
// Public: anyone can view the AI insight
// ============================================================================
export const getAIInsight = async (req: Request, res: Response) => {
  const postId = req.params.postId as string;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        ai_score: true,
        ai_insight: true,
        title: true,
        working_domain: true,
      },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Check if AI analysis exists
    if (post.ai_score === null || post.ai_insight === null) {
      return res.json({
        id: post.id,
        ai_score: null,
        ai_insight: null,
        status: 'pending',
        message: 'AI analysis has not been generated yet.',
      });
    }

    res.json({
      id: post.id,
      ai_score: post.ai_score,
      ai_insight: post.ai_insight,
      status: 'complete',
    });
  } catch (error: any) {
    console.error('Get AI insight error:', error);
    res.status(500).json({ message: 'Failed to fetch AI insight.', error: error.message });
  }
};
