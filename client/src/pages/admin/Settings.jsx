import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAdminSettingsApi, updateSettingsApi, uploadLogoApi, removeLogoApi, uploadPhotoApi, removePhotoApi } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const Settings = () => {
  const { token } = useAuth();
  const [settings, setSettings] = useState({});
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    getAdminSettingsApi(token).then((res) => {
      setSettings(res.data.settings);
      setLogoPreview(res.data.settings.logo_url);
      setPhotoPreview(res.data.settings.founder_photo_url);
    }).catch(() => {});
  }, [token]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleContactSave = async (e) => {
    e.preventDefault();
    setSaving('contact');
    try {
      await updateSettingsApi(token, {
        whatsapp_number: settings.whatsapp_number,
        contact_email: settings.contact_email,
        instagram_url: settings.instagram_url,
        twitter_url: settings.twitter_url,
        facebook_url: settings.facebook_url,
        linkedin_url: settings.linkedin_url,
      });
      showToast('Settings updated successfully!');
    } catch { showToast('Save failed.'); }
    setSaving('');
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setSaving('logo');
    const formData = new FormData();
    formData.append('logo', logoFile);
    try {
      const res = await uploadLogoApi(token, formData);
      setLogoPreview(res.data.logo_url);
      showToast('Logo updated successfully!');
    } catch { showToast('Logo upload failed.'); }
    setSaving('');
  };

  const handleLogoRemove = async () => {
    setSaving('logo-remove');
    try {
      await removeLogoApi(token);
      setLogoPreview(null);
      setLogoFile(null);
      showToast('Logo removed.');
    } catch { showToast('Failed to remove logo.'); }
    setSaving('');
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    setSaving('photo');
    const formData = new FormData();
    formData.append('photo', photoFile);
    try {
      const res = await uploadPhotoApi(token, formData);
      setPhotoPreview(res.data.founder_photo_url);
      showToast('Photo updated successfully!');
    } catch { showToast('Photo upload failed.'); }
    setSaving('');
  };

  const handlePhotoRemove = async () => {
    setSaving('photo-remove');
    try {
      await removePhotoApi(token);
      setPhotoPreview(null);
      setPhotoFile(null);
      showToast('Photo removed.');
    } catch { showToast('Failed to remove photo.'); }
    setSaving('');
  };

  const field = (label, key, type = 'text') => (
    <div className="form-group">
      <label>{label}</label>
      <input type={type} value={settings[key] || ''} onChange={(e) => setSettings(s => ({ ...s, [key]: e.target.value }))} />
    </div>
  );

  return (
    <AdminLayout>
      {toast && <div className="admin-toast">{toast}</div>}
      <div className="admin-page-header"><h1>Settings</h1></div>

      <div style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>
        {/* Logo */}
        <div className="admin-form">
          <h3 style={{ marginBottom: '16px' }}>Logo</h3>
          {logoPreview && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <img src={logoPreview} alt="Logo" style={{ height: '60px', objectFit: 'contain' }} />
              <button className="btn btn-outline" onClick={handleLogoRemove} disabled={saving === 'logo-remove'} style={{ color: 'var(--color-danger, #e53e3e)', borderColor: 'var(--color-danger, #e53e3e)' }}>
                {saving === 'logo-remove' ? 'Removing...' : 'Remove'}
              </button>
            </div>
          )}
          <input type="file" accept="image/*" onChange={(e) => { setLogoFile(e.target.files[0]); setLogoPreview(URL.createObjectURL(e.target.files[0])); }} />
          <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={handleLogoUpload} disabled={saving === 'logo' || !logoFile}>
            {saving === 'logo' ? 'Uploading...' : 'Save Logo'}
          </button>
        </div>

        {/* Founder Photo */}
        <div className="admin-form">
          <h3 style={{ marginBottom: '16px' }}>Founder Photo</h3>
          {photoPreview && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <img src={photoPreview} alt="Founder" style={{ height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
              <button className="btn btn-outline" onClick={handlePhotoRemove} disabled={saving === 'photo-remove'} style={{ color: 'var(--color-danger, #e53e3e)', borderColor: 'var(--color-danger, #e53e3e)' }}>
                {saving === 'photo-remove' ? 'Removing...' : 'Remove'}
              </button>
            </div>
          )}
          <input type="file" accept="image/*" onChange={(e) => { setPhotoFile(e.target.files[0]); setPhotoPreview(URL.createObjectURL(e.target.files[0])); }} />
          <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={handlePhotoUpload} disabled={saving === 'photo' || !photoFile}>
            {saving === 'photo' ? 'Uploading...' : 'Save Photo'}
          </button>
        </div>

        {/* Contact & Social */}
        <div className="admin-form">
          <h3 style={{ marginBottom: '16px' }}>Contact Details & Social Links</h3>
          <form onSubmit={handleContactSave}>
            {field('WhatsApp Number (international format)', 'whatsapp_number', 'tel')}
            {field('Contact Email (displayed in footer)', 'contact_email', 'email')}
            {field('Instagram URL', 'instagram_url')}
            {field('Twitter URL', 'twitter_url')}
            {field('Facebook URL', 'facebook_url')}
            {field('LinkedIn URL', 'linkedin_url')}
            <button type="submit" className="btn btn-primary" disabled={saving === 'contact'}>
              {saving === 'contact' ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
