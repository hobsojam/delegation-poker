function shortText(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) return null;
  return s;
}

function validateShortText(value, maxLen = 200) {
  const text = shortText(value);
  if (!text) return { ok: false, reason: 'required' };
  if (text.length > maxLen) return { ok: false, reason: 'too_long' };
  return { ok: true, value: text };
}

module.exports = { shortText, validateShortText };

