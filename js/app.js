// 박스 앱 - 블록 에디터(텍스트 + 체크리스트)
function createDefaultMemoStore() {
    return {
        link: 0,
        tast: 0,
        text: 1,
        linkContent: [],
        taskContent: [],
        textContent: '',
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

function getMemoStore(ID) {
    const raw = localStorage.getItem(ID);
    let store;

    try {
        store = raw ? JSON.parse(raw) : createDefaultMemoStore();
    } catch (e) {
        store = createDefaultMemoStore();
    }

    if (!store || typeof store !== 'object') {
        store = createDefaultMemoStore();
    }

    store.link = store.link ?? 0;
    store.tast = store.tast ?? 0;
    store.text = store.text ?? 1;
    store.linkContent = Array.isArray(store.linkContent) ? store.linkContent : [];
    store.taskContent = Array.isArray(store.taskContent) ? store.taskContent : [];

    if (!Array.isArray(store.blocks)) {
        store.blocks = textToBlocks(store.textContent || '');
    } else {
        store.blocks = normalizeBlocks(store.blocks);
    }

    store.textContent = blocksToText(store.blocks);
    return store;
}

function saveMemoStore(ID, store) {
    const next = { ...createDefaultMemoStore(), ...(store || {}) };
    next.blocks = normalizeBlocks(next.blocks);
    next.textContent = blocksToText(next.blocks);
    localStorage.setItem(ID, JSON.stringify(next));
}

function getCaretOffset(el) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return 0;

    const range = sel.getRangeAt(0);
    const pre = range.cloneRange();
    pre.selectNodeContents(el);
    pre.setEnd(range.endContainer, range.endOffset);
    return pre.toString().length;
}

function setCaretOffset(el, offset) {
    const sel = window.getSelection();
    if (!sel) return;

    const range = document.createRange();
    let remain = Math.max(0, offset);

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let node = walker.nextNode();

    while (node) {
        const len = node.textContent.length;
        if (remain <= len) {
            range.setStart(node, remain);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            return;
        }
        remain -= len;
        node = walker.nextNode();
    }

    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
}

function updateMemoTitleAndSidebar(ID) {
    const bxObj = bxArr.find(b => b.id === ID);
    if (bxObj && (!bxObj.name || bxObj.name === 'title' || bxObj.name === '')) {
        bxObj.name = '';
        saveBxArr();
    }

    const titleEl = document.querySelector(`#hdr${ID} .bx-title`);
    if (titleEl && typeof getDisplayTitle === 'function') {
        titleEl.textContent = getDisplayTitle(ID);
    }

    if (typeof renderSidebar === 'function') {
        renderSidebar();
    }
}

function saveMemoFromDom(ID) {
    const editor = document.getElementById(`txt${ID}`);
    if (!editor) return;

    const blocks = Array.from(editor.querySelectorAll('.app-line')).map(line => {
        const type = line.dataset.type === 'task' ? 'task' : 'text';
        const contentEl = line.querySelector('.app-line-content');
        const text = contentEl ? (contentEl.textContent || '').replace(/\r/g, '') : '';
        if (type === 'task') {
            const checkEl = line.querySelector('.app-line-check');
            return { type: 'task', checked: !!(checkEl && checkEl.checked), text };
        }
        return { type: 'text', text };
    });

    const store = getMemoStore(ID);
    store.blocks = blocks;
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

function focusMemoLine(ID, index, offset = 0) {
    const el = document.querySelector(`#txt${ID} .app-line[data-index="${index}"] .app-line-content`);
    if (!el) return;
    el.focus();
    if (offset === 'end') {
        setCaretOffset(el, (el.textContent || '').length);
        return;
    }
    setCaretOffset(el, offset);
}

function onMemoLineInput(ID) {
    saveMemoFromDom(ID);
}

function onMemoLineKeydown(e, ID) {
    const content = e.currentTarget;
    const line = content.closest('.app-line');
    if (!line) return;

    const idx = Number(line.dataset.index);
    const full = content.textContent || '';
    const caret = getCaretOffset(content);

    if (e.key === ' ') {
        const before = full.slice(0, caret);
        const after = full.slice(caret);
        const match = before.match(/^(\s*)(\[\]|\[x\]|\[X\])$/);
        if (match && after === '') {
            e.preventDefault();
            const store = getMemoStore(ID);
            const blocks = normalizeBlocks(store.blocks);
            blocks[idx] = {
                type: 'task',
                checked: match[2].toLowerCase() === '[x]',
                text: ''
            };
            store.blocks = blocks;
            saveMemoStore(ID, store);
            renderMemoEditor(ID);
            focusMemoLine(ID, idx, 0);
            return;
        }
    }

    if (e.key === 'Enter') {
        e.preventDefault();
        const left = full.slice(0, caret);
        const right = full.slice(caret);
        const store = getMemoStore(ID);
        const blocks = normalizeBlocks(store.blocks);
        const cur = blocks[idx] || { type: 'text', text: '' };

        // Empty checklist line + Enter => convert current line back to plain text.
        if (cur.type === 'task' && (full.trim() === '')) {
            blocks[idx] = { type: 'text', text: '' };
            store.blocks = blocks;
            saveMemoStore(ID, store);
            renderMemoEditor(ID);
            focusMemoLine(ID, idx, 0);
            return;
        }

        cur.text = left;
        const nextBlock = cur.type === 'task'
            ? { type: 'task', checked: false, text: right }
            : { type: 'text', text: right };

        blocks[idx] = cur;
        blocks.splice(idx + 1, 0, nextBlock);

        store.blocks = blocks;
        saveMemoStore(ID, store);
        renderMemoEditor(ID);
        focusMemoLine(ID, idx + 1, 0);
        return;
    }

    if (e.key === 'Backspace' && caret === 0) {
        const store = getMemoStore(ID);
        const blocks = normalizeBlocks(store.blocks);
        const cur = blocks[idx];
        if (!cur || idx === 0) return;
        if ((cur.text || '').length > 0) return;

        e.preventDefault();
        blocks.splice(idx, 1);
        store.blocks = blocks;
        saveMemoStore(ID, store);
        renderMemoEditor(ID);
        focusMemoLine(ID, idx - 1, 'end');
    }
}

function syncTaskLinePresentation(line) {
    if (!line) return;
    const content = line.querySelector('.app-line-content');
    const check = line.querySelector('.app-line-check');
    if (!content || !check) return;

    const checked = !!check.checked;
    line.classList.toggle('is-checked', checked);
    content.style.textDecoration = checked ? 'line-through' : 'none';
    content.style.opacity = checked ? '0.62' : '1';
}

function buildMemoLine(ID, block, index) {
    const line = document.createElement('div');
    line.className = `app-line${block.type === 'task' ? ' is-task' : ''}${block.type === 'task' && block.checked ? ' is-checked' : ''}`;
    line.dataset.type = block.type;
    line.dataset.index = String(index);

    if (block.type === 'task') {
        const check = document.createElement('input');
        check.type = 'checkbox';
        check.className = 'app-line-check';
        check.checked = !!block.checked;
        check.addEventListener('change', () => {
            syncTaskLinePresentation(line);
            saveMemoFromDom(ID);
        });
        line.appendChild(check);
    }

    const content = document.createElement('div');
    content.className = 'app-line-content';
    content.contentEditable = 'true';
    content.spellcheck = false;
    content.textContent = block.text || '';
    content.addEventListener('input', () => onMemoLineInput(ID));
    content.addEventListener('keydown', e => onMemoLineKeydown(e, ID));

    line.appendChild(content);
    if (block.type === 'task') {
        syncTaskLinePresentation(line);
    }
    return line;
}

function renderMemoEditor(ID) {
    const editor = document.getElementById(`txt${ID}`);
    if (!editor) return;

    const store = getMemoStore(ID);
    saveMemoStore(ID, store); // migration persistence

    editor.innerHTML = '';
    const blocks = normalizeBlocks(store.blocks);
    blocks.forEach((block, idx) => {
        editor.appendChild(buildMemoLine(ID, block, idx));
    });

    updateMemoTitleAndSidebar(ID);
}

function initMemoEditor(ID) {
    renderMemoEditor(ID);
}

// Legacy compatibility: convert plain text updates into block data if old handlers call this.
function apptext(v, ID) {
    const store = getMemoStore(ID);
    store.blocks = textToBlocks(v);
    saveMemoStore(ID, store);
    renderMemoEditor(ID);
}

function apptextKeydown() {
    // no-op (kept for legacy inline handler compatibility)
}
