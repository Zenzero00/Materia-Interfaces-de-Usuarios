/* script.js - Plantilla clásica (Vanilla JS) con print-mode para PDF (texto real) */

(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  /* Display logged-in user name */
  (function displayUserName() {
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      const firstName = session.firstName || 'Usuario';
      const lastName = session.lastName || '';
      const fullName = firstName + (lastName ? ' ' + lastName : '');

      const userNameEl = $('#cv-user-name');
      if (userNameEl) {
        userNameEl.textContent = fullName;
      }

      // Also pre-fill the CV form with user data
      if (session.firstName && $('#nombre')) {
        $('#nombre').value = session.firstName;
      }
      if (session.lastName && $('#apellidos')) {
        $('#apellidos').value = session.lastName;
      }
      if (session.email && $('#correo')) {
        $('#correo').value = session.email;
      }
    } catch (e) {
      console.warn('No se pudo cargar la sesión del usuario:', e);
    }
  })();

  /* Quill for Perfil and dynamic blocks */
  const quillProfile = new Quill('#perfilEditor', {
    theme: 'snow',
    modules: { toolbar: [['bold', 'italic', 'underline'], [{ list: 'bullet' }], ['link']] }
  });
  const quillMap = new Map();

  /* months and years for selects */
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const years = [];
  for (let y = 1950; y <= 2035; y++) years.push(y);

  /* Photo modal & upload */
  const photoBox = $('#photoBox');
  const photoPreview = $('#photoPreview');
  const photoModal = new bootstrap.Modal($('#photoModal'));
  const dropZone = $('#dropZone');
  const modalFile = $('#modalFile');
  const chooseFile = $('#chooseFile');

  function setPhoto(src) {
    if (!src) return;
    photoPreview.src = src;
    photoBox.classList.add('has-photo');
    const cvp = $('#cvPhotoClassic'); if (cvp) cvp.src = src;
  }

  if (photoBox) {
    photoBox.addEventListener('click', () => photoModal.show());
    photoBox.addEventListener('keypress', e => { if (e.key === 'Enter' || e.key === ' ') photoModal.show(); });
  }

  if (chooseFile && modalFile) {
    chooseFile.addEventListener('click', () => modalFile.click());
    modalFile.addEventListener('change', e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = ev => { setPhoto(ev.target.result); photoModal.hide(); };
      r.readAsDataURL(f);
    });
  }

  if (dropZone) {
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragging'); });
    dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.classList.remove('dragging'); });
    dropZone.addEventListener('drop', e => {
      e.preventDefault(); dropZone.classList.remove('dragging');
      const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = ev => { setPhoto(ev.target.result); photoModal.hide(); };
      r.readAsDataURL(f);
    });
  }

  /* Basic sync for personal fields */
  function syncBasics() {
    if ($('#pNombre')) $('#pNombre').textContent = ($('#nombre')?.value || '') + ' ' + ($('#apellidos')?.value || '');
    if ($('#pApellidos')) $('#pApellidos').textContent = $('#apellidos')?.value || '';
    if ($('#pCorreo')) $('#pCorreo').textContent = $('#correo')?.value || '';
    if ($('#pTelefono')) $('#pTelefono').textContent = $('#telefono')?.value || '';
    if ($('#pDireccion')) $('#pDireccion').textContent = $('#direccion')?.value || '';
    if ($('#pCodigo')) $('#pCodigo').textContent = $('#codigoPostal')?.value || '';
    if ($('#pLocalidad')) $('#pLocalidad').textContent = $('#localidad')?.value || '';
  }

  ['#nombre', '#apellidos', '#correo', '#telefono', '#direccion', '#codigoPostal', '#localidad'].forEach(sel => {
    const el = document.querySelector(sel); if (el) el.addEventListener('input', syncBasics);
  });

  /* Dynamic blocks: formacion, experiencia, idiomas, habilidades */
  let counter = 0;
  function uid(prefix) { return prefix + (++counter); }

  function createMonthSelect(namePrefix, suffix) {
    const wrap = document.createElement('div');
    wrap.className = 'd-flex gap-2';
    const selM = document.createElement('select'); selM.className = 'form-select fld'; selM.name = namePrefix + '_mes' + (suffix || '');
    const selY = document.createElement('select'); selY.className = 'form-select fld'; selY.name = namePrefix + '_anio' + (suffix || '');
    months.forEach((m, i) => { const o = document.createElement('option'); o.value = i + 1; o.textContent = m; selM.appendChild(o); });
    years.forEach(y => { const o = document.createElement('option'); o.value = y; o.textContent = y; selY.appendChild(o); });
    wrap.appendChild(selM); wrap.appendChild(selY);
    return wrap;
  }

  function createFormacion() {
    const id = uid('form_');
    const wrap = document.createElement('div'); wrap.className = 'item-panel';
    wrap.innerHTML = `
      <div class="item-header">
        <strong>Formación</strong>
        <div>
          <button class="btn btn-sm btn-outline-success btn-done">✔</button>
          <button class="btn btn-sm btn-outline-danger btn-remove">🗑</button>
        </div>
      </div>
      <input class="form-control mb-2 fld" placeholder="Formación (ej. Ingeniero en Computación)">
      <input class="form-control mb-2 fld" placeholder="Institución">
      <input class="form-control mb-2 fld" placeholder="Localidad">
      <label class="form-label small mb-1">Fecha inicio</label>
      <div class="mb-2" data-start></div>
      <label class="form-label small mb-1">Fecha fin</label>
      <div class="mb-2" data-end></div>
      <div id="${id}" class="quill-small"></div>
    `;
    const startSlot = wrap.querySelector('[data-start]');
    const endSlot = wrap.querySelector('[data-end]');
    startSlot.appendChild(createMonthSelect('start', '_' + id));
    endSlot.appendChild(createMonthSelect('end', '_' + id));
    $('#formacion').appendChild(wrap);

    const q = new Quill('#' + id, { theme: 'snow', modules: { toolbar: [['bold', 'italic'], ['link'], [{ list: 'bullet' }]] } });
    quillMap.set(id, q);
    attachItemEvents(wrap, id);
  }

  function createExperiencia() {
    const id = uid('exp_');
    const wrap = document.createElement('div'); wrap.className = 'item-panel';
    wrap.innerHTML = `
      <div class="item-header">
        <strong>Experiencia</strong>
        <div>
          <button class="btn btn-sm btn-outline-success btn-done">✔</button>
          <button class="btn btn-sm btn-outline-danger btn-remove">🗑</button>
        </div>
      </div>
      <input class="form-control mb-2 fld" placeholder="Puesto">
      <input class="form-control mb-2 fld" placeholder="Empleador">
      <input class="form-control mb-2 fld" placeholder="Localidad">
      <label class="form-label small mb-1">Fecha inicio</label>
      <div class="mb-2" data-start></div>
      <label class="form-label small mb-1">Fecha fin</label>
      <div class="mb-2" data-end></div>
      <div id="${id}" class="quill-small"></div>
    `;
    const startSlot = wrap.querySelector('[data-start]');
    const endSlot = wrap.querySelector('[data-end]');
    startSlot.appendChild(createMonthSelect('start', '_' + id));
    endSlot.appendChild(createMonthSelect('end', '_' + id));
    $('#experiencia').appendChild(wrap);

    const q = new Quill('#' + id, { theme: 'snow', modules: { toolbar: [['bold', 'italic'], ['link'], [{ list: 'bullet' }]] } });
    quillMap.set(id, q);
    attachItemEvents(wrap, id);
  }

  function createIdioma() {
    const wrap = document.createElement('div'); wrap.className = 'item-panel';
    wrap.innerHTML = `
      <div class="item-header">
        <strong>Idioma</strong>
        <div><button class="btn btn-sm btn-outline-danger btn-remove">🗑</button></div>
      </div>
      <div class="row gx-2">
        <div class="col"><input class="form-control fld" placeholder="Idioma (ej. Español)"></div>
        <div class="col">
          <select class="form-select fld">
            <option>Principiante</option><option>Bajo</option><option>Medio</option><option>Alto</option><option>Nativo</option>
          </select>
        </div>
      </div>
    `;
    $('#idiomas').appendChild(wrap);
    attachItemEvents(wrap, null);
  }

  function createHabilidad() {
    const wrap = document.createElement('div'); wrap.className = 'item-panel';
    wrap.innerHTML = `
      <div class="item-header">
        <strong>Habilidad</strong>
        <div><button class="btn btn-sm btn-outline-danger btn-remove">🗑</button></div>
      </div>
      <div class="row gx-2">
        <div class="col"><input class="form-control fld" placeholder="Habilidad (ej. Git)"></div>
        <div class="col">
          <select class="form-select fld">
            <option>Principiante</option><option>Bajo</option><option>Medio</option><option>Alto</option><option>Nativo</option>
          </select>
        </div>
      </div>
    `;
    $('#habilidades').appendChild(wrap);
    attachItemEvents(wrap, null);
  }

  function attachItemEvents(node, quillId) {
    const rem = node.querySelector('.btn-remove'); if (rem) rem.addEventListener('click', () => { node.remove(); updatePreview(); });
    const done = node.querySelector('.btn-done'); if (done) done.addEventListener('click', () => node.classList.toggle('collapsed'));
    node.querySelectorAll('.fld').forEach(f => f.addEventListener('input', updatePreview));
    if (quillId && quillMap.has(quillId)) quillMap.get(quillId).on('text-change', updatePreview);
  }

  // wire add buttons
  Array.from(document.querySelectorAll('.add-btn')).forEach(b => {
    b.addEventListener('click', e => {
      const t = e.currentTarget.dataset.target;
      if (t === 'formacion') createFormacion();
      if (t === 'experiencia') createExperiencia();
      if (t === 'idiomas') createIdioma();
      if (t === 'habilidades') createHabilidad();
    });
  });

  /* Preview update (classic) */
  function escapeHtml(s) { if (!s) return ''; return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]); }

  function fmtDate(prefix, suffix) {
    const selM = document.querySelector(`select[name="${prefix}_mes${suffix}"]`);
    const selY = document.querySelector(`select[name="${prefix}_anio${suffix}"]`);
    if (!selM || !selY) return '';
    const m = months[parseInt(selM.value, 10) - 1] || '';
    const y = selY.value || '';
    return (m && y) ? `${m} ${y}` : '';
  }

  function updatePreview() {
    // perfil
    const pHtml = quillProfile.root.innerHTML || '';
    const pTarget = $('#cvPerfilClassic'); if (pTarget) pTarget.innerHTML = pHtml;

    // formacion
    const fTarget = $('#cvFormacionClassic'); if (fTarget) fTarget.innerHTML = '';
    document.querySelectorAll('#formacion .item-panel').forEach(node => {
      const f = node.querySelectorAll('.fld');
      const title = f[0]?.value || '';
      const inst = f[1]?.value || '';
      const loc = f[2]?.value || '';
      const suffix = '_' + (node.querySelector('.quill-small')?.id || '');
      const start = fmtDate('start', suffix);
      const end = fmtDate('end', suffix);
      const qid = node.querySelector('.quill-small')?.id || null;
      const qhtml = qid && quillMap.has(qid) ? quillMap.get(qid).root.innerHTML : '';
      const d = document.createElement('div');
      d.innerHTML = `<div class="d-flex"><div style="min-width:120px;font-weight:700">${escapeHtml(start)} – ${escapeHtml(end)}</div><div style="flex:1"><strong>${escapeHtml(title)}</strong><div class="text-muted small">${escapeHtml(inst)}${loc ? ', ' + escapeHtml(loc) : ''}</div><div>${qhtml}</div></div></div><hr>`;
      fTarget.appendChild(d);
    });

    // experiencia
    const eTarget = $('#cvExperienciaClassic'); if (eTarget) eTarget.innerHTML = '';
    document.querySelectorAll('#experiencia .item-panel').forEach(node => {
      const f = node.querySelectorAll('.fld');
      const puesto = f[0]?.value || '';
      const empresa = f[1]?.value || '';
      const lugar = f[2]?.value || '';
      const suffix = '_' + (node.querySelector('.quill-small')?.id || '');
      const start = fmtDate('start', suffix);
      const end = fmtDate('end', suffix);
      const qid = node.querySelector('.quill-small')?.id || null;
      const qhtml = qid && quillMap.has(qid) ? quillMap.get(qid).root.innerHTML : '';
      const d = document.createElement('div');
      d.innerHTML = `<div class="d-flex"><div style="min-width:120px;font-weight:700">${escapeHtml(start)} – ${escapeHtml(end)}</div><div style="flex:1"><strong>${escapeHtml(puesto)}</strong><div class="text-muted small">${escapeHtml(empresa)}${lugar ? ', ' + escapeHtml(lugar) : ''}</div><div>${qhtml}</div></div></div><hr>`;
      eTarget.appendChild(d);
    });

    // habilidades
    const hTarget = $('#cvHabilidadesClassic'); if (hTarget) hTarget.innerHTML = '';
    document.querySelectorAll('#habilidades .item-panel').forEach(node => {
      const hab = node.querySelectorAll('.fld')[0]?.value || '';
      const niv = node.querySelectorAll('.fld')[1]?.value || '';
      const div = document.createElement('div'); div.textContent = `${hab} — ${niv}`; hTarget.appendChild(div);
    });

    // basics
    syncBasics();
  }

  // poll for quill content
  setInterval(updatePreview, 700);

  /* Color switching */
  Array.from(document.querySelectorAll('.color-swatch')).forEach(btn => btn.addEventListener('click', e => {
    const color = e.currentTarget.dataset.color;
    document.documentElement.style.setProperty('--accent', color);
    Array.from(document.querySelectorAll('.classic-accent')).forEach(el => el.style.background = color);
    Array.from(document.querySelectorAll('.section-title')).forEach(el => el.style.background = color);
    Array.from(document.querySelectorAll('.data-header')).forEach(el => el.style.background = color);
  }));

  /* Print-to-PDF using print-mode (same window) to ensure selectable text without popups */
  const downloadBtn = $('#download');
  if (downloadBtn) downloadBtn.addEventListener('click', () => {
    updatePreview(); // ensure latest content
    // Toggle print-mode class to hide UI and show only .cv-classic
    document.body.classList.add('print-mode');
    // allow styles to apply
    setTimeout(() => {
      window.print();
      // slight delay to ensure print dialog opened before removing mode
      setTimeout(() => document.body.classList.remove('print-mode'), 500);
    }, 250);
  });

  /* Seed initial blocks */
  createFormacion();
  createExperiencia();
  createIdioma();
  createHabilidad();
  setTimeout(updatePreview, 300);

})();
