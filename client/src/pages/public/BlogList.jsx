import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublishedPostsApi } from '../../services/api';
import './BlogList.css';

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    document.title = 'Blog — Booky Editing Services';
  }, []);

  useEffect(() => {
    setLoading(true);
    getPublishedPostsApi(page)
      .then((res) => {
        setPosts(res.data.posts);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="blog-list-page">
      <section className="page-hero">
        <div className="container">
          <h1>Editorial Blog</h1>
          <p>Insights, tips, and guidance for authors at every stage of their journey.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading ? (
            <div className="spinner"></div>
          ) : posts.length === 0 ? (
            <div className="blog-empty">
              <span>📚</span>
              <h2>Articles Coming Soon</h2>
              <p>We're working on helpful editorial content for authors. Check back soon!</p>
            </div>
          ) : (
            <>
              <div className="grid-3">
                {posts.map((post) => (
                  <div key={post.id} className="card blog-card">
                    {post.cover_image_url && (
                      <img src={post.cover_image_url} alt={post.title} className="blog-card__image" />
                    )}
                    <div className="blog-card__body">
                      {post.category && <span className="blog-card__category">{post.category}</span>}
                      <h3>{post.title}</h3>
                      {post.meta_description && <p>{post.meta_description}</p>}
                      <div className="blog-card__footer">
                        <span>{new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <Link to={`/blog/${post.slug}`}>Read More →</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="blog-pagination">
                  <button className="btn btn-outline" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Previous</button>
                  <span>Page {page} of {totalPages}</span>
                  <button className="btn btn-outline" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default BlogList;
