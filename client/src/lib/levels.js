export const LEVELS = [
  { level: 1, name: 'Tell',     color: '#ef4444', bg: '#2a0a0a', desc: 'I will tell them' },
  { level: 2, name: 'Sell',     color: '#f97316', bg: '#2a1308', desc: 'I will try to sell it to them' },
  { level: 3, name: 'Consult',  color: '#eab308', bg: '#261e06', desc: 'I will consult and then decide' },
  { level: 4, name: 'Agree',    color: '#22c55e', bg: '#082a12', desc: 'We will agree together' },
  { level: 5, name: 'Advise',   color: '#06b6d4', bg: '#061e26', desc: 'I will advise but they decide' },
  { level: 6, name: 'Inquire',  color: '#3b82f6', bg: '#06102a', desc: 'I will inquire after they decide' },
  { level: 7, name: 'Delegate', color: '#a855f7', bg: '#16082a', desc: 'I will fully delegate to them' },
];

export function levelById(level) {
  return LEVELS.find(l => l.level === level);
}
