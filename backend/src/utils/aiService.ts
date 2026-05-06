// ============================================================================
// HEALTH AI — AI Analysis Service (Step 11)
// Dual-path: MockAI (default) / Groq API (when GROQ_API_KEY is set)
// ============================================================================

import prisma from '../lib/prisma';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AIAnalysisResult {
  match_score: number;        // 0–100
  ai_recommendation: string;  // 2-sentence insight
}

interface PostAnalysisInput {
  title: string;
  working_domain: string;
  short_explanation?: string | null;
  required_expertise?: string;
  collaboration_type?: string;
  project_stage?: string;
}

// ============================================================================
// GROQ AI SERVICE — Real AI analysis via Groq API (Llama 3.3)
// ============================================================================

async function analyzeWithGroq(input: PostAnalysisInput): Promise<AIAnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const prompt = `You are an expert advisor for a Health-AI Co-Creation platform that connects healthcare professionals (doctors, nurses, researchers) with engineers (software, biomedical, data scientists) to build innovative health technology solutions.

Analyze the following project post and evaluate its potential for successful interdisciplinary collaboration between a healthcare professional and an engineer.

PROJECT DETAILS:
- Title: ${input.title}
- Working Domain: ${input.working_domain}
- Required Expertise: ${input.required_expertise || 'Not specified'}
- Project Stage: ${input.project_stage || 'IDEA'}
- Collaboration Type: ${input.collaboration_type || 'ADVISOR'}
- Description: ${input.short_explanation || 'No description provided'}

INSTRUCTIONS:
1. Evaluate the "match_score" (0-100): How well does this project lend itself to productive doctor-engineer collaboration? Consider clarity of need, feasibility, domain fit, and interdisciplinary synergy potential.
2. Write "ai_recommendation": Exactly 2 sentences. The first sentence should describe what specific skills or background an ideal partner should bring. The second sentence should highlight the unique interdisciplinary value — how the doctor-engineer collaboration would create something neither could achieve alone.

Respond ONLY with valid JSON in this exact format:
{"match_score": <number>, "ai_recommendation": "<string>"}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} — ${errorText}`);
  }

  const data: any = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('Empty response from Groq API');

  const parsed = JSON.parse(content);

  return {
    match_score: Math.min(100, Math.max(0, Math.round(parsed.match_score))),
    ai_recommendation: parsed.ai_recommendation || 'Unable to generate recommendation.',
  };
}

// ============================================================================
// MOCK AI SERVICE — Intelligent keyword-based heuristic analysis
// ============================================================================

function analyzeWithMock(input: PostAnalysisInput): AIAnalysisResult {
  let score = 55; // Base score — moderate match

  const title = (input.title || '').toLowerCase();
  const domain = (input.working_domain || '').toLowerCase();
  const description = (input.short_explanation || '').toLowerCase();
  const expertise = (input.required_expertise || '').toLowerCase();
  const allText = `${title} ${domain} ${description} ${expertise}`;

  // ── Domain-specific scoring ────────────────────────────────────────────

  // High-synergy health-tech domains
  const highSynergyDomains = [
    'cardiology', 'radiology', 'oncology', 'neurology', 'genomics',
    'telemedicine', 'digital health', 'medical imaging', 'diagnostics',
    'rehabilitation', 'mental health', 'drug discovery', 'clinical trials',
    'biomedical', 'wearable', 'health monitoring', 'patient care',
  ];

  const techKeywords = [
    'machine learning', 'deep learning', 'artificial intelligence', 'ai',
    'neural network', 'nlp', 'computer vision', 'data science', 'algorithm',
    'iot', 'blockchain', 'cloud', 'mobile app', 'api', 'automation',
    'predictive', 'analytics', 'big data', 'edge computing',
  ];

  const clinicalKeywords = [
    'clinical', 'patient', 'diagnosis', 'treatment', 'medical',
    'healthcare', 'hospital', 'doctor', 'nurse', 'therapy',
    'pharmaceutical', 'surgical', 'epidemiology', 'ehr', 'fda',
  ];

  // Count keyword matches
  const domainMatches = highSynergyDomains.filter(k => allText.includes(k)).length;
  const techMatches = techKeywords.filter(k => allText.includes(k)).length;
  const clinicalMatches = clinicalKeywords.filter(k => allText.includes(k)).length;

  // Domain richness bonus
  score += Math.min(domainMatches * 5, 15);

  // Cross-disciplinary bonus (best when BOTH tech and clinical keywords present)
  if (techMatches > 0 && clinicalMatches > 0) {
    score += 12; // Strong interdisciplinary signal
  }
  score += Math.min(techMatches * 3, 9);
  score += Math.min(clinicalMatches * 3, 9);

  // Description length bonus (more detail = clearer project = better match)
  if (description.length > 200) score += 5;
  if (description.length > 500) score += 3;

  // Project stage bonus — earlier stages benefit more from collaboration
  if (input.project_stage === 'IDEA') score += 4;
  if (input.project_stage === 'CONCEPT_VALIDATION') score += 3;
  if (input.project_stage === 'PROTOTYPE') score += 2;

  // Collaboration type bonus
  if (input.collaboration_type === 'COFOUNDER') score += 5;
  if (input.collaboration_type === 'RESEARCH_PARTNER') score += 3;

  // Add slight randomness for realism (±3)
  score += Math.floor(Math.random() * 7) - 3;

  // Clamp to valid range
  score = Math.min(100, Math.max(25, score));

  // ── Generate recommendation ────────────────────────────────────────────

  const recommendations = generateRecommendation(input, score, domainMatches, techMatches, clinicalMatches);

  return {
    match_score: score,
    ai_recommendation: recommendations,
  };
}

