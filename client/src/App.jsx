import { Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Services from './pages/public/Services';
import Testimonials from './pages/public/Testimonials';
import Contact from './pages/public/Contact';
import BlogList from './pages/public/BlogList';
import BlogPost from './pages/public/BlogPost';
import NotFound from './pages/public/NotFound';

// Admin Pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import AdminBlogList from './pages/admin/BlogList';
import BlogEdit from './pages/admin/BlogEdit';
import Settings from './pages/admin/Settings';
import AboutEditor from './pages/admin/AboutEditor';
import TestimonialsManager from './pages/admin/TestimonialsManager';
import Quotes from './pages/admin/Quotes';
import ForgotPassword from './pages/admin/ForgotPassword';
import ResetPassword from './pages/admin/ResetPassword';
import Analytics from './pages/admin/Analytics';
import Comments from './pages/admin/Comments';

const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />
      <Route path="/services" element={<Layout><Services /></Layout>} />
      <Route path="/testimonials" element={<Layout><Testimonials /></Layout>} />
      <Route path="/contact" element={<Layout><Contact /></Layout>} />
      <Route path="/blog" element={<Layout><BlogList /></Layout>} />
      <Route path="/blog/:slug" element={<Layout><BlogPost /></Layout>} />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/reset-password" element={<ResetPassword />} />
      <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/blogs" element={<ProtectedRoute><AdminBlogList /></ProtectedRoute>} />
      <Route path="/admin/blogs/new" element={<ProtectedRoute><BlogEdit /></ProtectedRoute>} />
      <Route path="/admin/blogs/:id" element={<ProtectedRoute><BlogEdit /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/admin/about" element={<ProtectedRoute><AboutEditor /></ProtectedRoute>} />
      <Route path="/admin/testimonials" element={<ProtectedRoute><TestimonialsManager /></ProtectedRoute>} />
      <Route path="/admin/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/admin/comments" element={<ProtectedRoute><Comments /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  );
};

export default App;
