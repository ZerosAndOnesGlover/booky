import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  useEffect(() => {
    document.title = '404 Not Found — Booky Editing Services';
  }, []);

  return (
    <div className="notfound">
      <div className="container notfound__inner">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn btn-primary">← Back to Home</Link>
      </div>
    </div>
  );
};

export default NotFound;
