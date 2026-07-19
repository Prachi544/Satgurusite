
document.addEventListener('DOMContentLoaded', function () {

  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

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
        var response = await fetch('https://backend-39jo.onrender.com/api/book-pandit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          var errorData = await response.json().catch(function () { return {}; });
          throw new Error(errorData.error || 'Server responded with an error');
        }

        statusEl.dataset.state = 'success';
        statusEl.textContent = 'Request sent! The pandit has been notified and will contact you shortly.';
        form.reset();
        setTimeout(closeModal, 2200);

      } catch (err) {
        console.error('Booking error:', err);
        statusEl.dataset.state = 'error';
        statusEl.textContent = err.message || 'Something went wrong. Please check your connection and try again.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Booking Request';
      }
    });
  }
});