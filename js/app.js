// 박스 앱 - 블록 에디터(텍스트 + 체크리스트)
const MEMO_PLACEHOLDER = '\u200B';

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

function cleanMemoText(text) {
    return (text || '').replace(/\u200B/g, '').replace(/\r/g, '');
}

function getMemoLineText(line) {
    if (!line) return '';
    const clone = line.cloneNode(true);
    clone.querySelectorAll('.app-line-check').forEach(el => el.remove());
    return cleanMemoText(clone.textContent || '');
}

function isMemoEditorStructureDirty(editor) {
    if (!editor) return false;

    return Array.from(editor.querySelectorAll('.app-line')).some(line => {
        const contents = line.querySelectorAll('.app-line-content');
        if (contents.length !== 1) return true;

        const content = contents[0];
        if (content.children.length > 0) return true;

        return Array.from(line.childNodes).some(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                return cleanMemoText(node.textContent || '').trim() !== '';
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return false;
            const el = node;
            return !el.classList.contains('app-line-content') && !el.classList.contains('app-line-check');
        });
    });
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

function focusContentElement(el, offset = 'end') {
    if (!el) return;
    const editor = el.closest('.app-editor');
    if (!editor) return;
    editor.focus();
    if (offset === 'end') {
        setCaretOffset(el, (el.textContent || '').length);
        return;
    }
    setCaretOffset(el, offset);
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
    const editor = document.getElementById(`txt${ID}`);
    if (!editor) return;

    const blocks = Array.from(editor.querySelectorAll('.app-line')).map(line => {
        const type = line.dataset.type === 'task' ? 'task' : 'text';
        const text = getMemoLineText(line);
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
    focusContentElement(el, offset);
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
    const editor = document.getElementById(`txt${ID}`);
    if (!editor) return;

    const lines = editor.querySelectorAll('.app-line .app-line-content');
    if (lines.length === 0) {
        renderMemoEditor(ID);
    }

    const nextLines = editor.querySelectorAll('.app-line .app-line-content');
    const target = nextLines[nextLines.length - 1] || nextLines[0];
    if (!target) return;

    focusContentElement(target, 'end');
}

function ensureEditorSelectionInContent(editor) {
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return false;

    const range = sel.getRangeAt(0);
    if (!editor.contains(range.startContainer)) return false;

    const currentLine = getLineFromNode(range.startContainer);
    if (currentLine) {
        const currentContent = currentLine.querySelector('.app-line-content');
        if (currentContent && (currentContent === range.startContainer || currentContent.contains(range.startContainer))) {
            return true;
        }
    }

    const lines = editor.querySelectorAll('.app-line .app-line-content');
    const fallback = lines[lines.length - 1] || lines[0];
    if (!fallback) return false;
    focusContentElement(fallback, 'end');
    return true;
}

function bindMemoMainInteractions(ID) {
    const main = document.getElementById(`main${ID}`);
    if (!main) return;

    if (!main.dataset.memoBound) {
        main.addEventListener('click', e => {
            if (e.target.closest('.app-line-content, .app-line-check')) return;
            focusMemoEditorAtEnd(ID);
        });

        main.addEventListener('scroll', () => {
            showMemoThinScrollbar(ID, 700);
        }, { passive: true });

        main.dataset.memoBound = '1';
    }
}

function onMemoEditorInput(ID) {
    const editor = document.getElementById(`txt${ID}`);
    if (!editor) return;
    saveMemoFromDom(ID);
    if (isMemoEditorStructureDirty(editor)) {
        renderMemoEditor(ID);
    }
}

function getLineFromNode(node) {
    if (!node) return null;
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    return el ? el.closest('.app-line') : null;
}

function getMemoEditorSelectionContext(editor) {
    ensureEditorSelectionInContent(editor);
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;

    const range = sel.getRangeAt(0);
    if (!editor.contains(range.startContainer)) return null;

    const line = getLineFromNode(range.startContainer);
    if (!line) return null;

    const content = line.querySelector('.app-line-content');
    if (!content) return null;

    return {
        selection: sel,
        range,
        line,
        content,
        index: Number(line.dataset.index),
        caret: getCaretOffset(content),
        collapsed: sel.isCollapsed
    };
}

function replaceMemoBlocks(ID, blocks, focusIndex, focusOffset = 0) {
    const store = getMemoStore(ID);
    store.blocks = normalizeBlocks(blocks);
    saveMemoStore(ID, store);
    renderMemoEditor(ID);
    if (typeof focusIndex === 'number') {
        focusMemoLine(ID, focusIndex, focusOffset);
    }
}

function onMemoEditorKeydown(e, ID) {
    const editor = document.getElementById(`txt${ID}`);
    if (!editor) return;

    const ctx = getMemoEditorSelectionContext(editor);
    if (!ctx) return;

    const idx = ctx.index;
    const raw = ctx.content.textContent || '';
    const full = cleanMemoText(raw);
    const caret = Math.min(ctx.caret, full.length);

    if (e.key === ' ' && ctx.collapsed) {
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
            replaceMemoBlocks(ID, blocks, idx, 0);
            return;
        }
    }

    if (e.key === 'Enter' && ctx.collapsed) {
        e.preventDefault();
        const left = full.slice(0, caret);
        const right = full.slice(caret);
        const store = getMemoStore(ID);
        const blocks = normalizeBlocks(store.blocks);
        const cur = blocks[idx] || { type: 'text', text: '' };

        // Empty checklist line + Enter => convert current line back to plain text.
        if (cur.type === 'task' && (full.trim() === '')) {
            blocks[idx] = { type: 'text', text: '' };
            replaceMemoBlocks(ID, blocks, idx, 0);
            return;
        }

        cur.text = left;
        const nextBlock = cur.type === 'task'
            ? { type: 'task', checked: false, text: right }
            : { type: 'text', text: right };

        blocks[idx] = cur;
        blocks.splice(idx + 1, 0, nextBlock);

        replaceMemoBlocks(ID, blocks, idx + 1, 0);
        return;
    }

    if (e.key === 'Backspace' && ctx.collapsed && caret === 0) {
        const store = getMemoStore(ID);
        const blocks = normalizeBlocks(store.blocks);
        const cur = blocks[idx];
        if (!cur || idx === 0) return;
        if ((cur.text || '').length > 0) return;

        e.preventDefault();
        blocks.splice(idx, 1);
        replaceMemoBlocks(ID, blocks, idx - 1, 'end');
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
        check.setAttribute('contenteditable', 'false');
        check.addEventListener('change', () => {
            syncTaskLinePresentation(line);
            saveMemoFromDom(ID);
        });
        line.appendChild(check);
    }

    const content = document.createElement('div');
    content.className = 'app-line-content';
    content.textContent = block.text || MEMO_PLACEHOLDER;

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

    editor.contentEditable = 'true';
    editor.spellcheck = false;
    editor.innerHTML = '';
    const blocks = normalizeBlocks(store.blocks);
    blocks.forEach((block, idx) => {
        editor.appendChild(buildMemoLine(ID, block, idx));
    });

    updateMemoTitleAndSidebar(ID);
}

function initMemoEditor(ID) {
    bindMemoEditor(ID);
    renderMemoEditor(ID);
    bindMemoMainInteractions(ID);
}

function bindMemoEditor(ID) {
    const editor = document.getElementById(`txt${ID}`);
    if (!editor || editor.dataset.editorBound) return;

    editor.addEventListener('mousedown', e => {
        const content = e.target.closest('.app-line-content');
        if (content) return;

        const line = e.target.closest('.app-line');
        if (line) {
            e.preventDefault();
            const lineContent = line.querySelector('.app-line-content');
            focusContentElement(lineContent, 'end');
            return;
        }

        if (e.target === editor) {
            e.preventDefault();
            focusMemoEditorAtEnd(ID);
        }
    });

    editor.addEventListener('focus', () => {
        ensureEditorSelectionInContent(editor);
    });

    editor.addEventListener('input', () => onMemoEditorInput(ID));
    editor.addEventListener('keydown', e => onMemoEditorKeydown(e, ID));
    editor.dataset.editorBound = '1';
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
