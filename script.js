const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');
const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');

function closeMenu() {
  if (!nav || !menuBtn) return;
  nav.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.textContent = '☰';
}

if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? '✕' : '☰';
  });

  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('click', event => {
    if (window.innerWidth > 900 || !nav.classList.contains('open')) return;
    if (!nav.contains(event.target) && !menuBtn.contains(event.target)) closeMenu();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
}

// Smooth scrolling with sticky-header offset.
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - 78;
    window.scrollTo({ top: y, behavior: 'smooth' });
  });
});

// Keep the current section visible in the navigation.
const sectionIds = ['about', 'programs', 'impact', 'involved', 'transparency', 'contact'];
const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];

if ('IntersectionObserver' in window && sections.length) {
  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach(link => {
      const active = link.getAttribute('href') === `#${visible.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -65% 0px', threshold: [0.1, 0.3, 0.6] });
  sections.forEach(section => observer.observe(section));
}

// Get-involved links automatically select the relevant enquiry type.
const interestSelect = form?.querySelector('select[name="interest"]');
document.querySelectorAll('.involve-grid a, .donate-actions a').forEach(link => {
  link.addEventListener('click', () => {
    if (!interestSelect) return;
    const text = link.textContent.toLowerCase();
    if (text.includes('volunteer') || text.includes('team')) interestSelect.value = 'Volunteer';
    else if (text.includes('partnership') || text.includes('partner')) interestSelect.value = 'Partner with HM Foundation';
    else if (text.includes('member') || text.includes('interest')) interestSelect.value = 'Become a member';
    else if (text.includes('donate')) interestSelect.value = 'Support / Donate';
  });
});

// Frontend-only enquiry workflow: validate, save a local copy, and confirm to the visitor.
if (form && note) {
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const enquiries = JSON.parse(localStorage.getItem('hmf_enquiries') || '[]');
    enquiries.push({ ...data, submittedAt: new Date().toISOString() });
    localStorage.setItem('hmf_enquiries', JSON.stringify(enquiries.slice(-20)));

    note.textContent = `Thank you, ${data.name}. Your ${String(data.interest).toLowerCase()} enquiry has been recorded on this device. Secure online delivery will be connected when HM Foundation's official backend is activated.`;
    note.classList.add('success');
    form.reset();
    note.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  form.addEventListener('input', () => {
    note.classList.remove('success');
  });
}

// Reveal content progressively without compromising accessibility.
const revealTargets = document.querySelectorAll('.program-card, .values-grid article, .metric-grid div, .involve-grid article, .donate-box, .contact-form');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  revealTargets.forEach(el => el.classList.add('reveal'));
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach(el => revealObserver.observe(el));
}

// Responsive utility: close the mobile menu when returning to desktop.
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) closeMenu();
});

// Accessible back-to-top control.
const topButton = document.createElement('button');
topButton.className = 'back-to-top';
topButton.type = 'button';
topButton.setAttribute('aria-label', 'Back to top');
topButton.textContent = '↑';
document.body.appendChild(topButton);
topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
window.addEventListener('scroll', () => topButton.classList.toggle('show', window.scrollY > 650), { passive: true });
