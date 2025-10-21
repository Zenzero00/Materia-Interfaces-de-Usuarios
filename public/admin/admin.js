// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // ---------- Color picker functionality (unchanged) ----------
    const colorInputs = document.querySelectorAll('input[type="color"]');
    const colorTextInputs = document.querySelectorAll('input[type="text"][id$="-hex"]');
    if (colorInputs && colorTextInputs && colorInputs.length === colorTextInputs.length) {
        colorInputs.forEach((input, index) => {
            input.addEventListener('input', function() {
                if (colorTextInputs[index]) colorTextInputs[index].value = this.value;
            });
        });

        colorTextInputs.forEach((input, index) => {
            input.addEventListener('input', function() {
                if (this.value.match(/^#[0-9A-F]{6}$/i) && colorInputs[index]) {
                    colorInputs[index].value = this.value;
                }
            });
        });
    }

    // Apply colors button
    const applyColorsBtn = document.getElementById('apply-colors');
    if (applyColorsBtn) {
        applyColorsBtn.addEventListener('click', function() {
                const c1 = document.getElementById('color-1')?.value;
                const c2 = document.getElementById('color-2')?.value;
                const c3 = document.getElementById('color-3')?.value;
                const c4 = document.getElementById('color-4')?.value;
                const c5 = document.getElementById('color-5')?.value;
                if (c1) document.documentElement.style.setProperty('--primary-color', c1);
                if (c2) document.documentElement.style.setProperty('--secondary-color', c2);
                if (c3) document.documentElement.style.setProperty('--accent-color', c3);
                if (c4) document.documentElement.style.setProperty('--danger-color', c4);
                if (c5) document.documentElement.style.setProperty('--neutral-color', c5);
            // persist current colors and add to history
            try{
                const colorSettings = { primary: c1, secondary: c2, accent: c3, danger: c4, neutral: c5 };
                try{ localStorage.setItem('admin_color_settings', JSON.stringify(colorSettings)); }catch(e){ /* ignore */ }
                const ch = (function load(){ try{ return JSON.parse(localStorage.getItem('admin_color_history')||'[]'); }catch(e){ return []; } })();
                ch.push(Object.assign({}, colorSettings, { timestamp: Date.now() }));
                try{ localStorage.setItem('admin_color_history', JSON.stringify(ch)); }catch(e){}
                renderColorHistory();
            }catch(e){ console.warn('No se pudo guardar colores en historial', e); }

                try{ if(window.BroadcastChannel){ const bc = new BroadcastChannel('admin-typography'); bc.postMessage({ type: 'colors-applied', colors: { primary: c1, secondary: c2, accent: c3, danger: c4, neutral: c5 } }); bc.close(); } }catch(e){}
            alert('Colores aplicados correctamente');
        });
    }

    // ---------- Color history (similar to typography) ----------
    function loadColorHistory(){ try{ return JSON.parse(localStorage.getItem('admin_color_history')||'[]'); }catch(e){ return []; } }
    function saveColorHistory(arr){ try{ localStorage.setItem('admin_color_history', JSON.stringify(arr)); }catch(e){ console.warn('No se pudo guardar historial de colores', e); } }

    function renderColorHistory(){
        const tbody = document.querySelector('#colors-changes tbody');
        if(!tbody) return;
        const hist = loadColorHistory();
        tbody.innerHTML = '';
        hist.forEach((entry, idx) => {
            const tr = document.createElement('tr');
            const idTd = document.createElement('td'); idTd.textContent = (idx+1).toString(); tr.appendChild(idTd);
            const pTd = document.createElement('td'); pTd.textContent = entry.primary || ''; tr.appendChild(pTd);
            const sTd = document.createElement('td'); sTd.textContent = entry.secondary || ''; tr.appendChild(sTd);
            const aTd = document.createElement('td'); aTd.textContent = entry.accent || ''; tr.appendChild(aTd);
            const dTd = document.createElement('td'); dTd.textContent = entry.danger || ''; tr.appendChild(dTd);
            const nTd = document.createElement('td'); nTd.textContent = entry.neutral || ''; tr.appendChild(nTd);
            const timeTd = document.createElement('td'); timeTd.textContent = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''; tr.appendChild(timeTd);
            tr.addEventListener('contextmenu', function(ev){ ev.preventDefault(); showColorContextMenu(ev.pageX, ev.pageY, idx); });
            tbody.appendChild(tr);
        });
    }

    // Color context menu (separate instance)
    let colorContextMenuEl = null;
    function ensureColorContextMenu(){
        if(colorContextMenuEl) return colorContextMenuEl;
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
        const opts = ['Editar','Eliminar','Aplicar'];
        opts.forEach((label) => {
            const item = document.createElement('div');
            item.textContent = label;
            item.style.padding = '8px 12px';
            item.style.cursor = 'pointer';
            item.addEventListener('mouseenter', ()=> item.style.background = '#f0f0f0');
            item.addEventListener('mouseleave', ()=> item.style.background = 'transparent');
            item.dataset.action = label.toLowerCase();
            colorContextMenuEl.appendChild(item);
        });
        document.body.appendChild(colorContextMenuEl);
        document.addEventListener('click', function(){ if(colorContextMenuEl) colorContextMenuEl.style.display = 'none'; });
        document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && colorContextMenuEl) colorContextMenuEl.style.display = 'none'; });
        return colorContextMenuEl;
    }

    function showColorContextMenu(x,y,index){
        const menu = ensureColorContextMenu();
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.display = 'block';
        Array.from(menu.children).forEach(child => {
            child.onclick = function(ev){
                const action = child.dataset.action;
                handleColorContextAction(action, index);
                menu.style.display = 'none';
            };
        });
    }

    function handleColorContextAction(action, index){
        const hist = loadColorHistory();
        const entry = hist[index];
        if(!entry) return;
        if(action === 'editar'){
            try{
                const h = loadColorHistory();
                const newEntry = {
                    primary: document.getElementById('color-1')?.value || entry.primary,
                    secondary: document.getElementById('color-2')?.value || entry.secondary,
                    accent: document.getElementById('color-3')?.value || entry.accent,
                    danger: document.getElementById('color-4')?.value || entry.danger,
                    neutral: document.getElementById('color-5')?.value || entry.neutral,
                    timestamp: Date.now()
                };
                h[index] = newEntry;
                saveColorHistory(h);
                renderColorHistory();
                // apply and update previews
                applyColorsToUI(newEntry);
                alert('Entrada de color actualizada con los valores actuales.');
            }catch(e){ console.warn('Error actualizando entrada de color', e); }
        } else if(action === 'eliminar'){
            showColorDeleteConfirmation(index);
        } else if(action === 'aplicar'){
            applyColorsToUI({ primary: entry.primary, secondary: entry.secondary, accent: entry.accent, danger: entry.danger, neutral: entry.neutral });
            try{ localStorage.setItem('admin_color_settings', JSON.stringify({ primary: entry.primary, secondary: entry.secondary, accent: entry.accent, danger: entry.danger, neutral: entry.neutral })); }catch(e){}
            alert('Configuración de colores aplicada desde el historial.');
        }
    }

    // Color delete confirmation modal
    let colorConfirmOverlay = null;
    function ensureColorConfirmModal(){
        if(colorConfirmOverlay) return colorConfirmOverlay;
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
        try{
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
            if(dialog){
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
            if(btnCancel){
                btnCancel.style.background = '#f0f0f0';
                btnCancel.style.color = '#111111';
                btnCancel.style.border = '1px solid rgba(0,0,0,0.08)';
                btnCancel.style.padding = '8px 12px';
                btnCancel.style.borderRadius = '4px';
                btnCancel.style.cursor = 'pointer';
            }
            if(btnConfirm){
                btnConfirm.style.background = '#e53935';
                btnConfirm.style.color = '#ffffff';
                btnConfirm.style.border = 'none';
                btnConfirm.style.padding = '8px 12px';
                btnConfirm.style.borderRadius = '4px';
                btnConfirm.style.cursor = 'pointer';
            }
            const actions = colorConfirmOverlay.querySelector('.confirm-actions');
            if(actions){ actions.style.display = 'flex'; actions.style.gap = '8px'; actions.style.justifyContent = 'flex-end'; actions.style.marginTop = '12px'; }
        }catch(e){}
        // handlers
        colorConfirmOverlay.querySelector('.btn-cancel').addEventListener('click', ()=>{ colorConfirmOverlay.style.display = 'none'; });
        colorConfirmOverlay.querySelector('.btn-confirm').addEventListener('click', ()=>{
            const idx = colorConfirmOverlay.dataset.deleteIndex;
            try{
                const h = loadColorHistory();
                if(typeof idx !== 'undefined'){
                    h.splice(parseInt(idx,10),1);
                    saveColorHistory(h);
                    renderColorHistory();
                }
            }catch(e){ console.warn('Error eliminando entrada de colores', e); }
            colorConfirmOverlay.style.display = 'none';
        });
        return colorConfirmOverlay;
    }

    function showColorDeleteConfirmation(index){
        const modal = ensureColorConfirmModal();
        modal.dataset.deleteIndex = index;
        // ensure inline styles enforced before showing
        try{
            modal.style.display = 'flex';
        }catch(e){}
    }

    function applyColorsToUI(settings){
        if(!settings) return;
        try{ if(settings.primary) document.documentElement.style.setProperty('--primary-color', settings.primary); }catch(e){}
        try{ if(settings.secondary) document.documentElement.style.setProperty('--secondary-color', settings.secondary); }catch(e){}
        try{ if(settings.accent) document.documentElement.style.setProperty('--accent-color', settings.accent); }catch(e){}
        try{ if(settings.danger) document.documentElement.style.setProperty('--danger-color', settings.danger); }catch(e){}
        // update inputs & previews
        try{ if(document.getElementById('color-1')) document.getElementById('color-1').value = settings.primary || ''; }catch(e){}
    try{ if(document.getElementById('color-2')) document.getElementById('color-2').value = settings.secondary || ''; }catch(e){}
    try{ if(document.getElementById('color-3')) document.getElementById('color-3').value = settings.accent || ''; }catch(e){}
    try{ if(document.getElementById('color-4')) document.getElementById('color-4').value = settings.danger || ''; }catch(e){}
    try{ if(document.getElementById('color-5')) document.getElementById('color-5').value = settings.neutral || ''; }catch(e){}
        // update hex text inputs and preview boxes if present
        document.querySelectorAll('.color-item').forEach(parent => {
            try{
                const hexInput = parent.querySelector('input[type="text"][id$="-hex"]');
                const preview = parent.querySelector('.color-preview');
                const id = hexInput?.id || '';
                if(id.indexOf('color-1')>=0){ if(hexInput) hexInput.value = settings.primary || hexInput.value; if(preview) preview.style.backgroundColor = settings.primary || preview.style.backgroundColor; }
                if(id.indexOf('color-2')>=0){ if(hexInput) hexInput.value = settings.secondary || hexInput.value; if(preview) preview.style.backgroundColor = settings.secondary || preview.style.backgroundColor; }
                if(id.indexOf('color-3')>=0){ if(hexInput) hexInput.value = settings.accent || hexInput.value; if(preview) preview.style.backgroundColor = settings.accent || preview.style.backgroundColor; }
                if(id.indexOf('color-4')>=0){ if(hexInput) hexInput.value = settings.danger || hexInput.value; if(preview) preview.style.backgroundColor = settings.danger || preview.style.backgroundColor; }
                if(id.indexOf('color-5')>=0){ if(hexInput) hexInput.value = settings.neutral || hexInput.value; if(preview) preview.style.backgroundColor = settings.neutral || preview.style.backgroundColor; }
            }catch(e){}
        });
    }

    // Initialize color controls from saved settings
    (function initColorControls(){
        try{
            const saved = (function(){ try{ return JSON.parse(localStorage.getItem('admin_color_settings')||'null'); }catch(e){ return null; } })();
            if(saved) applyColorsToUI(saved);
        }catch(e){ console.warn('No se pudo inicializar controles de color', e); }
        // ensure there is at least one history entry
        try{
            const ch = loadColorHistory();
            if(!ch || ch.length === 0){
                const defaultEntry = { primary: '#2c3e50', secondary: '#ffffff', accent: '#ff6b6b', danger: '#e74c3c', neutral: '#ffffff', timestamp: '' };
                saveColorHistory([defaultEntry]);
            }
        }catch(e){}
        renderColorHistory();
    })();

    // Make color preview boxes open a color picker when clicked
    (function wireColorPreviewClick(){
        try{
            const previews = document.querySelectorAll('.color-preview');
            previews.forEach((box, idx) => {
                // try to derive the matching text input by DOM proximity
                const parent = box.closest('.color-item');
                if(!parent) return;
                const hexInput = parent.querySelector('input[type="text"][id$="-hex"]');
                const colorInputId = 'js-color-picker-' + (hexInput ? hexInput.id : idx);

                    // Prefer the visible color input inside the same .color-item if available
                    let colorInput = parent.querySelector('input[type="color"]');
                    // fallback: create a hidden input[type=color] if not present
                    if(!colorInput){
                        colorInput = document.getElementById(colorInputId);
                        if(!colorInput){
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
                try{ // convert rgb(...) to hex if needed
                    if(initColor.indexOf('rgb') === 0){
                        const nums = initColor.match(/\d+/g);
                        if(nums && nums.length >= 3){
                            const hx = '#' + nums.slice(0,3).map(n => parseInt(n,10).toString(16).padStart(2,'0')).join('');
                            colorInput.value = hx;
                        }
                    } else {
                        colorInput.value = initColor;
                    }
                }catch(e){ colorInput.value = '#ffffff'; }

                // on change, update preview background and hex input
                // avoid attaching multiple listeners to the same element
                if(!colorInput.dataset || !colorInput.dataset._colorWired){
                    colorInput.addEventListener('input', function(){
                        try{
                            box.style.backgroundColor = this.value;
                            if(hexInput) hexInput.value = this.value;
                        }catch(e){}
                    });
                    try{ colorInput.dataset._colorWired = '1'; }catch(e){}
                }

                // when user clicks the preview box, open the color input
                box.style.cursor = 'pointer';
                box.addEventListener('click', function(){
                    try{
                        // focus & open color input — clicking the input programmatically opens the color picker in most browsers
                        colorInput.click();
                    }catch(e){
                        // fallback: focus the hidden input so user can use keyboard
                        try{ colorInput.focus(); }catch(e){}
                    }
                });
            });
        }catch(e){ console.warn('No se pudieron enlazar previews de color', e); }
    })();

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

    function safeGetIframeDoc(){
        try { return iframe?.contentDocument || iframe?.contentWindow?.document; }
        catch(e){ console.warn('No se puede acceder al iframe:', e); return null; }
    }

    function normFontName(f){ return (f||'').split(',')[0].replace(/["']/g,'').trim(); }

    function detectFontsFromIframe(){
        const doc = safeGetIframeDoc();
        if(!doc) return { primary: 'Poppins', secondary: 'Poppins' };
        const body = doc.body;
        const bodyFont = normFontName(getComputedStyle(body).getPropertyValue('font-family')) || 'Poppins';
        // Titles are h2 on this site, use first h2 to detect title font
        const h2 = doc.querySelector('h2');
        const h2Font = h2 ? normFontName(getComputedStyle(h2).getPropertyValue('font-family')) : bodyFont;
        return { primary: h2Font, secondary: bodyFont };
    }

    function detectSizesFromIframe(){
        const doc = safeGetIframeDoc();
        // Defaults adjusted to the site's original sizes
        if(!doc) return { titleSize: 56, subtitleSize: 36, paragraphSize: 15 };
        function pxToInt(v){ try{ return Math.round(parseFloat(v)); }catch(e){return undefined;} }
        // Titles are h2, subtitles are h4, paragraphs are p
        const h2 = doc.querySelector('h2');
        const h4 = doc.querySelector('h4');
        const p = doc.querySelector('p');
        const titleSize = h2 ? pxToInt(getComputedStyle(h2).getPropertyValue('font-size')) : undefined;
        const subtitleSize = h4 ? pxToInt(getComputedStyle(h4).getPropertyValue('font-size')) : undefined;
        const paragraphSize = p ? pxToInt(getComputedStyle(p).getPropertyValue('font-size')) : undefined;
        return { titleSize: titleSize || 56, subtitleSize: subtitleSize || 36, paragraphSize: paragraphSize || 15 };
    }

    function populateFontSelect(selectEl, current){
        if(!selectEl) return;
        const fallback = ['Poppins','Roboto','Open Sans','Montserrat','Lato','Playfair Display','Arial','Helvetica','Times New Roman'];
        selectEl.innerHTML = '';
        const add = (name) => { const o = document.createElement('option'); o.value = name; o.textContent = name; selectEl.appendChild(o); };
        add(current);
        fallback.forEach(f => { if(f !== current) add(f); });
    }

    function injectGoogleFontInDoc(doc, font){
        if(!doc || !font) return;
        const id = 'gf-' + font.replace(/\s+/g,'-');
        if(doc.getElementById(id)) return;
        const link = doc.createElement('link');
        link.id = id; link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(font) + ':wght@300;400;500;600;700&display=swap';
        doc.head.appendChild(link);
    }

    function applyTypographyToIframe(settings){
        const doc = safeGetIframeDoc();
        if(!doc) return;
        // inject fonts
        if(settings.primary) injectGoogleFontInDoc(doc, settings.primary);
        if(settings.secondary) injectGoogleFontInDoc(doc, settings.secondary);
        // Apply families: primary -> titles (h2), secondary -> subtitles (h4) and paragraphs
        if(settings.secondary) doc.body.style.fontFamily = settings.secondary + ', sans-serif';
        if(settings.primary){
            doc.querySelectorAll('h2').forEach(h => { h.style.fontFamily = settings.primary + ', sans-serif'; });
        }
        if(settings.secondary){
            doc.querySelectorAll('h4').forEach(h => { h.style.fontFamily = settings.secondary + ', sans-serif'; });
            doc.querySelectorAll('p').forEach(pel => { pel.style.fontFamily = settings.secondary + ', sans-serif'; });
        }

        // apply sizes if provided to all matching elements
        if(typeof settings.titleSize !== 'undefined'){
            doc.querySelectorAll('h2').forEach(h => h.style.fontSize = settings.titleSize + 'px');
        }
        if(typeof settings.subtitleSize !== 'undefined'){
            doc.querySelectorAll('h4').forEach(h => h.style.fontSize = settings.subtitleSize + 'px');
        }
        if(typeof settings.paragraphSize !== 'undefined'){
            doc.querySelectorAll('p').forEach(pel => pel.style.fontSize = settings.paragraphSize + 'px');
        }
    }

    function loadTypographySettings(){
        try{ const raw = localStorage.getItem(storageKey); return raw ? JSON.parse(raw) : null; } catch(e){ return null; }
    }

    function saveTypographySettings(s){
        try{ localStorage.setItem(storageKey, JSON.stringify(s)); } catch(e){ console.warn('No se pudo guardar configuración', e); }
    }

    // ---------- History storage & rendering ----------
    function loadHistory(){ try{ return JSON.parse(localStorage.getItem(historyKey) || '[]'); }catch(e){ return []; } }
    function saveHistory(arr){ try{ localStorage.setItem(historyKey, JSON.stringify(arr)); }catch(e){ console.warn('No se pudo guardar historial', e); } }

    function renderHistory(){
        const tbody = document.querySelector('#typography-changes tbody');
        if(!tbody) return;
        const hist = loadHistory();
        tbody.innerHTML = '';
        hist.forEach((entry, idx) => {
            const tr = document.createElement('tr');
            const idTd = document.createElement('td'); idTd.textContent = (idx+1).toString(); tr.appendChild(idTd);
            const pTd = document.createElement('td'); pTd.textContent = entry.primary || ''; tr.appendChild(pTd);
            const sTd = document.createElement('td'); sTd.textContent = entry.secondary || ''; tr.appendChild(sTd);
            const tTd = document.createElement('td'); tTd.textContent = (entry.titleSize || '') + 'px'; tr.appendChild(tTd);
            const subTd = document.createElement('td'); subTd.textContent = (entry.subtitleSize || '') + 'px'; tr.appendChild(subTd);
            const parTd = document.createElement('td'); parTd.textContent = (entry.paragraphSize || '') + 'px'; tr.appendChild(parTd);
            const timeTd = document.createElement('td'); timeTd.textContent = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''; tr.appendChild(timeTd);
            // attach context menu handler to row
            tr.addEventListener('contextmenu', function(ev){
                ev.preventDefault();
                showContextMenu(ev.pageX, ev.pageY, idx);
            });
            tbody.appendChild(tr);
        });
    }

    // Create a simple context menu DOM (single instance)
    let contextMenuEl = null;
    function ensureContextMenu(){
        if(contextMenuEl) return contextMenuEl;
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
        const opts = ['Editar','Eliminar','Aplicar'];
        opts.forEach((label, i) => {
            const item = document.createElement('div');
            item.textContent = label;
            item.style.padding = '8px 12px';
            item.style.cursor = 'pointer';
            item.addEventListener('mouseenter', ()=> item.style.background = '#f0f0f0');
            item.addEventListener('mouseleave', ()=> item.style.background = 'transparent');
            item.dataset.action = label.toLowerCase();
            contextMenuEl.appendChild(item);
        });
        document.body.appendChild(contextMenuEl);
        // global click to hide
        document.addEventListener('click', function(){ if(contextMenuEl) contextMenuEl.style.display = 'none'; });
        document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && contextMenuEl) contextMenuEl.style.display = 'none'; });
        return contextMenuEl;
    }

    function showContextMenu(x,y,index){
        const menu = ensureContextMenu();
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.display = 'block';
        // wire actions
        Array.from(menu.children).forEach(child => {
            child.onclick = function(ev){
                const action = child.dataset.action;
                handleContextAction(action, index);
                menu.style.display = 'none';
            };
        });
    }

    function handleContextAction(action, index){
        const hist = loadHistory();
        const entry = hist[index];
        if(!entry) return;
        if(action === 'editar'){
            // Overwrite this history entry with current control values (save what is currently set)
            try{
                const h = loadHistory();
                const newEntry = {
                    primary: primarySelect?.value || entry.primary,
                    secondary: secondarySelect?.value || entry.secondary,
                    titleSize: titleSlider ? parseInt(titleSlider.value,10) : entry.titleSize,
                    subtitleSize: subtitleSlider ? parseInt(subtitleSlider.value,10) : entry.subtitleSize,
                    paragraphSize: paragraphSlider ? parseInt(paragraphSlider.value,10) : entry.paragraphSize,
                    timestamp: Date.now()
                };
                h[index] = newEntry;
                saveHistory(h);
                renderHistory();
                // apply and update previews
                const s = { primary: newEntry.primary, secondary: newEntry.secondary, titleSize: newEntry.titleSize, subtitleSize: newEntry.subtitleSize, paragraphSize: newEntry.paragraphSize };
                saveTypographySettings(s);
                applyTypographyToIframe(s); updateAdminPreview(s);
                alert('Entrada actualizada con los valores actuales.');
            }catch(e){ console.warn('Error actualizando entrada', e); }
        } else if(action === 'eliminar'){
            // show styled confirmation modal
            showDeleteConfirmation(index);
        } else if(action === 'aplicar'){
            // apply entry to site and save as current settings
            const s = { primary: entry.primary, secondary: entry.secondary, titleSize: entry.titleSize, subtitleSize: entry.subtitleSize, paragraphSize: entry.paragraphSize };
            saveTypographySettings(s);
            applyTypographyToIframe(s);
            updateAdminPreview(s);
            alert('Configuración aplicada desde el historial.');
        }
    }

    // ---------- Styled confirmation modal for delete ----------
    let confirmOverlay = null;
    function ensureConfirmModal(){
        if(confirmOverlay) return confirmOverlay;
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
        try{
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
            if(dialog){
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
            if(btnCancel){
                btnCancel.style.background = '#f0f0f0';
                btnCancel.style.color = '#111111';
                btnCancel.style.border = '1px solid rgba(0,0,0,0.08)';
                btnCancel.style.padding = '8px 12px';
                btnCancel.style.borderRadius = '4px';
                btnCancel.style.cursor = 'pointer';
            }
            if(btnConfirm){
                btnConfirm.style.background = '#e53935';
                btnConfirm.style.color = '#ffffff';
                btnConfirm.style.border = 'none';
                btnConfirm.style.padding = '8px 12px';
                btnConfirm.style.borderRadius = '4px';
                btnConfirm.style.cursor = 'pointer';
            }
            const actions = confirmOverlay.querySelector('.confirm-actions');
            if(actions){ actions.style.display = 'flex'; actions.style.gap = '8px'; actions.style.justifyContent = 'flex-end'; actions.style.marginTop = '12px'; }
        }catch(e){ /* ignore style application errors */ }
        // handlers
        confirmOverlay.querySelector('.btn-cancel').addEventListener('click', ()=>{ confirmOverlay.style.display = 'none'; });
        confirmOverlay.querySelector('.btn-confirm').addEventListener('click', ()=>{
            const idx = confirmOverlay.dataset.deleteIndex;
            try{
                const h = loadHistory();
                if(typeof idx !== 'undefined'){
                    h.splice(parseInt(idx,10),1);
                    saveHistory(h);
                    renderHistory();
                }
            }catch(e){ console.warn('Error eliminando entrada', e); }
            confirmOverlay.style.display = 'none';
        });
        return confirmOverlay;
    }

    function showDeleteConfirmation(index){
        const modal = ensureConfirmModal();
        modal.dataset.deleteIndex = index;
        modal.style.display = 'flex';
    }


    // Initialize selects from iframe or saved settings
    (function initTypographyControls(){
        const detected = detectFontsFromIframe();
        const saved = loadTypographySettings();
        const primary = saved?.primary || detected.primary;
        const secondary = saved?.secondary || detected.secondary;

        populateFontSelect(primarySelect, primary);
        populateFontSelect(secondarySelect, secondary);

        // set slider values from saved if exist
        if(saved){
            if(titleSlider && typeof saved.titleSize !== 'undefined') titleSlider.value = saved.titleSize;
            if(subtitleSlider && typeof saved.subtitleSize !== 'undefined') subtitleSlider.value = saved.subtitleSize;
            if(paragraphSlider && typeof saved.paragraphSize !== 'undefined') paragraphSlider.value = saved.paragraphSize;
        }

        // Apply saved immediately
        if(saved) applyTypographyToIframe(saved);
    })();

    // Ensure history has a default entry if empty (preserve existing history)
    (function ensureInitialHistory(){
        try{
            const hist = loadHistory();
            if(!hist || hist.length === 0){
                const defaultEntry = {
                    primary: 'Poppins',
                    secondary: 'Poppins',
                    titleSize: 56,
                    subtitleSize: 36,
                    paragraphSize: 15,
                    timestamp: '' // leave date/time blank per request
                };
                saveHistory([defaultEntry]);
            }
        }catch(e){ console.warn('No se pudo inicializar historial', e); }
        renderHistory();
    })();

    // Update admin preview (the local preview box inside admin.html)
    const previewBox = document.getElementById('typography-preview');
    const titleValueSpan = document.getElementById('title-size-value');
    const subtitleValueSpan = document.getElementById('subtitle-size-value');
    const paragraphValueSpan = document.getElementById('paragraph-size-value');

    function updateAdminPreview(settings){
        if(!previewBox) return;
        const primary = settings?.primary || primarySelect?.value;
        const secondary = settings?.secondary || secondarySelect?.value;
        const titleSize = typeof settings?.titleSize !== 'undefined' ? settings.titleSize : (titleSlider ? titleSlider.value : undefined);
        const subtitleSize = typeof settings?.subtitleSize !== 'undefined' ? settings.subtitleSize : (subtitleSlider ? subtitleSlider.value : undefined);
        const paragraphSize = typeof settings?.paragraphSize !== 'undefined' ? settings.paragraphSize : (paragraphSlider ? paragraphSlider.value : undefined);

        // update displayed values
        if(titleValueSpan && typeof titleSize !== 'undefined') titleValueSpan.textContent = titleSize + 'px';
        if(subtitleValueSpan && typeof subtitleSize !== 'undefined') subtitleValueSpan.textContent = subtitleSize + 'px';
        if(paragraphValueSpan && typeof paragraphSize !== 'undefined') paragraphValueSpan.textContent = paragraphSize + 'px';

    // apply fonts: primary -> titles (h2), secondary -> subtitles (h4) and paragraphs (p)
    if(secondary) previewBox.style.fontFamily = secondary + ', sans-serif';
    // apply primary to title elements (h2)
    previewBox.querySelectorAll('h2').forEach(h => { if(primary) h.style.fontFamily = primary + ', sans-serif'; });
    // apply secondary to subtitle elements (h4) and paragraphs
    previewBox.querySelectorAll('h4').forEach(h => { if(secondary) h.style.fontFamily = secondary + ', sans-serif'; });
    previewBox.querySelectorAll('p').forEach(p => { if(secondary) p.style.fontFamily = secondary + ', sans-serif'; });

    // apply sizes to matching elements in the preview
    if(typeof titleSize !== 'undefined'){
        previewBox.querySelectorAll('h2').forEach(h => h.style.fontSize = titleSize + 'px');
    }
    if(typeof subtitleSize !== 'undefined'){
        previewBox.querySelectorAll('h4').forEach(h => h.style.fontSize = subtitleSize + 'px');
    }
    if(typeof paragraphSize !== 'undefined'){
        previewBox.querySelectorAll('p').forEach(p => p.style.fontSize = paragraphSize + 'px');
    }
    }

    // Live change handlers
    // Helper: apply only primary font (titles) to iframe and preview
    function applyPrimaryFontOnly(font){
        if(!font) return;
        // inject into iframe
        const doc = safeGetIframeDoc();
        if(doc) injectGoogleFontInDoc(doc, font);
        // apply to iframe titles (h2)
        try{ if(doc) doc.querySelectorAll('h2').forEach(h => h.style.fontFamily = font + ', sans-serif'); }catch(e){}
        // apply to admin preview titles
        try{ if(previewBox) previewBox.querySelectorAll('h2').forEach(h => h.style.fontFamily = font + ', sans-serif'); }catch(e){}
    }

    // Helper: apply only secondary font (body, subtitles, paragraphs) to iframe and preview
    function applySecondaryFontOnly(font){
        if(!font) return;
        const doc = safeGetIframeDoc();
        if(doc) injectGoogleFontInDoc(doc, font);
        try{ if(doc) doc.body.style.fontFamily = font + ', sans-serif'; }catch(e){}
        try{ if(doc) doc.querySelectorAll('h4').forEach(h => h.style.fontFamily = font + ', sans-serif'); }catch(e){}
        try{ if(doc) doc.querySelectorAll('p').forEach(p => p.style.fontFamily = font + ', sans-serif'); }catch(e){}
        // admin preview
        try{ if(previewBox) previewBox.style.fontFamily = font + ', sans-serif'; }catch(e){}
        try{ if(previewBox) previewBox.querySelectorAll('h4').forEach(h => h.style.fontFamily = font + ', sans-serif'); }catch(e){}
        try{ if(previewBox) previewBox.querySelectorAll('p').forEach(p => p.style.fontFamily = font + ', sans-serif'); }catch(e){}
    }

    if(primarySelect) primarySelect.addEventListener('change', (ev)=>{
        const newPrimary = ev.currentTarget ? ev.currentTarget.value : primarySelect.value;
        try{ console.debug('primarySelect change ->', newPrimary); }catch(e){}
        applyPrimaryFontOnly(newPrimary);
    });
    if(secondarySelect) secondarySelect.addEventListener('change', (ev)=>{
        const newSecondary = ev.currentTarget ? ev.currentTarget.value : secondarySelect.value;
        try{ console.debug('secondarySelect change ->', newSecondary); }catch(e){}
        applySecondaryFontOnly(newSecondary);
    });

    // sliders update iframe too
    [titleSlider, subtitleSlider, paragraphSlider].forEach(sl => {
        if(!sl) return;
        sl.addEventListener('input', ()=>{
            const s = { primary: primarySelect?.value, secondary: secondarySelect?.value, titleSize: titleSlider?.value, subtitleSize: subtitleSlider?.value, paragraphSize: paragraphSlider?.value };
            applyTypographyToIframe(s);
            updateAdminPreview(s);
        });
    });

    // Apply / Save
    if(applyTypoBtn){
        applyTypoBtn.addEventListener('click', ()=>{
            const s = {
                primary: primarySelect?.value,
                secondary: secondarySelect?.value,
                titleSize: titleSlider ? parseInt(titleSlider.value,10) : undefined,
                subtitleSize: subtitleSlider ? parseInt(subtitleSlider.value,10) : undefined,
                paragraphSize: paragraphSlider ? parseInt(paragraphSlider.value,10) : undefined
            };
            saveTypographySettings(s);
            applyTypographyToIframe(s);
            updateAdminPreview(s);
            // push to history
            try{
                const h = loadHistory();
                h.push(Object.assign({}, s, { timestamp: Date.now() }));
                saveHistory(h);
                renderHistory();
            }catch(e){ console.warn('No se pudo actualizar historial', e); }
            try{ if(window.BroadcastChannel){ const bc = new BroadcastChannel('admin-typography'); bc.postMessage({ type: 'settings-applied', settings: s }); bc.close(); } }catch(e){}
            alert('Configuración de tipografía guardada localmente.');
        });
    }

    // Cancel button (only for typography section)
    if(applyTypoBtn){
        const typographySection = applyTypoBtn.closest('.config-section');
        const cancelBtn = typographySection ? typographySection.querySelector('.btn-secondary') : null;
        if(cancelBtn){
            cancelBtn.addEventListener('click', ()=>{
                const saved = loadTypographySettings();
                if(saved){
                    if(primarySelect) primarySelect.value = saved.primary;
                    if(secondarySelect) secondarySelect.value = saved.secondary;
                    if(titleSlider && typeof saved.titleSize !== 'undefined') titleSlider.value = saved.titleSize;
                    if(subtitleSlider && typeof saved.subtitleSize !== 'undefined') subtitleSlider.value = saved.subtitleSize;
                    if(paragraphSlider && typeof saved.paragraphSize !== 'undefined') paragraphSlider.value = saved.paragraphSize;
                    applyTypographyToIframe(saved);
                } else {
                    // reload iframe to original
                    if(iframe) iframe.contentWindow.location.reload();
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
    if(refreshBtn && iframe){
        refreshBtn.addEventListener('click', function() { iframe.src = iframe.src; });
    }
    // View site button
    const viewSiteBtn = document.getElementById('view-site');
    if(viewSiteBtn){ viewSiteBtn.addEventListener('click', function(){ window.open('../index.html','_blank'); }); }

    // Smooth scrolling for sidebar links
    document.querySelectorAll('.sidebar-menu a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

});