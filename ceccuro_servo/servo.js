(() => {
    let csrfTokenPromise;
    const scriptUrl = document.currentScript?.src || `${window.location.origin}/ceccuro_servo/servo.js`;

    const getCsrfToken = () => {
        if (!csrfTokenPromise) {
            const endpoint = new URL('./servo.php', scriptUrl).href;
            csrfTokenPromise = fetch(endpoint, {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
            }).then((response) => {
                if (!response.ok) throw new Error('Security session unavailable.');
                return response.json();
            }).then((data) => data.csrf_token);
        }
        return csrfTokenPromise;
    };

    const request = async (url, options = {}) => {
        const method = (options.method || 'GET').toUpperCase();
        const headers = new Headers(options.headers || {});
        headers.set('X-Requested-With', 'XMLHttpRequest');
        if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            headers.set('X-CSRF-Token', await getCsrfToken());
        }
        return fetch(url, { ...options, credentials: 'same-origin', headers });
    };

    window.CeccuroServo = Object.freeze({ getCsrfToken, request });
})();
