import { useEffect, useState, Fragment } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAdminCommentsApi, approveCommentApi, deleteCommentApi } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const Comments = () => {
  const { token } = useAuth();
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchComments = () => {
    setLoading(true);
    getAdminCommentsApi(token, filter)
      .then((res) => setComments(res.data.comments))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComments(); }, [filter]);

  const handleApprove = async (id) => {
    try {
      await approveCommentApi(token, id);
      showToast('Comment approved.');
      fetchComments();
    } catch { showToast('Action failed.'); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCommentApi(token, id);
      showToast('Comment deleted.');
      fetchComments();
    } catch { showToast('Delete failed.'); }
    setConfirmId(null);
  };

  return (
    <AdminLayout>
      {confirmId && (
        <ConfirmDialog
          message="Delete this comment? This cannot be undone."
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
      {toast && <div className="admin-toast">{toast}</div>}
      <div className="admin-page-header">
        <h1>Comments</h1>
      </div>

      <div className="admin-filters">
        {[
          { value: 'pending',  label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: '',         label: 'All' },
        ].map((f) => (
          <button
            key={f.value}
            className={`filter-btn ${filter === f.value ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="admin-table-wrapper">
        {loading ? (
          <div className="spinner"></div>
        ) : comments.length === 0 ? (
          <p style={{ padding: '24px', color: 'var(--color-grey)', textAlign: 'center' }}>
            No {filter === 'pending' ? 'pending' : filter === 'approved' ? 'approved' : ''} comments.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Author</th>
                <th>Post</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <Fragment key={c.id}>
                  <tr>
                    <td><strong>{c.author_name}</strong></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-grey)' }}>/blog/{c.post_slug}</td>
                    <td style={{ maxWidth: '280px' }}>
                      <span style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: '0.9rem',
                      }}>
                        {c.body}
                      </span>
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${c.is_approved ? 'status-badge--published' : 'status-badge--draft'}`}>
                        {c.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      {!c.is_approved && (
                        <button className="action-btn action-btn--edit" onClick={() => handleApprove(c.id)}>
                          Approve
                        </button>
                      )}
                      <button className="action-btn action-btn--delete" onClick={() => setConfirmId(c.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
};

export default Comments;
