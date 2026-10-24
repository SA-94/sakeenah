// جمعية سكينة — تفاعلات الموقع
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ظل الهيدر عند النزول
  const header = document.querySelector('.header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // الوضع الليلي والنهاري
  const themeBtn = document.querySelector('.theme-toggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const applyTheme = (t) => {
    document.documentElement.setAttribute('data-theme', t);
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(t === 'dark'));
      themeBtn.setAttribute('aria-label', t === 'dark' ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي');
    }
    if (themeMeta) themeMeta.setAttribute('content', t === 'dark' ? '#0E1A14' : '#00683A');
  };
  applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(t);
    try { localStorage.setItem('theme', t); } catch (e) { /* التخزين غير متاح: يبقى الاختيار لهذه الزيارة */ }
  });

  // قائمة الجوال
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');
  if (burger && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      document.documentElement.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    };
    burger.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  // ظهور العناصر عند الوصول إليها، مع تدرّج بسيط بين عناصر المجموعة الواحدة
  const reveals = [...document.querySelectorAll('.reveal')];
  reveals.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    const i = siblings.indexOf(el);
    if (i > 0 && !el.style.getPropertyValue('--d')) el.style.setProperty('--d', `${Math.min(i, 5) * 80}ms`);
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  // عدّاد الأرقام
  const counters = document.querySelectorAll('[data-count]');
  const fmt = new Intl.NumberFormat('en-US');
  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = fmt.format(target); return; }
    const start = performance.now();
    const dur = 1600;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt.format(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        cio.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  // دقيقة سكينة: أربع دورات من شهيق 4 ثم حبس 4 ثم زفير 6
  const breathBtn = document.querySelector('.breath-btn');
  const circle = document.querySelector('.breath-circle');
  const word = document.querySelector('.breath-word');
  const count = document.querySelector('.breath-count');
  if (breathBtn && circle && word && count) {
    const phases = [
      { label: 'شهيق', secs: 4, scale: 1 },
      { label: 'احبس', secs: 4, scale: 1 },
      { label: 'زفير', secs: 6, scale: 0.62 },
    ];
    const ROUNDS = 4;
    let timer = null;
    const setCircle = (scale, secs) => {
      if (reduceMotion) return;
      circle.style.transitionDuration = `${secs}s`;
      circle.style.transform = `scale(${scale})`;
    };
    const stop = (label, note) => {
      clearTimeout(timer);
      timer = null;
      breathBtn.textContent = 'ابدأ الدقيقة';
      word.textContent = label;
      count.textContent = note;
      setCircle(0.62, 1.2);
    };
    const run = (round, index, remaining) => {
      const phase = phases[index];
      if (remaining === phase.secs) {
        word.textContent = phase.label;
        setCircle(phase.scale, phase.secs);
      }
      count.textContent = `${remaining} · الدورة ${round} من ${ROUNDS}`;
      timer = setTimeout(() => {
        if (remaining > 1) return run(round, index, remaining - 1);
        if (index + 1 < phases.length) return run(round, index + 1, phases[index + 1].secs);
        if (round < ROUNDS) return run(round + 1, 0, phases[0].secs);
        stop('أحسنت', 'عُد إلى هذه الدقيقة متى احتجتها.');
      }, 1000);
    };
    breathBtn.addEventListener('click', () => {
      if (timer) return stop('جاهز؟', 'شهيق 4 · احبس 4 · زفير 6');
      breathBtn.textContent = 'إيقاف';
      run(1, 0, phases[0].secs);
    });
  }

  // التبرع: النسخ، ومجال التبرع، ورسالة الإيصال، والبطاقة
  const toast = document.querySelector('.toast');
  let toastTimer = null;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
  };
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      if (!ok) throw new Error('copy failed');
    }
  };
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const what = btn.dataset.copyLabel || 'النص';
      try {
        await copyText(btn.dataset.copy);
        showToast(`تم نسخ ${what}`);
        const label = btn.querySelector('span');
        if (label) {
          const old = label.textContent;
          label.textContent = 'تم النسخ';
          setTimeout(() => { label.textContent = old; }, 2200);
        }
      } catch {
        showToast(`تعذّر النسخ، انسخ ${what} يدويًا`);
      }
    });
  });

  const purposes = [...document.querySelectorAll('.purpose')];
  const receipt = document.querySelector('.receipt-link');
  const setPurpose = (name) => {
    purposes.forEach((b) => {
      const on = b.textContent.trim() === name;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', String(on));
    });
    if (receipt) {
      const msg = `السلام عليكم، حوّلت تبرعًا لجمعية سكينة (المجال: ${name})، وهذا إيصال التحويل.`;
      receipt.href = `https://wa.me/966539690899?text=${encodeURIComponent(msg)}`;
    }
  };
  purposes.forEach((b) => b.addEventListener('click', () => setPurpose(b.textContent.trim())));
  if (purposes.length) {
    // donate.html?purpose=... يختار المجال القادم من صفحة أخرى
    const wanted = new URLSearchParams(location.search).get('purpose');
    const match = purposes.find((b) => b.textContent.trim() === wanted);
    setPurpose((match || purposes[0]).textContent.trim());
  }
  document.querySelectorAll('[data-purpose]').forEach((a) => {
    a.addEventListener('click', () => setPurpose(a.dataset.purpose));
  });

  const card = document.querySelector('.bank-card');
  const flipBtn = document.querySelector('.flip-btn');
  if (card) {
    let flipping = false;
    const flip = () => {
      flipping = true;
      card.classList.remove('is-tilting');
      setTimeout(() => { flipping = false; }, 900);
      const on = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', String(on));
    };
    card.addEventListener('click', flip);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
    if (flipBtn) flipBtn.addEventListener('click', flip);

    // ميلان ثلاثي الأبعاد مع لمعة تتبع المؤشر (للماوس فقط)
    const canTilt = !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (canTilt) {
      const stage = card.parentElement;
      stage.addEventListener('pointermove', (e) => {
        if (flipping) return;
        const r = card.getBoundingClientRect();
        const x = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
        const y = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
        const dir = card.classList.contains('is-flipped') ? -1 : 1;
        card.classList.add('is-tilting');
        card.style.setProperty('--ry', `${(x - 0.5) * 22 * dir}deg`);
        card.style.setProperty('--rx', `${(0.5 - y) * 16}deg`);
        card.style.setProperty('--gx', `${x * 100}%`);
        card.style.setProperty('--gy', `${y * 100}%`);
      });
      stage.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.removeProperty('--rx');
        card.style.removeProperty('--ry');
        card.style.setProperty('--gx', '30%');
        card.style.setProperty('--gy', '20%');
      });
    }
  }

  // التبويبات (تدعم أكثر من مجموعة في الصفحة، والرابط المباشر مثل governance.html#reports)
  document.querySelectorAll('.gtabs').forEach((tablist) => {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
      history.replaceState(null, '', '#' + tab.id.slice(4));
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        // RTL: السهم الأيسر يتقدم
        const step = { ArrowLeft: 1, ArrowRight: -1 }[e.key];
        if (step) { e.preventDefault(); select(tabs[(i + step + tabs.length) % tabs.length], true); }
        if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
        if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
      });
    });
    // يفتح التبويب من الرابط عند التحميل، وعند الضغط على رابط داخل نفس الصفحة (مثل روابط الفوتر)
    const openFromHash = () => {
      const t = document.getElementById('tab-' + location.hash.slice(1));
      if (t && tabs.includes(t)) {
        select(t);
        tablist.scrollIntoView({ block: 'start' });
      }
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    // رابط لنفس التبويب المفتوح لا يغيّر العنوان، فنرجع للتبويبات يدويًا
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href*="#"]');
      if (!a || a.pathname !== location.pathname || a.hash !== location.hash) return;
      const t = document.getElementById('tab-' + a.hash.slice(1));
      if (t && tabs.includes(t)) { e.preventDefault(); openFromHash(); }
    });
  });

  // عارض الوثائق داخل الصفحة (PDF.js يُحمَّل عند أول فتح فقط)
  const viewer = document.querySelector('.viewer');
  if (viewer && typeof viewer.showModal === 'function') {
    const CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/';
    const body = viewer.querySelector('.viewer-body');
    const info = viewer.querySelector('.viewer-info');
    let lib, task, io, opener, token = 0;

    const loadLib = () => lib ? Promise.resolve(lib) : new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = CDN + 'build/pdf.min.js';
      s.onload = () => { lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = CDN + 'build/pdf.worker.min.js'; ok(lib); };
      s.onerror = fail;
      document.head.append(s);
    });

    const renderPage = async (pdf, el, my) => {
      const page = await pdf.getPage(+el.dataset.n);
      if (my !== token) return;
      const base = page.getViewport({ scale: 1 });
      const vp = page.getViewport({ scale: (el.clientWidth / base.width) * Math.min(window.devicePixelRatio || 1, 2) });
      const c = document.createElement('canvas');
      c.width = vp.width; c.height = vp.height;
      c.setAttribute('role', 'img');
      c.setAttribute('aria-label', 'صفحة ' + el.dataset.n);
      await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      if (my === token) el.append(c);
    };

    const fail = (url) => {
      body.innerHTML = '';
      const p = document.createElement('p');
      p.className = 'viewer-msg';
      p.innerHTML = 'تعذّر عرض الوثيقة هنا. <a target="_blank" rel="noopener">افتحها في نافذة جديدة</a>';
      p.querySelector('a').href = url;
      body.append(p);
    };

    const open = async (url, title) => {
      const my = ++token;
      viewer.querySelector('#viewer-title').textContent = title;
      viewer.querySelector('.viewer-open').href = url;
      viewer.querySelector('.viewer-dl').href = url;
      info.textContent = '';
      body.innerHTML = '<p class="viewer-msg">جارٍ تحميل الوثيقة…</p>';
      viewer.showModal();
      document.documentElement.classList.add('viewer-on');
      try {
        const pdfjs = await loadLib();
        task = pdfjs.getDocument({ url, cMapUrl: CDN + 'cmaps/', cMapPacked: true, standardFontDataUrl: CDN + 'standard_fonts/' });
        const pdf = await task.promise;
        if (my !== token) return;
        const first = (await pdf.getPage(1)).getViewport({ scale: 1 });
        const n = pdf.numPages;
        info.textContent = n === 1 ? 'صفحة واحدة' : n === 2 ? 'صفحتان' : n + (n <= 10 ? ' صفحات' : ' صفحة');
        body.innerHTML = '';
        io = new IntersectionObserver((entries) => entries.forEach((en) => {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          renderPage(pdf, en.target, my).catch(() => {});
        }), { root: body, rootMargin: '800px 0px' });
        for (let n = 1; n <= pdf.numPages; n++) {
          const el = document.createElement('div');
          el.className = 'viewer-page';
          el.dataset.n = n;
          el.style.aspectRatio = first.width + ' / ' + first.height;
          body.append(el);
          io.observe(el);
        }
        body.scrollTop = 0;
      } catch (err) {
        if (my === token) fail(url);
      }
    };

    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-view]');
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      opener = a;
      open(a.getAttribute('href'), a.dataset.title || a.textContent.trim());
    });
    viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
    viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
    viewer.addEventListener('close', () => {
      token++;
      if (io) io.disconnect();
      if (task) task.destroy();
      body.innerHTML = '';
      document.documentElement.classList.remove('viewer-on');
      if (opener) opener.focus();
    });
  }
})();
