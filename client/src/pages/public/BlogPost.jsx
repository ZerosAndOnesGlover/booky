import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  getPostBySlugApi,
  getPublishedPostsApi,
  toggleLikeApi,
  getCommentsApi,
  submitCommentApi,
  recordPageViewApi,
} from '../../services/api';
import { getSessionId } from '../../utils/session';
import './BlogPost.css';

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();

  useEffect(() => {
    const sessionId = getSessionId();

    setLoading(true);
    setCommentSubmitted(false);
    setLiked(false);

    getPostBySlugApi(slug, sessionId)
      .then((res) => {
        setPost(res.data.post);
        setLikeCount(res.data.post.like_count ?? 0);
        setLiked(res.data.is_liked ?? false);
        document.title = `${res.data.post.title} — Booky Editing Services`;
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    getPublishedPostsApi(1).then((res) => setRecentPosts(res.data.posts.slice(0, 3))).catch(() => {});
    getCommentsApi(slug).then((res) => setComments(res.data.comments)).catch(() => {});

    // Record page view (fire-and-forget)
    recordPageViewApi({ path: `/blog/${slug}`, session_id: sessionId }).catch(() => {});
  }, [slug]);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const res = await toggleLikeApi(slug, getSessionId());
      setLiked(res.data.liked);
      setLikeCount(res.data.like_count);
    } catch { /* silent */ }
    setLiking(false);
  };

  const onCommentSubmit = async (data) => {
    try {
      await submitCommentApi(slug, data);
      setCommentSubmitted(true);
      reset();
    } catch { /* silent — form stays open */ }
  };

  if (loading) return <div className="spinner" style={{ marginTop: '120px' }}></div>;

  if (notFound) return (
    <div className="blog-post-notfound">
      <div className="container text-center" style={{ padding: '120px 24px' }}>
        <h1>Post Not Found</h1>
        <p>The article you're looking for doesn't exist or has been removed.</p>
        <Link to="/blog" className="btn btn-primary" style={{ marginTop: '24px' }}>← Back to Blog</Link>
      </div>
    </div>
  );

  const readTime = Math.ceil(post.body.replace(/<[^>]+>/g, '').split(' ').length / 200);

  return (
    <div className="blog-post-page">
      {post.cover_image_url && (
        <div className="blog-post__cover">
          <img src={post.cover_image_url} alt={post.title} />
        </div>
      )}

      <section className="section">
        <div className="container blog-post__layout">
          <article className="blog-post__content">
            <Link to="/blog" className="blog-post__back">← Back to Blog</Link>
            {post.category && <span className="blog-card__category">{post.category}</span>}
            <h1>{post.title}</h1>
            <div className="blog-post__meta">
              <span>{new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span>·</span>
              <span>{readTime} min read</span>
              <span>·</span>
              <span>{post.view_count} {post.view_count === 1 ? 'read' : 'reads'}</span>
            </div>

            <div className="blog-post__body" dangerouslySetInnerHTML={{ __html: post.body }} />

            {/* Like button */}
            <div className="blog-post__engagement">
              <button
                className={`like-btn ${liked ? 'like-btn--active' : ''}`}
                onClick={handleLike}
                disabled={liking}
                aria-label={liked ? 'Unlike this post' : 'Like this post'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                  fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
              </button>
            </div>

            {/* Comments */}
            <div className="blog-post__comments">
              <h3>
                {comments.length > 0
                  ? `${comments.length} Comment${comments.length === 1 ? '' : 's'}`
                  : 'Comments'}
              </h3>

              {comments.length > 0 ? (
                <div className="comments-list">
                  {comments.map((c) => (
                    <div key={c.id} className="comment">
                      <div className="comment__header">
                        <strong>{c.author_name}</strong>
                        <span>{new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <p>{c.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="comments-empty">No comments yet. Be the first to share your thoughts.</p>
              )}

              <div className="comment-form-wrap">
                <h4>Leave a Comment</h4>
                {commentSubmitted ? (
                  <div className="comment-submitted">
                    Your comment has been submitted and will appear after moderation. Thank you!
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onCommentSubmit)} noValidate>
                    <div className="form-group">
                      <label>Your Name *</label>
                      <input
                        type="text"
                        className={errors.author_name ? 'error' : ''}
                        {...register('author_name', { required: 'Name is required' })}
                      />
                      {errors.author_name && <span className="error-message">{errors.author_name.message}</span>}
                    </div>
                    <div className="form-group">
                      <label>Comment *</label>
                      <textarea
                        rows={4}
                        className={errors.body ? 'error' : ''}
                        {...register('body', {
                          required: 'Comment cannot be empty',
                          maxLength: { value: 1000, message: 'Max 1000 characters' },
                        })}
                      />
                      {errors.body && <span className="error-message">{errors.body.message}</span>}
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Post Comment'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </article>

          <aside className="blog-post__sidebar">
            <div className="card sidebar-card">
              <h4>About Booky Editing Services</h4>
              <p>Professional editing and publishing support for authors who want clarity, confidence, and excellence.</p>
              <Link to="/contact" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>Get a Quote</Link>
            </div>

            {recentPosts.length > 0 && (
              <div className="card sidebar-card" style={{ marginTop: '24px' }}>
                <h4>Recent Posts</h4>
                <ul className="sidebar-posts">
                  {recentPosts.filter(p => p.slug !== slug).map((p) => (
                    <li key={p.id}>
                      <Link to={`/blog/${p.slug}`}>{p.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
};

export default BlogPost;
