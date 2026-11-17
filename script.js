/* ==========================================================================
   PTˣ Physiotherapy: shared JavaScript (no libraries needed)
   1 Config · 2 Mobile navigation · 3 FAQ accordions · 4 Condition filters
   5 Appointment finder · 6 Footer year
   ========================================================================== */
(function () {
  'use strict';

  /* 1. CONFIG: edit these values; the rest of the file reads from here ---- */
  var CONFIG = {
    email: 'joe@ptxphysio.co.uk',
    bookingPage: 'book.html',        // where the finder's button sends people (your Cliniko page)
    clinikoUrl: 'https://ptx-physiotherapy.uk3.cliniko.com/bookings?embedded=true',   // public Cliniko booking link (safe to share; never put an API key here)
    prices: { initial: '£68', followUp: '£55', block: '£195' }   // introductory rates
  };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* 2. MOBILE NAVIGATION ------------------------------------------------- */
  var toggle = $('.menu-toggle');
  var nav = $('#site-nav');
  function closeNav() {
    if (!nav) return;
    nav.classList.remove('open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', closeNav); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  }
  // Mark the current page in the navigation (for accessibility and styling)
  var here = location.pathname.split('/').pop() || 'index.html';
  $$('.nav a').forEach(function (a) {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });

  /* 3. FAQ ACCORDIONS: one open at a time -------------------------------- */
  $$('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      $$('.faq-q').forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
        document.getElementById(b.getAttribute('aria-controls')).hidden = true;
      });
      if (!expanded) {
        btn.setAttribute('aria-expanded', 'true');
        document.getElementById(btn.getAttribute('aria-controls')).hidden = false;
      }
    });
  });

  /* 4. CONDITION FILTER TABS ---------------------------------------------
     Buttons:  <button class="filter-btn" data-filter="sports">
     Cards:    <a class="card" data-category="sports"> (data-filter="all" shows everything) */
  var filterBtns = $$('.filter-btn');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      $$('[data-category]').forEach(function (card) {
        card.hidden = !(f === 'all' || card.getAttribute('data-category').split(' ').indexOf(f) !== -1);
      });
    });
  });

  /* 5. TWO-CLICK APPOINTMENT FINDER -------------------------------------- */
  var finder = $('[data-finder]');
  if (finder) {
    var APPTS = {
      initial: { name: 'Initial Physiotherapy Assessment', mins: '60 mins', price: CONFIG.prices.initial,
        covers: 'Your full story, a movement and hands-on assessment, a clear explanation of what is going on, a tailored plan and your first treatment.' },
      followUp: { name: 'Follow-Up Session', mins: '45 mins', price: CONFIG.prices.followUp,
        covers: 'Hands-on treatment, exercise progression and a review of how you are getting on.' }
    };
    var notes = {
      newPatient: 'Everything starts with an initial assessment. Any further sessions are agreed with you afterwards.',
      returningPain: 'A new problem usually needs a fresh assessment, so book an initial assessment.',
      returningRehab: 'Planning several sessions? Ask about the block of 4 follow-ups (' + CONFIG.prices.block + ').',
      returningActive: 'Book a follow-up and we will keep building your plan.'
    };
    var picks = {};
    var out = $('[data-finder-result]', finder);

    $$('.opt', finder).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var q = btn.getAttribute('data-q');
        picks[q] = btn.getAttribute('data-v');
        $$('.opt[data-q="' + q + '"]', finder).forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        if (picks.who && picks.goal) render();
      });
    });

    function render() {
      var isNew = picks.who === 'new';
      var key = (isNew || picks.goal === 'pain') ? 'initial' : 'followUp';
      var a = APPTS[key];
      var note = isNew ? notes.newPatient
        : picks.goal === 'pain' ? notes.returningPain
        : picks.goal === 'rehab' ? notes.returningRehab : notes.returningActive;
      out.innerHTML =
        '<div class="result-card">' +
        '<p class="eyebrow">We recommend</p>' +
        '<h3>' + a.name + ' · ' + a.mins + '</h3>' +
        '<p class="price">' + a.price + ' introductory rate</p>' +
        '<p><strong>What it covers:</strong> ' + a.covers + '</p>' +
        '<p>' + note + '</p>' +
        '<a class="btn btn-gold" href="' + ((here === CONFIG.bookingPage) ? '#booking' : CONFIG.bookingPage) + '">Book this appointment</a>' +
        '<p class="micro">Still unsure? <a href="mailto:' + CONFIG.email + '?subject=Which%20appointment%20should%20I%20book%3F">Ask me a quick question</a>.</p>' +
        '</div>';
    }
  }


  /* 5b. BOOKING PAGE: Cliniko embed, with a request form as the fallback --
     If CONFIG.clinikoUrl is set, the embed shows and the request form is hidden. */
  var embed = $('#cliniko-embed');
  var reqForm = $('#request-form');
  if (embed && CONFIG.clinikoUrl) {
    var frame = document.createElement('iframe');
    frame.id = 'cliniko-booking-frame';
    frame.title = 'Book online with PTˣ Physiotherapy';
    frame.src = CONFIG.clinikoUrl;
    frame.setAttribute('scrolling', 'auto');
    frame.setAttribute('allow', 'payment');
    frame.style.height = '1000px';
    embed.appendChild(frame);
    if (reqForm) reqForm.hidden = true;

    // Cliniko tells the page how tall its booking form is, so the iframe resizes to fit.
    window.addEventListener('message', function (e) {
      var host = '';
      try { host = new URL(e.origin).hostname; } catch (err) { return; }
      if (!/\.cliniko\.com$/.test(host) || typeof e.data !== 'string') return;   // only trust Cliniko
      if (e.data.indexOf('cliniko-bookings-resize') > -1) frame.style.height = Number(e.data.split(':')[1]) + 'px';
      if (e.data.indexOf('cliniko-bookings-page') > -1) frame.scrollIntoView();
    });
  } else if (embed) {
    embed.hidden = true;
  }
  var bookingForm = $('#booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { return (document.getElementById(id).value || '').trim(); };
      var body = [
        'BOOKING REQUEST', '',
        'Name: ' + v('f-name'),
        'Date of birth: ' + v('f-dob'),
        'Address: ' + v('f-address') + ', ' + v('f-postcode'),
        'Telephone: ' + v('f-phone'),
        'Email: ' + v('f-email'),
        'Appointment: ' + v('f-type'),
        'Preferred times: ' + (v('f-times') || 'Not specified'), '',
        'Problem: ' + v('f-issue'), '',
        'Consent given for PTˣ to use these details to arrange my appointment: Yes'
      ].join('\n');
      location.href = 'mailto:' + CONFIG.email +
        '?subject=' + encodeURIComponent('PTˣ booking request from ' + v('f-name')) +
        '&body=' + encodeURIComponent(body);
    });
  }

  /* 6. FOOTER YEAR ------------------------------------------------------- */
  var yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
