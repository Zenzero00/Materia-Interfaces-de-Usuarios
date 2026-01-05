// Page Transition Loader
// This script shows the loader animation when navigating between pages

(function () {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoader);
    } else {
        initLoader();
    }

    function initLoader() {
        // Get admin colors from localStorage
        let colors = {
            primary: '#43ba7f',    // Color 1 - Verde
            secondary: '#ff511a', // Color 2 - Naranja
            accent: '#212741',    // Color 3 - Oscuro
            neutral: '#ffffff'    // Color 4 - Blanco
        };

        try {
            const savedColors = localStorage.getItem('admin_color_settings');
            if (savedColors) {
                const parsed = JSON.parse(savedColors);
                if (parsed.primary) colors.primary = parsed.primary;
                if (parsed.secondary) colors.secondary = parsed.secondary;
                if (parsed.accent) colors.accent = parsed.accent;
                if (parsed.neutral) colors.neutral = parsed.neutral;
            }
        } catch (e) { }

        // Create loader HTML with admin colors
        const loaderHTML = `
      <div id="page-loader" class="loader" style="display: none;">
        <div>
          <div class="tangram">
            <div class="triangle ax4 f1" style="background-color: ${colors.primary};"></div>
            <div class="triangle ax4 f2" style="background-color: ${colors.secondary};"></div>
            <div class="triangle ax2 f3" style="background-color: ${colors.accent};"></div>
            <div class="triangle f4" style="background-color: ${colors.neutral};"></div>
            <div class="triangle f5" style="background-color: ${colors.primary};"></div>
            <div class="square f6" style="background-color: ${colors.secondary};"></div>
            <div class="rhomboid f7" style="background-color: ${colors.accent};"></div>
          </div>
        </div>
      </div>
    `;

        // Add loader to body
        document.body.insertAdjacentHTML('beforeend', loaderHTML);

        // Intercept all link clicks
        document.addEventListener('click', function (e) {
            const link = e.target.closest('a');
            if (link && link.href && !link.href.startsWith('javascript:') && !link.href.startsWith('#')) {
                // Check if it's an internal link (same origin)
                const url = new URL(link.href);
                if (url.origin === window.location.origin) {
                    e.preventDefault();
                    showLoaderAndNavigate(link.href);
                }
            }
        });

        // Also intercept form submissions that navigate
        document.addEventListener('submit', function (e) {
            const form = e.target;
            if (form.method === 'get' || !form.method) {
                // Show loader for GET form submissions
                showLoaderAndNavigate(null, form);
            }
        });
    }

    function showLoaderAndNavigate(url, form) {
        const loader = document.getElementById('page-loader');
        if (!loader) return;

        // Show loader
        loader.style.display = 'flex';

        // Wait for half the animation cycle (2 figures)
        // The animation is 12.5s with a 1.5s delay, showing half = 7s
        setTimeout(() => {
            if (form) {
                form.submit();
            } else if (url) {
                window.location.href = url;
            }
        }, 7000);
    }

    // Show loader when page is about to unload
    window.addEventListener('beforeunload', function () {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.style.display = 'flex';
        }
    });

    // Hide loader when page loads (in case of back navigation)
    window.addEventListener('load', function () {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    });

    // Expose global function for scripts to use
    window.navigateWithLoader = function (url) {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.style.display = 'flex';
            setTimeout(() => {
                window.location.href = url;
            }, 7000);
        } else {
            window.location.href = url;
        }
    };
})();
