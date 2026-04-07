import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllPostsApi, deletePostApi } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const AdminBlogList = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, title }

  const fetchPosts = () => {
    setLoading(true);
    getAllPostsApi(token, filter)
      .then((res) => setPosts(res.data.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, [filter]);

  const handleDelete = async () => {
    if (!confirmTarget) return;
    try {
      await deletePostApi(token, confirmTarget.id);
      fetchPosts();
    } catch { /* silent */ }
    setConfirmTarget(null);
  };

  return (
    <AdminLayout>
      {confirmTarget && (
        <ConfirmDialog
          message={`Delete "${confirmTarget.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
      <div className="admin-page-header">
        <h1>Blog Posts</h1>
        <Link to="/admin/blogs/new" className="btn btn-primary">+ New Post</Link>
      </div>

      <div className="admin-filters">
        {['', 'published', 'draft'].map((f) => (
          <button key={f} className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`} onClick={() => setFilter(f)}>
            {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-table-wrapper">
        {loading ? (
          <div className="spinner"></div>
        ) : posts.length === 0 ? (
          <p style={{ padding: '24px', color: 'var(--color-grey)', textAlign: 'center' }}>No posts found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td><span className={`status-badge status-badge--${post.status}`}>{post.status}</span></td>
                  <td>{new Date(post.created_at).toLocaleDateString()}</td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button className="action-btn action-btn--edit" onClick={() => navigate(`/admin/blogs/${post.id}`)}>Edit</button>
                    <button className="action-btn action-btn--delete" onClick={() => setConfirmTarget({ id: post.id, title: post.title })}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBlogList;
