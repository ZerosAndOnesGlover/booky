import { useEffect, useState, Fragment } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getQuotesApi, toggleReadApi } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const Quotes = () => {
  const { token } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchQuotes = () => {
    setLoading(true);
    getQuotesApi(token, filter)
      .then((res) => setQuotes(res.data.quotes))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQuotes(); }, [filter]);

  const handleToggleRead = async (id, currentStatus) => {
    try {
      await toggleReadApi(token, id, !currentStatus);
      setQuotes(qs => qs.map(q => q.id === id ? { ...q, is_read: !currentStatus } : q));
      showToast(!currentStatus ? 'Marked as read' : 'Marked as unread');
    } catch { showToast('Update failed.'); }
  };

  return (
    <AdminLayout>
      {toast && <div className="admin-toast">{toast}</div>}
      <div className="admin-page-header"><h1>Quote Inbox</h1></div>

      <div className="admin-filters">
        {['', 'unread', 'read'].map((f) => (
          <button key={f} className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`} onClick={() => setFilter(f)}>
            {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-table-wrapper">
        {loading ? (
          <div className="spinner"></div>
        ) : quotes.length === 0 ? (
          <p style={{ padding: '24px', color: 'var(--color-grey)', textAlign: 'center' }}>No submissions found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Service</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <Fragment key={q.id}>
                  <tr className={!q.is_read ? 'unread' : ''} style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
                    <td>{q.full_name}</td>
                    <td>{q.editing_type}</td>
                    <td>{new Date(q.submitted_at).toLocaleDateString()}</td>
                    <td><span className={`status-badge status-badge--${q.is_read ? 'read' : 'unread'}`}>{q.is_read ? 'Read' : 'Unread'}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="action-btn action-btn--edit" onClick={() => handleToggleRead(q.id, q.is_read)}>
                        {q.is_read ? 'Mark Unread' : 'Mark Read'}
                      </button>
                    </td>
                  </tr>
                  {expanded === q.id && (
                    <tr>
                      <td colSpan={5}>
                        <div className="quote-detail">
                          <div className="quote-detail__grid">
                            <div className="quote-detail__item"><label>Email</label><span>{q.email}</span></div>
                            <div className="quote-detail__item"><label>Phone</label><span>{q.phone}</span></div>
                            <div className="quote-detail__item"><label>Book Title</label><span>{q.book_title}</span></div>
                            <div className="quote-detail__item"><label>Genre</label><span>{q.genre}</span></div>
                            <div className="quote-detail__item"><label>Word Count</label><span>{q.word_count?.toLocaleString()}</span></div>
                            <div className="quote-detail__item"><label>Deadline</label><span>{q.deadline}</span></div>
                          </div>
                          {q.file_url && (
                            <a href={q.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                              📄 Download Manuscript
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
};

export default Quotes;
