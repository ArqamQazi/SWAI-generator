document.addEventListener('DOMContentLoaded', () => {
    // Register Service Worker for offline support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.error('ServiceWorker registration failed: ', error);
            });
    }
    const form = document.getElementById('swaiForm');
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const outputContainer = document.getElementById('outputContainer');
    const outputYaml = document.getElementById('outputYaml');

    const iconUrlInput = document.getElementById('iconUrl');
    const iconFileInput = document.getElementById('iconFileInput');
    const iconBrowseBtn = document.getElementById('iconBrowseBtn');

    const shareUrlInput = document.getElementById('shareUrl');
    const installLinkInput = document.getElementById('installLink');
    const copyInstallLinkBtn = document.getElementById('copyInstallLinkBtn');

    if (iconBrowseBtn && iconFileInput) {
        iconBrowseBtn.addEventListener('click', () => {
            iconFileInput.click();
        });

        iconFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                iconUrlInput.value = file.name; 
            }
        });
    }

    function splitLines(str) {
        if (!str) return undefined;
        const lines = str.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        return lines.length > 0 ? lines : undefined;
    }

    function splitComma(str) {
        if (!str) return undefined;
        const items = str.split(',').map(l => l.trim()).filter(l => l.length > 0);
        return items.length > 0 ? items : undefined;
    }

    generateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const data = {
            app_name: formData.get('app_name').trim(),
            app_id: formData.get('app_id').trim(),
            main_url: formData.get('main_url').trim(),
            allowed_urls: splitLines(formData.get('allowed_urls')),
        };

        // Optionals
        const iconUrl = formData.get('icon_url');
        if (iconUrl) data.icon_url = iconUrl.trim();

        const notAllowed = splitLines(formData.get('not_allowed_urls'));
        if (notAllowed) data.not_allowed_urls = notAllowed;

        const loginUrls = splitLines(formData.get('login_urls'));
        if (loginUrls) data.login_urls = loginUrls;

        const allowMultiWindow = formData.get('allow_multi_window') === 'on';
        if (allowMultiWindow !== true) {
            data.allow_multi_window = allowMultiWindow;
        }

        const useDynamicColors = formData.get('use_dynamic_titlebar_colors') === 'on';
        if (useDynamicColors !== true) {
            data.use_dynamic_titlebar_colors = useDynamicColors;
        }

        const useManifest = formData.get('use_manifest') === 'on';
        if (useManifest !== false) {
            data.use_manifest = useManifest;
        }

        const ecosystem = formData.get('ecosystem');
        if (ecosystem) {
            data.ecosystem = ecosystem.trim();
            const reuseWindow = formData.get('reuse_window_for_ecosystem_navigation') === 'on';
            if (reuseWindow !== false) {
                data.reuse_window_for_ecosystem_navigation = reuseWindow;
            }
        }

        const categories = splitComma(formData.get('categories'));
        if (categories) data.categories = categories;

        const keywords = splitComma(formData.get('keywords'));
        if (keywords) data.keywords = keywords;

        const comment = formData.get('comment');
        if (comment) data.comment = comment.trim();

        const customJs = formData.get('custom_js');
        if (customJs && customJs.trim().length > 0) {
            data.custom_js = customJs; 
        }

        const customUserAgent = formData.get('custom_user_agent');
        if (customUserAgent && customUserAgent.trim().length > 0) {
            data.custom_user_agent = customUserAgent.trim();
        }

        try {
            // Generate YAML string
            const yamlString = jsyaml.dump(data, {
                lineWidth: -1, 
                noRefs: true
            });
            outputYaml.value = yamlString;
            outputContainer.classList.remove('hidden');
            outputContainer.scrollIntoView({ behavior: 'smooth' });
        } catch (e) {
            alert('Error generating YAML: ' + e.message);
        }
    });

    downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const yamlContent = outputYaml.value;
        if (!yamlContent) return;

        const appName = document.getElementById('appName').value.trim() || 'app';
        const safeName = appName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        const blob = new Blob([yamlContent], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeName}.swai`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Build a swai:// install link for a hosted copy of the generated file
    if (shareUrlInput && installLinkInput && copyInstallLinkBtn) {
        const updateInstallLink = () => {
            const link = window.swaiInstallUrl(shareUrlInput.value) || '';
            installLinkInput.value = link;
            copyInstallLinkBtn.disabled = !link;
        };

        shareUrlInput.addEventListener('input', updateInstallLink);
        updateInstallLink();

        copyInstallLinkBtn.addEventListener('click', async () => {
            if (!installLinkInput.value) return;

            try {
                await navigator.clipboard.writeText(installLinkInput.value);
            } catch (e) {
                // Clipboard access can be unavailable (e.g. insecure context);
                // leave the link selected so it can be copied by hand.
                installLinkInput.select();
                return;
            }

            copyInstallLinkBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyInstallLinkBtn.textContent = 'Copy link';
            }, 2000);
        });
    }

});
