import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Video, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export function StudentCalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    async function loadCalendar() {
      try {
        const res = await api.get('/student/calendar');
        if (res.success && res.data) {
          setEvents(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCalendar();
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const getEventsForDay = (dayNum) => {
    if (!dayNum) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return events.filter((e) => e.date === dateStr);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>My Learning Schedule</h2>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Live cohort classes and curriculum milestones
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
            {monthNames[month]} {year}
          </h3>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={handlePrevMonth} className="btn btn-secondary btn-icon" aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <button onClick={handleNextMonth} className="btn btn-secondary btn-icon" aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="80px" />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="calendar-scroll-wrapper">
            <div className="calendar-grid-inner">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} style={{ padding: '12px', textAlign: 'center', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {d}
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(110px, auto)' }}>
            {calendarDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isToday =
                day &&
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={idx}
                  style={{
                    borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid var(--border-light)',
                    borderBottom: '1px solid var(--border-light)',
                    padding: '8px',
                    backgroundColor: day ? (isToday ? 'var(--mint-light)' : '#FFFFFF') : 'var(--bg-subtle)',
                    minHeight: '110px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {day && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: isToday ? 800 : 600,
                          color: isToday ? 'var(--mint-dark)' : 'var(--text-main)',
                          width: isToday ? '22px' : 'auto',
                          height: isToday ? '22px' : 'auto',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {day}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          padding: '4px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--mint-light)',
                          borderLeft: '3px solid var(--mint)',
                          fontSize: '11.5px',
                          lineHeight: 1.2
                        }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ev.title}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {ev.startTime} &bull; {ev.instructor}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
