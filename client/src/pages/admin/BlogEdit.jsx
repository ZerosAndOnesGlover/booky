import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPostByIdApi, createPostApi, updatePostApi } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import slugify from 'slugify';

const MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const BlogEdit = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [status, setStatus] = useState('draft');
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      getPostByIdApi(token, id).then((res) => {
        const p = res.data.post;
        setTitle(p.title);
        setSlug(p.slug);
        setBody(p.body);
        setCategory(p.category || '');
        setMetaDesc(p.meta_description || '');
        setStatus(p.status);
        setCoverPreview(p.cover_image_url);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [id, token]);

  useEffect(() => {
    if (!isEdit && title) {
      setSlug(slugify(title, { lower: true, strict: true, trim: true }));
    }
  }, [title]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (publishStatus) => {
    const bodyIsEmpty = !body || body.replace(/<(.|\n)*?>/g, '').trim() === '';
    if (!title || bodyIsEmpty) return showToast('Title and body are required.');
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('body', body);
      formData.append('category', category);
      formData.append('meta_description', metaDesc);
      formData.append('status', publishStatus);
      if (coverFile) formData.append('cover_image', coverFile);

      if (isEdit) {
        await updatePostApi(token, id, formData);
      } else {
        await createPostApi(token, formData);
      }

      showToast(publishStatus === 'published' ? 'Post published!' : 'Draft saved!');
      setTimeout(() => navigate('/admin/blogs'), 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><div className="spinner"></div></AdminLayout>;

  return (
    <AdminLayout>
      {toast && <div className="admin-toast">{toast}</div>}
      <div className="admin-page-header">
        <h1>{isEdit ? 'Edit Post' : 'New Blog Post'}</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => handleSave('draft')} disabled={saving}>Save as Draft</button>
          <button className="btn btn-primary" onClick={() => handleSave('published')} disabled={saving}>
            {saving ? 'Saving...' : 'Publish Post'}
          </button>
        </div>
      </div>

      <div className="admin-form" style={{ maxWidth: '100%' }}>
        <div className="form-group">
          <label>Post Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter post title" />
          {slug && <small style={{ color: 'var(--color-grey)', marginTop: '4px', display: 'block' }}>Slug: /blog/{slug}</small>}
        </div>

        <div className="blog-edit-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="form-group">
            <label>Category</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Writing Tips" />
          </div>
          <div className="form-group">
            <label>Meta Description (SEO) — {metaDesc.length}/160</label>
            <input type="text" value={metaDesc} onChange={(e) => setMetaDesc(e.target.value.slice(0, 160))} placeholder="Brief description for search engines" />
          </div>
        </div>

        <div className="form-group">
          <label>Cover Image</label>
          {coverPreview && <img src={coverPreview} alt="Cover preview" style={{ height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px', width: '100%' }} />}
          <input type="file" accept="image/*" onChange={handleCoverChange} />
        </div>

        <div className="form-group">
          <label>Content *</label>
          <ReactQuill
            theme="snow"
            value={body}
            onChange={setBody}
            modules={MODULES}
            className="blog-editor"
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default BlogEdit;
