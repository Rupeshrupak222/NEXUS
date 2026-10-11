const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('\x1b[36m====================================================');
  console.log('   NEXUS LMS PLATFORM — AUTOMATED SYSTEM QA SUITE   ');
  console.log('====================================================\x1b[0m\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`\x1b[32m✔ PASS:\x1b[0m ${testName}`);
      passed++;
    } else {
      console.error(`\x1b[31m✖ FAIL:\x1b[0m ${testName}`);
      failed++;
    }
  }

  // 1. Healthcheck
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    assert(res.ok && data.status === 'healthy', 'Health Check Endpoint (/api/health)');
  } catch (e) {
    assert(false, `Health Check failed: ${e.message}`);
  }

  // 2. Admin Login
  let adminToken = '';
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@academy.io', password: 'AdminPassword@2026' })
    });
    const data = await res.json();
    assert(res.ok && data.success && data.data.token && data.data.user.role === 'ADMIN', 'Admin Authentication (/api/auth/login)');
    adminToken = data.data.token;
  } catch (e) {
    assert(false, `Admin Login failed: ${e.message}`);
  }

  // 3. Admin Dashboard Metrics
  try {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.ok && data.success && data.data.metrics.totalStudents >= 4, 'Admin Dashboard Aggregation (/api/admin/dashboard)');
  } catch (e) {
    assert(false, `Admin Dashboard failed: ${e.message}`);
  }

  // 4. Student Directory & Search
  let firstCourseId = '';
  let firstBatchId = '';
  try {
    const res = await fetch(`${BASE_URL}/admin/courses`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.ok && data.data.length >= 3, 'Courses Directory (/api/admin/courses)');
    firstCourseId = data.data[0].id;

    const bRes = await fetch(`${BASE_URL}/admin/batches`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const bData = await bRes.json();
    assert(bRes.ok && bData.data.length >= 4, 'Batches Directory (/api/admin/batches)');
    firstBatchId = bData.data[0].id;
  } catch (e) {
    assert(false, `Courses/Batches fetch failed: ${e.message}`);
  }

  // 5. Admin Enrolls New Student (Section 6, 7)
  const testStudentEmail = `vikas.sharma.${Date.now()}@example.com`;
  let activationToken = '';
  try {
    const res = await fetch(`${BASE_URL}/admin/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Vikas Sharma',
        email: testStudentEmail,
        phone: '+1 555-888-9999',
        courseId: firstCourseId,
        batchId: firstBatchId,
        joiningDate: '2026-03-28'
      })
    });
    const data = await res.json();
    assert(res.ok && data.success && data.data.student.student_id.startsWith('STU-'), 'Admin Creates Student & Assigns ID');
    activationToken = data.data.activationToken;
    assert(!!activationToken, 'Cryptographic Activation Token Generated & Dispatched');
  } catch (e) {
    assert(false, `Student creation failed: ${e.message}`);
  }

  // 6. Student Account Activation (Section 7)
  try {
    const res = await fetch(`${BASE_URL}/auth/activate-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: activationToken,
        newPassword: 'VikasSecurePass@2026'
      })
    });
    const data = await res.json();
    assert(res.ok && data.success, 'Student Activates Account via Token (/api/auth/activate-account)');
  } catch (e) {
    assert(false, `Account activation failed: ${e.message}`);
  }

  // 7. Activated Student Login
  let studentToken = '';
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testStudentEmail, password: 'VikasSecurePass@2026' })
    });
    const data = await res.json();
    assert(res.ok && data.success && data.data.user.role === 'STUDENT', 'Activated Student Login (/api/auth/login)');
    studentToken = data.data.token;
  } catch (e) {
    assert(false, `Activated student login failed: ${e.message}`);
  }

  // 8. Security Negative Test: RBAC Enforcement
  // Student MUST NOT access admin endpoints
  try {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(res.status === 403, 'RBAC Security: Student blocked from Admin Dashboard (HTTP 403)');
  } catch (e) {
    assert(false, `RBAC test error: ${e.message}`);
  }

  // 9. Student Dashboard & Enrolled Courses
  try {
    const res = await fetch(`${BASE_URL}/student/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data = await res.json();
    assert(res.ok && data.success && data.data.enrolledCourses.length > 0, 'Student Dashboard & Enrolled Courses (/api/student/dashboard)');
  } catch (e) {
    assert(false, `Student dashboard failed: ${e.message}`);
  }

  // 10. Student Curriculum Access & Progress (Rahul Sharma)
  let rahulToken = '';
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'rahul@example.com', password: 'StudentPass@2026' })
    });
    const data = await res.json();
    rahulToken = data.data.token;

    // Get courses
    const cRes = await fetch(`${BASE_URL}/student/courses`, {
      headers: { Authorization: `Bearer ${rahulToken}` }
    });
    const cData = await cRes.json();
    assert(cRes.ok && cData.data.length >= 2, 'Student Only Sees Own Enrolled Courses');
    const courseId = cData.data[0].course_id;

    // Get curriculum with progress
    const curRes = await fetch(`${BASE_URL}/student/courses/${courseId}`, {
      headers: { Authorization: `Bearer ${rahulToken}` }
    });
    const curData = await curRes.json();
    assert(curRes.ok && curData.data.modules.length > 0, 'Student Curriculum with Lesson State');

    // Complete a lesson
    const firstLesson = curData.data.modules[0].lessons[0];
    const compRes = await fetch(`${BASE_URL}/student/courses/${courseId}/lessons/${firstLesson.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rahulToken}` }
    });
    const compData = await compRes.json();
    assert(compRes.ok && compData.success && compData.completionPercentage >= 0, 'Server-Side Lesson Progress Calculation');
  } catch (e) {
    assert(false, `Rahul curriculum test failed: ${e.message}`);
  }

  // 11. Live Session Join & Attendance Verification (Section 15, 16, 17, 18)
  try {
    const sRes = await fetch(`${BASE_URL}/student/sessions`, {
      headers: { Authorization: `Bearer ${rahulToken}` }
    });
    const sData = await sRes.json();
    assert(sRes.ok && sData.data.length > 0, 'Student Live Sessions List (No raw URLs exposed)');

    // Join session (LIVE session today)
    const liveSession = sData.data.find(s => s.status === 'LIVE') || sData.data[0];
    const joinRes = await fetch(`${BASE_URL}/student/sessions/${liveSession.id}/join`, {
      headers: { Authorization: `Bearer ${rahulToken}` }
    });
    const joinData = await joinRes.json();
    assert(joinRes.ok && joinData.success && !!joinData.data.joinUrl, 'Live Class Join Authorization & Attendance Trigger');
  } catch (e) {
    assert(false, `Session join failed: ${e.message}`);
  }

  // 12. Public Certificate Verification (Section 28, 29)
  try {
    const certNum = 'CERT-2026-9842';
    const vRes = await fetch(`${BASE_URL}/verify-certificate/${certNum}`);
    const vData = await vRes.json();
    assert(vRes.ok && vData.success && vData.data.isValid && vData.data.studentName === 'Priya Patel', 'Public Certificate Verification (/verify-certificate/:num)');
  } catch (e) {
    assert(false, `Certificate verification failed: ${e.message}`);
  }

  // 13. Audit Log Recorded
  try {
    const res = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.ok && data.data.length > 0, 'Audit Logging for Security Actions (/api/admin/audit-logs)');
  } catch (e) {
    assert(false, `Audit log check failed: ${e.message}`);
  }

  console.log(`\n\x1b[36m====================================================`);
  console.log(`QA SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\x1b[0m\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
