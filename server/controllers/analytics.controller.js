const PageView = require('../models/PageView');
const BlogPost = require('../models/BlogPost');
const QuoteSubmission = require('../models/QuoteSubmission');
const BlogComment = require('../models/BlogComment');
const { Op, fn, col, literal } = require('sequelize');
let geoip;
try { geoip = require('geoip-lite'); } catch {}

// Extract real client IP (handles proxies)
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || '';
};

// --- PUBLIC: Record a page view ---
const recordPageView = async (req, res, next) => {
  try {
    const { path, session_id } = req.body;
    if (!path || !session_id) {
      return res.status(400).json({ error: true, message: 'path and session_id are required.' });
    }

    let country = null;
    let city = null;
    if (geoip) {
      const ip = getClientIp(req);
      const geo = geoip.lookup(ip);
      if (geo) {
        country = geo.country || null;
        city = geo.city || null;
      }
    }

    await PageView.create({ path, session_id, country, city });
    return res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// Compute { rangeStart, rangeEnd } from query params
const getDateRange = (query) => {
  const { range, startDate, endDate } = query;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === 'custom' && startDate && endDate) {
    return {
      rangeStart: new Date(startDate),
      rangeEnd: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1), // end of day
    };
  }

  let rangeStart = null;
  switch (range) {
    case '7d':  rangeStart = new Date(today.getTime() - 7   * 24 * 60 * 60 * 1000); break;
    case '30d': rangeStart = new Date(today.getTime() - 30  * 24 * 60 * 60 * 1000); break;
    case '3m':  rangeStart = new Date(today.getTime() - 90  * 24 * 60 * 60 * 1000); break;
    case '6m':  rangeStart = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000); break;
    case '1y':  rangeStart = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000); break;
    default:    rangeStart = null; break;
  }
  return { rangeStart, rangeEnd: null };
};

// Days to show in daily-view table
const getDailyViewDays = (range, startDate, endDate) => {
  if (range === 'custom' && startDate && endDate) {
    const diff = Math.ceil((new Date(endDate) - new Date(startDate)) / (24 * 60 * 60 * 1000)) + 1;
    return Math.min(diff, 365);
  }
  switch (range) {
    case '7d':  return 7;
    case '30d': return 30;
    case '3m':  return 90;
    case '6m':  return 180;
    case '1y':  return 365;
    default:    return 365;
  }
};

// --- ADMIN: Get analytics summary ---
const getAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || '30d';
    const { rangeStart, rangeEnd } = getDateRange(req.query);
    const dailyDays = getDailyViewDays(range, req.query.startDate, req.query.endDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7  * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    let rangeWhere = {};
    if (rangeStart && rangeEnd) {
      rangeWhere = { created_at: { [Op.between]: [rangeStart, rangeEnd] } };
    } else if (rangeStart) {
      rangeWhere = { created_at: { [Op.gte]: rangeStart } };
    }

    const [totalViews, todayVisitors, weekVisitors, monthVisitors, topPages, dailyViews, topPostViews, topCountries] =
      await Promise.all([
        PageView.count({ where: rangeWhere }),

        PageView.count({
          distinct: true,
          col: 'session_id',
          where: { created_at: { [Op.gte]: today } },
        }),

        PageView.count({
          distinct: true,
          col: 'session_id',
          where: { created_at: { [Op.gte]: weekAgo } },
        }),

        PageView.count({
          distinct: true,
          col: 'session_id',
          where: { created_at: { [Op.gte]: monthAgo } },
        }),

        PageView.findAll({
          attributes: ['path', [fn('COUNT', col('id')), 'views']],
          where: rangeWhere,
          group: ['path'],
          order: [[literal('views'), 'DESC']],
          limit: 10,
          raw: true,
        }),

        PageView.findAll({
          attributes: [
            [fn('DATE', col('created_at')), 'date'],
            [fn('COUNT', col('id')), 'views'],
          ],
          where: rangeWhere,
          group: [fn('DATE', col('created_at'))],
          order: [[fn('DATE', col('created_at')), 'ASC']],
          raw: true,
        }),

        // Blog post views filtered by the selected date range via PageView
        PageView.findAll({
          attributes: ['path', [fn('COUNT', col('id')), 'views']],
          where: { ...rangeWhere, path: { [Op.like]: '/blog/%' } },
          group: ['path'],
          order: [[literal('views'), 'DESC']],
          limit: 10,
          raw: true,
        }),

        PageView.findAll({
          attributes: ['country', [fn('COUNT', col('id')), 'views']],
          where: { ...rangeWhere, country: { [Op.ne]: null } },
          group: ['country'],
          order: [[literal('views'), 'DESC']],
          limit: 10,
          raw: true,
        }),
      ]);

    // Join blog post view counts with post metadata
    const slugs = topPostViews.map(r => r.path.replace('/blog/', ''));
    const postMeta = slugs.length
      ? await BlogPost.findAll({
          where: { slug: { [Op.in]: slugs }, status: 'published' },
          attributes: ['id', 'title', 'slug', 'like_count'],
        })
      : [];

    const topPosts = topPostViews
      .map(r => {
        const slug = r.path.replace('/blog/', '');
        const post = postMeta.find(p => p.slug === slug);
        if (!post) return null;
        return { id: post.id, title: post.title, slug: post.slug, view_count: parseInt(r.views, 10), like_count: post.like_count };
      })
      .filter(Boolean);

    return res.status(200).json({
      totalViews,
      todayVisitors,
      weekVisitors,
      monthVisitors,
      topPages,
      dailyViews,
      topPosts,
      topCountries,
    });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Lightweight dashboard counts (avoids fetching all rows) ---
const getDashboardStats = async (req, res, next) => {
  try {
    const [published, drafts, unreadQuotes, pendingComments] = await Promise.all([
      BlogPost.count({ where: { status: 'published' } }),
      BlogPost.count({ where: { status: 'draft' } }),
      QuoteSubmission.count({ where: { is_read: false } }),
      BlogComment.count({ where: { is_approved: false } }),
    ]);
    return res.status(200).json({ published, drafts, unreadQuotes, pendingComments });
  } catch (err) {
    next(err);
  }
};

module.exports = { recordPageView, getAnalytics, getDashboardStats };
