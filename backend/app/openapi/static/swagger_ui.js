/**
 * Sonikoma Studio Developer Docs UI Enhancements, Built-in OAuth2 Modal,
 * and Universal Request Authorization Interceptor
 */

// 0. Intercept all outgoing Swagger UI API requests and automatically attach Bearer token
(function() {
    var originalFetch = window.fetch;
    if (originalFetch) {
        window.fetch = function(input, init) {
            var token = localStorage.getItem('sonikoma_jwt_token') || sessionStorage.getItem('sonikoma_jwt_token');
            if (token) {
                var cleanToken = token.trim().replace(/^Bearer\s+/i, '');
                var authHeaderVal = 'Bearer ' + cleanToken;

                if (typeof Request !== 'undefined' && input instanceof Request) {
                    var newHeaders = new Headers(input.headers);
                    if (!newHeaders.has('Authorization')) {
                        newHeaders.set('Authorization', authHeaderVal);
                    }
                    input = new Request(input, { headers: newHeaders });
                } else {
                    init = init || {};
                    if (typeof Headers !== 'undefined' && init.headers instanceof Headers) {
                        if (!init.headers.has('Authorization')) {
                            init.headers.set('Authorization', authHeaderVal);
                        }
                    } else if (Array.isArray(init.headers)) {
                        var hasAuth = init.headers.some(function(h) { return h[0].toLowerCase() === 'authorization'; });
                        if (!hasAuth) {
                            init.headers.push(['Authorization', authHeaderVal]);
                        }
                    } else {
                        init.headers = init.headers || {};
                        if (!init.headers['Authorization'] && !init.headers['authorization']) {
                            init.headers['Authorization'] = authHeaderVal;
                        }
                    }
                }
            }
            return originalFetch.call(this, input, init);
        };
    }

    var origOpen = XMLHttpRequest.prototype.open;
    var origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function() {
        var token = localStorage.getItem('sonikoma_jwt_token') || sessionStorage.getItem('sonikoma_jwt_token');
        if (token && this._url && typeof this._url === 'string' && this._url.indexOf('/api/') !== -1) {
            try {
                var cleanToken = token.trim().replace(/^Bearer\s+/i, '');
                this.setRequestHeader('Authorization', 'Bearer ' + cleanToken);
            } catch (e) {}
        }
        return origSend.apply(this, arguments);
    };
})();

