/* CV Generator JavaScript */
(function () {
  'use strict';

  // Display logged-in user name
  (function displayUserName() {
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      const firstName = session.firstName || 'Usuario';
      const lastName = session.lastName || '';
      const fullName = firstName + (lastName ? ' ' + lastName : '');

      const userNameEl = document.getElementById('cv-user-name');
      if (userNameEl) userNameEl.textContent = fullName;

      // Pre-fill form with user data
      const nombreInput = document.getElementById('nombre');
      const apellidosInput = document.getElementById('apellidos');
      const emailInput = document.getElementById('email');

      if (nombreInput && session.firstName) nombreInput.value = session.firstName;
      if (apellidosInput && session.lastName) apellidosInput.value = session.lastName;
      if (emailInput && session.email) emailInput.value = session.email;
    } catch (e) {
      console.warn('No se pudo cargar la sesión:', e);
    }
  })();

  // Initialize Quill WYSIWYG Editors
  const quillToolbar = [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link'],
    ['clean']
  ];

  // Profile editor
  let perfilEditor = null;
  const perfilEditorEl = document.getElementById('perfilEditor');
  if (perfilEditorEl && typeof Quill !== 'undefined') {
    perfilEditor = new Quill('#perfilEditor', {
      theme: 'snow',
      placeholder: 'Describe tu perfil profesional, experiencia y objetivos...',
      modules: { toolbar: quillToolbar }
    });
    perfilEditor.on('text-change', updatePreview);
  }

  // Store for experience description editors
  const expEditors = {};

  // Photo handling with Cropper.js
  const photoBox = document.getElementById('photoBox');
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');
  const cropperImage = document.getElementById('cropperImage');
  const cropConfirmBtn = document.getElementById('cropConfirmBtn');
  const dropZone = document.getElementById('dropZone');
  let currentPhoto = '';
  let cropper = null;
  let cropperModal = null;
  let photoModal = null;

  // Click on photo box to open upload modal
  if (photoBox) {
    photoBox.addEventListener('click', () => {
      const modalEl = document.getElementById('photoModal');
      if (modalEl) {
        photoModal = new bootstrap.Modal(modalEl);
        photoModal.show();
      }
    });
  }

  // File input change handler
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        // Close photo modal first
        if (photoModal) photoModal.hide();
        // Open cropper
        openCropper(file);
      }
    });
  }

  // Drag and drop zone in modal
  if (dropZone) {
    dropZone.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') {
        photoInput.click();
      }
    });
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragging');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragging');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragging');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        // Close photo modal first
        if (photoModal) photoModal.hide();
        // Open cropper
        openCropper(file);
      }
    });
  }

  function openCropper(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Set image source for cropper
      if (cropperImage) {
        cropperImage.src = e.target.result;
      }

      // Show modal
      const modalEl = document.getElementById('cropperModal');
      if (modalEl) {
        cropperModal = new bootstrap.Modal(modalEl);
        cropperModal.show();

        // Initialize cropper after modal is shown
        modalEl.addEventListener('shown.bs.modal', initCropper, { once: true });

        // Destroy cropper when modal is hidden
        modalEl.addEventListener('hidden.bs.modal', destroyCropper, { once: true });
      }
    };
    reader.readAsDataURL(file);
  }

  function initCropper() {
    if (cropper) {
      cropper.destroy();
    }

    if (cropperImage && typeof Cropper !== 'undefined') {
      cropper = new Cropper(cropperImage, {
        aspectRatio: 1,
        viewMode: 2,
        dragMode: 'move',
        autoCropArea: 0.9,
        restore: false,
        guides: true,
        center: true,
        highlight: true,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        minCropBoxWidth: 100,
        minCropBoxHeight: 100
      });
    }
  }

  function destroyCropper() {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    // Reset file input
    if (photoInput) photoInput.value = '';
  }

  // Confirm crop button
  if (cropConfirmBtn) {
    cropConfirmBtn.addEventListener('click', () => {
      if (cropper) {
        // Get cropped canvas with minimum 300x300 size
        const canvas = cropper.getCroppedCanvas({
          width: 300,
          height: 300,
          minWidth: 300,
          minHeight: 300,
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high'
        });

        if (canvas) {
          currentPhoto = canvas.toDataURL('image/jpeg', 0.9);

          if (photoPreview) {
            photoPreview.src = currentPhoto;
            photoPreview.style.display = 'block';
          }
          if (photoBox) photoBox.classList.add('has-photo');

          updatePreview();
        }
      }

      // Close modal
      if (cropperModal) {
        cropperModal.hide();
      }
    });
  }

  // Template selection
  window.selectTemplate = function (template) {
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.template === template);
    });
    document.querySelectorAll('.cv-template').forEach(tpl => {
      tpl.classList.toggle('active', tpl.id === 'cv-' + template);
    });
  };

  // Dynamic item counters
  let expCounter = 0;
  let eduCounter = 0;
  let langCounter = 0;
  let skillCounter = 0;
  let abilityCounter = 0;

  // Generate year options from 1976 to 2026
  function generateYearOptions() {
    let options = '<option value="">Año</option>';
    for (let year = 2026; year >= 1976; year--) {
      options += `<option value="${year}">${year}</option>`;
    }
    return options;
  }

  // Add Experiencia
  window.addExperiencia = function () {
    const list = document.getElementById('experiencia-list');
    const id = 'exp-' + (++expCounter);
    const editorId = 'expEditor-' + expCounter;
    const yearOptions = generateYearOptions();
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = id;
    div.innerHTML = `
      <button type="button" class="btn-remove" onclick="removeItem('${id}')"><i class="fas fa-times"></i></button>
      <div class="row g-2">
        <div class="col-12">
          <input type="text" class="form-control form-control-sm" placeholder="Empresa" data-field="empresa">
        </div>
        <div class="col-6">
          <label class="form-label form-label-sm mb-1">Fecha de Inicio</label>
          <select class="form-select form-select-sm" data-field="inicio">
            ${yearOptions}
          </select>
        </div>
        <div class="col-6">
          <label class="form-label form-label-sm mb-1">Fecha de Fin</label>
          <select class="form-select form-select-sm" data-field="fin">
            ${yearOptions}
          </select>
        </div>
        <div class="col-12">
          <div id="${editorId}" class="quill-editor quill-small" data-field="descripcion"></div>
        </div>
      </div>
    `;
    list.appendChild(div);

    // Date validation - if start > end, set start = end
    const startSelect = div.querySelector('[data-field="inicio"]');
    const endSelect = div.querySelector('[data-field="fin"]');

    function validateDates() {
      const start = parseInt(startSelect.value) || 0;
      const end = parseInt(endSelect.value) || 0;
      if (start > 0 && end > 0 && start > end) {
        startSelect.value = endSelect.value;
      }
      updatePreview();
    }

    startSelect.addEventListener('change', validateDates);
    endSelect.addEventListener('change', validateDates);

    // Initialize Quill for this experience item
    if (typeof Quill !== 'undefined') {
      expEditors[id] = new Quill('#' + editorId, {
        theme: 'snow',
        placeholder: 'Descripción / Logros...',
        modules: { toolbar: [['bold', 'italic'], [{ 'list': 'bullet' }]] }
      });
      expEditors[id].on('text-change', updatePreview);
    }

    attachInputListeners(div);
    updatePreview();
  };

  // Add Formacion
  window.addFormacion = function () {
    const list = document.getElementById('formacion-list');
    const id = 'edu-' + (++eduCounter);
    const yearOptions = generateYearOptions();
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = id;
    div.innerHTML = `
      <button type="button" class="btn-remove" onclick="removeItem('${id}')"><i class="fas fa-times"></i></button>
      <div class="row g-2">
        <div class="col-12">
          <input type="text" class="form-control form-control-sm" placeholder="Institución" data-field="institucion">
        </div>
        <div class="col-12">
          <input type="text" class="form-control form-control-sm" placeholder="Título / Carrera" data-field="titulo">
        </div>
        <div class="col-6">
          <label class="form-label form-label-sm mb-1">Fecha de Inicio</label>
          <select class="form-select form-select-sm" data-field="inicio">
            ${yearOptions}
          </select>
        </div>
        <div class="col-6">
          <label class="form-label form-label-sm mb-1">Fecha de Fin</label>
          <select class="form-select form-select-sm" data-field="fin">
            ${yearOptions}
          </select>
        </div>
      </div>
    `;
    list.appendChild(div);

    // Date validation - if start > end, set start = end
    const startSelect = div.querySelector('[data-field="inicio"]');
    const endSelect = div.querySelector('[data-field="fin"]');

    function validateDates() {
      const start = parseInt(startSelect.value) || 0;
      const end = parseInt(endSelect.value) || 0;
      if (start > 0 && end > 0 && start > end) {
        startSelect.value = endSelect.value;
      }
      updatePreview();
    }

    startSelect.addEventListener('change', validateDates);
    endSelect.addEventListener('change', validateDates);

    attachInputListeners(div);
    updatePreview();
  };

  // Add Idioma
  window.addIdioma = function () {
    const list = document.getElementById('idiomas-list');
    const id = 'lang-' + (++langCounter);
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = id;
    div.innerHTML = `
      <button type="button" class="btn-remove" onclick="removeItem('${id}')"><i class="fas fa-times"></i></button>
      <div class="row g-2">
        <div class="col-12">
          <input type="text" class="form-control form-control-sm" placeholder="Idioma" data-field="idioma">
        </div>
      </div>
    `;
    list.appendChild(div);
    attachInputListeners(div);
    updatePreview();
  };

  // Add Competencia
  window.addCompetencia = function () {
    const list = document.getElementById('competencias-list');
    const id = 'skill-' + (++skillCounter);
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = id;
    div.innerHTML = `
      <button type="button" class="btn-remove" onclick="removeItem('${id}')"><i class="fas fa-times"></i></button>
      <div class="row g-2">
        <div class="col-7">
          <input type="text" class="form-control form-control-sm" placeholder="Competencia" data-field="nombre">
        </div>
        <div class="col-5">
          <select class="form-select form-select-sm" data-field="nivel">
            <option value="20">20%</option>
            <option value="40">40%</option>
            <option value="60">60%</option>
            <option value="80" selected>80%</option>
            <option value="100">100%</option>
          </select>
        </div>
      </div>
    `;
    list.appendChild(div);
    attachInputListeners(div);
    updatePreview();
  };

  // Add Habilidad
  window.addHabilidad = function () {
    const list = document.getElementById('habilidades-list');
    const id = 'ability-' + (++abilityCounter);
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.id = id;
    div.innerHTML = `
      <button type="button" class="btn-remove" onclick="removeItem('${id}')"><i class="fas fa-times"></i></button>
      <div class="row g-2">
        <div class="col-7">
          <input type="text" class="form-control form-control-sm" placeholder="Habilidad" data-field="nombre">
        </div>
        <div class="col-5">
          <select class="form-select form-select-sm" data-field="nivel">
            <option value="1">1 punto</option>
            <option value="2">2 puntos</option>
            <option value="3">3 puntos</option>
            <option value="4">4 puntos</option>
            <option value="5" selected>5 puntos</option>
          </select>
        </div>
      </div>
    `;
    list.appendChild(div);
    attachInputListeners(div);
    updatePreview();
  };

  // Remove item
  window.removeItem = function (id) {
    const item = document.getElementById(id);
    if (item) {
      item.remove();
      delete expEditors[id];
      updatePreview();
    }
  };

  // Attach input listeners
  function attachInputListeners(container) {
    container.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('input', updatePreview);
      el.addEventListener('change', updatePreview);
    });
  }

  // Attach listeners to static form fields
  document.querySelectorAll('#nombre, #apellidos, #titulo, #email, #direccion, #web, #linkedin').forEach(el => {
    if (el) {
      el.addEventListener('input', updatePreview);
      el.addEventListener('change', updatePreview);
    }
  });

  // Email validation
  const emailInput = document.getElementById('email');
  if (emailInput) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    emailInput.addEventListener('input', () => {
      const value = emailInput.value.trim();
      if (value && !emailPattern.test(value)) {
        emailInput.classList.add('is-invalid');
      } else {
        emailInput.classList.remove('is-invalid');
      }
    });
  }

  // Initialize intl-tel-input for phone number
  const telefonoInput = document.getElementById('telefono');
  if (telefonoInput && typeof intlTelInput !== 'undefined') {
    window.phoneIti = intlTelInput(telefonoInput, {
      initialCountry: 've',
      preferredCountries: ['ve', 'us', 'es', 'co', 'mx', 'ar'],
      separateDialCode: true,
      nationalMode: true,
      autoPlaceholder: 'aggressive',
      utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.3/build/js/utils.js'
    });

    // Only allow numbers in phone input
    telefonoInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/[^\d]/g, '');
      // Limit to 15 digits max
      if (value.length > 15) value = value.substring(0, 15);
      e.target.value = value;
      updatePreview();
    });

    // Format on blur
    telefonoInput.addEventListener('blur', () => {
      if (window.phoneIti && telefonoInput.value) {
        const number = window.phoneIti.getNumber();
        if (number) {
          // Format the number for display
          window.phoneIti.setNumber(number);
        }
      }
      updatePreview();
    });

    telefonoInput.addEventListener('countrychange', updatePreview);
  }

  // Get field values
  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  // Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }

  // Update Preview
  function updatePreview() {
    const nombre = getVal('nombre');
    const apellidos = getVal('apellidos');
    const titulo = getVal('titulo');
    // Get phone with country code from intl-tel-input (formatted)
    let telefono = '';
    if (window.phoneIti && getVal('telefono')) {
      // Get formatted international number
      const countryData = window.phoneIti.getSelectedCountryData();
      const nationalNum = getVal('telefono');
      telefono = '+' + countryData.dialCode + ' ' + nationalNum;
    }
    const email = getVal('email');
    const direccion = getVal('direccion');
    const web = getVal('web');
    const linkedin = getVal('linkedin');

    // Get profile from Quill editor
    const perfil = perfilEditor ? perfilEditor.root.innerHTML : '';

    // === MODERNA ===
    const photoModerna = document.getElementById('preview-photo-moderna');
    if (photoModerna) photoModerna.src = currentPhoto || '';

    setText('preview-nombre-moderna', nombre);
    setText('preview-apellidos-moderna', apellidos);
    setText('preview-titulo-moderna', titulo);
    setHTML('preview-perfil-moderna', perfil);
    setText('preview-telefono-moderna', telefono);
    setText('preview-email-moderna', email);
    setText('preview-web-moderna', linkedin);
    setText('preview-direccion-moderna', direccion);

    // Experiencia - Moderna
    const expModerna = document.getElementById('preview-experiencia-moderna');
    if (expModerna) {
      expModerna.innerHTML = '';
      document.querySelectorAll('#experiencia-list .dynamic-item').forEach(item => {
        const itemId = item.id;
        const empresa = item.querySelector('[data-field="empresa"]')?.value || '';
        const puesto = item.querySelector('[data-field="puesto"]')?.value || '';
        const inicio = item.querySelector('[data-field="inicio"]')?.value || '';
        const fin = item.querySelector('[data-field="fin"]')?.value || '';
        // Get description from Quill editor
        const desc = expEditors[itemId] ? expEditors[itemId].root.innerHTML : '';

        expModerna.innerHTML += `
          <div class="exp-item-moderna">
            <div class="exp-header-moderna">
              <span class="exp-company">${escapeHtml(empresa)}</span>
              <span class="exp-dates">${escapeHtml(inicio)} - ${escapeHtml(fin)}</span>
            </div>
            <div class="exp-description">${desc}</div>
          </div>
        `;
      });
    }

    // Formacion - Moderna
    const eduModerna = document.getElementById('preview-formacion-moderna');
    if (eduModerna) {
      eduModerna.innerHTML = '';
      document.querySelectorAll('#formacion-list .dynamic-item').forEach(item => {
        const institucion = item.querySelector('[data-field="institucion"]')?.value || '';
        const tituloEdu = item.querySelector('[data-field="titulo"]')?.value || '';
        const inicio = item.querySelector('[data-field="inicio"]')?.value || '';
        const fin = item.querySelector('[data-field="fin"]')?.value || '';

        eduModerna.innerHTML += `
          <div class="edu-item-moderna">
            <div class="edu-header-moderna">
              <span class="edu-institution">${escapeHtml(institucion)}</span>
              <span class="edu-dates">${escapeHtml(inicio)} - ${escapeHtml(fin)}</span>
            </div>
            <div class="edu-degree">${escapeHtml(tituloEdu)}</div>
          </div>
        `;
      });
    }

    // Idiomas - Moderna
    const langModerna = document.getElementById('preview-idiomas-moderna');
    if (langModerna) {
      langModerna.innerHTML = '';
      document.querySelectorAll('#idiomas-list .dynamic-item').forEach(item => {
        const idioma = item.querySelector('[data-field="idioma"]')?.value || '';
        langModerna.innerHTML += `
          <div class="lang-item-moderna">
            <i class="fas fa-check"></i>
            <span>${escapeHtml(idioma)}</span>
          </div>
        `;
      });
    }

    // Competencias - Moderna
    const skillModerna = document.getElementById('preview-competencias-moderna');
    if (skillModerna) {
      skillModerna.innerHTML = '';
      document.querySelectorAll('#competencias-list .dynamic-item').forEach(item => {
        const nombreSkill = item.querySelector('[data-field="nombre"]')?.value || '';
        const nivel = item.querySelector('[data-field="nivel"]')?.value || '80';

        skillModerna.innerHTML += `
          <div class="skill-item-moderna">
            <div class="skill-name">${escapeHtml(nombreSkill)}</div>
            <div class="skill-bar"><div class="skill-bar-fill" style="width:${nivel}%"></div></div>
          </div>
        `;
      });
    }

    // Habilidades - Moderna
    const abilityModerna = document.getElementById('preview-habilidades-moderna');
    if (abilityModerna) {
      abilityModerna.innerHTML = '';
      document.querySelectorAll('#habilidades-list .dynamic-item').forEach(item => {
        const nombreAbility = item.querySelector('[data-field="nombre"]')?.value || '';
        const nivel = parseInt(item.querySelector('[data-field="nivel"]')?.value || '5', 10);

        let dots = '';
        for (let i = 1; i <= 5; i++) {
          dots += `<div class="ability-dot ${i <= nivel ? 'filled' : ''}"></div>`;
        }

        abilityModerna.innerHTML += `
          <div class="ability-item-moderna">
            <span>${escapeHtml(nombreAbility)}</span>
            <div class="ability-dots">${dots}</div>
          </div>
        `;
      });
    }

    // === CLASICA ===
    const photoClasica = document.getElementById('preview-photo-clasica');
    if (photoClasica) photoClasica.src = currentPhoto || '';

    setText('preview-fullname-clasica', nombre + ' ' + apellidos);
    setText('preview-email-clasica', email);
    setText('preview-telefono-clasica', telefono);
    setText('preview-direccion-clasica', direccion);
    setText('preview-linkedin-clasica', linkedin);
    setHTML('preview-perfil-clasica', perfil);

    // Experiencia - Clasica
    const expClasica = document.getElementById('preview-experiencia-clasica');
    if (expClasica) {
      expClasica.innerHTML = '';
      document.querySelectorAll('#experiencia-list .dynamic-item').forEach(item => {
        const itemId = item.id;
        const empresa = item.querySelector('[data-field="empresa"]')?.value || '';
        const puesto = item.querySelector('[data-field="puesto"]')?.value || '';
        const inicio = item.querySelector('[data-field="inicio"]')?.value || '';
        const fin = item.querySelector('[data-field="fin"]')?.value || '';
        // Get description from Quill editor
        const desc = expEditors[itemId] ? expEditors[itemId].root.innerHTML : '';

        expClasica.innerHTML += `
          <div class="exp-item-clasica">
            <div class="exp-dates-clasica">${escapeHtml(inicio)} - ${escapeHtml(fin)}</div>
            <div class="exp-content-clasica">
              <div class="exp-title-clasica">${escapeHtml(puesto)}</div>
              <div class="exp-company-clasica">${escapeHtml(empresa)}</div>
              <div class="exp-description-clasica">${desc}</div>
            </div>
          </div>
        `;
      });
    }

    // Formacion - Clasica
    const eduClasica = document.getElementById('preview-formacion-clasica');
    if (eduClasica) {
      eduClasica.innerHTML = '';
      document.querySelectorAll('#formacion-list .dynamic-item').forEach(item => {
        const institucion = item.querySelector('[data-field="institucion"]')?.value || '';
        const tituloEdu = item.querySelector('[data-field="titulo"]')?.value || '';
        const inicio = item.querySelector('[data-field="inicio"]')?.value || '';
        const fin = item.querySelector('[data-field="fin"]')?.value || '';

        eduClasica.innerHTML += `
          <div class="edu-item-clasica">
            <div class="edu-dates-clasica">${escapeHtml(inicio)} - ${escapeHtml(fin)}</div>
            <div class="edu-content-clasica">
              <div class="edu-title-clasica">${escapeHtml(tituloEdu)}</div>
              <div class="edu-institution-clasica">${escapeHtml(institucion)}</div>
            </div>
          </div>
        `;
      });
    }
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '';
  }

  function setHTML(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value || '';
  }

  // Download PDF
  window.downloadPDF = function () {
    updatePreview();
    document.body.classList.add('print-mode');
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove('print-mode'), 500);
    }, 200);
  };

  // Save CV to localStorage
  window.saveCV = function () {
    const nombre = getVal('nombre');
    const apellidos = getVal('apellidos');

    if (!nombre || !apellidos) {
      alert('Por favor ingresa al menos Nombre y Apellido para guardar.');
      return;
    }

    // Collect all CV data
    const cvData = {
      id: Date.now(),
      nombre: nombre,
      apellidos: apellidos,
      titulo: getVal('titulo'),
      telefono: window.phoneIti ? window.phoneIti.getNumber() : getVal('telefono'),
      email: getVal('email'),
      direccion: getVal('direccion'),
      linkedin: getVal('linkedin'),
      perfil: perfilEditor ? perfilEditor.root.innerHTML : '',
      photo: currentPhoto
    };

    // Get existing CVs from localStorage
    let savedCVs = JSON.parse(localStorage.getItem('saved_cvs') || '[]');
    savedCVs.push(cvData);
    localStorage.setItem('saved_cvs', JSON.stringify(savedCVs));

    loadSavedCVs();
    alert('CV guardado exitosamente!');
  };

  // Load saved CVs into table
  function loadSavedCVs() {
    const tbody = document.getElementById('saved-cvs-body');
    const noMessage = document.getElementById('no-cvs-message');
    const savedCVs = JSON.parse(localStorage.getItem('saved_cvs') || '[]');

    if (!tbody) return;

    tbody.innerHTML = '';

    if (savedCVs.length === 0) {
      if (noMessage) noMessage.style.display = 'block';
      return;
    }

    if (noMessage) noMessage.style.display = 'none';

    savedCVs.forEach((cv, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${cv.nombre}</td>
        <td>${cv.apellidos}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Load a saved CV
  window.loadCV = function (id) {
    const savedCVs = JSON.parse(localStorage.getItem('saved_cvs') || '[]');
    const cv = savedCVs.find(c => c.id === id);

    if (!cv) return;

    document.getElementById('nombre').value = cv.nombre || '';
    document.getElementById('apellidos').value = cv.apellidos || '';
    document.getElementById('titulo').value = cv.titulo || '';
    document.getElementById('email').value = cv.email || '';
    document.getElementById('direccion').value = cv.direccion || '';
    document.getElementById('linkedin').value = cv.linkedin || '';

    if (cv.perfil && perfilEditor) {
      perfilEditor.root.innerHTML = cv.perfil;
    }

    if (cv.photo) {
      currentPhoto = cv.photo;
      const photoPreview = document.getElementById('photoPreview');
      if (photoPreview) {
        photoPreview.src = cv.photo;
        photoPreview.style.display = 'block';
      }
      const photoBox = document.getElementById('photoBox');
      if (photoBox) photoBox.classList.add('has-photo');
    }

    updatePreview();
  };

  // Delete a saved CV
  window.deleteCV = function (id) {
    if (!confirm('¿Estás seguro de eliminar este CV?')) return;

    let savedCVs = JSON.parse(localStorage.getItem('saved_cvs') || '[]');
    savedCVs = savedCVs.filter(c => c.id !== id);
    localStorage.setItem('saved_cvs', JSON.stringify(savedCVs));
    loadSavedCVs();
  };

  // Initial items
  addExperiencia();
  addFormacion();
  addIdioma();
  addCompetencia();
  addHabilidad();

  // Load saved CVs on page load
  loadSavedCVs();

  // Initial preview
  setTimeout(updatePreview, 100);

})();
