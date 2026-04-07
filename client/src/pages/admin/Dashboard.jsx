import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllPostsApi, getQuotesApi, getAdminCommentsApi } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const Dashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({ published: 0, drafts: 0, unread: 0, pendingComments: 0 });
  const [recentQuotes, setRecentQuotes] = useState([]);

  useEffect(() => {
    getAllPostsApi(token).then((res) => {
      const published = res.data.posts.filter(p => p.status === 'published').length;
      const drafts = res.data.posts.filter(p => p.status === 'draft').length;
      setStats(s => ({ ...s, published, drafts }));
    }).catch(() => {});

    getQuotesApi(token, 'unread').then((res) => {
      setStats(s => ({ ...s, unread: res.data.total }));
    }).catch(() => {});

    getAdminCommentsApi(token, 'pending').then((res) => {
      setStats(s => ({ ...s, pendingComments: res.data.total ?? res.data.comments?.length ?? 0 }));
    }).catch(() => {});

    // Recent submissions (any status) for the table
    getQuotesApi(token, '', 1).then((res) => {
      setRecentQuotes(res.data.quotes.slice(0, 5));
    }).catch(() => {});
  }, [token]);

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <Link to="/admin/blogs/new" className="btn btn-primary">+ New Blog Post</Link>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <span className="admin-stat-card__number">{stats.published}</span>
          <span className="admin-stat-card__label">Published Posts</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__number">{stats.drafts}</span>
          <span className="admin-stat-card__label">Draft Posts</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__number">{stats.unread}</span>
          <span className="admin-stat-card__label">Unread Quotes</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__number">{stats.pendingComments}</span>
          <span className="admin-stat-card__label">Pending Comments</span>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(75,46,99,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Recent Quote Submissions</h3>
          <Link to="/admin/quotes" style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>View All →</Link>
        </div>
        {recentQuotes.length === 0 ? (
          <p style={{ padding: '24px', color: 'var(--color-grey)', textAlign: 'center' }}>No unread submissions.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Service</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentQuotes.map((q) => (
                <tr key={q.id} className={!q.is_read ? 'unread' : ''}>
                  <td data-label="Name">{q.full_name}</td>
                  <td data-label="Service">{q.editing_type}</td>
                  <td data-label="Date">{new Date(q.submitted_at).toLocaleDateString()}</td>
                  <td data-label="Status"><span className={`status-badge status-badge--${q.is_read ? 'read' : 'unread'}`}>{q.is_read ? 'Read' : 'Unread'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