window.addEventListener('DOMContentLoaded', function() {
    // 1. Keyboard shortcuts: Ctrl+K or / to search
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
            e.preventDefault();
            var searchInput = document.querySelector('.top-header-search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });

    // 2. Real-time endpoint filter driven by top header input
    window.sonikomaFilterEndpoints = function(query) {
        if (window.ui && window.ui.layoutActions && typeof window.ui.layoutActions.updateFilter === 'function') {
            window.ui.layoutActions.updateFilter(query);
        } else {
            var inPageInput = document.querySelector('.operation-filter-input');
            if (inPageInput) {
                inPageInput.value = query;
                inPageInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    };

    // 3. Expand / Collapse All Helper
    window.sonikomaToggleAll = function() {
        var opblocks = document.querySelectorAll('.opblock');
        var isAnyClosed = Array.from(opblocks).some(function(el) { return !el.classList.contains('is-open'); });
        opblocks.forEach(function(block) {
            var summary = block.querySelector('.opblock-summary');
            if (summary) {
                if (isAnyClosed && !block.classList.contains('is-open')) summary.click();
                else if (!isAnyClosed && block.classList.contains('is-open')) summary.click();
            }
        });
    };

    // 4. Sidebar Toggle Handler (Open / Close Sidebar)
    window.sonikomaToggleSidebar = function() {
        var isCollapsed = document.body.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sonikoma_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    };

    // Restore sidebar state from previous session
    if (localStorage.getItem('sonikoma_sidebar_collapsed') === 'true') {
        document.body.classList.add('sidebar-collapsed');
    }

    // 5. Inject Built-in OAuth2 Modal Container
    if (!document.getElementById('sonikomaAuthOverlay')) {
        var overlay = document.createElement('div');
        overlay.id = 'sonikomaAuthOverlay';
        overlay.className = 'sonikoma-auth-overlay';
        overlay.innerHTML = `
            <div class="sonikoma-auth-dialog">
                <div class="sonikoma-auth-dialog-header">
                    <h3><span>🔐</span> OAuth2PasswordBearer Authentication</h3>
                    <button class="sonikoma-auth-close-btn" onclick="window.sonikomaCloseAuthModal()">&times;</button>
                </div>
                <div class="sonikoma-auth-dialog-body">
                    <div class="sonikoma-auth-flow-info">
                        Flow: <strong>password</strong> &bull; Token URL: <code>/api/v1/auth/token</code>
                    </div>
                    <form id="sonikomaAuthForm" onsubmit="window.sonikomaSubmitAuth(event)">
                        <div class="sonikoma-auth-field">
                            <label for="skAuthUsername">Username or Email</label>
                            <input type="text" id="skAuthUsername" required placeholder="Enter username or email" autocomplete="username" />
                        </div>
                        <div class="sonikoma-auth-field">
                            <label for="skAuthPassword">Password</label>
                            <input type="password" id="skAuthPassword" required placeholder="Enter your password" autocomplete="current-password" />
                        </div>
                        <div id="skAuthStatus" class="sonikoma-auth-status-msg"></div>
                        <div class="sonikoma-auth-dialog-footer">
                            <button type="button" class="sonikoma-auth-btn-secondary" onclick="window.sonikomaLogoutAuth()">Logout</button>
                            <button type="button" class="sonikoma-auth-btn-secondary" onclick="window.sonikomaCloseAuthModal()">Close</button>
                            <button type="submit" class="sonikoma-auth-btn-primary" id="skAuthSubmitBtn">Authorize</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) window.sonikomaCloseAuthModal();
        });
    }

    // 6. Open and Close Modal Functions
    window.sonikomaOpenAuthModal = function() {
        var overlay = document.getElementById('sonikomaAuthOverlay');
        if (overlay) {
            overlay.classList.add('is-active');
            var uInput = document.getElementById('skAuthUsername');
            if (uInput) uInput.focus();
        }
    };

    window.sonikomaCloseAuthModal = function() {
        var overlay = document.getElementById('sonikomaAuthOverlay');
        if (overlay) overlay.classList.remove('is-active');
    };

    // 7. Submit OAuth2 Credentials & Store Token
    window.sonikomaSubmitAuth = function(e) {
        if (e) e.preventDefault();
        var uInput = document.getElementById('skAuthUsername');
        var pInput = document.getElementById('skAuthPassword');
        var statusEl = document.getElementById('skAuthStatus');
        var submitBtn = document.getElementById('skAuthSubmitBtn');

        if (!uInput || !pInput) return;
        var username = uInput.value.trim();
        var password = pInput.value;

        if (!username || !password) {
            statusEl.className = 'sonikoma-auth-status-msg error';
            statusEl.textContent = 'Please enter both username and password.';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';
        statusEl.className = 'sonikoma-auth-status-msg';
        statusEl.style.display = 'none';

        var formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        fetch('/api/v1/auth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: formData.toString()
        })
        .then(function(res) {
            return res.json().then(function(data) {
                return { status: res.status, data: data };
            });
        })
        .then(function(result) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Authorize';

            if (result.status === 200 && (result.data.access_token || result.data.token)) {
                var token = result.data.access_token || result.data.token;
                localStorage.setItem('sonikoma_jwt_token', token);
                document.cookie = 'access_token=' + encodeURIComponent(token) + '; path=/; max-age=604800; SameSite=Lax;';
                
                // Authorize Swagger UI internal store
                if (window.ui) {
                    if (typeof window.ui.preauthorizeApiKey === 'function') {
                        window.ui.preauthorizeApiKey('OAuth2PasswordBearer', token);
                        window.ui.preauthorizeApiKey('HTTPBearer', token);
                    }
                    if (window.ui.authActions && typeof window.ui.authActions.authorize === 'function') {
                        window.ui.authActions.authorize({
                            OAuth2PasswordBearer: {
                                name: 'OAuth2PasswordBearer',
                                schema: { type: 'oauth2' },
                                value: { token: { access_token: token, token_type: 'bearer' } }
                            },
                            HTTPBearer: {
                                name: 'HTTPBearer',
                                schema: { type: 'http', scheme: 'bearer' },
                                value: token
                            }
                        });
                    }
                }

                statusEl.className = 'sonikoma-auth-status-msg success';
                statusEl.textContent = 'Authorized successfully! Session is now active.';
                syncAuthStatus();

                setTimeout(function() {
                    window.sonikomaCloseAuthModal();
                }, 1200);
            } else {
                var errorDetail = result.data.detail || 'Authentication failed. Please check credentials.';
                statusEl.className = 'sonikoma-auth-status-msg error';
                statusEl.textContent = typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail);
            }
        })
        .catch(function(err) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Authorize';
            statusEl.className = 'sonikoma-auth-status-msg error';
            statusEl.textContent = 'Connection error: ' + err.message;
        });
    };

    // 8. Logout Auth
    window.sonikomaLogoutAuth = function() {
        localStorage.removeItem('sonikoma_jwt_token');
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
        if (window.ui && window.ui.authActions && typeof window.ui.authActions.logout === 'function') {
            window.ui.authActions.logout(['OAuth2PasswordBearer', 'HTTPBearer']);
        }
        var statusEl = document.getElementById('skAuthStatus');
        if (statusEl) {
            statusEl.className = 'sonikoma-auth-status-msg success';
            statusEl.textContent = 'Logged out successfully.';
        }
        syncAuthStatus();
        setTimeout(function() {
            window.sonikomaCloseAuthModal();
        }, 800);
    };

    // 9. Synchronize Header Authorize Button State & Pre-authorize Swagger
    var LOCKED_SVG_HTML = '<svg viewBox="0 0 20 20" width="14" height="14" fill="#10b981" style="display:block;margin:auto;"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>';
    var UNLOCKED_SVG_HTML = '<svg viewBox="0 0 20 20" width="14" height="14" fill="#818cf8" style="display:block;margin:auto;"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2h-3V7a5 5 0 00-5-5zm0 2a3 3 0 013 3v2H7V7a3 3 0 013-3z"/></svg>';

    function syncAuthStatus() {
        var topBtn = document.querySelector('.top-bar-btn.authorize-btn');
        var token = localStorage.getItem('sonikoma_jwt_token');
        var isAuthorized = !!token;

        if (isAuthorized) {
            document.body.classList.add('is-authenticated');
            if (document.cookie.indexOf('access_token=') === -1) {
                document.cookie = 'access_token=' + encodeURIComponent(token) + '; path=/; max-age=604800; SameSite=Lax;';
            }
        } else {
            document.body.classList.remove('is-authenticated');
        }

        if (token && window.ui) {
            try {
                if (typeof window.ui.preauthorizeApiKey === 'function') {
                    window.ui.preauthorizeApiKey('OAuth2PasswordBearer', token);
                    window.ui.preauthorizeApiKey('HTTPBearer', token);
                }
                var isAlreadyAuthorizedInUI = false;
                if (window.ui.authSelectors && typeof window.ui.authSelectors.authorized === 'function') {
                    var authObj = window.ui.authSelectors.authorized();
                    if (authObj) {
                        var jsAuth = typeof authObj.toJS === 'function' ? authObj.toJS() : authObj;
                        if (jsAuth && (jsAuth.OAuth2PasswordBearer || jsAuth.HTTPBearer)) {
                            isAlreadyAuthorizedInUI = true;
                        }
                    }
                }
                if (!isAlreadyAuthorizedInUI && window.ui.authActions && typeof window.ui.authActions.authorize === 'function') {
                    window.ui.authActions.authorize({
                        OAuth2PasswordBearer: {
                            name: 'OAuth2PasswordBearer',
                            schema: {
                                type: 'oauth2',
                                flows: {
                                    password: {
                                        tokenUrl: '/api/v1/auth/token'
                                    }
                                }
                            },
                            value: {
                                token: {
                                    access_token: token,
                                    token_type: 'bearer'
                                }
                            }
                        },
                        HTTPBearer: {
                            name: 'HTTPBearer',
                            schema: {
                                type: 'http',
                                scheme: 'bearer'
                            },
                            value: token
                        }
                    });
                }
            } catch (e) {}
        }

        // Update all per-endpoint lock icon buttons
        var lockButtons = document.querySelectorAll('.authorization__btn');
        lockButtons.forEach(function(btn) {
            if (isAuthorized) {
                if (!btn.classList.contains('sonikoma-locked-active')) {
                    btn.classList.add('sonikoma-locked-active');
                    btn.classList.remove('sonikoma-unlocked-active');
                    btn.title = 'Authorized: Active JWT session attached';
                    btn.innerHTML = LOCKED_SVG_HTML;
                }
            } else {
                if (!btn.classList.contains('sonikoma-unlocked-active')) {
                    btn.classList.add('sonikoma-unlocked-active');
                    btn.classList.remove('sonikoma-locked-active');
                    btn.title = 'Click to Authorize endpoint';
                    btn.innerHTML = UNLOCKED_SVG_HTML;
                }
            }
        });

        if (topBtn) {
            if (isAuthorized) {
                topBtn.classList.add('authorized');
                topBtn.innerHTML = '<span class="auth-icon">🔒</span><span>Authorized</span>';
            } else {
                topBtn.classList.remove('authorized');
                topBtn.innerHTML = '<span class="auth-icon">🔓</span><span>Authorize</span>';
            }
        }

        // Inject and synchronize dedicated [Copy] [Chevron] [Lock] control tray on all endpoint cards
        var summaries = document.querySelectorAll('.opblock-summary');
        summaries.forEach(function(summary) {
            var tray = summary.querySelector('.sonikoma-endpoint-controls');
            if (!tray) {
                tray = document.createElement('div');
                tray.className = 'sonikoma-endpoint-controls';
                tray.innerHTML = [
                    '<button type="button" class="sonikoma-ctrl-btn sonikoma-copy-btn" title="Copy endpoint URL">📋</button>',
                    '<button type="button" class="sonikoma-ctrl-btn sonikoma-arrow-btn" title="Expand / Collapse">▼</button>',
                    '<button type="button" class="sonikoma-ctrl-btn sonikoma-lock-btn' + (isAuthorized ? ' authorized' : '') + '" title="' + (isAuthorized ? 'Authorized: JWT active' : 'Click to Authorize') + '">' + (isAuthorized ? '🔒' : '🔓') + '</button>'
                ].join('');
                summary.appendChild(tray);
            } else {
                var lockBtn = tray.querySelector('.sonikoma-lock-btn');
                if (lockBtn) {
                    if (isAuthorized && !lockBtn.classList.contains('authorized')) {
                        lockBtn.classList.add('authorized');
                        lockBtn.title = 'Authorized: JWT active';
                        lockBtn.innerHTML = '🔒';
                    } else if (!isAuthorized && lockBtn.classList.contains('authorized')) {
                        lockBtn.classList.remove('authorized');
                        lockBtn.title = 'Click to Authorize';
                        lockBtn.innerHTML = '🔓';
                    }
                }
            }
        });

        // Inject copy buttons on Curl, Request URL, and Response code blocks
        injectCodeCopyButtons();
    }

    function getCleanText(el) {
        if (!el) return '';
        var clone = el.cloneNode(true);
        var removeEls = clone.querySelectorAll('button, .sonikoma-box-copy-btn, .download-contents, .download-contents-wrapper, .copy-to-clipboard, .sonikoma-arrow-btn, .sonikoma-copy-btn, .sonikoma-url-copy-btn');
        removeEls.forEach(function(b) { b.remove(); });
        var text = clone.innerText || clone.textContent || '';
        return text.replace(/^\s*(📋|✓|Copy|Copied!|Download|⬇|🪟|PowerShell)+\s*/gi, '').replace(/\s*(📋|✓|Copy|Copied!|Download|⬇|🪟|PowerShell)+\s*$/gi, '').trim();
    }

    function getActiveAuthToken() {
        var token = localStorage.getItem('sonikoma_jwt_token') || '';
        if (!token) {
            try {
                if (window.ui && window.ui.authSelectors && typeof window.ui.authSelectors.authorized === 'function') {
                    var authState = window.ui.authSelectors.authorized();
                    if (authState) {
                        var authObj = typeof authState.toJS === 'function' ? authState.toJS() : authState;
                        if (authObj.HTTPBearer && authObj.HTTPBearer.value) {
                            var v = authObj.HTTPBearer.value;
                            token = typeof v === 'string' ? v : (v.token || v.access_token || '');
                        } else if (authObj.OAuth2PasswordBearer && authObj.OAuth2PasswordBearer.value) {
                            var v2 = authObj.OAuth2PasswordBearer.value;
                            token = typeof v2 === 'string' ? v2 : (v2.access_token || (v2.token && v2.token.access_token) || v2.token || '');
                        }
                    }
                }
            } catch (e) {}
        }
        if (!token) {
            try {
                var rawAuth = localStorage.getItem('authorized');
                if (rawAuth) {
                    var parsed = JSON.parse(rawAuth);
                    if (parsed.HTTPBearer && parsed.HTTPBearer.value) {
                        var v3 = parsed.HTTPBearer.value;
                        token = typeof v3 === 'string' ? v3 : (v3.token || v3.access_token || '');
                    } else if (parsed.OAuth2PasswordBearer && parsed.OAuth2PasswordBearer.value) {
                        var v4 = parsed.OAuth2PasswordBearer.value;
                        token = typeof v4 === 'string' ? v4 : (v4.access_token || (v4.token && v4.token.access_token) || v4.token || '');
                    }
                }
            } catch (e) {}
        }
        return token ? token.trim().replace(/^Bearer\s+/i, '') : '';
    }

    function injectAuthHeaderIntoCurl(curlText, token) {
        if (!token || !curlText) return curlText;
        var cleanToken = token.trim().replace(/^Bearer\s+/i, '');
        if (/authorization:/i.test(curlText)) return curlText;

        var lines = curlText.split('\n');
        var injected = false;
        var result = [];

        for (var i = 0; i < lines.length; i++) {
            result.push(lines[i]);
            if (!injected && (lines[i].indexOf('http://') !== -1 || lines[i].indexOf('https://') !== -1 || i === 0)) {
                var isPowerShell = /`\s*$/.test(lines[i]);
                var contChar = isPowerShell ? '`' : '\\';
                if (!lines[i].trim().endsWith(contChar)) {
                    result[result.length - 1] = lines[i].trimEnd() + ' ' + contChar;
                }
                result.push("  -H 'Authorization: Bearer " + cleanToken + "' " + contChar);
                injected = true;
            }
        }
        return result.join('\n');
    }

    function convertCurlToPowerShell(rawText) {
        if (!rawText) return '';
        var token = getActiveAuthToken();
        var cmd = injectAuthHeaderIntoCurl(rawText, token).trim();
        // Replace leading curl with curl.exe
        if (/^curl\b/i.test(cmd)) {
            cmd = cmd.replace(/^curl\b/i, 'curl.exe');
        } else if (!/^curl\.exe\b/i.test(cmd)) {
            cmd = 'curl.exe ' + cmd;
        }
        // Replace bash backslash line continuations with PowerShell backticks
        cmd = cmd.replace(/\\\s*$/gm, '`');
        return cmd;
    }

    function injectCodeCopyButtons() {
        function attachActionsToolbar(container, getTextFn, hasDownload, isCurl) {
            if (!container) return;

            // Remove any rogue floating download buttons from Swagger UI
            var parent = container.closest('.response-col_description') || container.parentElement;
            if (parent) {
                var rogues = parent.querySelectorAll('.download-contents, .download-contents-wrapper');
                rogues.forEach(function(r) {
                    if (!r.closest('.sonikoma-code-header')) r.remove();
                });
            }

            // Check if code header already exists above container
            var prev = container.previousElementSibling;
            if (prev && prev.classList.contains('sonikoma-code-header')) return;

            var header = document.createElement('div');
            header.className = 'sonikoma-code-header';

            var title = document.createElement('span');
            title.className = 'sonikoma-code-title';
            title.innerHTML = hasDownload ? '<span>📄</span><span>JSON Response</span>' : (isCurl ? '<span>💻</span><span>cURL Command</span>' : '<span>⚡</span><span>Code Output</span>');
            header.appendChild(title);

            var toolbar = document.createElement('div');
            toolbar.className = 'sonikoma-box-actions';

            // 1. Download Button (if response body)
            if (hasDownload) {
                var dlBtn = document.createElement('button');
                dlBtn.type = 'button';
                dlBtn.className = 'sonikoma-box-download-btn';
                dlBtn.title = 'Download response as JSON';
                dlBtn.innerHTML = '<span>⬇</span><span>Download</span>';
                dlBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var text = getTextFn ? getTextFn(container) : getCleanText(container);
                    var blob = new Blob([text], { type: 'application/json' });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = 'response.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                };
                toolbar.appendChild(dlBtn);
            }

            // 2. PowerShell Copy Button (for cURL)
            if (isCurl) {
                var psBtn = document.createElement('button');
                psBtn.type = 'button';
                psBtn.className = 'sonikoma-box-copy-btn';
                psBtn.title = 'Copy as Windows PowerShell (curl.exe) format with Authorization';
                psBtn.innerHTML = '<span class="icon">🪟</span><span>PowerShell</span>';
                psBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var text = getTextFn ? getTextFn(container) : getCleanText(container);
                    var psText = convertCurlToPowerShell(text);
                    navigator.clipboard.writeText(psText).then(function() {
                        psBtn.innerHTML = '<span class="icon">✓</span><span>Copied PS!</span>';
                        psBtn.classList.add('copied');
                        setTimeout(function() {
                            psBtn.innerHTML = '<span class="icon">🪟</span><span>PowerShell</span>';
                            psBtn.classList.remove('copied');
                        }, 1500);
                    }).catch(function() {
                        navigator.clipboard.writeText(psText);
                    });
                };
                toolbar.appendChild(psBtn);
            }

            // 3. Standard Copy Button
            var copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'sonikoma-box-copy-btn';
            copyBtn.title = 'Copy to clipboard';
            copyBtn.innerHTML = '<span class="icon">📋</span><span>Copy</span>';
            copyBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                var text = getTextFn ? getTextFn(container) : getCleanText(container);
                var token = getActiveAuthToken();
                var finalText = isCurl ? injectAuthHeaderIntoCurl(text, token) : text;
                navigator.clipboard.writeText(finalText).then(function() {
                    copyBtn.innerHTML = '<span class="icon">✓</span><span>Copied!</span>';
                    copyBtn.classList.add('copied');
                    setTimeout(function() {
                        copyBtn.innerHTML = '<span class="icon">📋</span><span>Copy</span>';
                        copyBtn.classList.remove('copied');
                    }, 1500);
                }).catch(function() {
                    navigator.clipboard.writeText(finalText);
                });
            };
            toolbar.appendChild(copyBtn);

            header.appendChild(toolbar);
            if (container.parentNode) {
                container.parentNode.insertBefore(header, container);
            }
        }

        // 1. Curl command (attach ONLY to the pre block)
        var curlPres = document.querySelectorAll('.swagger-ui .curl pre, .swagger-ui .curl-command pre');
        curlPres.forEach(function(el) {
            attachActionsToolbar(el, function(c) { return getCleanText(c); }, false, true);
        });

        // 2. Request URL (sleek single-line terminal badge with inline copy button)
        var urlContainers = document.querySelectorAll('.swagger-ui .request-url');
        urlContainers.forEach(function(container) {
            if (container.classList.contains('sonikoma-url-enhanced')) return;
            container.classList.add('sonikoma-url-enhanced');

            var pre = container.querySelector('pre') || container;
            var copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'sonikoma-url-copy-btn';
            copyBtn.title = 'Copy Request URL';
            copyBtn.innerHTML = '<span class="icon">📋</span><span>Copy URL</span>';
            copyBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                var text = getCleanText(pre);
                navigator.clipboard.writeText(text).then(function() {
                    copyBtn.innerHTML = '<span class="icon">✓</span><span>Copied!</span>';
                    copyBtn.classList.add('copied');
                    setTimeout(function() {
                        copyBtn.innerHTML = '<span class="icon">📋</span><span>Copy URL</span>';
                        copyBtn.classList.remove('copied');
                    }, 1500);
                }).catch(function() {
                    navigator.clipboard.writeText(text);
                });
            };
            container.appendChild(copyBtn);
        });

        // 3. Response body (attach to highlight-code with Download button)
        var respCodes = document.querySelectorAll('.swagger-ui .responses-table .highlight-code, .swagger-ui .responses-inner .highlight-code, .swagger-ui .response-col_description .highlight-code');
        respCodes.forEach(function(el) {
            attachActionsToolbar(el, function(c) {
                var pre = c.querySelector('pre') || c;
                return getCleanText(pre);
            }, true);
        });

        // 4. Response headers (attach to response-headers pre or response-headers)
        var headerPres = document.querySelectorAll('.swagger-ui .response-headers pre, .swagger-ui .response-headers');
        headerPres.forEach(function(el) {
            attachActionsToolbar(el, function(c) { return getCleanText(c); }, false);
        });

        // 5. Example values
        var examplePres = document.querySelectorAll('.swagger-ui .example pre');
        examplePres.forEach(function(el) {
            attachActionsToolbar(el, function(c) { return getCleanText(c); }, false);
        });
    }

    syncAuthStatus();
    setInterval(syncAuthStatus, 500);

    // 10. Click handlers for custom control tray buttons (Copy, Arrow, Lock)
    document.addEventListener('click', function(e) {
        var copyBtn = e.target.closest('.sonikoma-copy-btn');
        if (copyBtn) {
            e.preventDefault();
            e.stopPropagation();
            var summary = copyBtn.closest('.opblock-summary');
            var pathEl = summary ? summary.querySelector('.opblock-summary-path a, .opblock-summary-path span') : null;
            var pathText = pathEl ? getCleanText(pathEl) : '';
            if (pathText) {
                var fullUrl = window.location.origin + pathText;
                navigator.clipboard.writeText(fullUrl).then(function() {
                    copyBtn.innerText = '✓';
                    copyBtn.classList.add('copied');
                    setTimeout(function() {
                        copyBtn.innerText = '📋';
                        copyBtn.classList.remove('copied');
                    }, 1500);
                }).catch(function() {
                    navigator.clipboard.writeText(fullUrl);
                });
            }
            return;
        }

        var arrowBtn = e.target.closest('.sonikoma-arrow-btn');
        if (arrowBtn) {
            e.preventDefault();
            e.stopPropagation();
            var summary = arrowBtn.closest('.opblock-summary');
            if (summary) {
                var control = summary.querySelector('.opblock-summary-control');
                if (control) control.click();
                else summary.click();
            }
            return;
        }

        var lockBtn = e.target.closest('.sonikoma-lock-btn, .authorization__btn');
        if (lockBtn) {
            e.preventDefault();
            e.stopPropagation();
            window.sonikomaOpenAuthModal();
            return;
        }
    }, true);
});
