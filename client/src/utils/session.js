export const getSessionId = () => {
  let id = sessionStorage.getItem('booky_session_id');
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('booky_session_id', id);
  }
  return id;
};
