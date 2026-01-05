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

  // Load and apply admin settings (colors, fonts, sizes)
  (function loadAdminSettings() {
    try {
      // Load color settings
      const colorSettings = JSON.parse(localStorage.getItem('admin_color_settings') || '{}');
      if (colorSettings.primary || colorSettings.secondary || colorSettings.accent || colorSettings.neutral) {
        const root = document.documentElement;
        // Apply colors to CSS variables for CV templates
        if (colorSettings.accent) {
          root.style.setProperty('--moderna-dark', colorSettings.accent);   // Header background
          root.style.setProperty('--clasica-gray', colorSettings.accent);   // Section headers
          root.style.setProperty('--cv-text', colorSettings.accent);        // Dark text color
        }
        if (colorSettings.secondary) {
          root.style.setProperty('--moderna-accent', colorSettings.secondary); // Accent color (buttons, bars)
        }
        if (colorSettings.primary) {
          root.style.setProperty('--primary', colorSettings.primary);  // Primary color
          root.style.setProperty('--cv-primary', colorSettings.primary); // Checkmarks, highlights
        }
        if (colorSettings.neutral) {
          root.style.setProperty('--cv-background', colorSettings.neutral); // CV background
          root.style.setProperty('--cv-text-light', colorSettings.neutral); // Light/white text
        }
        console.log('CV: Colores del admin aplicados', colorSettings);
      }

      // Load typography settings
      const typoSettings = JSON.parse(localStorage.getItem('admin_typography_settings') || '{}');
      if (typoSettings.primary || typoSettings.secondary || typoSettings.paragraphSize) {
        const root = document.documentElement;
        // Apply font families
        if (typoSettings.secondary) {
          // Inject Google Font
          const fontName = typoSettings.secondary;
          const linkId = 'cv-gfont-' + fontName.replace(/\s+/g, '-');
          if (!document.getElementById(linkId)) {
            const link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(fontName) + ':wght@300;400;500;600;700&display=swap';
            document.head.appendChild(link);
          }
          // Apply to CV templates
          document.querySelectorAll('.cv-template').forEach(tpl => {
            tpl.style.fontFamily = fontName + ', sans-serif';
          });
        }
        // Apply font size to CV
        if (typoSettings.paragraphSize) {
          document.querySelectorAll('.cv-template').forEach(tpl => {
            tpl.style.fontSize = typoSettings.paragraphSize + 'px';
          });
        }
        console.log('CV: Tipografía del admin aplicada', typoSettings);
      }
    } catch (e) {
      console.warn('No se pudo cargar configuración del admin:', e);
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

  // Generate year options for select
  function generateYearOptions() {
    let options = '<option value="">Año</option>';
    for (let year = 2026; year >= 1976; year--) {
      options += `<option value="${year}">${year}</option>`;
    }
    return options;
  }

  // Make select searchable - typing numbers will jump to matching year
  function makeSelectSearchable(selectEl) {
    let searchBuffer = '';
    let clearTimer = null;

    selectEl.addEventListener('keydown', (e) => {
      // Only handle number keys
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();

        // Clear previous timer
        if (clearTimer) clearTimeout(clearTimer);

        // Add to search buffer
        searchBuffer += e.key;

        // Find matching option
        const options = selectEl.options;
        for (let i = 0; i < options.length; i++) {
          if (options[i].value.startsWith(searchBuffer)) {
            selectEl.selectedIndex = i;
            selectEl.dispatchEvent(new Event('change'));
            break;
          }
        }

        // Clear buffer after 1 second of no typing
        clearTimer = setTimeout(() => {
          searchBuffer = '';
        }, 1000);
      }
    });
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

    // Make selects searchable by typing
    makeSelectSearchable(startSelect);
    makeSelectSearchable(endSelect);

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

    // Make selects searchable by typing
    makeSelectSearchable(startSelect);
    makeSelectSearchable(endSelect);

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
            <option value="20">Principiante</option>
            <option value="40">Bajo</option>
            <option value="60">Medio</option>
            <option value="80" selected>Alto</option>
            <option value="100">Nativo</option>
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
            <option value="1">Principiante</option>
            <option value="2">Bajo</option>
            <option value="3">Medio</option>
            <option value="4">Alto</option>
            <option value="5" selected>Nativo</option>
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

    // Idiomas - Clasica
    const langClasica = document.getElementById('preview-idiomas-clasica');
    if (langClasica) {
      langClasica.innerHTML = '';
      document.querySelectorAll('#idiomas-list .dynamic-item').forEach(item => {
        const idioma = item.querySelector('[data-field="idioma"]')?.value || '';
        langClasica.innerHTML += `
          <div class="lang-item-clasica">• ${escapeHtml(idioma)}</div>
        `;
      });
    }

    // Competencias - Clasica (show name and level text)
    const skillClasica = document.getElementById('preview-competencias-clasica');
    if (skillClasica) {
      skillClasica.innerHTML = '';
      const nivelNombres = { '20': 'Principiante', '40': 'Bajo', '60': 'Medio', '80': 'Alto', '100': 'Nativo' };
      document.querySelectorAll('#competencias-list .dynamic-item').forEach(item => {
        const nombreSkill = item.querySelector('[data-field="nombre"]')?.value || '';
        const nivel = item.querySelector('[data-field="nivel"]')?.value || '80';
        const nivelTexto = nivelNombres[nivel] || 'Alto';

        skillClasica.innerHTML += `
          <div class="skill-item-clasica-simple">
            <span class="skill-name-clasica">${escapeHtml(nombreSkill)}</span>
            <span class="skill-level-clasica">${nivelTexto}</span>
          </div>
        `;
      });
    }

    // Habilidades - Clasica (show name and level text)
    const abilityClasica = document.getElementById('preview-habilidades-clasica');
    if (abilityClasica) {
      abilityClasica.innerHTML = '';
      const nivelNombresAb = { '1': 'Principiante', '2': 'Bajo', '3': 'Medio', '4': 'Alto', '5': 'Nativo' };
      document.querySelectorAll('#habilidades-list .dynamic-item').forEach(item => {
        const nombreAbility = item.querySelector('[data-field="nombre"]')?.value || '';
        const nivel = item.querySelector('[data-field="nivel"]')?.value || '5';
        const nivelTexto = nivelNombresAb[nivel] || 'Nativo';

        abilityClasica.innerHTML += `
          <div class="ability-item-clasica-simple">
            <span class="ability-name-clasica">${escapeHtml(nombreAbility)}</span>
            <span class="ability-level-clasica">${nivelTexto}</span>
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

  // Download PDF using browser print (native, with selectable text)
  window.downloadPDF = function () {
    updatePreview();

    // Add print mode class to hide UI elements
    document.body.classList.add('print-mode');

    // Small delay to ensure styles are applied
    setTimeout(() => {
      window.print();

      // Remove print mode after printing
      setTimeout(() => {
        document.body.classList.remove('print-mode');
      }, 1000);
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

    // Collect experience data
    const experiencias = [];
    document.querySelectorAll('#experiencia-list .dynamic-item').forEach(item => {
      const empresa = item.querySelector('[data-field="empresa"]')?.value || '';
      const inicio = item.querySelector('[data-field="inicio"]')?.value || '';
      const fin = item.querySelector('[data-field="fin"]')?.value || '';
      const editorEl = item.querySelector('.quill-editor');
      const descripcion = editorEl?.__quill?.root.innerHTML || '';
      experiencias.push({ empresa, inicio, fin, descripcion });
    });

    // Collect formation data
    const formaciones = [];
    document.querySelectorAll('#formacion-list .dynamic-item').forEach(item => {
      const institucion = item.querySelector('[data-field="institucion"]')?.value || '';
      const titulo = item.querySelector('[data-field="titulo"]')?.value || '';
      const inicio = item.querySelector('[data-field="inicio"]')?.value || '';
      const fin = item.querySelector('[data-field="fin"]')?.value || '';
      const editorEl = item.querySelector('.quill-editor');
      const descripcion = editorEl?.__quill?.root.innerHTML || '';
      formaciones.push({ institucion, titulo, inicio, fin, descripcion });
    });

    // Collect languages
    const idiomas = [];
    document.querySelectorAll('#idiomas-list .dynamic-item').forEach(item => {
      const idioma = item.querySelector('[data-field="idioma"]')?.value || '';
      idiomas.push({ idioma });
    });

    // Collect competencies
    const competencias = [];
    document.querySelectorAll('#competencias-list .dynamic-item').forEach(item => {
      const nombre = item.querySelector('[data-field="nombre"]')?.value || '';
      const nivel = item.querySelector('[data-field="nivel"]')?.value || '';
      competencias.push({ nombre, nivel });
    });

    // Collect skills (field is 'nombre' in the HTML)
    const habilidades = [];
    document.querySelectorAll('#habilidades-list .dynamic-item').forEach(item => {
      const nombre = item.querySelector('[data-field="nombre"]')?.value || '';
      const nivel = item.querySelector('[data-field="nivel"]')?.value || '';
      habilidades.push({ nombre, nivel });
    });

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
      photo: currentPhoto,
      experiencias: experiencias,
      formaciones: formaciones,
      idiomas: idiomas,
      competencias: competencias,
      habilidades: habilidades
    };

    // Get existing CVs from localStorage
    let savedCVs = JSON.parse(localStorage.getItem('saved_cvs') || '[]');
    savedCVs.push(cvData);
    localStorage.setItem('saved_cvs', JSON.stringify(savedCVs));

    loadSavedCVs();
    alert('CV guardado exitosamente!');
  };

  // Context Menu Logic
  let selectedCVId = null;
  const contextMenu = document.getElementById('cv-context-menu');

  document.addEventListener('click', () => {
    if (contextMenu) contextMenu.style.display = 'none';
  });

  window.handleContextMenu = function (e, id) {
    e.preventDefault();
    selectedCVId = id;

    // Position menu
    if (contextMenu) {
      contextMenu.style.display = 'block';
      contextMenu.style.left = `${e.pageX}px`;
      contextMenu.style.top = `${e.pageY}px`;
    }
  };

  // Custom Confirmation Modal
  let cvConfirmOverlay = null;

  function createConfirmModal() {
    if (cvConfirmOverlay) return cvConfirmOverlay;

    cvConfirmOverlay = document.createElement('div');
    cvConfirmOverlay.className = 'cv-confirm-overlay';
    cvConfirmOverlay.innerHTML = `
      <div class="cv-confirm-dialog" role="dialog" aria-modal="true">
        <h3 id="confirm-title">Confirmar acción</h3>
        <p id="confirm-message">¿Estás seguro?</p>
        <div class="confirm-actions">
          <button class="btn-cancel">Cancelar</button>
          <button class="btn-confirm">Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(cvConfirmOverlay);

    // Apply styles inline
    cvConfirmOverlay.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);z-index:10000;';

    const dialog = cvConfirmOverlay.querySelector('.cv-confirm-dialog');
    dialog.style.cssText = 'background:#fff;color:#111;padding:24px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.2);max-width:400px;width:90%;text-align:center;';

    const title = cvConfirmOverlay.querySelector('h3');
    title.style.cssText = 'margin:0 0 12px 0;font-size:1.2rem;font-weight:600;color:#333;';

    const msg = cvConfirmOverlay.querySelector('p');
    msg.style.cssText = 'margin:0 0 20px 0;font-size:0.95rem;color:#666;';

    const actions = cvConfirmOverlay.querySelector('.confirm-actions');
    actions.style.cssText = 'display:flex;gap:12px;justify-content:center;';

    const btnCancel = cvConfirmOverlay.querySelector('.btn-cancel');
    btnCancel.style.cssText = 'background:#f0f0f0;color:#333;border:1px solid #ddd;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:500;transition:all 0.2s;';

    const btnConfirm = cvConfirmOverlay.querySelector('.btn-confirm');
    btnConfirm.style.cssText = 'background:linear-gradient(135deg,#1B73E8,#4285F4);color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:500;transition:all 0.2s;';

    return cvConfirmOverlay;
  }

  function showConfirmModal(title, message, onConfirm, confirmBtnText = 'Confirmar', isDanger = false) {
    const overlay = createConfirmModal();

    overlay.querySelector('#confirm-title').textContent = title;
    overlay.querySelector('#confirm-message').textContent = message;

    const btnConfirm = overlay.querySelector('.btn-confirm');
    btnConfirm.textContent = confirmBtnText;

    if (isDanger) {
      btnConfirm.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
    } else {
      btnConfirm.style.background = 'linear-gradient(135deg, #1B73E8, #4285F4)';
    }

    overlay.style.display = 'flex';

    // Remove old handlers
    const newBtnCancel = overlay.querySelector('.btn-cancel').cloneNode(true);
    overlay.querySelector('.btn-cancel').replaceWith(newBtnCancel);

    const newBtnConfirm = overlay.querySelector('.btn-confirm').cloneNode(true);
    overlay.querySelector('.btn-confirm').replaceWith(newBtnConfirm);

    // Re-apply styles
    newBtnCancel.style.cssText = 'background:#f0f0f0;color:#333;border:1px solid #ddd;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:500;transition:all 0.2s;';
    newBtnConfirm.style.cssText = isDanger
      ? 'background:linear-gradient(135deg,#dc3545,#c82333);color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:500;transition:all 0.2s;'
      : 'background:linear-gradient(135deg,#1B73E8,#4285F4);color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:500;transition:all 0.2s;';
    newBtnConfirm.textContent = confirmBtnText;

    newBtnCancel.addEventListener('click', () => {
      overlay.style.display = 'none';
    });

    newBtnConfirm.addEventListener('click', () => {
      overlay.style.display = 'none';
      if (onConfirm) onConfirm();
    });
  }

  window.confirmLoadCV = function () {
    if (!selectedCVId) {
      alert('No hay CV seleccionado');
      return;
    }
    if (contextMenu) contextMenu.style.display = 'none';

    showConfirmModal(
      'Cargar Datos del CV',
      '¿Estás seguro de cargar estos datos? Se perderán los datos actuales no guardados.',
      () => loadCV(selectedCVId),
      'Cargar',
      false
    );
  };

  window.confirmDeleteCV = function () {
    if (!selectedCVId) return;
    if (contextMenu) contextMenu.style.display = 'none';

    showConfirmModal(
      'Eliminar CV',
      '¿Estás seguro de eliminar este CV? Esta acción no se puede deshacer.',
      () => deleteCV(selectedCVId),
      'Eliminar',
      true
    );
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
      tr.style.cursor = 'context-menu';
      tr.oncontextmenu = (e) => handleContextMenu(e, cv.id);

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

    // Fill basic fields
    document.getElementById('nombre').value = cv.nombre || '';
    document.getElementById('apellidos').value = cv.apellidos || '';
    document.getElementById('titulo').value = cv.titulo || '';
    document.getElementById('email').value = cv.email || '';
    document.getElementById('direccion').value = cv.direccion || '';

    // Fill Phone
    if (window.phoneIti) {
      window.phoneIti.setNumber(cv.telefono || '');
    } else {
      document.getElementById('telefono').value = cv.telefono || '';
    }

    // Fill LinkedIn
    document.getElementById('linkedin').value = cv.linkedin || '';

    // Fill Profile
    if (cv.perfil && perfilEditor) {
      perfilEditor.root.innerHTML = cv.perfil;
    }

    // Fill Photo
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

    // Clear and reload Experience
    const expList = document.getElementById('experiencia-list');
    if (expList) expList.innerHTML = '';
    if (cv.experiencias && cv.experiencias.length > 0) {
      cv.experiencias.forEach(exp => {
        addExperiencia();
        const items = document.querySelectorAll('#experiencia-list .dynamic-item');
        const lastItem = items[items.length - 1];
        if (lastItem) {
          const empresaInput = lastItem.querySelector('[data-field="empresa"]');
          if (empresaInput) empresaInput.value = exp.empresa || '';
          const inicioSelect = lastItem.querySelector('[data-field="inicio"]');
          if (inicioSelect) inicioSelect.value = exp.inicio || '';
          const finSelect = lastItem.querySelector('[data-field="fin"]');
          if (finSelect) finSelect.value = exp.fin || '';
          const editorEl = lastItem.querySelector('.quill-editor');
          if (editorEl && editorEl.__quill && exp.descripcion) {
            editorEl.__quill.root.innerHTML = exp.descripcion;
          }
        }
      });
    } else {
      addExperiencia();
    }

    // Clear and reload Formation
    const formList = document.getElementById('formacion-list');
    if (formList) formList.innerHTML = '';
    if (cv.formaciones && cv.formaciones.length > 0) {
      cv.formaciones.forEach(form => {
        addFormacion();
        const items = document.querySelectorAll('#formacion-list .dynamic-item');
        const lastItem = items[items.length - 1];
        if (lastItem) {
          const instInput = lastItem.querySelector('[data-field="institucion"]');
          if (instInput) instInput.value = form.institucion || '';
          const tituloInput = lastItem.querySelector('[data-field="titulo"]');
          if (tituloInput) tituloInput.value = form.titulo || '';
          const inicioSelect = lastItem.querySelector('[data-field="inicio"]');
          if (inicioSelect) inicioSelect.value = form.inicio || '';
          const finSelect = lastItem.querySelector('[data-field="fin"]');
          if (finSelect) finSelect.value = form.fin || '';
          const editorEl = lastItem.querySelector('.quill-editor');
          if (editorEl && editorEl.__quill && form.descripcion) {
            editorEl.__quill.root.innerHTML = form.descripcion;
          }
        }
      });
    } else {
      addFormacion();
    }

    // Clear and reload Languages
    const langList = document.getElementById('idiomas-list');
    if (langList) langList.innerHTML = '';
    if (cv.idiomas && cv.idiomas.length > 0) {
      cv.idiomas.forEach(lang => {
        addIdioma();
        const items = document.querySelectorAll('#idiomas-list .dynamic-item');
        const lastItem = items[items.length - 1];
        if (lastItem) {
          const idiomaInput = lastItem.querySelector('[data-field="idioma"]');
          if (idiomaInput) idiomaInput.value = lang.idioma || '';
        }
      });
    } else {
      addIdioma();
    }

    // Clear and reload Competencies
    const compList = document.getElementById('competencias-list');
    if (compList) compList.innerHTML = '';
    if (cv.competencias && cv.competencias.length > 0) {
      cv.competencias.forEach(comp => {
        addCompetencia();
        const items = document.querySelectorAll('#competencias-list .dynamic-item');
        const lastItem = items[items.length - 1];
        if (lastItem) {
          const nombreInput = lastItem.querySelector('[data-field="nombre"]');
          if (nombreInput) nombreInput.value = comp.nombre || '';
          const nivelSelect = lastItem.querySelector('[data-field="nivel"]');
          if (nivelSelect) nivelSelect.value = comp.nivel || '';
        }
      });
    } else {
      addCompetencia();
    }

    // Clear and reload Skills (field is 'nombre' in the HTML)
    const skillList = document.getElementById('habilidades-list');
    if (skillList) skillList.innerHTML = '';
    if (cv.habilidades && cv.habilidades.length > 0) {
      cv.habilidades.forEach(skill => {
        addHabilidad();
        const items = document.querySelectorAll('#habilidades-list .dynamic-item');
        const lastItem = items[items.length - 1];
        if (lastItem) {
          const nombreInput = lastItem.querySelector('[data-field="nombre"]');
          if (nombreInput) nombreInput.value = skill.nombre || '';
          const nivelSelect = lastItem.querySelector('[data-field="nivel"]');
          if (nivelSelect) nivelSelect.value = skill.nivel || '';
        }
      });
    } else {
      addHabilidad();
    }

    // Update preview
    updatePreview();
  };

  // Delete a saved CV (called from confirmDeleteCV which already shows modal)
  window.deleteCV = function (id) {
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
