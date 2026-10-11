import React, { useState, useEffect } from 'react';
import { Radio, Video, PlayCircle, Clock, Calendar, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function StudentLiveClassesPage() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'live', 'upcoming', 'past'

  // Join Modal State
  const [joining, setJoining] = useState(false);
  const [joinModal, setJoinModal] = useState(false);
  const [joinResult, setJoinResult] = useState(null);

  // Recording Modal State
  const [watchModal, setWatchModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/sessions');
      if (res.success && res.data) {
        setSessions(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch live classes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleJoinClass = async (sessionId) => {
    setJoining(true);
    try {
      const res = await api.get(`/student/sessions/${sessionId}/join`);
      if (res.success && res.data) {
        setJoinResult(res.data);
        setJoinModal(true);
        showToast('Authorized! Attendance recorded.', 'success');
        fetchSessions(); // refresh attendance tag
      }
    } catch (err) {
      showToast(err.message || 'Unable to join session.', 'error');
    } finally {
      setJoining(false);
    }
  };

  const liveSessions = sessions.filter((s) => s.status === 'LIVE');
  const upcomingSessions = sessions.filter((s) => s.status === 'SCHEDULED');
  const pastSessions = sessions.filter((s) => s.status === 'COMPLETED');

  const displayedList =
    activeTab === 'live'
      ? liveSessions
      : activeTab === 'upcoming'
      ? upcomingSessions
      : pastSessions;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Live Interactive Classes</h2>
        <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Attend live broadcasts with faculty and access recorded lecture archives
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveTab('upcoming')}
          className="btn btn-ghost"
          style={{
            borderBottom: activeTab === 'upcoming' ? '2px solid var(--mint)' : '2px solid transparent',
            color: activeTab === 'upcoming' ? 'var(--mint-dark)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'upcoming' ? 700 : 500,
            borderRadius: 0
          }}
        >
          Upcoming Classes ({upcomingSessions.length})
        </button>

        <button
          onClick={() => setActiveTab('live')}
          className="btn btn-ghost"
          style={{
            borderBottom: activeTab === 'live' ? '2px solid var(--mint)' : '2px solid transparent',
            color: activeTab === 'live' ? 'var(--mint-dark)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'live' ? 700 : 500,
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span className="pulse-dot" style={{ color: 'var(--mint)' }} />
          Live Now ({liveSessions.length})
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className="btn btn-ghost"
          style={{
            borderBottom: activeTab === 'past' ? '2px solid var(--mint)' : '2px solid transparent',
            color: activeTab === 'past' ? 'var(--mint-dark)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'past' ? 700 : 500,
            borderRadius: 0
          }}
        >
          Past & Recordings ({pastSessions.length})
        </button>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <LoadingSkeleton count={3} height="100px" />
      ) : displayedList.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No sessions found in this category.</p>
        </div>
      ) : (
        <div className="grid-cards-auto">
          {displayedList.map((s) => (
            <div key={s.id} className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <Badge variant={s.status === 'LIVE' ? 'mint' : 'primary'} pulse={s.status === 'LIVE'}>
                    {s.status === 'LIVE' ? 'Broadcasting Now' : s.status}
                  </Badge>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {s.batch_code}
                  </span>
                </div>

                <h3 style={{ fontSize: '17px', margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                  {s.title}
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Course: <strong>{s.course_title}</strong> &bull; Instructor: <strong>{s.instructor_name}</strong>
                </div>

                <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '13px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-main)' }}>
                    <Calendar size={15} color="var(--mint)" /> {s.date}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <Clock size={14} /> {s.start_time} - {s.end_time}
                  </div>
                </div>

                {s.attendance_status && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--mint-dark)', fontWeight: 600, marginBottom: '12px' }}>
                    <CheckCircle2 size={15} /> Verified Attendance: {s.attendance_status}
                  </div>
                )}
              </div>

              <div>
                {s.status === 'LIVE' || s.status === 'SCHEDULED' ? (
                  <button
                    onClick={() => handleJoinClass(s.id)}
                    className="btn btn-mint"
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={joining}
                  >
                    <Video size={16} /> Enter Live Classroom
                  </button>
                ) : s.recording_reference ? (
                  <button
                    onClick={() => {
                      setSelectedRecording(s);
                      setWatchModal(true);
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <PlayCircle size={16} color="var(--primary)" /> Watch Session Recording
                  </button>
                ) : (
                  <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} disabled>
                    Recording Processing
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JOIN SESSION MODAL WITH SECURE ACCESS */}
      <Modal
        isOpen={joinModal}
        onClose={() => setJoinModal(false)}
        title="Live Classroom Access Granted"
        maxWidth="500px"
      >
        {joinResult && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--mint-light)', color: 'var(--mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <CheckCircle2 size={30} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '4px' }}>
                {joinResult.sessionTitle}
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
                Instructor: {joinResult.instructor} &bull; Platform: {joinResult.meetingProvider}
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Your attendance entry has been verified and registered on the academic attendance ledger.
            </div>

            <a
              href={joinResult.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-mint btn-lg"
              style={{ justifyContent: 'center', marginTop: '6px' }}
            >
              Launch Meeting &rarr;
            </a>
          </div>
        )}
      </Modal>

      {/* WATCH RECORDING MODAL */}
      <Modal
        isOpen={watchModal}
        onClose={() => setWatchModal(false)}
        title={`Session Recording — ${selectedRecording?.title}`}
        maxWidth="740px"
      >
        {selectedRecording && (
          <div>
            <div style={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
              <video
                src={selectedRecording.recording_reference}
                controls
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />
            </div>
            <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              Broadcast date: <strong>{selectedRecording.date}</strong> &bull; Course: <strong>{selectedRecording.course_title}</strong>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
