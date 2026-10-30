/**
 * swai:// install links.
 *
 * The SWAI installer (swai-inst) registers itself as the handler for the
 * swai: URL scheme. A link looks like:
 *
 *     swai://install?url=<percent-encoded https URL of a .swai/.swaib>
 *
 * The installer only accepts https sources without embedded credentials, and
 * takes the link from an arbitrary page, so it validates and asks for
 * confirmation before downloading anything. Anything that would be rejected
 * there is refused here instead of being rendered as a dead button.
 */
(() => {
    'use strict';

    const SCHEME = 'swai://install?url=';

    /**
     * Builds the swai:// install link for a hosted .swai/.swaib file.
     *
     * @param {string} fileUrl Absolute https URL of the file.
     * @returns {string|null} The install link, or null if fileUrl cannot be
     *                        installed through the protocol.
     */
    function swaiInstallUrl(fileUrl) {
        if (typeof fileUrl !== 'string') return null;

        const trimmed = fileUrl.trim();
        if (!trimmed) return null;

        let parsed;
        try {
            parsed = new URL(trimmed);
        } catch (e) {
            return null;
        }

        // Keep this in sync with parse_swai_protocol_url() in swai-inst.
        if (parsed.protocol !== 'https:') return null;
        if (!parsed.hostname) return null;
        if (parsed.username || parsed.password) return null;

        return SCHEME + encodeURIComponent(trimmed);
    }

    window.swaiInstallUrl = swaiInstallUrl;
})();
