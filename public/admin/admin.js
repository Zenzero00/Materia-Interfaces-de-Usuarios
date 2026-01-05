// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // ---------- Display logged-in user ----------
    (function displayCurrentUser() {
        try {
            const session = JSON.parse(localStorage.getItem('admin_session') || '{}');
            const firstName = session.firstName || 'Admin';
            const lastName = session.lastName || 'User';
            const fullName = firstName + ' ' + lastName;

            const userNameEl = document.getElementById('user-name');
            const userAvatarEl = document.getElementById('user-avatar');

            if (userNameEl) {
                userNameEl.textContent = fullName;
            }
            if (userAvatarEl) {
                userAvatarEl.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName) + '&background=1B73E8&color=fff';
                userAvatarEl.alt = fullName;
            }
        } catch (e) {
            console.warn('No se pudo cargar la sesión del usuario:', e);
        }
    })();

    // ---------- Color picker functionality ----------
    const colorInputs = document.querySelectorAll('input[type="color"]');
    const colorTextInputs = document.querySelectorAll('input[type="text"][id$="-hex"]');

    // Sync color picker -> hex input AND update preview
    if (colorInputs && colorTextInputs && colorInputs.length === colorTextInputs.length) {
        colorInputs.forEach((input, index) => {
            input.addEventListener('input', function () {
                if (colorTextInputs[index]) {
                    colorTextInputs[index].value = this.value;
                }
                // Update color preview
                const preview = this.closest('.color-item')?.querySelector('.color-preview');
                if (preview) preview.style.backgroundColor = this.value;
            });
        });

        // Sync hex input -> color picker (with validation: # fixed + max 6 hex chars)
        colorTextInputs.forEach((input, index) => {
            input.addEventListener('input', function (e) {
                let val = this.value;

                // Ensure # is always at the start
                if (!val.startsWith('#')) {
                    val = '#' + val.replace(/#/g, '');
                }

                // Remove any non-hex characters after the #
                val = '#' + val.slice(1).replace(/[^0-9A-Fa-f]/g, '');

                // Limit to 6 hex characters after the #
                if (val.length > 7) {
                    val = val.slice(0, 7);
                }

                // Update the input value
                this.value = val.toUpperCase();

                // Sync with color picker if valid 6-digit hex
                if (val.match(/^#[0-9A-Fa-f]{6}$/)) {
                    if (colorInputs[index]) {
                        colorInputs[index].value = val;
                        // Update color preview
                        const preview = colorInputs[index].closest('.color-item')?.querySelector('.color-preview');
                        if (preview) preview.style.backgroundColor = val;
                    }
                }
            });

            // Ensure # is always present on focus
            input.addEventListener('focus', function () {
                if (!this.value.startsWith('#')) {
                    this.value = '#' + this.value;
                }
            });
        });
    }

    // ---------- Reset buttons functionality ----------
    const resetButtons = document.querySelectorAll('.btn-reset');
    resetButtons.forEach((btn) => {
        btn.addEventListener('click', function () {
            const colorItem = this.closest('.color-item');
            if (!colorItem) return;

            const colorInput = colorItem.querySelector('input[type="color"]');
            const hexInput = colorItem.querySelector('input[type="text"][id$="-hex"]');
            const preview = colorItem.querySelector('.color-preview');

            // Reset to white
            const resetColor = '#ffffff';
            if (colorInput) colorInput.value = resetColor;
            if (hexInput) hexInput.value = resetColor;
            if (preview) preview.style.backgroundColor = resetColor;
        });
    });

    // Apply colors button
    const applyColorsBtn = document.getElementById('apply-colors');
    if (applyColorsBtn) {
        applyColorsBtn.addEventListener('click', function () {
            const c1 = document.getElementById('color-1')?.value || '#43ba7f';
            const c2 = document.getElementById('color-2')?.value || '#ff511a';
            const c3 = document.getElementById('color-3')?.value || '#212741';
            const c4 = document.getElementById('color-4')?.value || '#ffffff';
            const paletteName = document.getElementById('palette-name')?.value || 'Sin nombre';

            // Aplicar colores al admin
            if (c1) document.documentElement.style.setProperty('--primary-color', c1);
            if (c2) document.documentElement.style.setProperty('--secondary-color', c2);
            if (c3) document.documentElement.style.setProperty('--accent-color', c3);
            if (c4) document.documentElement.style.setProperty('--neutral-color', c4);

            // Aplicar colores al iframe (página principal)
            applyColorsToIframe({
                primary: c1,    // Botones verdes, iconos
                secondary: c2,  // Botones naranjas  
                accent: c3,     // Textos, encabezados, fondos
                neutral: c4     // Texto sobre botones, textos sobre fondos oscuros
            });

            // Guardar en historial con nombre de paleta
            try {
                const colorSettings = { name: paletteName, primary: c1, secondary: c2, accent: c3, neutral: c4 };
                localStorage.setItem('admin_color_settings', JSON.stringify(colorSettings));
                const ch = loadColorHistory();
                ch.push(Object.assign({}, colorSettings, { timestamp: Date.now() }));
                saveColorHistory(ch);
                renderColorHistory();
            } catch (e) { console.warn('No se pudo guardar colores en historial', e); }

            try {
                if (window.BroadcastChannel) {
                    const bc = new BroadcastChannel('admin-colors');
                    bc.postMessage({
                        type: 'colors-applied',
                        colors: { primary: c1, secondary: c2, accent: c3, neutral: c4 }
                    });
                    bc.close();
                }
            } catch (e) { }

            alert('Colores aplicados correctamente');
        });
    }
    // Función simplificada para aplicar colores al iframe
    // Ahora que el CSS usa variables, solo necesitamos establecerlas
    function applyColorsToIframe(colors) {
        const iframe = document.getElementById('site-preview');
        const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;

        if (!iframeDoc) return;

        // Aplicar variables CSS al iframe - el CSS responderá automáticamente
        if (colors.primary) iframeDoc.documentElement.style.setProperty('--primary-color', colors.primary);
        if (colors.secondary) iframeDoc.documentElement.style.setProperty('--secondary-color', colors.secondary);
        if (colors.accent) iframeDoc.documentElement.style.setProperty('--accent-color', colors.accent);
        if (colors.neutral) iframeDoc.documentElement.style.setProperty('--neutral-color', colors.neutral);
    }

    // Función mejorada para aplicar colores a elementos específicos
    function applyColorsToElements(doc, colors) {
        if (!doc) return;

        // ===== COLOR 1 (PRIMARY) - Botones verdes e iconos =====

        // Botones "Discover More" (verdes)
        const greenButtons = doc.querySelectorAll('.green-button a');
        greenButtons.forEach(btn => {
            if (colors.primary) btn.style.backgroundColor = colors.primary;
            if (colors.neutral) btn.style.color = colors.neutral;
            btn.style.border = 'none';
        });

        // Botón "Contact Support" en el header
        const headerContactBtn = doc.querySelector('.header-area .main-nav .nav li:last-child a');
        if (headerContactBtn) {
            if (colors.primary) headerContactBtn.style.backgroundColor = colors.primary;
            if (colors.neutral) headerContactBtn.style.color = colors.neutral;
        }

        // Iconos de servicios
        const serviceIcons = doc.querySelectorAll('.services .service-item i');
        serviceIcons.forEach(icon => {
            if (colors.primary) icon.style.color = colors.primary;
        });

        // ===== COLOR 2 (SECONDARY) - Botones naranjas =====

        // Botones "Contact Us" (naranjas)
        const orangeButtons = doc.querySelectorAll('.orange-button a');
        orangeButtons.forEach(btn => {
            if (colors.secondary) btn.style.backgroundColor = colors.secondary;
            if (colors.neutral) btn.style.color = colors.neutral;
            btn.style.border = 'none';
        });

        // ===== COLOR 3 (ACCENT) - Textos, encabezados y fondos =====

        // Encabezados principales (excepto los que están sobre fondos oscuros)
        const mainHeadings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
        mainHeadings.forEach(heading => {
            // No aplicar a títulos que ya manejamos específicamente
            if (!heading.closest('.simple-cta') && !heading.closest('.calculator .section-heading')) {
                if (colors.accent) heading.style.color = colors.accent;
            }
        });

        // Texto del banner principal
        const bannerText = doc.querySelectorAll('.header-text h2, .header-text p');
        bannerText.forEach(text => {
            if (colors.neutral) text.style.color = colors.neutral;
        });

        // Línea decorativa del banner
        const bannerLine = doc.querySelectorAll('.div-dec');
        bannerLine.forEach(line => {
            if (colors.neutral) line.style.backgroundColor = colors.neutral;
        });

        // Texto de servicios
        const serviceText = doc.querySelectorAll('.service-item h4, .service-item p');
        serviceText.forEach(text => {
            if (colors.accent) text.style.color = colors.accent;
        });

        // ===== FONDOS DE SECCIONES =====

        // Fondo del header
        const headerArea = doc.querySelector('.header-area');
        if (headerArea && colors.accent) {
            headerArea.style.backgroundImage = 'none';
            headerArea.style.backgroundColor = colors.accent;
        }

        // Fondo del footer
        const footer = doc.querySelector('footer');
        if (footer && colors.accent) {
            footer.style.backgroundColor = colors.accent;
        }

        // Fondo de la sección partners
        const partners = doc.querySelector('.partners');
        if (partners && colors.accent) {
            partners.style.backgroundColor = colors.accent;
        }

        // Fondo de la sección simple-cta
        const simpleCta = doc.querySelector('.simple-cta');
        if (simpleCta && colors.accent) {
            simpleCta.style.backgroundImage = 'none';
            simpleCta.style.backgroundColor = colors.accent;
        }

        // Fondo de la sección calculator (formularios)
        const calculator = doc.querySelector('.calculator');
        if (calculator && colors.accent) {
            calculator.style.backgroundImage = 'none';
            calculator.style.backgroundColor = colors.accent;
        }

        // Fondo de las tarjetas de servicios
        const serviceItems = doc.querySelectorAll('.service-item');
        serviceItems.forEach(item => {
            if (colors.neutral) {
                item.style.backgroundColor = colors.neutral;
                item.style.boxShadow = `0px 0px 15px ${colors.accent} 20`;
            }
        });

        // Fondo del body
        const body = doc.body;
        if (body && colors.neutral) {
            body.style.backgroundColor = colors.neutral;
        }

        // ===== TEXTOS QUE DEBEN SER BLANCOS (COLOR 4) SOBRE FONDOS OSCUROS =====

        // Títulos de la sección simple-cta
        const simpleCtaTitles = doc.querySelectorAll('.simple-cta h4');
        simpleCtaTitles.forEach(title => {
            if (colors.neutral) title.style.color = colors.neutral;
        });

        // Texto de simple-cta (pero mantener em y strong con sus colores)
        const simpleCtaText = doc.querySelectorAll('.simple-cta p');
        simpleCtaText.forEach(text => {
            if (colors.neutral) text.style.color = colors.neutral;
        });

        // Títulos de los formularios (Create Account, Login)
        const formTitles = doc.querySelectorAll('.calculator .section-heading h6, .calculator .section-heading h4');
        formTitles.forEach(title => {
            if (colors.neutral) title.style.color = colors.neutral;
        });

        // Texto de la sección calculator (descripciones)
        const calculatorText = doc.querySelectorAll('.calculator p');
        calculatorText.forEach(text => {
            if (colors.neutral) text.style.color = colors.neutral;
        });

        // ===== MANTENER COLORES ESPECÍFICOS EN SIMPLE-CTA =====

        // "Solutions" debe mantener el color primary (verde)
        const solutionsText = doc.querySelectorAll('.simple-cta em');
        solutionsText.forEach(em => {
            if (colors.primary) em.style.color = colors.primary;
        });

        // "Crypto" debe mantener el color secondary (naranja)
        const cryptoText = doc.querySelectorAll('.simple-cta strong');
        cryptoText.forEach(strong => {
            if (colors.secondary) strong.style.color = colors.secondary;
        });

        // ===== FORMULARIOS =====

        // Formularios de login y registro
        const forms = doc.querySelectorAll('#create-account, #login');
        forms.forEach(form => {
            if (colors.neutral) {
                form.style.backgroundColor = colors.neutral;
            }
            if (colors.accent) {
                form.style.border = `1px solid ${colors.accent} 30`;
            }
        });

        // Inputs de formularios
        const formInputs = doc.querySelectorAll('#create-account input, #login input, #create-account select, #login select');
        formInputs.forEach(input => {
            if (colors.neutral) {
                input.style.backgroundColor = colors.neutral;
            }
            if (colors.accent) {
                input.style.borderColor = colors.accent;
                input.style.color = colors.accent;
            }
        });

        // Labels de formularios
        const formLabels = doc.querySelectorAll('#create-account label, #login label');
        formLabels.forEach(label => {
            if (colors.accent) label.style.color = colors.accent;
        });

        // Botón "Crear Cuenta" (primary)
        const createAccountBtn = doc.querySelector('#create-account button[type="submit"]');
        if (createAccountBtn) {
            if (colors.primary) createAccountBtn.style.backgroundColor = colors.primary;
            if (colors.neutral) createAccountBtn.style.color = colors.neutral;
            createAccountBtn.style.border = 'none';
        }

        // Botón "Iniciar Sesión" (secondary)
        const loginBtn = doc.querySelector('#login button[type="submit"]');
        if (loginBtn) {
            if (colors.secondary) loginBtn.style.backgroundColor = colors.secondary;
            if (colors.neutral) loginBtn.style.color = colors.neutral;
            loginBtn.style.border = 'none';
        }

        // ===== ELEMENTOS ADICIONALES =====

        // Texto del footer
        const footerText = doc.querySelectorAll('footer p');
        footerText.forEach(text => {
            if (colors.neutral) text.style.color = colors.neutral;
        });

        // Enlaces del footer
        const footerLinks = doc.querySelectorAll('footer a');
        footerLinks.forEach(link => {
            if (colors.secondary) link.style.color = colors.secondary;
        });

        // Navegación del header
        const navLinks = doc.querySelectorAll('.header-area .main-nav .nav li a');
        navLinks.forEach(link => {
            if (colors.neutral) link.style.color = colors.neutral;
        });

        // Logo (si es texto)
        const logo = doc.querySelector('.header-area .logo');
        if (logo && !logo.querySelector('img') && colors.neutral) {
            logo.style.color = colors.neutral;
        }

        // Sección de testimonios
        const testimonialIcons = doc.querySelectorAll('.testimonials .fa-quote-left');
        testimonialIcons.forEach(icon => {
            if (colors.primary) {
                icon.style.backgroundColor = colors.primary;
                icon.style.color = colors.neutral;
            }
        });

        // Nombres en testimonios
        const testimonialNames = doc.querySelectorAll('.testimonials h4');
        testimonialNames.forEach(name => {
            if (colors.accent) name.style.color = colors.accent;
        });

        // Texto de testimonios
        const testimonialText = doc.querySelectorAll('.testimonials p');
        testimonialText.forEach(text => {
            if (colors.accent) text.style.color = colors.accent;
        });

        // Fondo de testimonios
        const testimonialItems = doc.querySelectorAll('.testimonials .item');
        testimonialItems.forEach(item => {
            if (colors.neutral) item.style.backgroundColor = colors.neutral;
        });

        // Sección about us
        const aboutUsItems = doc.querySelectorAll('.about-us .gradient-border');
        aboutUsItems.forEach(item => {
            if (colors.neutral) item.style.backgroundColor = colors.neutral;
            if (colors.accent) item.style.color = colors.accent;
        });

        // Tablas en about us
        const aboutUsTables = doc.querySelectorAll('.about-us .main-list, .about-us .list-item');
        aboutUsTables.forEach(table => {
            if (colors.neutral) table.style.backgroundColor = colors.neutral;
            if (colors.accent) {
                table.style.color = colors.accent;
                table.style.borderBottomColor = `${colors.accent} 20`;
            }
        });
    }

    // ---------- Color history (similar to typography) ----------
    // Default Mexant colors - always first entry, protected (can't edit/delete)
    const MEXANT_DEFAULT_COLORS = {
        name: 'Mexant (Colores Originales)',
        primary: '#43ba7f',
        secondary: '#ff511a',
        accent: '#212741',
        neutral: '#ffffff',
        timestamp: null, // No timestamp for default
        isProtected: true
    };

    function loadColorHistory() {
        try {
            const saved = JSON.parse(localStorage.getItem('admin_color_history') || '[]');
            // Ensure Mexant default is always first
            const hasDefault = saved.length > 0 && saved[0].isProtected;
            if (!hasDefault) {
                return [MEXANT_DEFAULT_COLORS, ...saved];
            }
            // Update the protected entry in case saved version is outdated
            saved[0] = MEXANT_DEFAULT_COLORS;
            return saved;
        } catch (e) {
            return [MEXANT_DEFAULT_COLORS];
        }
    }
    function saveColorHistory(arr) {
        try {
            // Don't save the protected entry, we'll add it on load
            const toSave = arr.filter(entry => !entry.isProtected);
            localStorage.setItem('admin_color_history', JSON.stringify(toSave));
        } catch (e) {
            console.warn('No se pudo guardar historial de colores', e);
        }
    }

    function renderColorHistory() {
        const tbody = document.querySelector('#colors-changes tbody');
        if (!tbody) return;
        const hist = loadColorHistory();
        tbody.innerHTML = '';
        hist.forEach((entry, idx) => {
            const tr = document.createElement('tr');
            const idTd = document.createElement('td');
            idTd.textContent = (idx + 1).toString();
            tr.appendChild(idTd);

            // Nombre de la paleta
            const nameTd = document.createElement('td');
            nameTd.textContent = entry.name || 'Sin nombre';
            tr.appendChild(nameTd);

            // Helper function to create color cell with preview box
            const createColorCell = (colorValue) => {
                const td = document.createElement('td');

                // Use a wrapper div for flexbox layout instead of td
                const wrapper = document.createElement('div');
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.gap = '8px';

                const colorBox = document.createElement('span');
                colorBox.style.display = 'inline-block';
                colorBox.style.width = '20px';
                colorBox.style.height = '20px';
                colorBox.style.borderRadius = '4px';
                colorBox.style.backgroundColor = colorValue || '#fff';
                colorBox.style.border = '1px solid #ddd';
                colorBox.style.flexShrink = '0';

                const hexText = document.createElement('span');
                hexText.textContent = colorValue || '';

                wrapper.appendChild(colorBox);
                wrapper.appendChild(hexText);
                td.appendChild(wrapper);
                return td;
            };

            tr.appendChild(createColorCell(entry.primary));
            tr.appendChild(createColorCell(entry.secondary));
            tr.appendChild(createColorCell(entry.accent));
            tr.appendChild(createColorCell(entry.neutral));

            // ELIMINADO: td para color 5

            const timeTd = document.createElement('td');
            if (entry.isProtected) {
                timeTd.textContent = 'Original';
                timeTd.style.fontWeight = 'bold';
                timeTd.style.color = '#43ba7f';  // Green color for protected
            } else {
                timeTd.textContent = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '';
            }
            tr.appendChild(timeTd);

            tr.addEventListener('contextmenu', function (ev) {
                ev.preventDefault();
                showColorContextMenu(ev.pageX, ev.pageY, idx);
            });
            tbody.appendChild(tr);
        });
    }

    // Color context menu (separate instance)
    let colorContextMenuEl = null;
    function ensureColorContextMenu() {
        if (colorContextMenuEl) return colorContextMenuEl;
        colorContextMenuEl = document.createElement('div');
        colorContextMenuEl.id = 'color-context-menu';
        colorContextMenuEl.style.position = 'absolute';
        colorContextMenuEl.style.zIndex = 9999;
        colorContextMenuEl.style.background = '#fff';
        colorContextMenuEl.style.border = '1px solid #ccc';
        colorContextMenuEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
        colorContextMenuEl.style.padding = '6px 0';
        colorContextMenuEl.style.minWidth = '140px';
        colorContextMenuEl.style.display = 'none';
        const opts = ['Editar', 'Eliminar', 'Aplicar'];
        opts.forEach((label) => {
            const item = document.createElement('div');
            item.textContent = label;
            item.style.padding = '8px 12px';
            item.style.cursor = 'pointer';
            item.addEventListener('mouseenter', () => item.style.background = '#f0f0f0');
            item.addEventListener('mouseleave', () => item.style.background = 'transparent');
            item.dataset.action = label.toLowerCase();
            colorContextMenuEl.appendChild(item);
        });
        document.body.appendChild(colorContextMenuEl);
        document.addEventListener('click', function () { if (colorContextMenuEl) colorContextMenuEl.style.display = 'none'; });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && colorContextMenuEl) colorContextMenuEl.style.display = 'none'; });
        return colorContextMenuEl;
    }

    function showColorContextMenu(x, y, index) {
        const menu = ensureColorContextMenu();
        const hist = loadColorHistory();
        const entry = hist[index];
        const isProtected = entry && entry.isProtected;

        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.display = 'block';

        Array.from(menu.children).forEach(child => {
            const action = child.dataset.action;

            // Disable edit and delete for protected entries
            if (isProtected && (action === 'editar' || action === 'eliminar')) {
                child.style.opacity = '0.4';
                child.style.cursor = 'not-allowed';
                child.style.pointerEvents = 'none';
            } else {
                child.style.opacity = '1';
                child.style.cursor = 'pointer';
                child.style.pointerEvents = 'auto';
            }

            child.onclick = function (ev) {
                handleColorContextAction(action, index);
                menu.style.display = 'none';
            };
        });
    }

    function handleColorContextAction(action, index) {
        console.log('handleColorContextAction called with action:', action, 'index:', index);
        const hist = loadColorHistory();
        const entry = hist[index];
        if (!entry) return;

        // Block edit and delete for protected entries
        if (entry.isProtected && (action === 'editar' || action === 'eliminar')) {
            alert('Esta entrada está protegida y no se puede ' + (action === 'editar' ? 'editar' : 'eliminar') + '.');
            return;
        }

        if (action === 'editar') {
            console.log('Calling showColorEditConfirmation');
            showColorEditConfirmation(index, entry);
        } else if (action === 'eliminar') {
            console.log('Calling showColorDeleteConfirmation');
            showColorDeleteConfirmation(index);
        } else if (action === 'aplicar') {
            console.log('Calling showColorApplyConfirmation');
            showColorApplyConfirmation(index, entry);
        }
    }

    // Color delete confirmation modal
    let colorConfirmOverlay = null;
    function ensureColorConfirmModal() {
        if (colorConfirmOverlay) return colorConfirmOverlay;
        colorConfirmOverlay = document.createElement('div');
        colorConfirmOverlay.className = 'admin-confirm-overlay';
        colorConfirmOverlay.innerHTML = `
            <div class="admin-confirm" role="dialog" aria-modal="true">
                <h3>Confirmar eliminación (colores)</h3>
                <p>¿Eliminar esta entrada del historial de colores?</p>
                <div class="confirm-actions">
                    <button class="btn-cancel">Cancelar</button>
                    <button class="btn-confirm">Eliminar</button>
                </div>
            </div>`;
        document.body.appendChild(colorConfirmOverlay);
        // Apply high-contrast inline styles so modal is visible regardless of theme colors
        try {
            colorConfirmOverlay.style.position = 'fixed';
            colorConfirmOverlay.style.left = '0';
            colorConfirmOverlay.style.top = '0';
            colorConfirmOverlay.style.right = '0';
            colorConfirmOverlay.style.bottom = '0';
            colorConfirmOverlay.style.display = 'none';
            colorConfirmOverlay.style.alignItems = 'center';
            colorConfirmOverlay.style.justifyContent = 'center';
            colorConfirmOverlay.style.background = 'rgba(0,0,0,0.36)';
            colorConfirmOverlay.style.zIndex = '10000';
            const dialog = colorConfirmOverlay.querySelector('.admin-confirm');
            if (dialog) {
                dialog.style.background = '#ffffff';
                dialog.style.color = '#111111';
                dialog.style.padding = '20px';
                dialog.style.borderRadius = '8px';
                dialog.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
                dialog.style.maxWidth = '520px';
                dialog.style.width = '90%';
            }
            const btnCancel = colorConfirmOverlay.querySelector('.btn-cancel');
            const btnConfirm = colorConfirmOverlay.querySelector('.btn-confirm');
            if (btnCancel) {
                btnCancel.style.background = '#f0f0f0';
                btnCancel.style.color = '#111111';
                btnCancel.style.border = '1px solid rgba(0,0,0,0.08)';
                btnCancel.style.padding = '8px 12px';
                btnCancel.style.borderRadius = '4px';
                btnCancel.style.cursor = 'pointer';
            }
            if (btnConfirm) {
                btnConfirm.style.background = '#e53935';
                btnConfirm.style.color = '#ffffff';
                btnConfirm.style.border = 'none';
                btnConfirm.style.padding = '8px 12px';
                btnConfirm.style.borderRadius = '4px';
                btnConfirm.style.cursor = 'pointer';
            }
            const actions = colorConfirmOverlay.querySelector('.confirm-actions');
            if (actions) { actions.style.display = 'flex'; actions.style.gap = '8px'; actions.style.justifyContent = 'flex-end'; actions.style.marginTop = '12px'; }
        } catch (e) { }
        // handlers
        colorConfirmOverlay.querySelector('.btn-cancel').addEventListener('click', () => { colorConfirmOverlay.style.display = 'none'; });
        colorConfirmOverlay.querySelector('.btn-confirm').addEventListener('click', () => {
            const idx = colorConfirmOverlay.dataset.deleteIndex;
            try {
                const h = loadColorHistory();
                if (typeof idx !== 'undefined') {
                    h.splice(parseInt(idx, 10), 1);
                    saveColorHistory(h);
                    renderColorHistory();
                }
            } catch (e) { console.warn('Error eliminando entrada de colores', e); }
            colorConfirmOverlay.style.display = 'none';
        });
        return colorConfirmOverlay;
    }

    function showColorDeleteConfirmation(index) {
        const modal = ensureColorConfirmModal();
        modal.dataset.deleteIndex = index;
        // ensure inline styles enforced before showing
        try {
            modal.style.display = 'flex';
        } catch (e) { }
    }

    // ---------- Color Edit Confirmation Modal ----------
    let colorEditOverlay = null;
    function ensureColorEditModal() {
        if (colorEditOverlay) return colorEditOverlay;
        colorEditOverlay = document.createElement('div');
        colorEditOverlay.className = 'admin-confirm-overlay';
        colorEditOverlay.innerHTML = `
            <div class="admin-confirm" role="dialog" aria-modal="true">
                <h3>Editar Paleta de Colores</h3>
                <p>Ingresa un nuevo nombre para esta paleta:</p>
                <input type="text" id="edit-palette-name" class="form-control" placeholder="Nombre de la paleta" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 6px;">
                <div class="confirm-actions">
                    <button class="btn-cancel">Cancelar</button>
                    <button class="btn-confirm" style="background: #1B73E8 !important;">Guardar</button>
                </div>
            </div>`;
        document.body.appendChild(colorEditOverlay);

        // Apply styles
        colorEditOverlay.style.position = 'fixed';
        colorEditOverlay.style.left = '0';
        colorEditOverlay.style.top = '0';
        colorEditOverlay.style.right = '0';
        colorEditOverlay.style.bottom = '0';
        colorEditOverlay.style.display = 'none';
        colorEditOverlay.style.alignItems = 'center';
        colorEditOverlay.style.justifyContent = 'center';
        colorEditOverlay.style.background = 'rgba(0,0,0,0.36)';
        colorEditOverlay.style.zIndex = '10000';

        const dialog = colorEditOverlay.querySelector('.admin-confirm');
        if (dialog) {
            dialog.style.background = '#ffffff';
            dialog.style.color = '#111111';
            dialog.style.padding = '20px';
            dialog.style.borderRadius = '8px';
            dialog.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
            dialog.style.maxWidth = '520px';
            dialog.style.width = '90%';
        }

        const btnCancel = colorEditOverlay.querySelector('.btn-cancel');
        const btnConfirm = colorEditOverlay.querySelector('.btn-confirm');
        if (btnCancel) {
            btnCancel.style.background = '#f0f0f0';
            btnCancel.style.color = '#111111';
            btnCancel.style.border = '1px solid rgba(0,0,0,0.08)';
            btnCancel.style.padding = '8px 12px';
            btnCancel.style.borderRadius = '4px';
            btnCancel.style.cursor = 'pointer';
        }
        if (btnConfirm) {
            btnConfirm.style.background = '#1B73E8';
            btnConfirm.style.color = '#ffffff';
            btnConfirm.style.border = 'none';
            btnConfirm.style.padding = '8px 12px';
            btnConfirm.style.borderRadius = '4px';
            btnConfirm.style.cursor = 'pointer';
        }

        const actions = colorEditOverlay.querySelector('.confirm-actions');
        if (actions) { actions.style.display = 'flex'; actions.style.gap = '8px'; actions.style.justifyContent = 'flex-end'; actions.style.marginTop = '12px'; }

        // Handlers
        colorEditOverlay.querySelector('.btn-cancel').addEventListener('click', () => { colorEditOverlay.style.display = 'none'; });
        colorEditOverlay.querySelector('.btn-confirm').addEventListener('click', () => {
            const idx = parseInt(colorEditOverlay.dataset.editIndex, 10);
            const newName = colorEditOverlay.querySelector('#edit-palette-name').value.trim() || 'Sin nombre';
            try {
                const h = loadColorHistory();
                if (h[idx] && !h[idx].isProtected) {
                    h[idx].name = newName;
                    h[idx].timestamp = Date.now();
                    saveColorHistory(h);
                    renderColorHistory();
                }
            } catch (e) { console.warn('Error editando entrada de colores', e); }
            colorEditOverlay.style.display = 'none';
        });

        return colorEditOverlay;
    }

    function showColorEditConfirmation(index, entry) {
        const modal = ensureColorEditModal();
        modal.dataset.editIndex = index;
        modal.querySelector('#edit-palette-name').value = entry.name || '';
        modal.style.display = 'flex';
    }

    // ---------- Color Apply Confirmation Modal ----------
    let colorApplyOverlay = null;
    function ensureColorApplyModal() {
        if (colorApplyOverlay) return colorApplyOverlay;
        colorApplyOverlay = document.createElement('div');
        colorApplyOverlay.className = 'admin-confirm-overlay';
        colorApplyOverlay.innerHTML = `
            <div class="admin-confirm" role="dialog" aria-modal="true">
                <h3>Aplicar Paleta de Colores</h3>
                <p>¿Estás seguro de que deseas aplicar esta paleta de colores?</p>
                <div class="palette-preview" style="display: flex; gap: 8px; margin: 15px 0;">
                    <div class="preview-color" data-color="primary" style="width: 40px; height: 40px; border-radius: 6px; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.15);"></div>
                    <div class="preview-color" data-color="secondary" style="width: 40px; height: 40px; border-radius: 6px; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.15);"></div>
                    <div class="preview-color" data-color="accent" style="width: 40px; height: 40px; border-radius: 6px; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.15);"></div>
                    <div class="preview-color" data-color="neutral" style="width: 40px; height: 40px; border-radius: 6px; border: 2px solid #ddd; box-shadow: 0 2px 6px rgba(0,0,0,0.15);"></div>
                </div>
                <div class="confirm-actions">
                    <button class="btn-cancel">Cancelar</button>
                    <button class="btn-confirm" style="background: #34A853 !important;">Aplicar</button>
                </div>
            </div>`;
        document.body.appendChild(colorApplyOverlay);

        // Apply styles
        colorApplyOverlay.style.position = 'fixed';
        colorApplyOverlay.style.left = '0';
        colorApplyOverlay.style.top = '0';
        colorApplyOverlay.style.right = '0';
        colorApplyOverlay.style.bottom = '0';
        colorApplyOverlay.style.display = 'none';
        colorApplyOverlay.style.alignItems = 'center';
        colorApplyOverlay.style.justifyContent = 'center';
        colorApplyOverlay.style.background = 'rgba(0,0,0,0.36)';
        colorApplyOverlay.style.zIndex = '10000';

        const dialog = colorApplyOverlay.querySelector('.admin-confirm');
        if (dialog) {
            dialog.style.background = '#ffffff';
            dialog.style.color = '#111111';
            dialog.style.padding = '20px';
            dialog.style.borderRadius = '8px';
            dialog.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
            dialog.style.maxWidth = '520px';
            dialog.style.width = '90%';
        }

        const btnCancel = colorApplyOverlay.querySelector('.btn-cancel');
        const btnConfirm = colorApplyOverlay.querySelector('.btn-confirm');
        if (btnCancel) {
            btnCancel.style.background = '#f0f0f0';
            btnCancel.style.color = '#111111';
            btnCancel.style.border = '1px solid rgba(0,0,0,0.08)';
            btnCancel.style.padding = '8px 12px';
            btnCancel.style.borderRadius = '4px';
            btnCancel.style.cursor = 'pointer';
        }
        if (btnConfirm) {
            btnConfirm.style.background = '#34A853';
            btnConfirm.style.color = '#ffffff';
            btnConfirm.style.border = 'none';
            btnConfirm.style.padding = '8px 12px';
            btnConfirm.style.borderRadius = '4px';
            btnConfirm.style.cursor = 'pointer';
        }

        const actions = colorApplyOverlay.querySelector('.confirm-actions');
        if (actions) { actions.style.display = 'flex'; actions.style.gap = '8px'; actions.style.justifyContent = 'flex-end'; actions.style.marginTop = '12px'; }

        // Handlers
        colorApplyOverlay.querySelector('.btn-cancel').addEventListener('click', () => { colorApplyOverlay.style.display = 'none'; });
        colorApplyOverlay.querySelector('.btn-confirm').addEventListener('click', () => {
            const idx = parseInt(colorApplyOverlay.dataset.applyIndex, 10);
            try {
                const h = loadColorHistory();
                const entry = h[idx];
                if (entry) {
                    applyColorsToUI({ primary: entry.primary, secondary: entry.secondary, accent: entry.accent, neutral: entry.neutral });
                    localStorage.setItem('admin_color_settings', JSON.stringify({ primary: entry.primary, secondary: entry.secondary, accent: entry.accent, neutral: entry.neutral }));

                    // Update color inputs
                    if (document.getElementById('color-1')) document.getElementById('color-1').value = entry.primary || '';
                    if (document.getElementById('color-1-hex')) document.getElementById('color-1-hex').value = entry.primary || '';
                    if (document.getElementById('color-2')) document.getElementById('color-2').value = entry.secondary || '';
                    if (document.getElementById('color-2-hex')) document.getElementById('color-2-hex').value = entry.secondary || '';
                    if (document.getElementById('color-3')) document.getElementById('color-3').value = entry.accent || '';
                    if (document.getElementById('color-3-hex')) document.getElementById('color-3-hex').value = entry.accent || '';
                    if (document.getElementById('color-4')) document.getElementById('color-4').value = entry.neutral || '';
                    if (document.getElementById('color-4-hex')) document.getElementById('color-4-hex').value = entry.neutral || '';
                    if (document.getElementById('palette-name')) document.getElementById('palette-name').value = entry.name || '';

                    // Update color previews
                    document.querySelectorAll('.color-item').forEach((item, i) => {
                        const preview = item.querySelector('.color-preview');
                        if (preview) {
                            const colors = [entry.primary, entry.secondary, entry.accent, entry.neutral];
                            if (colors[i]) preview.style.backgroundColor = colors[i];
                        }
                    });
                }
            } catch (e) { console.warn('Error aplicando colores', e); }
            colorApplyOverlay.style.display = 'none';
        });

        return colorApplyOverlay;
    }

    function showColorApplyConfirmation(index, entry) {
        const modal = ensureColorApplyModal();
        modal.dataset.applyIndex = index;

        // Update preview colors
        const previews = modal.querySelectorAll('.preview-color');
        previews.forEach(p => {
            const colorType = p.dataset.color;
            if (entry[colorType]) p.style.backgroundColor = entry[colorType];
        });

        modal.style.display = 'flex';
    }

    function applyColorsToUI(settings) {
        if (!settings) return;
        try { if (settings.primary) document.documentElement.style.setProperty('--primary-color', settings.primary); } catch (e) { }
        try { if (settings.secondary) document.documentElement.style.setProperty('--secondary-color', settings.secondary); } catch (e) { }
        try { if (settings.accent) document.documentElement.style.setProperty('--accent-color', settings.accent); } catch (e) { }
        try { if (settings.neutral) document.documentElement.style.setProperty('--neutral-color', settings.neutral); } catch (e) { }
        // ELIMINADO: color 5

        // update inputs & previews
        try { if (document.getElementById('color-1')) document.getElementById('color-1').value = settings.primary || ''; } catch (e) { }
        try { if (document.getElementById('color-2')) document.getElementById('color-2').value = settings.secondary || ''; } catch (e) { }
        try { if (document.getElementById('color-3')) document.getElementById('color-3').value = settings.accent || ''; } catch (e) { }
        try { if (document.getElementById('color-4')) document.getElementById('color-4').value = settings.neutral || ''; } catch (e) { }
        // ELIMINADO: color 5

        // update hex text inputs and preview boxes
        document.querySelectorAll('.color-item').forEach(parent => {
            try {
                const hexInput = parent.querySelector('input[type="text"][id$="-hex"]');
                const preview = parent.querySelector('.color-preview');
                const id = hexInput?.id || '';
                if (id.indexOf('color-1') >= 0) {
                    if (hexInput) hexInput.value = settings.primary || hexInput.value;
                    if (preview) preview.style.backgroundColor = settings.primary || preview.style.backgroundColor;
                }
                if (id.indexOf('color-2') >= 0) {
                    if (hexInput) hexInput.value = settings.secondary || hexInput.value;
                    if (preview) preview.style.backgroundColor = settings.secondary || preview.style.backgroundColor;
                }
                if (id.indexOf('color-3') >= 0) {
                    if (hexInput) hexInput.value = settings.accent || hexInput.value;
                    if (preview) preview.style.backgroundColor = settings.accent || preview.style.backgroundColor;
                }
                if (id.indexOf('color-4') >= 0) {
                    if (hexInput) hexInput.value = settings.neutral || hexInput.value;
                    if (preview) preview.style.backgroundColor = settings.neutral || preview.style.backgroundColor;
                }
                // ELIMINADO: color-5
            } catch (e) { }
        });
    }

    // Initialize color controls from saved settings
    (function initColorControls() {
        try {
            const saved = (function () {
                try {
                    return JSON.parse(localStorage.getItem('admin_color_settings') || 'null');
                } catch (e) {
                    return null;
                }
            })();
            if (saved) applyColorsToUI(saved);
        } catch (e) { console.warn('No se pudo inicializar controles de color', e); }

        // ensure there is at least one history entry - SOLO 4 COLORES
        try {
            const ch = loadColorHistory();
            if (!ch || ch.length === 0) {
                const defaultEntry = {
                    primary: '#43ba7f',
                    secondary: '#ff511a',
                    accent: '#212741',
                    neutral: '#ffffff',
                    timestamp: ''
                };
                saveColorHistory([defaultEntry]);
            }
        } catch (e) { }
        renderColorHistory();
    })();

    // Make color preview boxes open a color picker when clicked
    (function wireColorPreviewClick() {
        try {
            const previews = document.querySelectorAll('.color-preview');
            previews.forEach((box, idx) => {
                // try to derive the matching text input by DOM proximity
                const parent = box.closest('.color-item');
                if (!parent) return;
                const hexInput = parent.querySelector('input[type="text"][id$="-hex"]');
                const colorInputId = 'js-color-picker-' + (hexInput ? hexInput.id : idx);

                // Prefer the visible color input inside the same .color-item if available
                let colorInput = parent.querySelector('input[type="color"]');
                // fallback: create a hidden input[type=color] if not present
                if (!colorInput) {
                    colorInput = document.getElementById(colorInputId);
                    if (!colorInput) {
                        colorInput = document.createElement('input');
                        colorInput.type = 'color';
                        colorInput.id = colorInputId;
                        colorInput.style.position = 'absolute';
                        colorInput.style.left = '-9999px';
                        document.body.appendChild(colorInput);
                    }
                }

                // initialize color input from hex text or preview background
                const initColor = (hexInput && hexInput.value) ? hexInput.value : (window.getComputedStyle(box).backgroundColor || '#ffffff');
                try { // convert rgb(...) to hex if needed
                    if (initColor.indexOf('rgb') === 0) {
                        const nums = initColor.match(/\d+/g);
                        if (nums && nums.length >= 3) {
                            const hx = '#' + nums.slice(0, 3).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('');
                            colorInput.value = hx;
                        }
                    } else {
                        colorInput.value = initColor;
                    }
                } catch (e) { colorInput.value = '#ffffff'; }

                // on change, update preview background and hex input
                // avoid attaching multiple listeners to the same element
                if (!colorInput.dataset || !colorInput.dataset._colorWired) {
                    colorInput.addEventListener('input', function () {
                        try {
                            box.style.backgroundColor = this.value;
                            if (hexInput) hexInput.value = this.value;
                        } catch (e) { }
                    });
                    try { colorInput.dataset._colorWired = '1'; } catch (e) { }
                }

                // when user clicks the preview box, open the color input
                box.style.cursor = 'pointer';
                box.addEventListener('click', function () {
                    try {
                        // focus & open color input — clicking the input programmatically opens the color picker in most browsers
                        colorInput.click();
                    } catch (e) {
                        // fallback: focus the hidden input so user can use keyboard
                        try { colorInput.focus(); } catch (e) { }
                    }
                });
            });
        } catch (e) { console.warn('No se pudieron enlazar previews de color', e); }
    })();

    // ---------- Custom Font Upload with IndexedDB ----------
    const FONT_DB_NAME = 'CustomFontsDB';
    const FONT_STORE_NAME = 'fonts';
    let fontDB = null;

    // Open or create IndexedDB database for custom fonts
    function openFontDB() {
        return new Promise((resolve, reject) => {
            if (fontDB) { resolve(fontDB); return; }
            const request = indexedDB.open(FONT_DB_NAME, 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => { fontDB = request.result; resolve(fontDB); };
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(FONT_STORE_NAME)) {
                    db.createObjectStore(FONT_STORE_NAME, { keyPath: 'name' });
                }
            };
        });
    }

    // Save a custom font to IndexedDB
    function saveCustomFont(name, blob) {
        return openFontDB().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(FONT_STORE_NAME, 'readwrite');
                const store = tx.objectStore(FONT_STORE_NAME);
                store.put({ name, blob, timestamp: Date.now() });
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        });
    }

    // Load all custom fonts from IndexedDB
    function loadCustomFonts() {
        return openFontDB().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction(FONT_STORE_NAME, 'readonly');
                const store = tx.objectStore(FONT_STORE_NAME);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
            });
        });
    }

    // Inject @font-face rule for a custom font into a document
    function injectCustomFontFace(doc, fontName, blob) {
        if (!doc || !fontName || !blob) return Promise.resolve();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const dataUrl = e.target.result;
                const styleId = 'custom-font-' + fontName.replace(/\s+/g, '-');
                if (doc.getElementById(styleId)) { resolve(); return; }
                const style = doc.createElement('style');
                style.id = styleId;
                style.textContent = `@font-face { font-family: '${fontName}'; src: url('${dataUrl}') format('truetype'); font-weight: normal; font-style: normal; }`;
                doc.head.appendChild(style);
                resolve();
            };
            reader.onerror = () => resolve();
            reader.readAsDataURL(blob);
        });
    }

    // Cache for loaded custom fonts
    let customFontsCache = [];

    // Load custom fonts, update selectors, and re-render history
    function loadAndRefreshCustomFonts() {
        loadCustomFonts().then(fonts => {
            customFontsCache = fonts;
            refreshFontSelectors();
            // Re-render history to apply font styles now that fonts are loaded
            if (typeof renderHistory === 'function') {
                renderHistory();
            }
        }).catch(e => {
            console.warn('Error cargando fuentes personalizadas:', e);
        });
    }

    // Refresh font selectors to include custom fonts
    function refreshFontSelectors() {
        const primarySelect = document.getElementById('primary-font');
        const secondarySelect = document.getElementById('secondary-font');
        if (!primarySelect || !secondarySelect) return;

        const baseFonts = ['Poppins', 'Roboto', 'Open Sans', 'Montserrat', 'Lato', 'Playfair Display', 'Arial', 'Helvetica', 'Times New Roman'];
        const customNames = customFontsCache.map(f => f.name);

        const currentPrimary = primarySelect.value;
        const currentSecondary = secondarySelect.value;

        // Helper to populate a select
        const populate = (select, current) => {
            select.innerHTML = '';
            // Add custom fonts first (with prefix indicator)
            customNames.forEach(name => {
                const opt = document.createElement('option');
                opt.value = 'custom:' + name;
                opt.textContent = '⭐ ' + name;
                if (current === 'custom:' + name) opt.selected = true;
                select.appendChild(opt);
            });
            // Add separator if there are custom fonts
            if (customNames.length > 0) {
                const sep = document.createElement('option');
                sep.disabled = true;
                sep.textContent = '─────────────────';
                select.appendChild(sep);
            }
            // Add base fonts
            baseFonts.forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                if (current === name) opt.selected = true;
                select.appendChild(opt);
            });
        };

        populate(primarySelect, currentPrimary);
        populate(secondarySelect, currentSecondary);
    }

    // Handle font file upload
    const fontFileInput = document.getElementById('font-file-input');
    const btnUploadFont = document.getElementById('btn-upload-font');

    if (btnUploadFont && fontFileInput) {
        btnUploadFont.addEventListener('click', () => fontFileInput.click());

        fontFileInput.addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;

            // Extract font name from filename (without extension)
            let fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');
            fontName = fontName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

            // Capitalize first letter of each word
            fontName = fontName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

            // Check if font already exists
            if (customFontsCache.some(f => f.name.toLowerCase() === fontName.toLowerCase())) {
                alert(`La fuente "${fontName}" ya existe.`);
                this.value = '';
                return;
            }

            // Save the font
            saveCustomFont(fontName, file).then(() => {
                loadAndRefreshCustomFonts();
                alert(`Fuente "${fontName}" subida correctamente.`);
            }).catch(e => {
                console.error('Error guardando fuente:', e);
                alert('Error al guardar la fuente.');
            });

            this.value = ''; // Reset file input
        });
    }

    // Initialize custom fonts on page load
    loadAndRefreshCustomFonts();
    // ---------- Typography preview and persistence (new) ----------
    const iframe = document.getElementById('site-preview');
    const primarySelect = document.getElementById('primary-font');
    const secondarySelect = document.getElementById('secondary-font');
    const applyTypoBtn = document.getElementById('apply-typography');
    const storageKey = 'admin_typography_settings';
    const historyKey = 'admin_typography_history';

    // Sliders for sizes (if present)
    const titleSlider = document.getElementById('title-size');
    const subtitleSlider = document.getElementById('subtitle-size');
    const paragraphSlider = document.getElementById('paragraph-size');

    function safeGetIframeDoc() {
        try { return iframe?.contentDocument || iframe?.contentWindow?.document; }
        catch (e) { console.warn('No se puede acceder al iframe:', e); return null; }
    }

    function normFontName(f) { return (f || '').split(',')[0].replace(/["']/g, '').trim(); }

    function detectFontsFromIframe() {
        const doc = safeGetIframeDoc();
        if (!doc) return { primary: 'Poppins', secondary: 'Poppins' };
        const body = doc.body;
        const bodyFont = normFontName(getComputedStyle(body).getPropertyValue('font-family')) || 'Poppins';
        // Titles are h2 on this site, use first h2 to detect title font
        const h2 = doc.querySelector('h2');
        const h2Font = h2 ? normFontName(getComputedStyle(h2).getPropertyValue('font-family')) : bodyFont;
        return { primary: h2Font, secondary: bodyFont };
    }

    function detectSizesFromIframe() {
        const doc = safeGetIframeDoc();
        // Defaults adjusted to the site's original sizes
        if (!doc) return { titleSize: 56, subtitleSize: 36, paragraphSize: 15 };
        function pxToInt(v) { try { return Math.round(parseFloat(v)); } catch (e) { return undefined; } }
        // Titles are h2, subtitles are h4, paragraphs are p
        const h2 = doc.querySelector('h2');
        const h4 = doc.querySelector('h4');
        const p = doc.querySelector('p');
        const titleSize = h2 ? pxToInt(getComputedStyle(h2).getPropertyValue('font-size')) : undefined;
        const subtitleSize = h4 ? pxToInt(getComputedStyle(h4).getPropertyValue('font-size')) : undefined;
        const paragraphSize = p ? pxToInt(getComputedStyle(p).getPropertyValue('font-size')) : undefined;
        return { titleSize: titleSize || 56, subtitleSize: subtitleSize || 36, paragraphSize: paragraphSize || 15 };
    }

    function populateFontSelect(selectEl, current) {
        if (!selectEl) return;
        const fallback = ['Poppins', 'Roboto', 'Open Sans', 'Montserrat', 'Lato', 'Playfair Display', 'Arial', 'Helvetica', 'Times New Roman'];
        selectEl.innerHTML = '';
        const add = (name) => { const o = document.createElement('option'); o.value = name; o.textContent = name; selectEl.appendChild(o); };
        add(current);
        fallback.forEach(f => { if (f !== current) add(f); });
    }

    function injectGoogleFontInDoc(doc, font) {
        if (!doc || !font) return;
        const id = 'gf-' + font.replace(/\s+/g, '-');
        if (doc.getElementById(id)) return;
        const link = doc.createElement('link');
        link.id = id; link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(font) + ':wght@300;400;500;600;700&display=swap';
        doc.head.appendChild(link);
    }

    function applyTypographyToIframe(settings) {
        const doc = safeGetIframeDoc();
        if (!doc) return;
        // inject fonts
        if (settings.primary) injectGoogleFontInDoc(doc, settings.primary);
        if (settings.secondary) injectGoogleFontInDoc(doc, settings.secondary);

        // Apply font to body (affects all elements)
        if (settings.secondary) {
            doc.body.style.setProperty('font-family', settings.secondary + ', sans-serif', 'important');
        }

        // All heading elements use primary font
        const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        if (settings.primary) {
            headings.forEach(tag => {
                doc.querySelectorAll(tag).forEach(el => {
                    el.style.setProperty('font-family', settings.primary + ', sans-serif', 'important');
                });
            });
        }

        // All other text elements use secondary font
        const textElements = ['p', 'a', 'span', 'li', 'label', 'button', 'input', 'textarea', 'em', 'strong'];
        if (settings.secondary) {
            textElements.forEach(tag => {
                doc.querySelectorAll(tag).forEach(el => {
                    el.style.setProperty('font-family', settings.secondary + ', sans-serif', 'important');
                });
            });
        }

        // Set CSS variables on :root for font sizes (this affects CSS rules using these variables)
        const root = doc.documentElement;
        if (typeof settings.titleSize !== 'undefined') {
            root.style.setProperty('--title-font-size', settings.titleSize + 'px');
            // Also apply inline for elements without CSS variable usage
            doc.querySelectorAll('h1, h2').forEach(el => {
                el.style.setProperty('font-size', settings.titleSize + 'px', 'important');
            });
        }
        if (typeof settings.subtitleSize !== 'undefined') {
            root.style.setProperty('--subtitle-font-size', settings.subtitleSize + 'px');
            // Also apply inline for elements without CSS variable usage
            doc.querySelectorAll('h3, h4, h5, h6').forEach(el => {
                el.style.setProperty('font-size', settings.subtitleSize + 'px', 'important');
            });
        }
        if (typeof settings.paragraphSize !== 'undefined') {
            root.style.setProperty('--paragraph-font-size', settings.paragraphSize + 'px');
            // Also apply inline for all text elements
            doc.querySelectorAll('p, li, span, a, em, strong, button, .green-button a, .orange-button a').forEach(el => {
                el.style.setProperty('font-size', settings.paragraphSize + 'px', 'important');
            });
        }
    }

    function loadTypographySettings() {
        try { const raw = localStorage.getItem(storageKey); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    }

    function saveTypographySettings(s) {
        try { localStorage.setItem(storageKey, JSON.stringify(s)); } catch (e) { console.warn('No se pudo guardar configuración', e); }
    }

    // ---------- History storage & rendering ----------
    function loadHistory() { try { return JSON.parse(localStorage.getItem(historyKey) || '[]'); } catch (e) { return []; } }
    function saveHistory(arr) { try { localStorage.setItem(historyKey, JSON.stringify(arr)); } catch (e) { console.warn('No se pudo guardar historial', e); } }

    function renderHistory() {
        const tbody = document.querySelector('#typography-changes tbody');
        if (!tbody) return;
        const hist = loadHistory();
        tbody.innerHTML = '';
        hist.forEach((entry, idx) => {
            const tr = document.createElement('tr');

            // Style protected row
            if (entry.isProtected) {
                tr.style.background = 'linear-gradient(90deg, #e8f5e9 0%, #f1f8e9 100%)';
            }

            // ID with lock icon for protected
            const idTd = document.createElement('td');
            idTd.textContent = entry.isProtected ? '🔒 ' + (idx + 1) : (idx + 1).toString();
            idTd.style.fontWeight = entry.isProtected ? 'bold' : 'normal';
            tr.appendChild(idTd);

            // Format font names (show star for custom fonts) and apply font style
            const formatFont = (f) => {
                if (!f) return '';
                if (f.startsWith('custom:')) return '⭐ ' + f.replace('custom:', '');
                return f;
            };

            // Get the actual font family name for styling
            const getFontFamily = (f) => {
                if (!f) return 'inherit';
                if (f.startsWith('custom:')) {
                    const customName = f.replace('custom:', '');
                    // Inject custom font if available
                    const fontData = customFontsCache.find(cf => cf.name === customName);
                    if (fontData && fontData.blob) {
                        injectCustomFontFace(document, customName, fontData.blob);
                    }
                    return `'${customName}', sans-serif`;
                }
                // Inject Google font into admin document
                injectGoogleFontInDoc(document, f);
                return `'${f}', sans-serif`;
            };

            // Primary font cell - styled with the font itself
            const pTd = document.createElement('td');
            pTd.textContent = formatFont(entry.primary);
            pTd.style.fontFamily = getFontFamily(entry.primary);
            tr.appendChild(pTd);

            // Secondary font cell - styled with the font itself
            const sTd = document.createElement('td');
            sTd.textContent = formatFont(entry.secondary);
            sTd.style.fontFamily = getFontFamily(entry.secondary);
            tr.appendChild(sTd);


            const tTd = document.createElement('td');
            tTd.textContent = (entry.titleSize || '') + 'px';
            if (entry.titleSize) tTd.style.fontSize = entry.titleSize + 'px';
            tr.appendChild(tTd);

            const subTd = document.createElement('td');
            subTd.textContent = (entry.subtitleSize || '') + 'px';
            if (entry.subtitleSize) subTd.style.fontSize = entry.subtitleSize + 'px';
            tr.appendChild(subTd);

            const parTd = document.createElement('td');
            parTd.textContent = (entry.paragraphSize || '') + 'px';
            if (entry.paragraphSize) parTd.style.fontSize = entry.paragraphSize + 'px';
            tr.appendChild(parTd);

            const timeTd = document.createElement('td'); timeTd.textContent = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''; tr.appendChild(timeTd);

            // attach context menu handler to row
            tr.addEventListener('contextmenu', function (ev) {
                ev.preventDefault();
                showContextMenu(ev.pageX, ev.pageY, idx);
            });
            tbody.appendChild(tr);
        });
    }

    // Create a simple context menu DOM (single instance)
    let contextMenuEl = null;
    function ensureContextMenu() {
        if (contextMenuEl) return contextMenuEl;
        contextMenuEl = document.createElement('div');
        contextMenuEl.id = 'typography-context-menu';
        contextMenuEl.style.position = 'absolute';
        contextMenuEl.style.zIndex = 9999;
        contextMenuEl.style.background = '#fff';
        contextMenuEl.style.border = '1px solid #ccc';
        contextMenuEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
        contextMenuEl.style.padding = '6px 0';
        contextMenuEl.style.minWidth = '140px';
        contextMenuEl.style.display = 'none';
        const opts = ['Editar', 'Eliminar', 'Aplicar'];
        opts.forEach((label, i) => {
            const item = document.createElement('div');
            item.textContent = label;
            item.style.padding = '8px 12px';
            item.style.cursor = 'pointer';
            item.addEventListener('mouseenter', () => item.style.background = '#f0f0f0');
            item.addEventListener('mouseleave', () => item.style.background = 'transparent');
            item.dataset.action = label.toLowerCase();
            contextMenuEl.appendChild(item);
        });
        document.body.appendChild(contextMenuEl);
        // global click to hide
        document.addEventListener('click', function () { if (contextMenuEl) contextMenuEl.style.display = 'none'; });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && contextMenuEl) contextMenuEl.style.display = 'none'; });
        return contextMenuEl;
    }

    function showContextMenu(x, y, index) {
        const menu = ensureContextMenu();
        const hist = loadHistory();
        const entry = hist[index];
        const isProtected = entry && entry.isProtected;

        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.display = 'block';

        // wire actions and update styling for protected entries
        Array.from(menu.children).forEach(child => {
            const action = child.dataset.action;

            // Disable edit/delete for protected entries
            if (isProtected && (action === 'editar' || action === 'eliminar')) {
                child.style.color = '#aaa';
                child.style.cursor = 'not-allowed';
            } else {
                child.style.color = '#333';
                child.style.cursor = 'pointer';
            }

            child.onclick = function (ev) {
                handleTypographyContextAction(action, index);
                menu.style.display = 'none';
            };
        });
    }

    // ---------- Styled confirmation modal for delete ----------
    let confirmOverlay = null;
    function ensureConfirmModal() {
        if (confirmOverlay) return confirmOverlay;
        confirmOverlay = document.createElement('div');
        confirmOverlay.className = 'admin-confirm-overlay';
        confirmOverlay.innerHTML = `
            <div class="admin-confirm" role="dialog" aria-modal="true">
                <h3>Confirmar eliminación</h3>
                <p>¿Estás seguro de que deseas eliminar esta entrada del historial? Esta acción no se puede deshacer.</p>
                <div class="confirm-actions">
                    <button class="btn-cancel">Cancelar</button>
                    <button class="btn-confirm">Eliminar</button>
                </div>
            </div>`;
        document.body.appendChild(confirmOverlay);
        try {
            confirmOverlay.style.position = 'fixed';
            confirmOverlay.style.left = '0';
            confirmOverlay.style.top = '0';
            confirmOverlay.style.right = '0';
            confirmOverlay.style.bottom = '0';
            confirmOverlay.style.display = 'none';
            confirmOverlay.style.alignItems = 'center';
            confirmOverlay.style.justifyContent = 'center';
            confirmOverlay.style.background = 'rgba(0,0,0,0.36)';
            confirmOverlay.style.zIndex = '10000';

            const dialog = confirmOverlay.querySelector('.admin-confirm');
            if (dialog) {
                dialog.style.background = '#ffffff';
                dialog.style.color = '#111111';
                dialog.style.padding = '20px';
                dialog.style.borderRadius = '8px';
                dialog.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
                dialog.style.maxWidth = '520px';
                dialog.style.width = '90%';
            }

            const btnCancel = confirmOverlay.querySelector('.btn-cancel');
            const btnConfirm = confirmOverlay.querySelector('.btn-confirm');
            if (btnCancel) {
                btnCancel.style.background = '#f0f0f0';
                btnCancel.style.color = '#111111';
                btnCancel.style.border = '1px solid rgba(0,0,0,0.08)';
                btnCancel.style.padding = '8px 12px';
                btnCancel.style.borderRadius = '4px';
                btnCancel.style.cursor = 'pointer';
            }
            if (btnConfirm) {
                btnConfirm.style.background = '#e53935';
                btnConfirm.style.color = '#ffffff';
                btnConfirm.style.border = 'none';
                btnConfirm.style.padding = '8px 12px';
                btnConfirm.style.borderRadius = '4px';
                btnConfirm.style.cursor = 'pointer';
            }
            const actions = confirmOverlay.querySelector('.confirm-actions');
            if (actions) { actions.style.display = 'flex'; actions.style.gap = '8px'; actions.style.justifyContent = 'flex-end'; actions.style.marginTop = '12px'; }
        } catch (e) { /* ignore style application errors */ }
        // handlers
        confirmOverlay.querySelector('.btn-cancel').addEventListener('click', () => { confirmOverlay.style.display = 'none'; });
        confirmOverlay.querySelector('.btn-confirm').addEventListener('click', () => {
            const idx = confirmOverlay.dataset.deleteIndex;
            try {
                const h = loadHistory();
                if (typeof idx !== 'undefined') {
                    h.splice(parseInt(idx, 10), 1);
                    saveHistory(h);
                    renderHistory();
                }
            } catch (e) { console.warn('Error eliminando entrada', e); }
            confirmOverlay.style.display = 'none';
        });
        return confirmOverlay;
    }

    // ---------- Typography Context Actions ----------
    function handleTypographyContextAction(action, index) {
        const hist = loadHistory();
        const entry = hist[index];
        if (!entry) return;

        // Block edit and delete for protected entry (index 0 = ID 1)
        if (entry.isProtected && (action === 'editar' || action === 'eliminar')) {
            alert('Esta entrada es la original y no se puede ' + (action === 'editar' ? 'editar' : 'eliminar') + '.');
            return;
        }

        if (action === 'editar') {
            showTypographyEditModal(index, entry);
        } else if (action === 'eliminar') {
            showDeleteConfirmation(index);
        } else if (action === 'aplicar') {
            showTypographyApplyModal(index, entry);
        }
    }

    // ---------- Typography Edit Modal ----------
    let typoEditOverlay = null;
    function showTypographyEditModal(index, entry) {
        if (!typoEditOverlay) {
            typoEditOverlay = document.createElement('div');
            typoEditOverlay.className = 'admin-confirm-overlay';
            typoEditOverlay.innerHTML = `
                <div class="admin-confirm" role="dialog" aria-modal="true">
                    <h3>Editar Tipografía</h3>
                    <div style="margin: 16px 0;">
                        <label style="display:block;margin-bottom:8px;font-weight:500;">Fuente Principal:</label>
                        <select id="typo-edit-primary" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;"></select>
                    </div>
                    <div style="margin: 16px 0;">
                        <label style="display:block;margin-bottom:8px;font-weight:500;">Fuente Secundaria:</label>
                        <select id="typo-edit-secondary" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;"></select>
                    </div>
                    <div style="margin: 16px 0;">
                        <label style="display:block;margin-bottom:8px;font-weight:500;">Tamaño Títulos (px):</label>
                        <input type="number" id="typo-edit-title" min="12" max="100" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;">
                    </div>
                    <div style="margin: 16px 0;">
                        <label style="display:block;margin-bottom:8px;font-weight:500;">Tamaño Subtítulos (px):</label>
                        <input type="number" id="typo-edit-subtitle" min="12" max="100" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;">
                    </div>
                    <div style="margin: 16px 0;">
                        <label style="display:block;margin-bottom:8px;font-weight:500;">Tamaño Párrafos (px):</label>
                        <input type="number" id="typo-edit-paragraph" min="12" max="100" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;">
                    </div>
                    <div id="typo-edit-error" style="display:none;background:#ffe0e0;color:#c62828;padding:10px;border-radius:4px;margin-bottom:12px;font-size:14px;border:1px solid #ef9a9a;">
                        ⚠️ Los tamaños deben estar entre 12px y 100px.
                    </div>
                    <div class="confirm-actions" style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
                        <button class="btn-cancel" style="background:#f0f0f0;color:#111;border:1px solid rgba(0,0,0,0.08);padding:8px 12px;border-radius:4px;cursor:pointer;">Cancelar</button>
                        <button class="btn-confirm" style="background:#1b73e8;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;">Guardar</button>
                    </div>
                </div>`;
            typoEditOverlay.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.36);z-index:10000;';
            const dialog = typoEditOverlay.querySelector('.admin-confirm');
            dialog.style.cssText = 'background:#fff;color:#111;padding:20px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,0.2);max-width:400px;width:90%;max-height:80vh;overflow-y:auto;';
            document.body.appendChild(typoEditOverlay);

            typoEditOverlay.querySelector('.btn-cancel').addEventListener('click', () => {
                typoEditOverlay.style.display = 'none';
            });
        }

        // Hide error message when opening modal
        const errorDiv = document.getElementById('typo-edit-error');
        if (errorDiv) errorDiv.style.display = 'none';

        // Populate font selects
        const baseFonts = ['Poppins', 'Roboto', 'Open Sans', 'Montserrat', 'Lato', 'Playfair Display', 'Arial', 'Helvetica', 'Times New Roman'];
        const customNames = customFontsCache.map(f => 'custom:' + f.name);
        const allFonts = [...customNames, ...baseFonts];

        ['typo-edit-primary', 'typo-edit-secondary'].forEach(id => {
            const sel = document.getElementById(id);
            sel.innerHTML = '';
            allFonts.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = f.startsWith('custom:') ? '⭐ ' + f.replace('custom:', '') : f;
                sel.appendChild(opt);
            });
        });

        // Set current values
        document.getElementById('typo-edit-primary').value = entry.primary || 'Poppins';
        document.getElementById('typo-edit-secondary').value = entry.secondary || 'Poppins';
        document.getElementById('typo-edit-title').value = entry.titleSize || 56;
        document.getElementById('typo-edit-subtitle').value = entry.subtitleSize || 36;
        document.getElementById('typo-edit-paragraph').value = entry.paragraphSize || 15;

        // Set up confirm button
        const confirmBtn = typoEditOverlay.querySelector('.btn-confirm');
        confirmBtn.onclick = function () {
            const errorDiv = document.getElementById('typo-edit-error');

            // Validate pixel sizes (min 12, max 100)
            const titleVal = parseInt(document.getElementById('typo-edit-title').value, 10);
            const subtitleVal = parseInt(document.getElementById('typo-edit-subtitle').value, 10);
            const paragraphVal = parseInt(document.getElementById('typo-edit-paragraph').value, 10);

            const isInvalid = (val) => isNaN(val) || val < 12 || val > 100;

            if (isInvalid(titleVal) || isInvalid(subtitleVal) || isInvalid(paragraphVal)) {
                // Show red error note
                if (errorDiv) errorDiv.style.display = 'block';
                return;
            }

            // Hide error if values are valid
            if (errorDiv) errorDiv.style.display = 'none';

            const hist = loadHistory();
            hist[index] = {
                ...hist[index],
                primary: document.getElementById('typo-edit-primary').value,
                secondary: document.getElementById('typo-edit-secondary').value,
                titleSize: titleVal,
                subtitleSize: subtitleVal,
                paragraphSize: paragraphVal,
                timestamp: Date.now()
            };
            saveHistory(hist);
            renderHistory();
            typoEditOverlay.style.display = 'none';
        };

        typoEditOverlay.style.display = 'flex';
    }

    // ---------- Typography Apply Modal ----------
    let typoApplyOverlay = null;
    function showTypographyApplyModal(index, entry) {
        if (!typoApplyOverlay) {
            typoApplyOverlay = document.createElement('div');
            typoApplyOverlay.className = 'admin-confirm-overlay';
            typoApplyOverlay.innerHTML = `
                <div class="admin-confirm" role="dialog" aria-modal="true">
                    <h3>Aplicar Tipografía</h3>
                    <p>¿Deseas aplicar esta configuración de tipografía al sitio?</p>
                    <div id="typo-apply-preview" style="margin:16px 0;padding:12px;background:#f8f9fa;border-radius:6px;"></div>
                    <div class="confirm-actions" style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
                        <button class="btn-cancel" style="background:#f0f0f0;color:#111;border:1px solid rgba(0,0,0,0.08);padding:8px 12px;border-radius:4px;cursor:pointer;">Cancelar</button>
                        <button class="btn-confirm" style="background:#34a853;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;">Aplicar</button>
                    </div>
                </div>`;
            typoApplyOverlay.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.36);z-index:10000;';
            const dialog = typoApplyOverlay.querySelector('.admin-confirm');
            dialog.style.cssText = 'background:#fff;color:#111;padding:20px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,0.2);max-width:400px;width:90%;';
            document.body.appendChild(typoApplyOverlay);

            typoApplyOverlay.querySelector('.btn-cancel').addEventListener('click', () => {
                typoApplyOverlay.style.display = 'none';
            });
        }

        // Show preview
        const previewDiv = document.getElementById('typo-apply-preview');
        const displayPrimary = entry.primary?.startsWith('custom:') ? '⭐ ' + entry.primary.replace('custom:', '') : entry.primary;
        const displaySecondary = entry.secondary?.startsWith('custom:') ? '⭐ ' + entry.secondary.replace('custom:', '') : entry.secondary;
        previewDiv.innerHTML = `
            <div style="margin-bottom:8px;"><strong>Fuente Principal:</strong> ${displayPrimary || 'Poppins'}</div>
            <div style="margin-bottom:8px;"><strong>Fuente Secundaria:</strong> ${displaySecondary || 'Poppins'}</div>
            <div style="margin-bottom:8px;"><strong>Tamaño Títulos:</strong> ${entry.titleSize || 56}px</div>
            <div style="margin-bottom:8px;"><strong>Tamaño Subtítulos:</strong> ${entry.subtitleSize || 36}px</div>
            <div><strong>Tamaño Párrafos:</strong> ${entry.paragraphSize || 15}px</div>
        `;

        // Set up confirm button
        const confirmBtn = typoApplyOverlay.querySelector('.btn-confirm');
        confirmBtn.onclick = function () {
            // Apply to controls
            if (primarySelect) primarySelect.value = entry.primary || 'Poppins';
            if (secondarySelect) secondarySelect.value = entry.secondary || 'Poppins';
            if (titleSlider) titleSlider.value = entry.titleSize || 56;
            if (subtitleSlider) subtitleSlider.value = entry.subtitleSize || 36;
            if (paragraphSlider) paragraphSlider.value = entry.paragraphSize || 15;

            // Apply to iframe and preview
            const settings = {
                primary: entry.primary,
                secondary: entry.secondary,
                titleSize: entry.titleSize,
                subtitleSize: entry.subtitleSize,
                paragraphSize: entry.paragraphSize
            };
            applyTypographyToIframe(settings);
            updateAdminPreview(settings);
            saveTypographySettings(settings);

            typoApplyOverlay.style.display = 'none';
            alert('Tipografía aplicada correctamente.');
        };

        typoApplyOverlay.style.display = 'flex';
    }

    function showDeleteConfirmation(index) {
        const hist = loadHistory();
        const entry = hist[index];
        // Block delete for protected entry
        if (entry && entry.isProtected) {
            alert('Esta entrada es la original y no se puede eliminar.');
            return;
        }
        const modal = ensureConfirmModal();
        modal.dataset.deleteIndex = index;
        modal.style.display = 'flex';
    }


    // Initialize selects from iframe or saved settings
    (function initTypographyControls() {
        const detected = detectFontsFromIframe();
        const saved = loadTypographySettings();
        const primary = saved?.primary || detected.primary;
        const secondary = saved?.secondary || detected.secondary;

        populateFontSelect(primarySelect, primary);
        populateFontSelect(secondarySelect, secondary);

        // set slider values from saved if exist
        if (saved) {
            if (titleSlider && typeof saved.titleSize !== 'undefined') titleSlider.value = saved.titleSize;
            if (subtitleSlider && typeof saved.subtitleSize !== 'undefined') subtitleSlider.value = saved.subtitleSize;
            if (paragraphSlider && typeof saved.paragraphSize !== 'undefined') paragraphSlider.value = saved.paragraphSize;
        }

        // Apply saved immediately
        if (saved) applyTypographyToIframe(saved);
    })();

    // Ensure history has a default entry if empty (preserve existing history)
    // Mark first entry as protected (original settings)
    (function ensureInitialHistory() {
        try {
            let hist = loadHistory();
            if (!hist || hist.length === 0) {
                const defaultEntry = {
                    primary: 'Poppins',
                    secondary: 'Poppins',
                    titleSize: 56,
                    subtitleSize: 36,
                    paragraphSize: 15,
                    timestamp: '', // leave date/time blank per request
                    isProtected: true // Mark as protected (original)
                };
                saveHistory([defaultEntry]);
            } else {
                // Ensure first entry is marked as protected
                if (!hist[0].isProtected) {
                    hist[0].isProtected = true;
                    saveHistory(hist);
                }
            }
        } catch (e) { console.warn('No se pudo inicializar historial', e); }
        renderHistory();
    })();

    // Update admin preview (the local preview box inside admin.html)
    const previewBox = document.getElementById('typography-preview');
    const titleValueSpan = document.getElementById('title-size-value');
    const subtitleValueSpan = document.getElementById('subtitle-size-value');
    const paragraphValueSpan = document.getElementById('paragraph-size-value');

    function updateAdminPreview(settings) {
        if (!previewBox) return;
        const primary = settings?.primary || primarySelect?.value;
        const secondary = settings?.secondary || secondarySelect?.value;
        const titleSize = typeof settings?.titleSize !== 'undefined' ? settings.titleSize : (titleSlider ? titleSlider.value : undefined);
        const subtitleSize = typeof settings?.subtitleSize !== 'undefined' ? settings.subtitleSize : (subtitleSlider ? subtitleSlider.value : undefined);
        const paragraphSize = typeof settings?.paragraphSize !== 'undefined' ? settings.paragraphSize : (paragraphSlider ? paragraphSlider.value : undefined);

        // update displayed values
        if (titleValueSpan && typeof titleSize !== 'undefined') titleValueSpan.textContent = titleSize + 'px';
        if (subtitleValueSpan && typeof subtitleSize !== 'undefined') subtitleValueSpan.textContent = subtitleSize + 'px';
        if (paragraphValueSpan && typeof paragraphSize !== 'undefined') paragraphValueSpan.textContent = paragraphSize + 'px';

        // apply fonts: primary -> titles (h2), secondary -> subtitles (h4) and paragraphs (p)
        if (secondary) previewBox.style.fontFamily = secondary + ', sans-serif';
        // apply primary to title elements (h2)
        previewBox.querySelectorAll('h2').forEach(h => { if (primary) h.style.fontFamily = primary + ', sans-serif'; });
        // apply secondary to subtitle elements (h4) and paragraphs
        previewBox.querySelectorAll('h4').forEach(h => { if (secondary) h.style.fontFamily = secondary + ', sans-serif'; });
        previewBox.querySelectorAll('p').forEach(p => { if (secondary) p.style.fontFamily = secondary + ', sans-serif'; });

        // apply sizes to matching elements in the preview
        if (typeof titleSize !== 'undefined') {
            previewBox.querySelectorAll('h2').forEach(h => h.style.fontSize = titleSize + 'px');
        }
        if (typeof subtitleSize !== 'undefined') {
            previewBox.querySelectorAll('h4').forEach(h => h.style.fontSize = subtitleSize + 'px');
        }
        if (typeof paragraphSize !== 'undefined') {
            previewBox.querySelectorAll('p').forEach(p => p.style.fontSize = paragraphSize + 'px');
        }
    }

    // Live change handlers
    // Helper: apply only primary font (titles) to iframe and preview
    function applyPrimaryFontOnly(fontValue) {
        if (!fontValue) return;

        // Check if it's a custom font
        if (fontValue.startsWith('custom:')) {
            const fontName = fontValue.replace('custom:', '');
            // Find font in cache
            const fontData = customFontsCache.find(f => f.name === fontName);
            if (fontData && fontData.blob) {
                const doc = safeGetIframeDoc();
                // Inject custom font-face into iframe
                if (doc) {
                    injectCustomFontFace(doc, fontName, fontData.blob).then(() => {
                        doc.querySelectorAll('h2').forEach(h => h.style.fontFamily = `'${fontName}', sans-serif`);
                    });
                }
                // Inject into admin document and preview
                injectCustomFontFace(document, fontName, fontData.blob).then(() => {
                    if (previewBox) previewBox.querySelectorAll('h2').forEach(h => h.style.fontFamily = `'${fontName}', sans-serif`);
                });
            }
        } else {
            // Regular Google font
            const doc = safeGetIframeDoc();
            if (doc) injectGoogleFontInDoc(doc, fontValue);
            try { if (doc) doc.querySelectorAll('h2').forEach(h => h.style.fontFamily = fontValue + ', sans-serif'); } catch (e) { }
            try { if (previewBox) previewBox.querySelectorAll('h2').forEach(h => h.style.fontFamily = fontValue + ', sans-serif'); } catch (e) { }
        }
    }

    // Helper: apply only secondary font (body, subtitles, paragraphs) to iframe and preview
    function applySecondaryFontOnly(fontValue) {
        if (!fontValue) return;

        // Check if it's a custom font
        if (fontValue.startsWith('custom:')) {
            const fontName = fontValue.replace('custom:', '');
            const fontData = customFontsCache.find(f => f.name === fontName);
            if (fontData && fontData.blob) {
                const doc = safeGetIframeDoc();
                // Inject custom font-face into iframe
                if (doc) {
                    injectCustomFontFace(doc, fontName, fontData.blob).then(() => {
                        doc.body.style.fontFamily = `'${fontName}', sans-serif`;
                        doc.querySelectorAll('h4').forEach(h => h.style.fontFamily = `'${fontName}', sans-serif`);
                        doc.querySelectorAll('p').forEach(p => p.style.fontFamily = `'${fontName}', sans-serif`);
                    });
                }
                // Inject into admin document and preview
                injectCustomFontFace(document, fontName, fontData.blob).then(() => {
                    if (previewBox) {
                        previewBox.style.fontFamily = `'${fontName}', sans-serif`;
                        previewBox.querySelectorAll('h4').forEach(h => h.style.fontFamily = `'${fontName}', sans-serif`);
                        previewBox.querySelectorAll('p').forEach(p => p.style.fontFamily = `'${fontName}', sans-serif`);
                    }
                });
            }
        } else {
            // Regular Google font
            const doc = safeGetIframeDoc();
            if (doc) injectGoogleFontInDoc(doc, fontValue);
            try { if (doc) doc.body.style.fontFamily = fontValue + ', sans-serif'; } catch (e) { }
            try { if (doc) doc.querySelectorAll('h4').forEach(h => h.style.fontFamily = fontValue + ', sans-serif'); } catch (e) { }
            try { if (doc) doc.querySelectorAll('p').forEach(p => p.style.fontFamily = fontValue + ', sans-serif'); } catch (e) { }
            // admin preview
            try { if (previewBox) previewBox.style.fontFamily = fontValue + ', sans-serif'; } catch (e) { }
            try { if (previewBox) previewBox.querySelectorAll('h4').forEach(h => h.style.fontFamily = fontValue + ', sans-serif'); } catch (e) { }
            try { if (previewBox) previewBox.querySelectorAll('p').forEach(p => p.style.fontFamily = fontValue + ', sans-serif'); } catch (e) { }
        }
    }

    if (primarySelect) primarySelect.addEventListener('change', (ev) => {
        const newPrimary = ev.currentTarget ? ev.currentTarget.value : primarySelect.value;
        try { console.debug('primarySelect change ->', newPrimary); } catch (e) { }
        applyPrimaryFontOnly(newPrimary);
    });
    if (secondarySelect) secondarySelect.addEventListener('change', (ev) => {
        const newSecondary = ev.currentTarget ? ev.currentTarget.value : secondarySelect.value;
        try { console.debug('secondarySelect change ->', newSecondary); } catch (e) { }
        applySecondaryFontOnly(newSecondary);
    });

    // sliders update iframe too
    [titleSlider, subtitleSlider, paragraphSlider].forEach(sl => {
        if (!sl) return;
        sl.addEventListener('input', () => {
            const s = { primary: primarySelect?.value, secondary: secondarySelect?.value, titleSize: titleSlider?.value, subtitleSize: subtitleSlider?.value, paragraphSize: paragraphSlider?.value };
            applyTypographyToIframe(s);
            updateAdminPreview(s);
        });
    });

    // Apply / Save
    if (applyTypoBtn) {
        applyTypoBtn.addEventListener('click', () => {
            const s = {
                primary: primarySelect?.value,
                secondary: secondarySelect?.value,
                titleSize: titleSlider ? parseInt(titleSlider.value, 10) : undefined,
                subtitleSize: subtitleSlider ? parseInt(subtitleSlider.value, 10) : undefined,
                paragraphSize: paragraphSlider ? parseInt(paragraphSlider.value, 10) : undefined
            };
            saveTypographySettings(s);
            applyTypographyToIframe(s);
            updateAdminPreview(s);
            // push to history
            try {
                const h = loadHistory();
                h.push(Object.assign({}, s, { timestamp: Date.now() }));
                saveHistory(h);
                renderHistory();
            } catch (e) { console.warn('No se pudo actualizar historial', e); }
            try { if (window.BroadcastChannel) { const bc = new BroadcastChannel('admin-typography'); bc.postMessage({ type: 'settings-applied', settings: s }); bc.close(); } } catch (e) { }
            alert('Configuración de tipografía guardada localmente.');
        });
    }

    // Cancel button (only for typography section)
    if (applyTypoBtn) {
        const typographySection = applyTypoBtn.closest('.config-section');
        const cancelBtn = typographySection ? typographySection.querySelector('.btn-secondary') : null;
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                const saved = loadTypographySettings();
                if (saved) {
                    if (primarySelect) primarySelect.value = saved.primary;
                    if (secondarySelect) secondarySelect.value = saved.secondary;
                    if (titleSlider && typeof saved.titleSize !== 'undefined') titleSlider.value = saved.titleSize;
                    if (subtitleSlider && typeof saved.subtitleSize !== 'undefined') subtitleSlider.value = saved.subtitleSize;
                    if (paragraphSlider && typeof saved.paragraphSize !== 'undefined') paragraphSlider.value = saved.paragraphSize;
                    applyTypographyToIframe(saved);
                } else {
                    // reload iframe to original
                    if (iframe) iframe.contentWindow.location.reload();
                }
            });
        }
    }

    // Font import functionality is disabled. Previously the code allowed selecting a local
    // font file and registering it in the iframe via blob URLs and IndexedDB. That code
    // was removed to avoid issues applying fonts across reloads. If needed, re-implement
    // using a server-side font store or a robust IndexedDB solution.

    // ---------- Other existing controls ----------
    // Refresh preview button
    const refreshBtn = document.getElementById('refresh-preview');
    if (refreshBtn && iframe) {
        refreshBtn.addEventListener('click', function () { iframe.src = iframe.src; });
    }
    // View site button
    const viewSiteBtn = document.getElementById('view-site');
    if (viewSiteBtn) { viewSiteBtn.addEventListener('click', function () { window.open('../index.html', '_blank'); }); }

    // Smooth scrolling for sidebar links
    document.querySelectorAll('.sidebar-menu a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

});