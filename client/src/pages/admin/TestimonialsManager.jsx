import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllTestimonialsApi, createTestimonialApi, updateTestimonialApi,
  approveTestimonialApi, deleteTestimonialApi,
} from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const StarInput = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: '4px' }}>
    {[1,2,3,4,5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          color: n <= value ? '#F59E0B' : 'var(--color-border)',
          padding: '2px',
        }}
        aria-label={`${n} star${n > 1 ? 's' : ''}`}
      >
        ★
      </button>
    ))}
  </div>
);

const TestimonialsManager = () => {
  const { token } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [filter, setFilter] = useState('approved');
  const [form, setForm] = useState({ client_name: '', quote: '', book_title: '', rating: 5 });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [viewItem, setViewItem] = useState(null); // testimonial to view in dialog

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchAll = () => {
    getAllTestimonialsApi(token, filter)
      .then((res) => setTestimonials(res.data.testimonials))
      .catch(() => {});
  };

  useEffect(() => { fetchAll(); }, [filter]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await updateTestimonialApi(token, editId, form);
        showToast('Testimonial updated!');
      } else {
        await createTestimonialApi(token, form);
        showToast('Testimonial added!');
      }
      setForm({ client_name: '', quote: '', book_title: '', rating: 5 });
      setEditId(null);
      fetchAll();
    } catch { showToast('Save failed.'); }
    setSaving(false);
  };

  const handleEdit = (t) => {
    setEditId(t.id);
    setForm({ client_name: t.client_name, quote: t.quote, book_title: t.book_title || '', rating: t.rating ?? 5 });
    setViewItem(null);
  };

  const handleApprove = async (id) => {
    try {
      await approveTestimonialApi(token, id);
      showToast('Review approved and published!');
      fetchAll();
    } catch { showToast('Action failed.'); }
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    try {
      await deleteTestimonialApi(token, confirmTarget.id);
      showToast('Testimonial deleted.');
      fetchAll();
    } catch { showToast('Delete failed.'); }
    setConfirmTarget(null);
  };

  const handleReorder = async (id, direction, index) => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= testimonials.length) return;
    const itemA = testimonials[index];
    const itemB = testimonials[swapIndex];
    try {
      await updateTestimonialApi(token, itemA.id, { display_order: itemB.display_order });
      await updateTestimonialApi(token, itemB.id, { display_order: itemA.display_order });
      fetchAll();
    } catch {}
  };

  const renderStars = (rating = 5) =>
    '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return (
    <AdminLayout>
      {/* Detail View Dialog */}
      {viewItem && (
        <div className="confirm-overlay" onClick={() => setViewItem(null)}>
          <div className="confirm-dialog" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ fontSize: '1rem', color: 'var(--color-text)' }}>{viewItem.client_name}</strong>
              <span style={{ color: '#F59E0B', fontSize: '1.1rem' }}>{renderStars(viewItem.rating)}</span>
            </div>
            {viewItem.book_title && (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-grey)', marginBottom: '12px' }}>
                Book: <em>{viewItem.book_title}</em>
              </p>
            )}
            <p style={{ lineHeight: '1.8', color: 'var(--color-text)', fontStyle: 'italic', marginBottom: '20px' }}>
              "{viewItem.quote}"
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {!viewItem.is_approved && (
                <button className="action-btn action-btn--edit" onClick={() => { handleApprove(viewItem.id); setViewItem(null); }}>
                  Approve & Publish
                </button>
              )}
              <button className="action-btn action-btn--edit" onClick={() => handleEdit(viewItem)}>Edit</button>
              <button className="action-btn action-btn--delete" onClick={() => { setConfirmTarget({ id: viewItem.id, name: viewItem.client_name }); setViewItem(null); }}>Delete</button>
              <button className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => setViewItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {confirmTarget && (
        <ConfirmDialog
          message={`Delete testimonial from "${confirmTarget.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {toast && <div className="admin-toast">{toast}</div>}
      <div className="admin-page-header"><h1>Testimonials</h1></div>

      <div className="admin-filters">
        {[
          { value: 'approved', label: 'Published' },
          { value: 'pending',  label: 'Pending Approval' },
          { value: '',         label: 'All' },
        ].map((f) => (
          <button
            key={f.value}
            className={`filter-btn ${filter === f.value ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        <div className="admin-table-wrapper">
          {testimonials.length === 0 ? (
            <p style={{ padding: '24px', color: 'var(--color-grey)', textAlign: 'center' }}>
              No {filter === 'pending' ? 'pending reviews' : filter === 'approved' ? 'published testimonials' : 'testimonials'} yet.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Stars</th>
                  <th>Source</th>
                  {filter === 'approved' && <th>Order</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map((t, i) => (
                  <tr
                    key={t.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setViewItem(t)}
                  >
                    <td data-label="Client">
                      <strong>{t.client_name}</strong>
                      {t.book_title && <><br /><small style={{ color: 'var(--color-grey)' }}>{t.book_title}</small></>}
                    </td>
                    <td data-label="Stars" style={{ color: '#F59E0B', fontSize: '0.9rem' }}>{'★'.repeat(t.rating ?? 5)}</td>
                    <td data-label="Source">
                      <span className={`status-badge ${t.source === 'public' ? 'status-badge--unread' : 'status-badge--read'}`}>
                        {t.source === 'public' ? 'Visitor' : 'Admin'}
                      </span>
                    </td>
                    {filter === 'approved' && (
                      <td data-label="Order" onClick={(e) => e.stopPropagation()}>
                        <button className="action-btn action-btn--edit" onClick={() => handleReorder(t.id, 'up', i)} disabled={i === 0}>↑</button>
                        <button className="action-btn action-btn--edit" onClick={() => handleReorder(t.id, 'down', i)} disabled={i === testimonials.length - 1} style={{ marginLeft: '4px' }}>↓</button>
                      </td>
                    )}
                    <td data-label="Actions" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '6px' }}>
                      {!t.is_approved && (
                        <button className="action-btn action-btn--edit" onClick={() => handleApprove(t.id)}>Approve</button>
                      )}
                      <button className="action-btn action-btn--edit" onClick={() => handleEdit(t)}>Edit</button>
                      <button className="action-btn action-btn--delete" onClick={() => setConfirmTarget({ id: t.id, name: t.client_name })}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="admin-form">
          <h3 style={{ marginBottom: '16px' }}>{editId ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Client Name *</label>
              <input type="text" value={form.client_name} onChange={(e) => setForm(f => ({ ...f, client_name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Book Title (optional)</label>
              <input type="text" value={form.book_title} onChange={(e) => setForm(f => ({ ...f, book_title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Star Rating</label>
              <StarInput value={form.rating} onChange={(n) => setForm(f => ({ ...f, rating: n }))} />
            </div>
            <div className="form-group">
              <label>Testimonial Quote *</label>
              <textarea value={form.quote} onChange={(e) => setForm(f => ({ ...f, quote: e.target.value }))} rows={4} required />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editId ? 'Update' : 'Add Testimonial'}</button>
              {editId && <button type="button" className="btn btn-outline" onClick={() => { setEditId(null); setForm({ client_name: '', quote: '', book_title: '', rating: 5 }); }}>Cancel</button>}
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TestimonialsManager;
