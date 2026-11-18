/* Tickmark Talent — interactions & scroll animations */
(function () {
  const body = document.body;
  body.classList.remove('no-js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];

  /* ---------- Menu ---------- */
  const menuBtn = $('#menuBtn');
  menuBtn.addEventListener('click', () => {
    const o = body.classList.toggle('menu-open');
    menuBtn.textContent = o ? 'Close' : 'Menu'; menuBtn.setAttribute('aria-expanded', o);
  });
  $$('#overlay a').forEach(a => a.addEventListener('click', () => { body.classList.remove('menu-open'); menuBtn.textContent = 'Menu'; }));

  /* ---------- Practice panels ---------- */
  const panels = $$('.panel');
  const activate = p => panels.forEach(x => x.classList.toggle('active', x === p));
  panels.forEach(p => {
    p.addEventListener('mouseenter', () => fine && activate(p));
    p.addEventListener('click', () => activate(p));
    p.addEventListener('focus', () => activate(p));
  });

  /* ---------- Contact form ---------- */
  const lbl = $('#c4label');
  $$('.seg input').forEach(r => r.addEventListener('change', () => {
    lbl.textContent = r.value === 'cand' && r.checked ? 'Qualification & current role' : 'Firm & role to fill';
  }));
  $('#cform').addEventListener('submit', e => {
    e.preventDefault();
    const req = ['c1', 'c2']; let bad = 0;
    req.forEach(id => {
      const el = document.getElementById(id);
      const b = !el.value.trim() || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value));
      el.classList.toggle('bad', b); if (b) bad++;
    });
    const ok = $('#okmsg');
    if (bad) { ok.textContent = 'Please fill in your name and a valid email.'; return; }
    ok.textContent = `Thank you, ${$('#c1').value.trim().split(' ')[0]} — we'll be in touch within one working day.`;
    e.target.reset();
  });

  /* ---------- Videos: play when visible ---------- */
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting && !v.dataset.hold) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
  }), { threshold: 0.1 });
  $$('video').forEach(v => { v.muted = true; vio.observe(v); });

  /* ---------- Counters (rolling number) ---------- */
  $$('.odo').forEach(o => { o.innerHTML = '<span class="odo__in">0</span>'; });

  /* ---------- Draggable slider (works without GSAP too) ---------- */
  (function () {
    const slider = $('#slider'), track = $('#sliderTrack'), prog = $('#sliderProg');
    let x = 0, target = 0, start = 0, startX = 0, down = false, vel = 0, lastX = 0;
    const max = () => Math.max(0, track.scrollWidth - slider.clientWidth);
    const clamp = v => Math.min(0, Math.max(-max(), v));
    slider.addEventListener('pointerdown', e => { down = true; startX = e.clientX; start = target; lastX = e.clientX; slider.classList.add('grabbing'); slider.setPointerCapture(e.pointerId); });
    slider.addEventListener('pointermove', e => { if (!down) return; vel = e.clientX - lastX; lastX = e.clientX; target = clamp(start + (e.clientX - startX) * 1.1); });
    const up = () => { if (!down) return; down = false; slider.classList.remove('grabbing'); target = clamp(target + vel * 12); };
    slider.addEventListener('pointerup', up); slider.addEventListener('pointercancel', up);
    const step = () => (track.firstElementChild.offsetWidth + 22);
    $('#nextBtn').addEventListener('click', () => target = clamp(target - step()));
    $('#prevBtn').addEventListener('click', () => target = clamp(target + step()));
    (function loop() {
      x += (target - x) * 0.09;
      track.style.transform = `translate3d(${x}px,0,0)`;
      const m = max(); prog.style.transform = `scaleX(${m ? 0.15 + 0.85 * (-x / m) : 1})`;
      track.querySelectorAll('.pcard__img img').forEach(img => { img.style.transform = `scale(1.12) translateX(${(target - x) * 0.04}px)`; });
      requestAnimationFrame(loop);
    })();
    addEventListener('resize', () => { target = clamp(target); });
  })();

  /* ---------- Nav ---------- */
  const nav = $('#nav'); let lastY = 0;
  const navState = y => { nav.classList.toggle('solid', y > 40); nav.classList.toggle('hide', y > lastY && y > 400 && !body.classList.contains('menu-open')); lastY = y; };

  const loader = $('#loader');
  if (typeof gsap === 'undefined' || reduce) {
    loader.style.display = 'none'; body.classList.remove('loading');
    $$('.odo').forEach(o => o.querySelector('.odo__in').textContent = o.dataset.val);
    addEventListener('scroll', () => navState(scrollY), { passive: true });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    lenis.stop();
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); const t = id.length > 1 && document.querySelector(id);
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -10 }); }
    }));
  }
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => navState(s.scroll()) });

  /* ---------- Preloader: real asset progress → curtain ---------- */
  const imgs = $$('img').filter(i => i.loading !== 'lazy');
  let loaded = 0; const total = Math.max(imgs.length, 1);
  const counter = { v: 0 };
  const tick = () => { loaded++; gsap.to(counter, { v: Math.min(100, (loaded / total) * 100), duration: 0.6, ease: 'power2.out', onUpdate: paint }); };
  const paint = () => { $('#loadNum').textContent = Math.round(counter.v); gsap.set('#loadBar', { scaleX: counter.v / 100 }); };
  imgs.forEach(i => (i.complete ? tick() : (i.addEventListener('load', tick, { once: true }), i.addEventListener('error', tick, { once: true }))));
  if (!imgs.length) tick();
  let done = false;
  const finish = () => {
    if (done) return; done = true;
    gsap.to(counter, { v: 100, duration: 0.5, onUpdate: paint, onComplete: () => {
      gsap.timeline()
        .to('.loader__count, .loader__top, .loader__bar', { y: -40, opacity: 0, duration: 0.5, ease: 'power3.in' })
        .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' })
        .add(() => { loader.style.display = 'none'; body.classList.remove('loading'); lenis && lenis.start(); ScrollTrigger.refresh(); })
        .add(heroIntro(), '-=.55');
    } });
  };
  const minTime = new Promise(r => setTimeout(r, 1200));
  const assets = Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), ...imgs.map(i => i.complete ? 0 : new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }))]);
  Promise.all([minTime, assets]).then(finish);
  setTimeout(finish, 3500); // never keep visitors waiting
  // hard safety net (timer-based, independent of animation frames)
  setTimeout(() => {
    if (loader.style.display === 'none') return;
    loader.style.display = 'none'; body.classList.remove('loading'); lenis && lenis.start();
    gsap.set('.hero__h1 .ch, .tagline, .hero__lead, .hero__ctas, #heroArch', { clearProps: 'transform,opacity,clipPath' });
    ScrollTrigger.refresh();
  }, 6000);

  function heroIntro() {
    return gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from('.hero__h1 .ch', { yPercent: 120, skewY: 8, duration: 1.3, stagger: 0.07 })
      .fromTo('.gold-u', { '--u': 0 }, { '--u': 1, duration: 1, ease: 'power3.inOut' }, '-=.6')
      .from('.tagline, .hero__lead, .hero__ctas', { y: 30, opacity: 0, duration: 1, stagger: 0.08 }, '-=1.1')
      .from('#heroArch', { clipPath: 'inset(100% 0 0 0 round 999px 999px 18px 18px)', duration: 1.4, ease: 'expo.inOut' }, 0);
  }

  /* hero media: soft 3D parallax on pointer */
  if (fine) {
    const hero = $('#hero');
    const mx = gsap.quickTo('.hero__media', 'x', { duration: 1, ease: 'power3' }), my = gsap.quickTo('.hero__media', 'y', { duration: 1, ease: 'power3' });
    hero.addEventListener('pointermove', e => {
      const px = e.clientX / innerWidth - 0.5, py = e.clientY / innerHeight - 0.5;
      mx(px * 18); my(py * 14);
    });
  }
  /* hero scroll: video zoom */
  gsap.to('#heroArch video', { scale: 1, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('#heroSel', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__copy', { yPercent: -18, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- Magnetic buttons ---------- */
  if (fine) $$('.magnetic').forEach(b => {
    const qx = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), qy = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.3); qy((e.clientY - r.top - r.height / 2) * 0.4); });
    b.addEventListener('pointerleave', () => { qx(0); qy(0); });
  });

  /* ---------- Heading reveals ---------- */
  $$('.reveal-up').forEach(h => gsap.from(h, { yPercent: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } }));

  const mm = gsap.matchMedia();
  mm.add('(min-width: 1051px)', () => {
    /* ---------- Video-in-type: zoom through the letters ---------- */
    gsap.timeline({ scrollTrigger: { trigger: '#vtype', start: 'top top', end: '+=160%', pin: '.vtype__pin', scrub: 1, anticipatePin: 1 } })
      .fromTo('#vtypeMask', { scale: 1 }, { scale: 9, ease: 'power2.in' })
      .to('#vtypeMask', { opacity: 0, ease: 'none', duration: 0.35 }, '-=.35')
      .to('#vtypeCap', { opacity: 0, duration: 0.2 }, 0);

    /* ---------- Gallery converge: scattered → grid ---------- */
    const cims = $$('.cimg');
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#converge', start: 'top top', end: '+=140%', pin: '.converge__pin', scrub: 1, anticipatePin: 1 } });
    cims.forEach((c, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      tl.from(c, { x: (col - 1.5) * gsap.utils.random(260, 420), y: (row - 0.5) * gsap.utils.random(380, 560), rotate: gsap.utils.random(-24, 24), scale: gsap.utils.random(0.3, 0.6), opacity: 0, ease: 'power3.out' }, i * 0.04);
    });
    tl.from('#convTitle', { scale: 1.6, opacity: 0, ease: 'power2.out' }, 0);

    /* ---------- Method: number roller + step focus + video swap ---------- */
    const steps = $$('.mstep'), media = $('.method__media'), names = ['step_01.mp4', 'step_02.mp4', 'step_03.mp4', 'step_04.mp4'];
    steps.forEach((s, i) => ScrollTrigger.create({
      trigger: s, start: 'top 55%', end: 'bottom 55%',
      onToggle: st => {
        if (!st.isActive) return;
        steps.forEach(x => x.classList.toggle('on', x === s));
        gsap.to('#roller', { yPercent: -25 * i, duration: 0.9, ease: 'expo.out' });
        media.classList.toggle('v2', s.dataset.v === '2');
        $('#mName').textContent = names[i];
        const v = s.dataset.v === '2' ? $('#mVid2') : $('#mVid'); const p = v.play(); if (p && p.catch) p.catch(() => {});
      }
    }));
  });
  mm.add('(max-width: 1050px)', () => { $$('.mstep').forEach(s => s.classList.add('on')); });

  /* ---------- Gallery hover tilt (desktop) ---------- */
  if (fine) $$('.cimg').forEach(c => {
    c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); gsap.to(c, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * 10, rotateX: -((e.clientY - r.top) / r.height - 0.5) * 10, transformPerspective: 800, duration: 0.5 }); });
    c.addEventListener('pointerleave', () => gsap.to(c, { rotateX: 0, rotateY: 0, duration: 0.6 }));
  });

  /* ---------- Rolling counters ---------- */
  $$('.odo').forEach(o => {
    const el = o.querySelector('.odo__in'), to = +o.dataset.val, c = { v: 0 };
    ScrollTrigger.create({ trigger: o, start: 'top 85%', once: true, onEnter: () => {
      gsap.fromTo(el, { yPercent: 100 }, { yPercent: 0, duration: 0.9, ease: 'expo.out' });
      gsap.to(c, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(c.v); } });
    } });
  });
  gsap.from('.num', { y: 50, opacity: 0, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.ngrid', start: 'top 85%' } });

  /* ---------- Contact video: clip-path opens on scroll ---------- */
  gsap.to('#contactMedia', { clipPath: 'inset(0 0% 0 0% round 24px)', ease: 'none', scrollTrigger: { trigger: '#contactMedia', start: 'top 90%', end: 'bottom 60%', scrub: true } });

  /* ---------- Footer wordmark ---------- */
  gsap.from('.foot__word span', { yPercent: 100, duration: 1.2, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.foot', start: 'top 70%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
