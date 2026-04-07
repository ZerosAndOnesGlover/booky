import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAdminAboutApi, updateAboutApi } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const AboutEditor = () => {
  const { token } = useAuth();
  const [about, setAbout] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    getAdminAboutApi(token).then((res) => setAbout(res.data.about)).catch(() => {});
  }, [token]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAboutApi(token, about);
      showToast('About page updated successfully!');
    } catch { showToast('Save failed.'); }
    setSaving(false);
  };

  const field = (label, key, type = 'input') => (
    <div className="form-group">
      <label>{label}</label>
      {type === 'textarea'
        ? <textarea value={about[key] || ''} onChange={(e) => setAbout(s => ({ ...s, [key]: e.target.value }))} rows={4} />
        : <input type="text" value={about[key] || ''} onChange={(e) => setAbout(s => ({ ...s, [key]: e.target.value }))} />
      }
    </div>
  );

  return (
    <AdminLayout>
      {toast && <div className="admin-toast">{toast}</div>}
      <div className="admin-page-header"><h1>About Page</h1></div>
      <form className="admin-form" onSubmit={handleSave} style={{ maxWidth: '800px' }}>
        {field('Founder Story', 'founder_story', 'textarea')}
        {field('Mission', 'mission')}
        {field('Vision', 'vision')}
        <hr style={{ margin: '24px 0', borderColor: 'rgba(75,46,99,0.1)' }} />
        <h3 style={{ marginBottom: '16px' }}>Brand Values</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {[1,2,3,4].map((n) => (
            <div key={n}>
              {field(`Value ${n} Label`, `value_${n}_label`)}
              {field(`Value ${n} Description`, `value_${n}_description`, 'textarea')}
            </div>
          ))}
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }} disabled={saving}>
          {saving ? 'Saving...' : 'Save About Page'}
        </button>
      </form>
    </AdminLayout>
  );
};

export default AboutEditor;
