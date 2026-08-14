/* Add accessible names to the icon controls shared by the workspaces. */
(() => {
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();

  const inferredName = (element) => {
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      return clean(labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' '));
    }

    const label = element.closest('label');
    if (label) {
      const labelText = clean(label.textContent);
      if (labelText) return labelText;
    }

    const explicitLabel = element.getAttribute('data-label') || element.getAttribute('title') || element.getAttribute('placeholder');
    if (explicitLabel) return clean(explicitLabel);

    if (element.id) {
      return clean(element.id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()));
    }

    return '';
  };

  const applyNames = (root) => {
    if (!root || root.nodeType !== Node.ELEMENT_NODE && root !== document) return;

    const candidates = [];
    if (root !== document && root.matches?.('[data-tooltip], button, input, select, textarea, [role="button"]')) {
      candidates.push(root);
    }
    candidates.push(...root.querySelectorAll('[data-tooltip], button, input, select, textarea, [role="button"]'));

    candidates.filter((element) => element.hasAttribute('data-tooltip')).forEach((element) => {
      if (!element.hasAttribute('aria-label')) {
        const tooltip = clean(element.getAttribute('data-tooltip'));
        if (tooltip) element.setAttribute('aria-label', tooltip);
      }
    });

    candidates.forEach((element) => {
      if (element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby')) return;
      if (element.tagName === 'BUTTON' && clean(element.textContent)) return;

      const name = inferredName(element);
      if (name) element.setAttribute('aria-label', name);
    });
  };

  applyNames(document);

  if (document.body) {
    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) applyNames(node);
      }));
    }).observe(document.body, { childList: true, subtree: true });
  }
})();
