import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Award, CheckCircle2, AlertTriangle, ArrowLeft, Building2, Calendar, BookOpen, User } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';

export function VerifyCertificatePage() {
  const { certificateNumber } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVerification() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/verify-certificate/${certificateNumber}`);
        if (res.success && res.data) {
          setCert(res.data);
        } else {
          setError('Certificate not found or invalid.');
        }
      } catch (err) {
        setError(err.message || 'Unable to verify credential.');
      } finally {
        setLoading(false);
      }
    }

    if (certificateNumber) {
      fetchVerification();
    }
  }, [certificateNumber]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Top Brand Link */}
      <div style={{ maxWidth: '640px', width: '100%', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Portal Sign In
        </Link>
        <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          Public Credential Verification Service
        </span>
      </div>

      <div
        style={{
          maxWidth: '640px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden'
        }}
      >
        {/* Verification Status Header */}
        <div
          style={{
            padding: '32px 36px',
            backgroundColor: cert?.isValid ? 'var(--mint-light)' : 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: cert?.isValid ? 'var(--mint)' : 'var(--error)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {cert?.isValid ? <ShieldCheck size={32} /> : <AlertTriangle size={30} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 800, color: 'var(--text-main)' }}>
                {cert?.isValid ? 'Official Verified Certificate' : 'Verification Status'}
              </h1>
              {cert?.isValid && <Badge variant="mint" pulse>Authentic Credential</Badge>}
            </div>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              Credential Identification: <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{certificateNumber}</strong>
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '36px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div className="pulse-dot" style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
              <p style={{ marginTop: '12px', fontSize: '14px' }}>Verifying credential on official ledger...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <AlertTriangle size={48} color="var(--error)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', color: 'var(--error)', marginBottom: '8px' }}>Record Not Found</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
                No active certificate matching credential identifier <strong>{certificateNumber}</strong> exists in the database.
              </p>
            </div>
          ) : (
            <div>
              <div className="grid-2col" style={{ marginBottom: '28px' }}>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                    <User size={14} /> Recipient
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {cert.studentName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    ID: {cert.studentCode}
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                    <Calendar size={14} /> Date of Issue
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {new Date(cert.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--mint-dark)', fontWeight: 600, marginTop: '2px' }}>
                    Standing: {cert.gradeOrScore}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
                  <BookOpen size={14} /> Academic Course
                </div>
                <h3 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {cert.courseTitle}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
                  Duration: {cert.courseDuration} &bull; Full curriculum completed with 100% required attendance.
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Building2 size={24} color="var(--primary)" />
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <div><strong>Issuing Body:</strong> {cert.issuer}</div>
                  <div><strong>Accreditation:</strong> {cert.accreditedBy}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
