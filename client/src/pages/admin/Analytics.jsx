import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAnalyticsApi } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const RANGES = [
  { value: '7d',     label: 'Last 7 Days' },
  { value: '30d',    label: 'Last 30 Days' },
  { value: '3m',     label: 'Last 3 Months' },
  { value: '6m',     label: 'Last 6 Months' },
  { value: '1y',     label: 'Last 1 Year' },
  { value: 'all',    label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const COUNTRY_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

const PAGE_LABELS = {
  '/':             'Home',
  '/about':        'About',
  '/services':     'Services',
  '/testimonials': 'Testimonials',
  '/blog':         'Blog',
  '/contact':      'Get a Quote',
};

const friendlyPath = (path) => {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.startsWith('/blog/')) return `Blog: ${path.replace('/blog/', '')}`;
  return path.replace(/^\//, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Home';
};

const Analytics = () => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const fetchData = () => {
    setLoading(true);
    getAnalyticsApi(token, range, startDate, endDate)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (range !== 'custom') fetchData();
  }, [token, range]);

  const handleCustomApply = () => {
    if (startDate && endDate) fetchData();
  };

  const getCountryName = (code) => {
    try { return COUNTRY_NAMES.of(code) || code; }
    catch { return code; }
  };

  const rangeLabel = RANGES.find(r => r.value === range)?.label ?? '';

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1>Analytics</h1>
        <div className="analytics-controls">
          <select
            className="analytics-select"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {range === 'custom' && (
            <div className="analytics-date-row">
              <input
                className="analytics-date"
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="analytics-date-sep">to</span>
              <input
                className="analytics-date"
                type="date"
                value={endDate}
                min={startDate}
                max={today}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <button className="btn btn-primary" style={{ padding: '8px 20px' }} onClick={handleCustomApply}>
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <>
          <div className="admin-stats analytics-stats">
            <div className="admin-stat-card">
              <span className="admin-stat-card__number">{data?.totalViews ?? 0}</span>
              <span className="admin-stat-card__label">Page Views ({rangeLabel})</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-card__number">{data?.todayVisitors ?? 0}</span>
              <span className="admin-stat-card__label">Visitors Today</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-card__number">{data?.weekVisitors ?? 0}</span>
              <span className="admin-stat-card__label">This Week</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-card__number">{data?.monthVisitors ?? 0}</span>
              <span className="admin-stat-card__label">This Month</span>
            </div>
          </div>

          <div className="analytics-grid" style={{ marginTop: '24px' }}>
            <div className="admin-table-wrapper">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(75,46,99,0.1)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Top Pages</h3>
              </div>
              {!data?.topPages?.length ? (
                <p style={{ padding: '24px', color: 'var(--color-grey)', textAlign: 'center' }}>No data yet.</p>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>Page</th><th style={{ textAlign: 'right' }}>Views</th></tr></thead>
                  <tbody>
                    {data.topPages.map((p, i) => (
                      <tr key={i}>
                        <td data-label="Page">{friendlyPath(p.path)}</td>
                        <td data-label="Views" className="analytics-num">{p.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="admin-table-wrapper">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(75,46,99,0.1)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Visitors by Country</h3>
              </div>
              {!data?.topCountries?.length ? (
                <p style={{ padding: '24px', color: 'var(--color-grey)', textAlign: 'center' }}>No location data yet.</p>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>Country</th><th style={{ textAlign: 'right' }}>Views</th></tr></thead>
                  <tbody>
                    {data.topCountries.map((c, i) => (
                      <tr key={i}>
                        <td data-label="Country">{getCountryName(c.country)}</td>
                        <td data-label="Views" className="analytics-num">{c.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="admin-table-wrapper" style={{ marginTop: '24px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(75,46,99,0.1)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Daily Views — {rangeLabel}</h3>
            </div>
            {!data?.dailyViews?.length ? (
              <p style={{ padding: '24px', color: 'var(--color-grey)', textAlign: 'center' }}>No data yet.</p>
            ) : (
              <table className="admin-table">
                <thead><tr><th>Date</th><th style={{ textAlign: 'right' }}>Views</th></tr></thead>
                <tbody>
                  {data.dailyViews.map((d, i) => (
                    <tr key={i}>
                      <td data-label="Date">{new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td data-label="Views" className="analytics-num">{d.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="admin-table-wrapper" style={{ marginTop: '24px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(75,46,99,0.1)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Blog Posts by Reads</h3>
            </div>
            {!data?.topPosts?.length ? (
              <p style={{ padding: '24px', color: 'var(--color-grey)', textAlign: 'center' }}>No published posts yet.</p>
            ) : (
              <table className="admin-table">
                <thead><tr><th>Title</th><th style={{ textAlign: 'right' }}>Views</th><th style={{ textAlign: 'right' }}>Likes</th></tr></thead>
                <tbody>
                  {data.topPosts.map((p) => (
                    <tr key={p.id}>
                      <td data-label="Title">{p.title}</td>
                      <td data-label="Views" className="analytics-num">{p.view_count}</td>
                      <td data-label="Likes" className="analytics-num">{p.like_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default Analytics;
