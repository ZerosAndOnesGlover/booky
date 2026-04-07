const Anthropic = require('@anthropic-ai/sdk');
const BlogPost = require('../models/BlogPost');
const QuoteSubmission = require('../models/QuoteSubmission');
const PageView = require('../models/PageView');
const BlogComment = require('../models/BlogComment');
const Testimonial = require('../models/Testimonial');
const { Op, fn, col, literal } = require('sequelize');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const buildContext = async () => {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    publishedCount,
    draftCount,
    totalQuotes,
    unreadQuotes,
    recentQuotes,
    pendingComments,
    totalViews30d,
    todayViews,
    pendingTestimonials,
    topPosts,
  ] = await Promise.all([
    BlogPost.count({ where: { status: 'published' } }),
    BlogPost.count({ where: { status: 'draft' } }),
    QuoteSubmission.count(),
    QuoteSubmission.count({ where: { is_read: false } }),
    QuoteSubmission.findAll({
      where: { submitted_at: { [Op.gte]: monthAgo } },
      attributes: ['full_name', 'editing_type', 'word_count', 'genre', 'submitted_at'],
      order: [['submitted_at', 'DESC']],
      limit: 10,
      raw: true,
    }),
    BlogComment.count({ where: { is_approved: false } }),
    PageView.count({ where: { created_at: { [Op.gte]: monthAgo } } }),
    PageView.count({ where: { created_at: { [Op.gte]: today } } }),
    Testimonial.count({ where: { is_approved: false } }),
    BlogPost.findAll({
      where: { status: 'published' },
      attributes: ['title', 'category', 'view_count', 'like_count'],
      order: [['view_count', 'DESC']],
      limit: 5,
      raw: true,
    }),
  ]);

  return {
    publishedCount,
    draftCount,
    totalQuotes,
    unreadQuotes,
    recentQuotes,
    pendingComments,
    totalViews30d,
    todayViews,
    pendingTestimonials,
    topPosts,
    currentDate: now.toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
  };
};

const buildSystemPrompt = (ctx) => {
  const recentQuotesList = ctx.recentQuotes.length
    ? ctx.recentQuotes.map(q =>
        `  • ${q.full_name} — ${q.editing_type || 'N/A'}` +
        `${q.word_count ? ` (${Number(q.word_count).toLocaleString()} words)` : ''}` +
        `${q.genre ? `, ${q.genre}` : ''}`
      ).join('\n')
    : '  None in the last 30 days';

  const topPostsList = ctx.topPosts.length
    ? ctx.topPosts.map(p =>
        `  • "${p.title}"${p.category ? ` [${p.category}]` : ''} — ${p.view_count} views, ${p.like_count} likes`
      ).join('\n')
    : '  No published posts yet';

  return `You are Booky AI, an intelligent business assistant embedded in the admin panel of Booky Editing Services — a professional book editing and proofreading business.

Today is ${ctx.currentDate}.

## LIVE WEBSITE DATA
**Content:**
- Published blog posts: ${ctx.publishedCount}
- Draft posts: ${ctx.draftCount}
- Page views (last 30 days): ${ctx.totalViews30d}
- Visitors today: ${ctx.todayViews}

**Inbox:**
- Total quote submissions ever: ${ctx.totalQuotes}
- Unread quotes: ${ctx.unreadQuotes}
- Pending comment approvals: ${ctx.pendingComments}
- Pending testimonial approvals: ${ctx.pendingTestimonials}

**Top performing blog posts:**
${topPostsList}

**Recent quote requests (last 30 days):**
${recentQuotesList}

## YOUR CAPABILITIES
You assist the admin with:

1. **Financial & Income Strategy** — analyse quote trends, suggest pricing, identify high-value service opportunities, upsells, seasonal strategies, and income diversification (workshops, templates, online courses, etc.)

2. **Content Generation** — draft full blog posts, SEO meta descriptions, content calendars, social media captions, email newsletters, and post ideas rooted in the publishing and writing world

3. **Quote & Billing Assistance** — estimate project costs by word count and editing type, draft professional quote/invoice templates, recommend pricing tiers, advise on turnaround times and payment structures

4. **Analytics Insights** — interpret traffic patterns, identify best-performing content, surface growth opportunities, and flag gaps in the data above

5. **Business Strategy** — client acquisition, service packaging, competitive positioning, and growth roadmaps for a small editing business

## RESPONSE GUIDELINES
- Be specific and actionable — provide concrete numbers, templates, or fully written copy whenever possible
- When generating content (blog posts, invoices, emails), produce complete ready-to-use text unless the admin asks for options
- Format responses with clear headers, bullet points, and short paragraphs
- When advising on pricing, be aware this business serves a UK/Nigeria market context
- If data is missing or insufficient to answer well, say so and suggest what to track next
- Maintain a professional yet warm tone — this is a small creative business, not a corporation`;
};

const chat = async (req, res, next) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: true, message: 'messages array is required.' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: true, message: 'AI service is not configured. Add ANTHROPIC_API_KEY to your server .env file.' });
    }

    const ctx = await buildContext();
    const systemPrompt = buildSystemPrompt(ctx);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    });

    stream.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

    stream.on('finalMessage', () => {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });

  } catch (err) {
    next(err);
  }
};

module.exports = { chat };