function generateRecommendation(
  input: PostAnalysisInput,
  score: number,
  domainHits: number,
  techHits: number,
  clinicalHits: number
): string {
  const domain = input.working_domain || 'this domain';
  const expertise = input.required_expertise || 'the required expertise';

  // Skill recommendation (sentence 1)
  const skillSentences = [
    `An ideal partner should bring hands-on experience in ${expertise}, combined with a strong understanding of ${domain} workflows and regulatory requirements.`,
    `The best collaborator would have expertise in ${expertise} along with familiarity in ${domain} to bridge the gap between clinical needs and technical implementation.`,
    `A partner with deep knowledge in ${expertise} and practical exposure to ${domain} challenges would be instrumental in driving this project forward.`,
    `This project would benefit most from a partner who combines technical proficiency in ${expertise} with domain-specific insight into ${domain}.`,
    `The ideal match would bring specialized skills in ${expertise}, particularly someone who understands the nuances of ${domain} and patient-centered design.`,
  ];

  // Synergy recommendation (sentence 2)
  const synergySentences: string[] = [];

  if (score >= 80) {
    synergySentences.push(
      `The interdisciplinary synergy here is exceptionally strong — by merging clinical domain expertise with cutting-edge technical capabilities, this collaboration could produce a breakthrough solution that neither a doctor nor an engineer could build alone.`,
      `This project sits at the perfect intersection of healthcare insight and engineering innovation, where the doctor's understanding of patient needs and the engineer's ability to build scalable solutions create a uniquely powerful partnership.`,
    );
  } else if (score >= 65) {
    synergySentences.push(
      `The collaboration between a healthcare professional and an engineer on this project would create valuable synergy, with clinical insights guiding the technical direction toward real-world patient impact.`,
      `A doctor-engineer partnership here would ensure that technical solutions are clinically relevant and practically deployable, creating a product grounded in real medical needs.`,
    );
  } else {
    synergySentences.push(
      `While the interdisciplinary overlap is moderate, a structured collaboration framework could help align the healthcare perspective with the engineering approach to unlock meaningful innovation.`,
      `With clearer definition of the clinical problem and technical approach, this project has the foundation for a productive cross-disciplinary partnership that bridges healthcare needs with technical solutions.`,
    );
  }

  const skill = skillSentences[Math.floor(Math.random() * skillSentences.length)];
  const synergy = synergySentences[Math.floor(Math.random() * synergySentences.length)];

  return `${skill} ${synergy}`;
}

// ============================================================================
// PUBLIC API — analyzePost()
// ============================================================================

/**
 * Analyze a post using AI (Groq if API key is set, otherwise MockAI).
 * Stores results both on the Post record and in the AIAnalysis audit log.
 */
export async function analyzePost(
  postId: string,
  userId: string,
  input: PostAnalysisInput
): Promise<AIAnalysisResult> {
  let result: AIAnalysisResult;
  let provider: string;

  try {
    if (process.env.GROQ_API_KEY) {
      result = await analyzeWithGroq(input);
      provider = 'groq';
      console.log(`[AI] Groq analysis complete for post ${postId}: score=${result.match_score}`);
    } else {
      result = analyzeWithMock(input);
      provider = 'mock';
      console.log(`[AI] Mock analysis complete for post ${postId}: score=${result.match_score}`);
    }
  } catch (error: any) {
    console.error(`[AI] Analysis failed for post ${postId}, falling back to mock:`, error.message);
    result = analyzeWithMock(input);
    provider = 'mock-fallback';
  }

  // ── Persist results ──────────────────────────────────────────────────

  // 1. Update the Post record directly
  await prisma.post.update({
    where: { id: postId },
    data: {
      ai_score: result.match_score,
      ai_insight: result.ai_recommendation,
    },
  });

  // 2. Create an audit log entry in AIAnalysis
  await prisma.aIAnalysis.create({
    data: {
      user_id: userId,
      post_id: postId,
      analysis_type: `match_insight_${provider}`,
      input_data: {
        title: input.title,
        working_domain: input.working_domain,
        short_explanation: input.short_explanation || null,
        required_expertise: input.required_expertise || null,
        collaboration_type: input.collaboration_type || null,
        project_stage: input.project_stage || null,
      },
      output_result: {
        match_score: result.match_score,
        ai_recommendation: result.ai_recommendation,
        provider,
      },
    },
  });

  return result;
}
