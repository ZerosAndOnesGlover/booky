import { useEffect, useState } from 'react';
import { getBooksApi } from '../../services/api';
import { setSEO } from '../../utils/seo';
import './Books.css';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSEO({
      title: 'Books Worked On',
      subtitle: 'Our Editorial Portfolio',
      description: 'A showcase of books Booky Editing Services has helped bring to life — fiction, non-fiction, children\'s books, memoirs, and more.',
      keywords: 'books edited by Booky, editorial portfolio Nigeria, edited manuscripts Lagos, book editing portfolio Africa',
    });
    getBooksApi()
      .then((res) => setBooks(res.data.books))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="books-page">
      <section className="page-hero">
        <div className="container">
          <h1>Books Worked On</h1>
          <p>A selection of manuscripts we've helped bring to life.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading ? (
            <div className="spinner" />
          ) : books.length === 0 ? (
            <div className="books-empty">
              <span>📚</span>
              <h2>Coming Soon</h2>
              <p>Our editorial portfolio will be showcased here soon.</p>
            </div>
          ) : (
            <div className="books-grid">
              {books.map((book) => (
                <div key={book.id} className="book-card">
                  <div className="book-card__cover">
                    {book.cover_image_url ? (
                      <img src={book.cover_image_url} alt={`Cover of ${book.title}`} />
                    ) : (
                      <div className="book-card__cover-placeholder">
                        <span>📖</span>
                      </div>
                    )}
                  </div>
                  <div className="book-card__body">
                    {book.genre && (
                      <span className="book-card__genre">{book.genre}</span>
                    )}
                    <h3 className="book-card__title">{book.title}</h3>
                    <p className="book-card__author">by {book.author}</p>
                    {book.description && (
                      <p className="book-card__description">{book.description}</p>
                    )}
                    {book.links && book.links.length > 0 && (
                      <div className="book-card__links">
                        {book.links.map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="book-card__link"
                          >
                            {link.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Books;
