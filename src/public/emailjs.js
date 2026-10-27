// The original site's email flow (EmailJS public key, service and templates kept exactly as on approvedeu.com).
export const EMAILJS = { key: 'Vyn1uEt_qyYpqR5Ux', service: 'service_lb6bhaq', verifyTemplate: 'template_4kmjvj7', treeTemplate: 'template_nx4g4xe' };
let loading;
export function loadEmailJs() {
  if (window.emailjs) return Promise.resolve(window.emailjs);
  if (!loading) loading = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    s.onload = () => { window.emailjs.init(EMAILJS.key); res(window.emailjs); }; s.onerror = () => rej(new Error('Could not load the email service'));
    document.head.appendChild(s);
  });
  return loading;
}
export const savedEmail = () => { try { return localStorage.getItem('user_email') || ''; } catch { return ''; } };
