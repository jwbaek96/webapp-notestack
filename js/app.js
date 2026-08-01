const memoEditors = new Map();
let activeMemoEditorId = null;
let floatingToolbarReady = false;
let floatingToolbarHideTimer = null;

function createDefaultMemoStore() {
    return {
        link: 0,
        tast: 0,
        text: 1,
        linkContent: [],
        taskContent: [],
        textContent: '',
        htmlContent: '<p><br></p>',
        blocks: [{ type: 'text', text: '' }]
    };
}

function normalizeBlocks(blocks) {
    if (!Array.isArray(blocks) || blocks.length === 0) {
        return [{ type: 'text', text: '' }];
    }

    return blocks.map(block => {
        if (block && block.type === 'task') {
            return {
                type: 'task',
                text: typeof block.text === 'string' ? block.text : '',
                checked: !!block.checked
            };
        }

        return {
            type: 'text',
            text: block && typeof block.text === 'string' ? block.text : ''
        };
    });
}

function textToBlocks(text) {
    const src = typeof text === 'string' ? text : '';
    const lines = src.split('\n');
    const blocks = lines.map(line => {
        const md = line.match(/^\s*-\s*\[([ xX])\]\s?(.*)$/);
        if (md) {
            return { type: 'task', checked: md[1].toLowerCase() === 'x', text: md[2] || '' };
        }

        const glyph = line.match(/^\s*([☐☑])\s?(.*)$/);
        if (glyph) {
            return { type: 'task', checked: glyph[1] === '☑', text: glyph[2] || '' };
        }

        return { type: 'text', text: line };
    });

    return normalizeBlocks(blocks);
}

