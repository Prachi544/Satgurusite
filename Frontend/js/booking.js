/* =========================================================
   Panditji Online — shared front-end behaviour
   1) Mobile nav toggle
   2) Book Pandit modal (open / close / prefill puja type)
   3) Form submit -> sends booking to backend, which emails
      the pandit. Backend endpoint: POST /api/book-pandit
      (Not built yet — see the note at the bottom of this file.)
========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  /* ---------- Book Pandit modal ---------- */
  var overlay = document.getElementById('book-modal');
  var openButtons = document.querySelectorAll('[data-open-booking]');
  var closeButtons = document.querySelectorAll('[data-close-booking]');
  var pujaTypeSelect = document.getElementById('puja-type');

  function openModal(prefillValue) {
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (prefillValue && pujaTypeSelect) {
      pujaTypeSelect.value = prefillValue;
    }
    var firstField = overlay.querySelector('input, select');
    if (firstField) firstField.focus();
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  openButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal(btn.getAttribute('data-open-booking') || '');
    });
  });

  closeButtons.forEach(function (btn) {
    btn.addEventListener('click', closeModal);
  });

  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ---------- Form submit ---------- */
  var form = document.getElementById('booking-form');
  var statusEl = document.getElementById('booking-status');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var submitBtn = form.querySelector('.btn-submit');
      var data = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        pujaType: form.pujaType.value,
        date: form.date.value,
        city: form.city.value.trim(),
        message: form.message.value.trim()
      };

      if (!data.name || !data.phone || !data.pujaType || !data.date) {
        statusEl.dataset.state = 'error';
        statusEl.textContent = 'Please fill in name, phone, puja type and date.';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending request...';
      statusEl.dataset.state = '';
      statusEl.textContent = '';

      try {
        // TODO: replace with your live backend URL once deployed,
        // e.g. https://panditji-api.onrender.com/api/book-pandit
        var response = await fetch('/api/book-pandit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Server responded with an error');

        statusEl.dataset.state = 'success';
        statusEl.textContent = 'Request sent! The pandit has been notified and will contact you shortly.';
        form.reset();
        setTimeout(closeModal, 2200);

      } catch (err) {
        // Backend isn't live yet during early development —
        // show a friendly demo confirmation instead of a hard error.
        console.warn('Booking API not reachable yet:', err.message);
        statusEl.dataset.state = 'success';
        statusEl.textContent = 'Request received (demo mode — connect the backend to send real emails).';
        form.reset();
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Booking Request';
      }
    });
  }
});
