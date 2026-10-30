(() => {
    'use strict';

    // ── Configuration ──────────────────────────────────────────────────
    let searchString = window.location.search;
    if (searchString) {
        sessionStorage.setItem('storeConfig', searchString);
    } else {
        searchString = sessionStorage.getItem('storeConfig') || '';
    }
    const urlParams = new URLSearchParams(searchString);

    let parsedProject = 'stillhq%2FstillOS%2FsaDB-repo';
    let parsedRef = 'main';

    const fullLink = urlParams.get('link');
    if (fullLink) {
        try {
            const urlObj = new URL(fullLink);
            const parts = urlObj.pathname.split('/').filter(Boolean);
            const minusIndex = parts.indexOf('-');
            
            if (minusIndex !== -1) {
                parsedProject = encodeURIComponent(parts.slice(0, minusIndex).join('/'));
                const treeIndex = parts.indexOf('tree');
                if (treeIndex !== -1 && treeIndex < parts.length - 1) {
                    parsedRef = parts.slice(treeIndex + 1).join('/');
                }
            } else {
                parsedProject = encodeURIComponent(parts.join('/'));
            }
        } catch (e) {
            console.error("Invalid link parameter:", e);
        }
    } else {
        parsedProject = urlParams.get('project') || parsedProject;
        parsedRef = urlParams.get('ref') || urlParams.get('branch') || parsedRef;
    }

    const GITLAB_PROJECT = parsedProject;
    const REF            = parsedRef;

    const GITLAB_API     = urlParams.get('api') || ('https://gitlab.com/api/v4/projects/' + GITLAB_PROJECT);
    const GITLAB_RAW     = urlParams.get('raw') || urlParams.get('url') || `https://gitlab.com/${decodeURIComponent(GITLAB_PROJECT)}/-/raw/${REF}`;

    const APPS_PATH      = urlParams.get('apps') || 'swai_apps';
    const ICONS_PATH     = urlParams.get('icons') || 'swai_icons';

    // Pricing map (from swai files – number to human label)
    const PRICING_MAP = {
        0: 'Unknown',
        1: 'Free',
        2: 'Free (with Ads)',
        3: 'Free Trial',
        4: 'Freemium',
        5: 'One-Time Purchase',
        6: 'Subscription',
    };

    // Category icon SVGs (inline, tiny)
    const CATEGORY_ICONS = {
        'Office':      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
        'Graphics':    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        'Development': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
        'Science':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3h6v7l4 9H5l4-9V3z"/><line x1="9" y1="3" x2="15" y2="3"/></svg>',
        'Network':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
        'Audio':       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
        'AudioVideo':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
        'Chat':        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
        'Game':        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>',
        'Education':   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
        'Utility':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
        'Email':       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
        'Entertainment':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>',
    };

    // ── State ──────────────────────────────────────────────────────────
    let allApps     = [];   // parsed .swai objects
    let allBundles  = [];   // parsed .swaib objects
    let categories  = new Set();
    let activeCategory = 'all';
    let searchQuery = '';

    // ── DOM refs ───────────────────────────────────────────────────────
    const $appGrid       = document.getElementById('appGrid');
    const $bundleGrid    = document.getElementById('bundleGrid');
    const $bundlesSection = document.getElementById('bundlesSection');
    const $appsSection   = document.getElementById('appsSection');
    const $appsCount     = document.getElementById('appsCount');
    const $loadingState  = document.getElementById('loadingState');
    const $emptyState    = document.getElementById('emptyState');
    const $errorState    = document.getElementById('errorState');
    const $filterBarInner = document.querySelector('.filter-bar-inner');
    const $searchInput   = document.getElementById('searchInput');


    // Dialog
    const $dialogBackdrop = document.getElementById('dialogBackdrop');
    const $dialogClose    = document.getElementById('dialogClose');
    const $dialogIcon     = document.getElementById('dialogIcon');
    const $dialogTitle    = document.getElementById('dialogTitle');
    const $dialogSubtitle = document.getElementById('dialogSubtitle');
    const $dialogDescription = document.getElementById('dialogDescription');
    const $dialogMeta     = document.getElementById('dialogMeta');
    const $cmdSystem      = document.getElementById('cmdSystem');
    const $cmdLocal       = document.getElementById('cmdLocal');
    const $protocolInstall = document.getElementById('protocolInstall');
    const $protocolInstallHint = document.getElementById('protocolInstallHint');
    const $bundleAppsSection = document.getElementById('bundleAppsSection');
    const $bundleAppsList = document.getElementById('bundleAppsList');

    // ── Helpers ────────────────────────────────────────────────────────

    /** Build raw URL for a file in the repo */
    function rawFileUrl(filePath) {
        return `${GITLAB_RAW}/${filePath}`;
    }

    /** Build GitLab API URL to get raw file content */
    function apiRawUrl(filePath) {
        const encoded = encodeURIComponent(filePath);
        return `${GITLAB_API}/repository/files/${encoded}/raw?ref=${REF}`;
    }

    /** Build icon URL from app_id: try matching icon name in icons dir */
    function iconUrl(appFilename) {
        // e.g. com-chatgpt.swai -> com-chatgpt.png
        const base = appFilename.replace(/\.swai[b]?$/, '');
        return rawFileUrl(`${ICONS_PATH}/${base}.png`);
    }

    /** Build bundle icon URL, handling known naming mismatches in saDB-repo */
    function getBundleIconUrl(bundle) {
        const base = bundle._filename.replace('.swaib', '');
        // Repo typos/mismatches
        if (base === 'google-workplace') return rawFileUrl(`${ICONS_PATH}/google-workspace.png`);
        if (base === 'microsoft-365-enterprise') return rawFileUrl(`${ICONS_PATH}/com-microsoft-365-enterprise.png`);
        if (base === 'microsoft-365') return rawFileUrl(`${ICONS_PATH}/com-microsoft-365.png`);
        return rawFileUrl(`${ICONS_PATH}/${base}.png`);
    }

    /**
     * Point the dialog's Install button at the swai:// link for a file URL.
     * The button is hidden when the URL cannot be installed through the
     * protocol (only https sources are accepted by swai-inst).
     */
    function setProtocolInstall(fileUrl) {
        if (!$protocolInstall || !$protocolInstallHint) return;

        const link = window.swaiInstallUrl(fileUrl);
        $protocolInstall.hidden = !link;
        $protocolInstallHint.hidden = !link;
        if (link) {
            $protocolInstall.href = link;
        } else {
            $protocolInstall.removeAttribute('href');
        }
    }

    /** Pricing label */
    function pricingLabel(code) {
        return PRICING_MAP[code] || 'Unknown';
    }

    /** Pricing badge class */
    function pricingBadgeClass(code) {
        if (code === 1 || code === 2) return 'badge-free';
        if (code === 4 || code === 3) return 'badge-freemium';
        if (code === 5 || code === 6) return 'badge-paid';
        return '';
    }

    /** Escape HTML */
    function esc(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    // ── Data fetching ──────────────────────────────────────────────────

    /** List files in a directory from GitLab API */
    async function listFiles(path) {
        const url = `${GITLAB_API}/repository/tree?path=${encodeURIComponent(path)}&ref=${REF}&per_page=100`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to list ${path}: ${res.status}`);
        return res.json();
    }

    /** Fetch and parse a YAML file */
    async function fetchYaml(filePath) {
        const url = apiRawUrl(filePath);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${filePath}: ${res.status}`);
        const text = await res.text();
        return jsyaml.load(text);
    }

    /** Fetch items in batches to avoid rate limits */
    async function fetchInBatches(items, fetcher, batchSize = 10) {
        const results = [];
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(fetcher));
            results.push(...batchResults);
        }
        return results;
    }

    /** Load all apps and bundles */
    async function loadCatalog() {
        // 1. List all files in swai_apps
        const files = await listFiles(APPS_PATH);

        // 2. Separate .swai (apps) from .swaib (bundles)
        const appFiles    = files.filter(f => f.name.endsWith('.swai'));
        const bundleFiles = files.filter(f => f.name.endsWith('.swaib'));

        // 3. Fetch in smaller batches to avoid GitLab API rate limits
        const fetchFile = f => fetchYaml(f.path).then(data => ({ ...data, _filename: f.name })).catch(() => null);
        const allFiles = [...appFiles, ...bundleFiles];
        const allResults = await fetchInBatches(allFiles, fetchFile, 15);

        // Filter nulls (failed fetches) and separate
        allApps = allResults.filter(r => r && r._filename.endsWith('.swai'));
        allBundles = allResults.filter(r => r && r._filename.endsWith('.swaib'));

        // Collect categories
        categories = new Set();
        allApps.forEach(app => {
            if (app.categories && Array.isArray(app.categories)) {
                app.categories.forEach(c => categories.add(c));
            }
        });
    }

    // ── Rendering ──────────────────────────────────────────────────────


    /** Render category filter chips */
    function renderFilters() {
        // Remove existing chips except "All"
        const allChip = $filterBarInner.querySelector('[data-category="all"]');
        $filterBarInner.innerHTML = '';
        $filterBarInner.appendChild(allChip);

        // Sort categories
        const sorted = [...categories].sort();
        sorted.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'filter-chip';
            btn.dataset.category = cat;
            const iconSvg = CATEGORY_ICONS[cat] || '';
            btn.innerHTML = iconSvg + esc(cat);
            $filterBarInner.appendChild(btn);
        });

        // Event delegation
        $filterBarInner.addEventListener('click', (e) => {
            const chip = e.target.closest('.filter-chip');
            if (!chip) return;
            activeCategory = chip.dataset.category;
            $filterBarInner.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderView();
        });
    }

    /** Build an app card element */
    function createAppCard(app) {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');

        const imgSrc = app.icon_url || iconUrl(app._filename);
        const badgeLabel = pricingLabel(app.pricing);
        const badgeClass = pricingBadgeClass(app.pricing);

        card.innerHTML = `
            <img class="app-card-icon" src="${esc(imgSrc)}" alt="${esc(app.app_name)}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%23e0e0e0%22/><text x=%2232%22 y=%2238%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2220%22>${esc(app.app_name?.[0] || '?')}</text></svg>'">
            <span class="app-card-name">${esc(app.app_name)}</span>
            <span class="app-card-comment">${esc(app.comment || app.description || '')}</span>
        `;

        card.addEventListener('click', () => openAppDialog(app));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openAppDialog(app);
            }
        });

        return card;
    }

    /** Build a bundle card element */
    function createBundleCard(bundle) {
        const card = document.createElement('div');
        card.className = 'bundle-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');

        // Determine icon using helper
        const imgSrc = getBundleIconUrl(bundle);

        // Build preview chips for included apps
        const apps = bundle.apps ? Object.entries(bundle.apps) : [];
        let chipsHtml = '';
        apps.slice(0, 6).forEach(([filename, info]) => {
            const appIconBase = filename.replace('.swai', '');
            const appIconSrc = rawFileUrl(`${ICONS_PATH}/${appIconBase}.png`);
            const appName = info.app_id ? info.app_id.split('.').pop() : appIconBase;
            chipsHtml += `<span class="bundle-app-chip"><img src="${esc(appIconSrc)}" alt="" loading="lazy" onerror="this.style.display='none'">${esc(capitalize(appName))}</span>`;
        });
        if (apps.length > 6) {
            chipsHtml += `<span class="bundle-app-chip">+${apps.length - 6} more</span>`;
        }

        card.innerHTML = `
            <div class="bundle-card-header">
                <img class="bundle-card-icon" src="${esc(imgSrc)}" alt="${esc(bundle.bundle_name)}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 56 56%22><rect width=%2256%22 height=%2256%22 rx=%2212%22 fill=%22%233584e4%22 opacity=%22.15%22/><text x=%2228%22 y=%2234%22 text-anchor=%22middle%22 fill=%22%233584e4%22 font-size=%2218%22 font-weight=%22bold%22>B</text></svg>'">
                <div class="bundle-card-info">
                    <div class="bundle-card-name">${esc(bundle.bundle_name)}</div>
                    <div class="bundle-card-meta">${apps.length} app${apps.length !== 1 ? 's' : ''} · ${esc(pricingLabel(bundle.pricing))}</div>
                </div>
            </div>
            <div class="bundle-apps-preview">${chipsHtml}</div>
        `;

        card.addEventListener('click', () => openBundleDialog(bundle));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openBundleDialog(bundle);
            }
        });

        return card;
    }

    /** Capitalize first letter */
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /** Filter and render the current view */
    function renderView() {
        const query = searchQuery.toLowerCase().trim();

        // Filter apps
        let filteredApps = allApps.filter(app => {
            // Category filter
            if (activeCategory !== 'all') {
                if (!app.categories || !app.categories.includes(activeCategory)) return false;
            }
            // Search filter
            if (query) {
                const haystack = [
                    app.app_name,
                    app.app_id,
                    app.comment,
                    app.description,
                    ...(app.keywords || []),
                    ...(app.categories || []),
                ].filter(Boolean).join(' ').toLowerCase();
                return haystack.includes(query);
            }
            return true;
        });

        // Filter bundles (only by search, not by category)
        let filteredBundles = allBundles;
        if (query) {
            filteredBundles = allBundles.filter(b => {
                const haystack = [
                    b.bundle_name,
                    b.bundle_id,
                ].filter(Boolean).join(' ').toLowerCase();
                return haystack.includes(query);
            });
        }

        // If category filter is active, hide bundles section
        const showBundles = activeCategory === 'all' && filteredBundles.length > 0;

        // Render bundles
        $bundleGrid.innerHTML = '';
        if (showBundles) {
            $bundlesSection.style.display = '';
            filteredBundles.forEach(b => $bundleGrid.appendChild(createBundleCard(b)));
        } else {
            $bundlesSection.style.display = 'none';
        }

        // Render apps
        $appGrid.innerHTML = '';
        filteredApps.forEach(app => $appGrid.appendChild(createAppCard(app)));

        // Update count
        $appsCount.textContent = `${filteredApps.length} application${filteredApps.length !== 1 ? 's' : ''}`;

        // Show/hide states
        const hasResults = filteredApps.length > 0 || (showBundles && filteredBundles.length > 0);
        $appsSection.style.display = filteredApps.length > 0 ? '' : 'none';
        $emptyState.style.display = hasResults ? 'none' : '';
    }

    // ── Dialog ─────────────────────────────────────────────────────────

    function openAppDialog(app) {
        const imgSrc = app.icon_url || iconUrl(app._filename);
        const updateUrl = app.update_url || rawFileUrl(`${APPS_PATH}/${app._filename}`);

        $dialogIcon.src = imgSrc;
        $dialogTitle.textContent = app.app_name;
        $dialogSubtitle.textContent = app.app_id;
        $dialogDescription.textContent = app.description || app.comment || '';

        // Meta chips
        let metaHtml = '';
        if (app.pricing !== undefined) {
            metaHtml += `<span class="meta-chip">${esc(pricingLabel(app.pricing))}</span>`;
        }
        if (app.categories) {
            app.categories.forEach(c => {
                metaHtml += `<span class="meta-chip">${esc(c)}</span>`;
            });
        }
        if (app.author) {
            metaHtml += `<span class="meta-chip">${esc(app.author)}</span>`;
        }
        $dialogMeta.innerHTML = metaHtml;

        // Commands
        $cmdSystem.textContent = `sudo swai-inst install ${updateUrl}`;
        $cmdLocal.textContent  = `swai-inst --local install ${updateUrl}`;
        setProtocolInstall(updateUrl);

        // Hide bundle section
        $bundleAppsSection.style.display = 'none';

        openDialog();
    }

    function openBundleDialog(bundle) {
        const imgSrc = getBundleIconUrl(bundle);
        const updateUrl = bundle.update_url || rawFileUrl(`${APPS_PATH}/${bundle._filename}`);

        $dialogIcon.src = imgSrc;
        $dialogTitle.textContent = bundle.bundle_name;
        $dialogSubtitle.textContent = bundle.bundle_id;
        $dialogDescription.textContent = `This bundle installs ${Object.keys(bundle.apps || {}).length} apps together with a single command.`;

        // Meta chips
        let metaHtml = '';
        if (bundle.pricing !== undefined) {
            metaHtml += `<span class="meta-chip">${esc(pricingLabel(bundle.pricing))}</span>`;
        }
        metaHtml += `<span class="meta-chip badge-bundle">Bundle</span>`;
        $dialogMeta.innerHTML = metaHtml;

        // Commands
        $cmdSystem.textContent = `sudo swai-inst install ${updateUrl}`;
        $cmdLocal.textContent  = `swai-inst --local install ${updateUrl}`;
        setProtocolInstall(updateUrl);

        // Bundle apps list
        const apps = bundle.apps ? Object.entries(bundle.apps) : [];
        if (apps.length > 0) {
            $bundleAppsSection.style.display = '';
            $bundleAppsList.innerHTML = '';
            apps.forEach(([filename, info]) => {
                const appIconBase = filename.replace('.swai', '');
                const appIconSrc = rawFileUrl(`${ICONS_PATH}/${appIconBase}.png`);
                const appName = capitalize(info.app_id ? info.app_id.split('.').pop() : appIconBase);

                const row = document.createElement('div');
                row.className = 'bundle-app-row';
                row.innerHTML = `
                    <img src="${esc(appIconSrc)}" alt="" loading="lazy" onerror="this.style.display='none'">
                    <div class="bundle-app-row-info">
                        <div class="bundle-app-row-name">${esc(appName)}</div>
                        <div class="bundle-app-row-id">${esc(info.app_id || '')}</div>
                    </div>
                `;
                $bundleAppsList.appendChild(row);
            });
        } else {
            $bundleAppsSection.style.display = 'none';
        }

        openDialog();
    }

    function openDialog() {
        $dialogBackdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDialog() {
        $dialogBackdrop.classList.remove('open');
        document.body.style.overflow = '';
    }

    // ── Copy buttons ───────────────────────────────────────────────────
    document.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-btn');
        if (!copyBtn) return;

        const targetId = copyBtn.dataset.target;
        const codeEl = document.getElementById(targetId);
        if (!codeEl) return;

        navigator.clipboard.writeText(codeEl.textContent).then(() => {
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
            }, 2000);
        });
    });

    // ── Events ─────────────────────────────────────────────────────────

    // Close dialog
    $dialogClose.addEventListener('click', closeDialog);
    $dialogBackdrop.addEventListener('click', (e) => {
        if (e.target === $dialogBackdrop) closeDialog();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDialog();
    });

    // Search
    let searchTimeout;
    $searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = $searchInput.value;
            renderView();
        }, 200);
    });

    // ── Initialization ─────────────────────────────────────────────────

    async function init() {
        try {
            await loadCatalog();
            $loadingState.style.display = 'none';
            renderFilters();
            renderView();
        } catch (err) {
            console.error('Failed to load catalog:', err);
            $loadingState.style.display = 'none';
            $errorState.style.display = '';
        }
    }

    init();
})();