function blocksToText(blocks) {
    return normalizeBlocks(blocks)
        .map(block => block.type === 'task'
            ? `- [${block.checked ? 'x' : ' '}] ${block.text || ''}`
            : (block.text || ''))
        .join('\n');
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function htmlToPlainText(html) {
    const wrap = document.createElement('div');
    wrap.innerHTML = html || '';

    const lines = [];
    const blockSelector = 'p, div, li, h1, h2, h3, h4, h5, h6, blockquote, pre';

    const pushLine = text => {
        lines.push(String(text || '').replace(/\u00a0/g, ' ').replace(/\r/g, ''));
    };

    const children = Array.from(wrap.children);
    if (children.length === 0) {
        return (wrap.textContent || '').replace(/\u00a0/g, ' ').replace(/\r/g, '').replace(/\n+$/, '');
    }

    children.forEach(node => {
        if (node.matches('ol, ul')) {
            Array.from(node.querySelectorAll(':scope > li')).forEach(li => {
                pushLine(li.textContent || '');
            });
            return;
        }

        if (node.matches(blockSelector)) {
            pushLine(node.textContent || '');
            return;
        }

        pushLine(node.textContent || '');
    });

    return lines.join('\n').replace(/\n+$/, '');
}

function normalizeRichHtml(html) {
    const src = (html || '').trim();
    if (!src) return '<p><br></p>';
    if (!htmlToPlainText(src).trim()) return '<p><br></p>';
    return src;
}

function blocksToRichHtml(blocks) {
    const normalized = normalizeBlocks(blocks);
    const parts = [];
    let taskBuffer = [];

    const flushTasks = () => {
        if (!taskBuffer.length) return;
        parts.push(`<ol>${taskBuffer.join('')}</ol>`);
        taskBuffer = [];
    };

    normalized.forEach(block => {
        if (block.type === 'task') {
            const state = block.checked ? 'checked' : 'unchecked';
            const text = escapeHtml(block.text || '');
            taskBuffer.push(`<li data-list="${state}">${text || '<br>'}</li>`);
            return;
        }

        flushTasks();
        const text = escapeHtml(block.text || '');
        parts.push(`<p>${text || '<br>'}</p>`);
    });

    flushTasks();
    return normalizeRichHtml(parts.join(''));
}

function htmlToBlocks(html) {
    const wrap = document.createElement('div');
    wrap.innerHTML = normalizeRichHtml(html);
    const blocks = [];

    Array.from(wrap.children).forEach(node => {
        const tag = node.tagName;
        if (tag === 'OL' || tag === 'UL') {
            Array.from(node.querySelectorAll('li')).forEach(li => {
                const state = li.getAttribute('data-list');
                if (state === 'checked' || state === 'unchecked') {
                    blocks.push({
                        type: 'task',
                        checked: state === 'checked',
                        text: (li.textContent || '').replace(/\u00a0/g, ' ').trim()
                    });
                } else {
                    blocks.push({
                        type: 'text',
                        text: (li.textContent || '').replace(/\u00a0/g, ' ').trim()
                    });
                }
            });
            return;
        }

        if (tag === 'P' || tag === 'DIV') {
            const text = (node.textContent || '').replace(/\u00a0/g, ' ');
            blocks.push({ type: 'text', text: text.trim() ? text : '' });
        }
    });

    return normalizeBlocks(blocks);
}

function migrateMemoStore(store) {
    const next = { ...createDefaultMemoStore(), ...(store || {}) };
    let html = '';
    const hasStoredHtml = typeof store?.htmlContent === 'string' && store.htmlContent.trim();

    if (hasStoredHtml) {
        html = store.htmlContent;
    } else if (Array.isArray(next.blocks) && next.blocks.length) {
        html = blocksToRichHtml(next.blocks);
    } else if (typeof next.textContent === 'string' && next.textContent.trim()) {
        html = blocksToRichHtml(textToBlocks(next.textContent));
    } else {
        html = '<p><br></p>';
    }

    next.htmlContent = normalizeRichHtml(html);
    next.textContent = htmlToPlainText(next.htmlContent);
    next.blocks = htmlToBlocks(next.htmlContent);
    next.linkContent = Array.isArray(next.linkContent) ? next.linkContent : [];
    next.taskContent = Array.isArray(next.taskContent) ? next.taskContent : [];
    next.link = next.link ?? 0;
    next.tast = next.tast ?? 0;
    next.text = next.text ?? 1;
    return next;
}

function getMemoStore(ID) {
    const raw = localStorage.getItem(ID);
    let parsed;

    try {
        parsed = raw ? JSON.parse(raw) : createDefaultMemoStore();
    } catch (e) {
        parsed = createDefaultMemoStore();
    }

    return migrateMemoStore(parsed);
}

function saveMemoStore(ID, store) {
    localStorage.setItem(ID, JSON.stringify(migrateMemoStore(store)));
}

function getQuillEditor(ID) {
    return memoEditors.get(ID) || null;
}

function getActiveMemoQuill() {
    if (activeMemoEditorId === null) return null;
    return getQuillEditor(activeMemoEditorId);
}

function clearFloatingToolbarHideTimer() {
    if (!floatingToolbarHideTimer) return;
    clearTimeout(floatingToolbarHideTimer);
    floatingToolbarHideTimer = null;
}

function showFloatingToolbar() {
    const toolbar = document.getElementById('floating-editor-toolbar');
    if (!toolbar) return;
    clearFloatingToolbarHideTimer();
    toolbar.classList.add('is-visible');
}

function hideFloatingToolbar(clearActive = false) {
    const toolbar = document.getElementById('floating-editor-toolbar');
    if (!toolbar) return;
    clearFloatingToolbarHideTimer();
    toolbar.classList.remove('is-visible');
    if (clearActive) {
        activeMemoEditorId = null;
        syncFloatingToolbarState();
    }
}

function scheduleHideFloatingToolbar(clearActive = false) {
    clearFloatingToolbarHideTimer();
    floatingToolbarHideTimer = setTimeout(() => {
        hideFloatingToolbar(clearActive);
    }, 140);
}

function setActiveMemoEditor(ID) {
    activeMemoEditorId = ID;
    showFloatingToolbar();
    syncFloatingToolbarState();
}

function updateMemoTitleAndSidebar(ID) {
    const bxObj = bxArr.find(b => b.id === ID);
    if (bxObj && (!bxObj.name || bxObj.name === 'title' || bxObj.name === '')) {
        bxObj.name = '';
        saveBxArr();
    }

    const titleEl = document.querySelector(`#hdr${ID} .bx-title`);
    if (titleEl && typeof getHeaderDisplayTitle === 'function') {
        titleEl.textContent = getHeaderDisplayTitle(ID);
    } else if (titleEl && typeof getDisplayTitle === 'function') {
        titleEl.textContent = getDisplayTitle(ID);
    }

    if (typeof renderSidebar === 'function') {
        renderSidebar();
    }
}

function saveMemoFromDom(ID) {
    const quill = getQuillEditor(ID);
    if (!quill) return;

    const store = getMemoStore(ID);
    store.htmlContent = normalizeRichHtml(quill.root.innerHTML);
    store.textContent = (quill.getText() || '').replace(/\r/g, '').replace(/\n$/, '');
    store.blocks = htmlToBlocks(store.htmlContent);
    saveMemoStore(ID, store);

    if (typeof touchMemoUpdatedAt === 'function') {
        touchMemoUpdatedAt(ID);
        saveBxArr();
    }
    if (typeof renderMemoMeta === 'function') {
        renderMemoMeta(ID);
    }
    updateMemoTitleAndSidebar(ID);
}

const memoScrollbarTimers = new Map();

function showMemoThinScrollbar(ID, holdMs = 900) {
    const main = document.getElementById(`main${ID}`);
    if (!main) return;

    if (main.scrollHeight <= main.clientHeight + 1) {
        main.classList.remove('show-scrollbar');
        return;
    }

    main.classList.add('show-scrollbar');
    const oldTimer = memoScrollbarTimers.get(ID);
    if (oldTimer) clearTimeout(oldTimer);

    const timer = setTimeout(() => {
        main.classList.remove('show-scrollbar');
        memoScrollbarTimers.delete(ID);
    }, holdMs);
    memoScrollbarTimers.set(ID, timer);
}

function focusMemoEditorAtEnd(ID) {
    const quill = getQuillEditor(ID);
    if (!quill) return;
    setActiveMemoEditor(ID);
    const len = Math.max(0, quill.getLength() - 1);
    quill.focus();
    quill.setSelection(len, 0, 'silent');
}

function bindFloatingToolbar() {
    if (floatingToolbarReady) return;

    const toolbar = document.getElementById('floating-editor-toolbar');
    if (!toolbar) return;
    const icons = (typeof Quill !== 'undefined' && Quill.import) ? Quill.import('ui/icons') : null;

    if (icons) {
        const setIcon = (selector, html) => {
            const el = toolbar.querySelector(selector);
            if (el) el.innerHTML = html;
        };
        setIcon('#floating-ql-bold', icons.bold || 'B');
        setIcon('#floating-ql-italic', icons.italic || 'I');
        setIcon('#floating-ql-underline', icons.underline || 'U');
        setIcon('#floating-ql-strike', icons.strike || 'S');
        setIcon('#floating-ql-check', icons.list?.check || icons.list?.bullet || '[]');
        setIcon('#floating-ql-align-left', icons.align?.[''] || icons.align?.left || 'L');
        setIcon('#floating-ql-align-center', icons.align?.center || 'C');
        setIcon('#floating-ql-align-right', icons.align?.right || 'R');
    }

    toolbar.addEventListener('mousedown', e => {
        clearFloatingToolbarHideTimer();
        if (e.target.closest('button, .ql-picker-label, .ql-picker-item, select')) {
            e.preventDefault();
        }
    });

    document.addEventListener('mousedown', e => {
        const activeQuill = getActiveMemoQuill();
        if (!activeQuill) return;

        if (e.target.closest('#floating-editor-toolbar')) return;
        if (e.target.closest('.ql-picker-options')) return;
        if (e.target.closest('.ql-editor')) return;
        if (e.target.closest('.app-editor')) return;

        scheduleHideFloatingToolbar(true);
    });

    toolbar.querySelector('#floating-ql-bold')?.addEventListener('click', () => toggleInlineFormat('bold'));
    toolbar.querySelector('#floating-ql-italic')?.addEventListener('click', () => toggleInlineFormat('italic'));
    toolbar.querySelector('#floating-ql-underline')?.addEventListener('click', () => toggleInlineFormat('underline'));
    toolbar.querySelector('#floating-ql-strike')?.addEventListener('click', () => toggleInlineFormat('strike'));
    toolbar.querySelector('#floating-ql-check')?.addEventListener('click', () => toggleChecklistFormat());
    toolbar.querySelector('#floating-ql-align-left')?.addEventListener('click', () => applyLineFormat('align', false));
    toolbar.querySelector('#floating-ql-align-center')?.addEventListener('click', () => applyLineFormat('align', 'center'));
    toolbar.querySelector('#floating-ql-align-right')?.addEventListener('click', () => applyLineFormat('align', 'right'));

    floatingToolbarReady = true;
    hideFloatingToolbar();
    syncFloatingToolbarState();
}

function toggleInlineFormat(formatName) {
    const quill = getActiveMemoQuill();
    if (!quill) return;
    const current = quill.getFormat();
    quill.focus();
    quill.format(formatName, !current[formatName], 'user');
    syncFloatingToolbarState();
}

function toggleChecklistFormat() {
    const quill = getActiveMemoQuill();
    if (!quill) return;
    const current = quill.getFormat();
    quill.focus();
    quill.format('list', current.list === 'check' ? false : 'check', 'user');
    syncFloatingToolbarState();
}

function applyLineFormat(formatName, value) {
    const quill = getActiveMemoQuill();
    if (!quill) return;
    quill.focus();
    quill.format(formatName, value || false, 'user');
    syncFloatingToolbarState();
}

function syncFloatingToolbarState() {
    const toolbar = document.getElementById('floating-editor-toolbar');
    if (!toolbar) return;

    const quill = getActiveMemoQuill();
    const format = quill ? quill.getFormat() : {};

    const setActive = (selector, active) => {
        const btn = toolbar.querySelector(selector);
        if (btn) btn.classList.toggle('ql-active', !!active);
    };

    setActive('#floating-ql-bold', !!format.bold);
    setActive('#floating-ql-italic', !!format.italic);
    setActive('#floating-ql-underline', !!format.underline);
    setActive('#floating-ql-strike', !!format.strike);
    setActive('#floating-ql-check', format.list === 'check');
    setActive('#floating-ql-align-left', !format.align);
    setActive('#floating-ql-align-center', format.align === 'center');
    setActive('#floating-ql-align-right', format.align === 'right');
}

function focusMemoLine(ID) {
    focusMemoEditorAtEnd(ID);
}

function bindMemoMainInteractions(ID) {
    const main = document.getElementById(`main${ID}`);
    if (!main) return;

    if (!main.dataset.memoBound) {
        main.addEventListener('click', e => {
            if (e.target.closest('.ql-editor, .floating-editor-toolbar, .ql-picker-options, .ql-picker, .ql-toolbar button, .ql-toolbar select')) return;
            focusMemoEditorAtEnd(ID);
        });

        main.addEventListener('scroll', () => {
            showMemoThinScrollbar(ID, 700);
        }, { passive: true });

        main.dataset.memoBound = '1';
    }
}

function renderMemoEditor(ID) {
    const quill = getQuillEditor(ID);
    if (!quill) return;

    const store = getMemoStore(ID);
    saveMemoStore(ID, store);
    quill.clipboard.dangerouslyPasteHTML(store.htmlContent, 'silent');
    updateMemoTitleAndSidebar(ID);
}

function initMemoEditor(ID) {
    const editor = document.getElementById(`txt${ID}`);
    if (!editor || typeof Quill === 'undefined') return;

    bindFloatingToolbar();

    if (memoEditors.has(ID)) {
        renderMemoEditor(ID);
        bindMemoMainInteractions(ID);
        return;
    }

    const quill = new Quill(editor, {
        theme: 'snow',
        modules: { toolbar: false },
        placeholder: '메모를 입력하세요...'
    });

    quill.root.setAttribute('spellcheck', 'false');
    quill.root.setAttribute('data-memo-id', String(ID));
    quill.root.addEventListener('focus', () => {
        setActiveMemoEditor(ID);
    });
    quill.root.addEventListener('mousedown', () => {
        setActiveMemoEditor(ID);
    });
    quill.on('text-change', (_delta, _old, source) => {
        if (source !== 'user') return;
        saveMemoFromDom(ID);
    });
    quill.on('selection-change', range => {
        if (range) {
            setActiveMemoEditor(ID);
        } else if (activeMemoEditorId === ID) {
            scheduleHideFloatingToolbar();
        }
    });

    memoEditors.set(ID, quill);
    renderMemoEditor(ID);
    bindMemoMainInteractions(ID);
    syncFloatingToolbarState();
}

function apptext(v, ID) {
    const store = getMemoStore(ID);
    store.htmlContent = blocksToRichHtml(textToBlocks(v));
    saveMemoStore(ID, store);
    renderMemoEditor(ID);
}

function apptextKeydown() {
    // no-op (kept for legacy inline handler compatibility)
}
