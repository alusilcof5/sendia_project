export const teacherDemoSessionKey = 'sendia-teacher-demo-session-v1';

export function hasTeacherDemoSession() {
  try {
    return typeof window !== 'undefined' && window.sessionStorage.getItem(teacherDemoSessionKey) === 'active';
  } catch {
    return false;
  }
}

export function startTeacherDemoSession() {
  window.sessionStorage.setItem(teacherDemoSessionKey, 'active');
}

export function endTeacherDemoSession() {
  window.sessionStorage.removeItem(teacherDemoSessionKey);
}
