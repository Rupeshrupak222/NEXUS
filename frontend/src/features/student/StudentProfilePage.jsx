import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Calendar, Shield, Save } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function StudentProfilePage() {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    profileImage: ''
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get('/student/profile');
        if (res.success && res.data) {
          setProfile(res.data);
          setForm({
            name: res.data.name || '',
            phone: res.data.phone || '',
            profileImage: res.data.profile_image || ''
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/student/profile', form);
      if (res.success) {
        showToast('Profile information saved!', 'success');
        await refreshUser();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={3} height="80px" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Student Profile</h2>
        <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Review your enrolled credentials and keep your contact details current
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0, fontSize: '16px' }}>Personal Details</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSave}>
            {/* Read-Only Academic Fields */}
            <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                Academic Identifiers (Managed by Administration)
              </div>
              <div className="grid-form-2">
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Student Identification Code</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary)', marginTop: '2px' }}>
                    {profile?.student_id}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Registered Email</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                    {profile?.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Contact Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Avatar / Profile Picture URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://images.unsplash.com/..."
                value={form.profileImage}
                onChange={(e) => setForm({ ...form, profileImage: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="submit" className="btn btn-mint" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving Profile...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
