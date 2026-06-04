// Returns the trimmed URL when it is a valid http(s) URL, otherwise null.
// Blocks dangerous schemes (javascript:, data:, vbscript:, file:, etc.) from
// being stored and later rendered as href/src on public pages.
const safeUrl = (value) => {
  if (value == null || value === '') return null;
  const str = String(value).trim();
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:' ? str : null;
  } catch {
    return null;
  }
};

module.exports = { safeUrl };
