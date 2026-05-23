import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { setSEO } from '../../utils/seo';
import './NotFound.css';

const NotFound = () => {
  useEffect(() => {
    setSEO({
      title: 'Page Not Found',
      description: 'The page you are looking for does not exist or has been moved. Return to Booky Editing Services to explore our editorial and publishing support.',
    });
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
