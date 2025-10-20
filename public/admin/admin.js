// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Color picker functionality
    const colorInputs = document.querySelectorAll('input[type="color"]');
    const colorTextInputs = document.querySelectorAll('input[type="text"][id$="-hex"]');
    
    colorInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            colorTextInputs[index].value = this.value;
        });
    });
    
    colorTextInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            if (this.value.match(/^#[0-9A-F]{6}$/i)) {
                colorInputs[index].value = this.value;
            }
        });
    });
    
    // Font size range
    const baseFontSize = document.getElementById('base-font-size');
    const baseSizeValue = document.getElementById('base-size-value');
    
    baseFontSize.addEventListener('input', function() {
        baseSizeValue.textContent = this.value + 'px';
        updateTypographyPreview();
    });
    
    // Line height range
    const lineHeight = document.getElementById('line-height');
    const lineHeightValue = document.getElementById('line-height-value');
    
    lineHeight.addEventListener('input', function() {
        lineHeightValue.textContent = this.value;
        updateTypographyPreview();
    });
    
    // Font selectors
    const fontSelectors = document.querySelectorAll('.font-selector');
    fontSelectors.forEach(selector => {
        selector.addEventListener('change', updateTypographyPreview);
    });
    
    // Font import functionality
    const fontImportBtn = document.getElementById('import-font-btn');
    const fontImportUrl = document.getElementById('font-import-url');
    
    fontImportBtn.addEventListener('click', function() {
        const fontName = fontImportUrl.value.trim();
        if (fontName) {
            // Create a new link element for the Google Font
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}&display=swap`;
            document.head.appendChild(link);
            
            // Add to font selector options
            const primaryFontSelect = document.getElementById('primary-font');
            const secondaryFontSelect = document.getElementById('secondary-font');
            
            [primaryFontSelect, secondaryFontSelect].forEach(select => {
                const option = document.createElement('option');
                option.value = fontName;
                option.textContent = fontName;
                select.appendChild(option);
            });
            
            // Clear input
            fontImportUrl.value = '';
            
            alert(`Fuente "${fontName}" importada correctamente`);
        } else {
            alert('Por favor, ingresa el nombre de una fuente');
        }
    });
    
    // Update typography preview
    function updateTypographyPreview() {
        const preview = document.getElementById('typography-preview');
        const primaryFont = document.getElementById('primary-font').value;
        const secondaryFont = document.getElementById('secondary-font').value;
        const baseSize = baseFontSize.value + 'px';
        const lineHeightValue = lineHeight.value;
        const fontWeight = document.getElementById('font-weight').value;
        
        preview.style.fontFamily = primaryFont;
        preview.style.fontSize = baseSize;
        preview.style.lineHeight = lineHeightValue;
        preview.style.fontWeight = fontWeight;
        
        // Apply secondary font to headings
        const headings = preview.querySelectorAll('h1, h2, h3');
        headings.forEach(heading => {
            heading.style.fontFamily = secondaryFont;
        });
    }
    
    // Apply colors button
    document.getElementById('apply-colors').addEventListener('click', function() {
        // Get color values
        const color1 = document.getElementById('color-1').value;
        const color2 = document.getElementById('color-2').value;
        const color3 = document.getElementById('color-3').value;
        const color4 = document.getElementById('color-4').value;
        
        // Apply colors to CSS variables
        document.documentElement.style.setProperty('--primary-color', color1);
        document.documentElement.style.setProperty('--secondary-color', color2);
        document.documentElement.style.setProperty('--accent-color', color3);
        document.documentElement.style.setProperty('--danger-color', color4);
        
        alert('Colores aplicados correctamente');
    });
    
    // Apply typography button
    document.getElementById('apply-typography').addEventListener('click', function() {
        alert('Tipografía aplicada correctamente');
        // Aquí iría la lógica para aplicar la tipografía al sitio principal
    });
    
    // Apply functions button
    document.getElementById('apply-functions').addEventListener('click', function() {
        const colorblindMode = document.getElementById('colorblind-mode').checked;
        
        if (colorblindMode) {
            // Apply colorblind-friendly colors
            document.documentElement.style.setProperty('--primary-color', '#0072B2');
            document.documentElement.style.setProperty('--secondary-color', '#009E73');
            document.documentElement.style.setProperty('--accent-color', '#E69F00');
            document.documentElement.style.setProperty('--danger-color', '#D55E00');
        }
        
        alert('Funciones aplicadas correctamente');
    });
    
    // Refresh preview button
    document.getElementById('refresh-preview').addEventListener('click', function() {
        const preview = document.getElementById('site-preview');
        preview.src = preview.src;
    });
    
    // View site button
    document.getElementById('view-site').addEventListener('click', function() {
        window.open('../index.html', '_blank');
    });
    
    // Smooth scrolling for sidebar links
    document.querySelectorAll('.sidebar-menu a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Initialize preview
    updateTypographyPreview();
});