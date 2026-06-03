import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllBooksApi, createBookApi, updateBookApi, deleteBookApi } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const EMPTY_FORM = { title: '', author: '', links: [], is_active: true };

const BooksManager = () => {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [linkDraft, setLinkDraft] = useState({ name: '', url: '' });
  const fileRef = useRef();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchAll = () => {
    getAllBooksApi(token)
      .then((res) => setBooks(res.data.books))
      .catch(() => {});
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleAddLink = () => {
    if (!linkDraft.name.trim() || !linkDraft.url.trim()) return;
    setForm((f) => ({ ...f, links: [...f.links, { name: linkDraft.name.trim(), url: linkDraft.url.trim() }] }));
    setLinkDraft({ name: '', url: '' });
  };

  const handleRemoveLink = (index) => {
    setForm((f) => ({ ...f, links: f.links.filter((_, i) => i !== index) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      showToast('Title and author are required.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('author', form.author.trim());
      fd.append('links', JSON.stringify(form.links));
      fd.append('is_active', form.is_active);
      if (coverFile) fd.append('cover_image', coverFile);

      if (editId) {
        await updateBookApi(token, editId, fd);
        showToast('Book updated!');
      } else {
        await createBookApi(token, fd);
        showToast('Book added!');
      }
      resetForm();
      fetchAll();
    } catch {
      showToast('Save failed. Please try again.');
    }
    setSaving(false);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setCoverFile(null);
    setCoverPreview(null);
    setLinkDraft({ name: '', url: '' });
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleEdit = (book) => {
    setEditId(book.id);
    setForm({ title: book.title, author: book.author, links: book.links || [], is_active: book.is_active });
    setCoverFile(null);
    setCoverPreview(book.cover_image_url || null);
    setLinkDraft({ name: '', url: '' });
    if (fileRef.current) fileRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    try {
      await deleteBookApi(token, confirmTarget.id);
      showToast('Book deleted.');
      fetchAll();
    } catch {
      showToast('Delete failed.');
    }
    setConfirmTarget(null);
  };

  const handleReorder = async (id, direction, index) => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= books.length) return;
    const itemA = books[index];
    const itemB = books[swapIndex];
    try {
      const fdA = new FormData(); fdA.append('display_order', itemB.display_order);
      const fdB = new FormData(); fdB.append('display_order', itemA.display_order);
      await updateBookApi(token, itemA.id, fdA);
      await updateBookApi(token, itemB.id, fdB);
      fetchAll();
    } catch {}
  };

  return (
    <AdminLayout>
      {confirmTarget && (
        <ConfirmDialog
          message={`Delete "${confirmTarget.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-page-header"><h1>Books Worked On</h1></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Table */}
        <div className="admin-table-wrapper">
          {books.length === 0 ? (
            <p style={{ padding: '24px', color: 'var(--color-grey)', textAlign: 'center' }}>No books added yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Title / Author</th>
                  <th>Links</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b, i) => (
                  <tr key={b.id}>
                    <td data-label="Cover">
                      {b.cover_image_url
                        ? <img src={b.cover_image_url} alt={b.title} style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '4px' }} />
                        : <div style={{ width: '48px', height: '64px', background: 'var(--color-border)', borderRadius: '4px' }} />
                      }
                    </td>
                    <td data-label="Title / Author">
                      <strong>{b.title}</strong><br />
                      <small style={{ color: 'var(--color-grey)' }}>{b.author}</small>
                    </td>
                    <td data-label="Links">
                      {(b.links || []).length > 0
                        ? <span style={{ color: 'var(--color-grey)', fontSize: '0.8rem' }}>{b.links.length} link{b.links.length !== 1 ? 's' : ''}</span>
                        : <span style={{ color: 'var(--color-border)', fontSize: '0.8rem' }}>None</span>
                      }
                    </td>
                    <td data-label="Order">
                      <button className="action-btn action-btn--edit" onClick={() => handleReorder(b.id, 'up', i)} disabled={i === 0}>↑</button>
                      <button className="action-btn action-btn--edit" onClick={() => handleReorder(b.id, 'down', i)} disabled={i === books.length - 1} style={{ marginLeft: '4px' }}>↓</button>
                    </td>
                    <td data-label="Actions" style={{ display: 'flex', gap: '6px' }}>
                      <button className="action-btn action-btn--edit" onClick={() => handleEdit(b)}>Edit</button>
                      <button className="action-btn action-btn--delete" onClick={() => setConfirmTarget({ id: b.id, title: b.title })}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Form */}
        <div className="admin-form">
          <h3 style={{ marginBottom: '16px' }}>{editId ? 'Edit Book' : 'Add Book'}</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Book Cover</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" ref={fileRef} onChange={handleCoverChange} />
              {coverPreview && (
                <img src={coverPreview} alt="Cover preview" style={{ marginTop: '10px', width: '80px', height: '108px', objectFit: 'cover', borderRadius: '4px', display: 'block' }} />
              )}
            </div>

            <div className="form-group">
              <label>Book Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>Author *</label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>Links</label>
              {form.links.map((link, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', background: 'var(--color-bg)', padding: '6px 10px', borderRadius: '6px' }}>
                  <span style={{ flex: 1, fontSize: '0.85rem' }}>
                    <strong>{link.name}</strong> — <span style={{ color: 'var(--color-grey)', fontSize: '0.78rem', wordBreak: 'break-all' }}>{link.url}</span>
                  </span>
                  <button type="button" className="action-btn action-btn--delete" onClick={() => handleRemoveLink(i)}>✕</button>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginTop: '8px' }}>
                <input
                  type="text"
                  placeholder="Link name (e.g. Buy on Amazon)"
                  value={linkDraft.name}
                  onChange={(e) => setLinkDraft((l) => ({ ...l, name: e.target.value }))}
                />
                <input
                  type="url"
                  placeholder="https://..."
                  value={linkDraft.url}
                  onChange={(e) => setLinkDraft((l) => ({ ...l, url: e.target.value }))}
                />
                <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }} onClick={handleAddLink}>
                  Add
                </button>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="book-active"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                style={{ width: 'auto', margin: 0 }}
              />
              <label htmlFor="book-active" style={{ margin: 0 }}>Show on homepage</label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editId ? 'Update Book' : 'Add Book'}
              </button>
              {editId && (
                <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BooksManager;
