import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { logoutApi, getQuotesApi, getAdminCommentsApi, markAllQuotesReadApi } from '../../services/api';
import { useEffect, useRef, useState } from 'react';

const POLL_INTERVAL = 30000;

const AdminLayout = ({ children }) => {
  const { token, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingComments, setPendingComments] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const commentsSeenAtRef = useRef(parseInt(localStorage.getItem('commentsLastSeenAt') || '0'));

  useEffect(() => {
    if (!token) return;

    const fetchCounts = () => {
      getQuotesApi(token, 'unread', 1)
        .then((res) => setUnreadCount(res.data.total))
        .catch(() => {});
      getAdminCommentsApi(token, 'pending', 1, commentsSeenAtRef.current)
        .then((res) => setPendingComments(res.data.total))
        .catch(() => {});
    };

    fetchCounts();
    const id = setInterval(fetchCounts, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [token]);

  const handleLogout = async () => {
    try { await logoutApi(); } catch {}
    logout();
    navigate('/admin/login');
  };

  const closeMenu = () => setSidebarOpen(false);

  const handleQuoteNavClick = () => {
    setUnreadCount(0);
    closeMenu();
    markAllQuotesReadApi(token).catch(() => {});
  };

  const handleCommentsNavClick = () => {
    const now = Date.now();
    localStorage.setItem('commentsLastSeenAt', String(now));
    commentsSeenAtRef.current = now;
    setPendingComments(0);
    closeMenu();
  };

  return (
    <div className="admin-layout">
      {/* Mobile top bar */}
      <div className="admin-topbar">
        <button
          className="admin-topbar__hamburger"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <span className="admin-topbar__brand">Booky Editing Services Admin</span>
      </div>

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div className="admin-sidebar-backdrop" onClick={closeMenu} />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__header">
          <h2>Booky Editing Services Admin</h2>
          <span>Content Management</span>
        </div>
        <nav className="admin-sidebar__nav" onClick={closeMenu}>
          <NavLink to="/admin" end>📊 Dashboard</NavLink>
          <NavLink to="/admin/blogs">✏️ Blog Posts</NavLink>
          <NavLink to="/admin/testimonials">💬 Testimonials</NavLink>
          <NavLink to="/admin/books">📚 Books</NavLink>
          <NavLink to="/admin/quotes" onClick={handleQuoteNavClick}>
            <span>📥 Quote Inbox</span>
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </NavLink>
          <NavLink to="/admin/comments" onClick={handleCommentsNavClick}>
            <span>💬 Comments</span>
            {pendingComments > 0 && <span className="badge">{pendingComments}</span>}
          </NavLink>
          <NavLink to="/admin/analytics">📊 Analytics</NavLink>
          <NavLink to="/admin/ai">✦ Booky Editing Services AI</NavLink>
          <NavLink to="/admin/settings">⚙️ Settings</NavLink>
          <NavLink to="/admin/about">📄 About Page</NavLink>
          <a href="https://bookyeditingservices.com" target="_blank" rel="noopener noreferrer">🌐 View Website</a>
        </nav>
        <div className="admin-sidebar__footer">
          <button className="admin-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <span className="admin-theme-toggle__track">
              <span className={`admin-theme-toggle__thumb ${darkMode ? 'admin-theme-toggle__thumb--on' : ''}`}></span>
            </span>
            <span>{darkMode ? '🌙 Dark' : '☀️ Light'}</span>
          </button>
          <button onClick={handleLogout} style={{ marginTop: '8px' }}>Logout</button>
        </div>
      </aside>
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
