import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';
import { recordPageViewApi } from '../../services/api';
import { getSessionId } from '../../utils/session';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    recordPageViewApi({ path: location.pathname, session_id: getSessionId() }).catch(() => {});
  }, [location.pathname]);

  return (
    <div className="layout">
      <Navbar />
      <main className="layout__main">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Layout;
