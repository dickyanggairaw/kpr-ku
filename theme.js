// Theme Management Module for KPR Simulation App
// Handles dark/light mode switching with localStorage persistence

const THEME_KEY = 'kprku-theme';
const LIGHT_THEME = 'light';
const DARK_THEME = 'dark';

/**
 * Get system color scheme preference
 * @returns {string} 'dark' or 'light'
 */
function getSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return DARK_THEME;
    }
    return LIGHT_THEME;
}

/**
 * Get saved theme from localStorage or system preference
 * @returns {string} 'dark' or 'light'
 */
function getSavedTheme() {
    try {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme === DARK_THEME || savedTheme === LIGHT_THEME) {
            return savedTheme;
        }
    } catch (e) {
        // localStorage might be blocked (private browsing)
        console.warn('localStorage not available, using system preference');
    }
    return getSystemPreference();
}

/**
 * Apply theme to document
 * @param {string} theme - 'dark' or 'light'
 */
function setTheme(theme) {
    const validTheme = theme === DARK_THEME ? DARK_THEME : LIGHT_THEME;

    // Apply theme attribute to HTML element
    document.documentElement.setAttribute('data-theme', validTheme);

    // Update theme toggle icon
    updateThemeIcon(validTheme);

    // Save to localStorage
    try {
        localStorage.setItem(THEME_KEY, validTheme);
    } catch (e) {
        console.warn('Could not save theme preference');
    }
}

/**
 * Update theme toggle button icon
 * @param {string} theme - 'dark' or 'light'
 */
function updateThemeIcon(theme) {
    const iconElement = document.querySelector('.theme-icon');
    if (iconElement) {
        // Light mode shows sun (☀️), dark mode shows moon (🌙)
        iconElement.textContent = theme === DARK_THEME ? '🌙' : '☀️';
    }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || LIGHT_THEME;
    const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    setTheme(newTheme);
}

/**
 * Initialize theme system
 * - Load saved preference or detect system preference
 * - Apply theme before page renders (avoid flash)
 * - Listen for system preference changes
 */
function initTheme() {
    // Get and apply initial theme
    const initialTheme = getSavedTheme();
    setTheme(initialTheme);

    // Listen for system preference changes
    if (window.matchMedia) {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Modern browsers
        if (darkModeQuery.addEventListener) {
            darkModeQuery.addEventListener('change', (e) => {
                // Only update if user hasn't manually set a preference
                try {
                    const savedTheme = localStorage.getItem(THEME_KEY);
                    if (!savedTheme) {
                        setTheme(e.matches ? DARK_THEME : LIGHT_THEME);
                    }
                } catch (err) {
                    // If localStorage not available, follow system preference
                    setTheme(e.matches ? DARK_THEME : LIGHT_THEME);
                }
            });
        }
        // Older browsers
        else if (darkModeQuery.addListener) {
            darkModeQuery.addListener((e) => {
                try {
                    const savedTheme = localStorage.getItem(THEME_KEY);
                    if (!savedTheme) {
                        setTheme(e.matches ? DARK_THEME : LIGHT_THEME);
                    }
                } catch (err) {
                    setTheme(e.matches ? DARK_THEME : LIGHT_THEME);
                }
            });
        }
    }
}

// Expose toggleTheme to global scope for inline event handlers
window.toggleTheme = toggleTheme;

// Export for ES module usage
export { initTheme, setTheme, toggleTheme, LIGHT_THEME, DARK_THEME };
