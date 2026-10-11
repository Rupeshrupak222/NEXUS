import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, Download, ExternalLink, Printer, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function StudentCertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [certModal, setCertModal] = useState(false);

  useEffect(() => {
    async function loadCertificates() {
      try {
        const res = await api.get('/student/certificates');
        if (res.success && res.data) {
          setCertificates(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCertificates();
  }, []);

  const openCertificate = (cert) => {
    setSelectedCert(cert);
    setCertModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Verified Certificates</h2>
        <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Accredited credentials awarded upon successful curriculum graduation
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton count={2} height="120px" />
      ) : certificates.length === 0 ? (
        <div className="card" style={{ padding: '56px 20px', textAlign: 'center' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: 'var(--mint-light)', color: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Award size={26} />
          </div>
          <h3 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '6px' }}>
            No Certificates Earned Yet
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 16px' }}>
            Complete 100% of your enrolled curriculum lessons and maintain active attendance to earn your official credentials.
          </p>
          <Link to="/student/courses" className="btn btn-mint btn-sm">
            Go to My Courses
          </Link>
        </div>
      ) : (
        <div className="grid-cards-auto">
          {certificates.map((cert) => (
            <div key={cert.id} className="card card-interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'var(--mint-light)', color: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={22} />
                  </div>
                  <Badge variant="mint" pulse>Verified Credential</Badge>
                </div>

                <h3 style={{ fontSize: '17px', margin: '0 0 4px 0', color: 'var(--text-main)' }}>
                  {cert.course_title}
                </h3>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Issued on: <strong>{cert.issue_date}</strong> &bull; Standing: <strong>{cert.grade_or_score}</strong>
                </div>

                <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 600, marginBottom: '20px' }}>
                  ID: {cert.certificate_number}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => openCertificate(cert)}
                  className="btn btn-mint"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  View Certificate
                </button>
                <Link
                  to={`/verify-certificate/${cert.certificate_number}`}
                  target="_blank"
                  className="btn btn-secondary btn-icon"
                  title="Open Public Verification Link"
                >
                  <ExternalLink size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OFFICIAL HIGH-RES CERTIFICATE MODAL */}
      <Modal
        isOpen={certModal}
        onClose={() => setCertModal(false)}
        title="Official Certificate of Completion"
        maxWidth="820px"
      >
        {selectedCert && (
          <div>
            {/* Printable Certificate Canvas */}
            <div
              id="printable-certificate"
              style={{
                backgroundColor: '#FFFFFF',
                border: '8px double #1E293B',
                borderRadius: '8px',
                padding: '48px 36px',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                position: 'relative'
              }}
            >
              {/* Corner Watermarks */}
              <div style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Nexus Institute of Advanced Technology
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1E293B', margin: '0 0 16px 0' }}>
                CERTIFICATE OF COMPLETION
              </h1>

              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '8px' }}>
                This is to certify that
              </div>

              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', display: 'inline-block', padding: '0 24px 6px', marginBottom: '16px' }}>
                {user?.name}
              </div>

              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 16px auto', lineHeight: 1.6 }}>
                has successfully fulfilled all curriculum, laboratory assignments, and attendance requirements for the specialized accredited course
              </div>

              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '24px' }}>
                {selectedCert.course_title}
              </div>

              {/* Honors and Issue Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Issue Date</div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedCert.issue_date}</div>
                </div>

                <div>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--mint-light)', color: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <ShieldCheck size={26} />
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mint-dark)', marginTop: '4px' }}>
                    VERIFIED
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic Standing</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>{selectedCert.grade_or_score}</div>
                </div>
              </div>

              {/* Footer ID and QR Notice */}
              <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Credential Verification ID: {selectedCert.certificate_number}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button onClick={handlePrint} className="btn btn-secondary">
                <Printer size={16} /> Print Certificate
              </button>
              <Link
                to={`/verify-certificate/${selectedCert.certificate_number}`}
                target="_blank"
                className="btn btn-primary"
              >
                Public Verification Page &rarr;
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
