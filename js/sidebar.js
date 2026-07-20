// =============================================
// 좌측 사이드바 - 메모 목록
// =============================================
let lwPinned = false;
let currentBgTab = 'library';
let currentBgObjectUrl = null;
const LW_SETTINGS_KEY = 'lw-settings-v1';
const LW_TREE_KEY = 'lw-tree-v2';
let lwSettings = {
    showPreview: true
};
let lwTree = {
    root: [],
    folders: {}
};
let lwSearchQuery = '';
let lwDragState = {
    draggingRef: null,
    draggingType: null,
    sourceFolderId: null
};
let lwSuppressClickUntil = 0;

function isPinnedLeftOpen() {
    const lw = document.getElementById('lw');
    if (!lw || !lwPinned) return false;
    if (typeof isMobileViewport === 'function' && isMobileViewport()) return false;
    return lw.classList.contains('open');
}

function updateRightBackdropsOffset() {
    const rwBack = document.getElementById('rw-back');
    const wwBack = document.getElementById('ww-back');
    const lw = document.getElementById('lw');

    let offset = 0;
    if (isPinnedLeftOpen() && lw) {
        const rect = lw.getBoundingClientRect();
        offset = Math.max(0, Math.round(rect.right));
    }

    [rwBack, wwBack].forEach(back => {
        if (!back) return;
        if (offset > 0) {
            back.style.left = `${offset}px`;
            back.style.width = '';
        } else {
            back.style.left = '';
            back.style.width = '';
        }
    });
}

const BG_DB_NAME = 'macnote-assets';
const BG_DB_VERSION = 1;
const BG_STORE = 'backgrounds';

const bgLibraryItems = [
    { id: 'light-default', name: 'Light 기본', path: 'assets/img/Light.png' },
    { id: 'dark-default', name: 'Dark 기본', path: 'assets/img/Dark.png' },
    { id: '2', name: 'Boliviainteligente', path: 'assets/img/stock/boliviainteligente-unsplash.jpg' },
    { id: '4', name: 'Richard Horvath', path: 'assets/img/stock/richard-horvath-unsplash.jpg' },
    { id: '3', name: 'Jack Anstey', path: 'assets/img/stock/jack-anstey-unsplash.jpg' },
    { id: '1', name: 'Iswanto Arif', path: 'assets/img/stock/iswanto-arif-unsplash.jpg' },
    { id: '6', name: 'Braden Jarvis', path: 'assets/img/stock/braden-jarvis-unsplash.jpg' },
    { id: '5', name: 'Urban Vintage', path: 'assets/img/stock/urban-vintage-unsplash.jpg' }
];

function memoRef(id) {
    return `memo:${id}`;
}

function folderRef(id) {
    return `folder:${id}`;
}

function parseRef(ref) {
    if (typeof ref !== 'string') return null;
    if (ref.startsWith('memo:')) return { type: 'memo', id: Number(ref.slice(5)) };
    if (ref.startsWith('folder:')) return { type: 'folder', id: ref.slice(7) };
    return null;
}

function isMemoRef(ref) {
    return typeof ref === 'string' && ref.startsWith('memo:');
}

function isFolderRef(ref) {
    return typeof ref === 'string' && ref.startsWith('folder:');
}

function ensureLwTreeShape(tree) {
    if (!tree || typeof tree !== 'object') {
        return { root: [], folders: {} };
    }

    const root = Array.isArray(tree.root) ? tree.root.filter(r => typeof r === 'string') : [];
    const folders = tree.folders && typeof tree.folders === 'object' ? tree.folders : {};
    const cleanFolders = {};

    Object.keys(folders).forEach(folderId => {
        const f = folders[folderId] || {};
        cleanFolders[folderId] = {
            id: folderId,
            name: typeof f.name === 'string' && f.name.trim() ? f.name : '새 폴더',
            collapsed: !!f.collapsed,
            items: Array.isArray(f.items) ? f.items.filter(r => typeof r === 'string' && isMemoRef(r)) : []
        };
    });

    return { root, folders: cleanFolders };
}

function loadLwTree() {
    try {
        const parsed = JSON.parse(localStorage.getItem(LW_TREE_KEY) || '{}');
        lwTree = ensureLwTreeShape(parsed);
    } catch (e) {
        lwTree = { root: [], folders: {} };
    }
}

function saveLwTree() {
    localStorage.setItem(LW_TREE_KEY, JSON.stringify(lwTree));
}

function getMemoPreviewById(id) {
    const raw = localStorage.getItem(id);
    const data = raw ? JSON.parse(raw) : {};
    const src = data.textContent || '';
    return src
        .replace(/\n/g, ' ')
        .replace(/\s*-\s*\[[ xX]\]\s*/g, ' ')
        .replace(/[☐☑]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 55);
}

function syncLwTreeWithMemos() {
    lwTree = ensureLwTreeShape(lwTree);

    const memoIds = new Set((bxArr || []).map(obj => obj.id));
    const seenMemoRefs = new Set();
    let dirty = false;

    lwTree.root = lwTree.root.filter(ref => {
        if (isMemoRef(ref)) {
            const p = parseRef(ref);
            if (!p || !memoIds.has(p.id) || seenMemoRefs.has(ref)) {
                dirty = true;
                return false;
            }
            seenMemoRefs.add(ref);
            return true;
        }
        if (isFolderRef(ref)) {
            const p = parseRef(ref);
            const ok = !!(p && lwTree.folders[p.id]);
            if (!ok) dirty = true;
            return ok;
        }
        dirty = true;
        return false;
    });

    Object.keys(lwTree.folders).forEach(folderId => {
        const folder = lwTree.folders[folderId];
        const unique = [];
        folder.items.forEach(ref => {
            const p = parseRef(ref);
            if (!p || p.type !== 'memo' || !memoIds.has(p.id) || seenMemoRefs.has(ref)) {
                dirty = true;
                return;
            }
            seenMemoRefs.add(ref);
            unique.push(ref);
        });
        folder.items = unique;
    });

    const missingMemoRefs = [];
    memoIds.forEach(id => {
        const ref = memoRef(id);
        if (!seenMemoRefs.has(ref)) missingMemoRefs.push(ref);
    });

    if (missingMemoRefs.length) {
        lwTree.root.push(...missingMemoRefs);
        dirty = true;
    }

    if (dirty) saveLwTree();
}

function removeRefFromTree(ref) {
    let removed = false;

    const rootIdx = lwTree.root.indexOf(ref);
    if (rootIdx >= 0) {
        lwTree.root.splice(rootIdx, 1);
        removed = true;
    }

    Object.values(lwTree.folders).forEach(folder => {
        const idx = folder.items.indexOf(ref);
        if (idx >= 0) {
            folder.items.splice(idx, 1);
            removed = true;
        }
    });

    return removed;
}

function insertRefAt(ref, parentFolderId, targetRef, mode) {
    if (parentFolderId) {
        const folder = lwTree.folders[parentFolderId];
        if (!folder) return;
        if (!targetRef || mode === 'append') {
            folder.items.push(ref);
            return;
        }
        const idx = folder.items.indexOf(targetRef);
        if (idx < 0) {
            folder.items.push(ref);
            return;
        }
        folder.items.splice(mode === 'after' ? idx + 1 : idx, 0, ref);
        return;
    }

    if (!targetRef || mode === 'append') {
        lwTree.root.push(ref);
        return;
    }

    const idx = lwTree.root.indexOf(targetRef);
    if (idx < 0) {
        lwTree.root.push(ref);
        return;
    }
    lwTree.root.splice(mode === 'after' ? idx + 1 : idx, 0, ref);
}

function clearLwDropClasses() {
    document.querySelectorAll('.lw-dragging, .drop-before, .drop-after, .drop-inside').forEach(el => {
        el.classList.remove('lw-dragging', 'drop-before', 'drop-after', 'drop-inside');
    });
}

function shouldIgnoreSidebarItemClick() {
    return Date.now() < lwSuppressClickUntil;
}

function getMemoFolderLabel(ID) {
    const ref = memoRef(ID);
    for (const folder of Object.values(lwTree.folders || {})) {
        if (Array.isArray(folder.items) && folder.items.includes(ref)) {
            return folder.name || '새 폴더';
        }
    }
    return '루트';
}

function getMemoFolderId(ID) {
    const ref = memoRef(ID);
    for (const folder of Object.values(lwTree.folders || {})) {
        if (Array.isArray(folder.items) && folder.items.includes(ref)) {
            return folder.id;
        }
    }
    return null;
}

function listSidebarFolders() {
    syncLwTreeWithMemos();
    return Object.values(lwTree.folders || {}).map(folder => ({
        id: folder.id,
        name: folder.name || '새 폴더'
    }));
}

function moveMemoToFolder(ID, targetFolderId = null) {
    syncLwTreeWithMemos();
    const ref = memoRef(ID);

    removeRefFromTree(ref);

    if (targetFolderId && lwTree.folders[targetFolderId]) {
        lwTree.folders[targetFolderId].items.push(ref);
    } else {
        lwTree.root.push(ref);
    }

    saveLwTree();
    renderSidebar();
}

function applyDropToTree(targetRef, targetParentFolderId, mode) {
    const draggedRef = lwDragState.draggingRef;
    if (!draggedRef) return;

    const dragged = parseRef(draggedRef);
    if (!dragged) return;

    if (dragged.type === 'folder' && targetParentFolderId) return;
    if (dragged.type === 'folder' && mode === 'inside') return;
    if (draggedRef === targetRef) return;

    removeRefFromTree(draggedRef);

    if (mode === 'inside') {
        if (!targetRef) {
            lwTree.root.push(draggedRef);
        } else {
            const p = parseRef(targetRef);
            if (p && p.type === 'folder' && dragged.type === 'memo') {
                lwTree.folders[p.id].items.push(draggedRef);
            } else {
                insertRefAt(draggedRef, targetParentFolderId, targetRef, 'after');
            }
        }
    } else {
        insertRefAt(draggedRef, targetParentFolderId, targetRef, mode || 'after');
    }

    saveLwTree();
    renderSidebar();
    lwSuppressClickUntil = Date.now() + 220;
}

function makeListDnDHandlers(itemEl, ref, parentFolderId, type) {
    itemEl.draggable = true;

    itemEl.addEventListener('dragstart', e => {
        lwDragState.draggingRef = ref;
        lwDragState.draggingType = type;
        lwDragState.sourceFolderId = parentFolderId || null;
        itemEl.classList.add('lw-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ref);
    });

    itemEl.addEventListener('dragend', () => {
        clearLwDropClasses();
        lwDragState.draggingRef = null;
        lwDragState.draggingType = null;
        lwDragState.sourceFolderId = null;
    });

    itemEl.addEventListener('dragover', e => {
        if (!lwDragState.draggingRef) return;
        if (lwDragState.draggingRef === ref) return;
        e.preventDefault();

        clearLwDropClasses();

        const rect = itemEl.getBoundingClientRect();
        const y = e.clientY - rect.top;
        let mode = 'after';

        if (type === 'folder' && lwDragState.draggingType === 'memo') {
            mode = 'inside';
        } else if (y < rect.height / 2) {
            mode = 'before';
        }

        itemEl.classList.add(`drop-${mode}`);
        itemEl.dataset.dropMode = mode;
    });

    itemEl.addEventListener('dragleave', () => {
        itemEl.classList.remove('drop-before', 'drop-after', 'drop-inside');
    });

    itemEl.addEventListener('drop', e => {
        if (!lwDragState.draggingRef) return;
        e.preventDefault();
        e.stopPropagation();
        const mode = itemEl.dataset.dropMode || 'after';
        applyDropToTree(ref, parentFolderId || null, mode);
        delete itemEl.dataset.dropMode;
    });
}

function toggleFolderCollapsed(folderId) {
    const folder = lwTree.folders[folderId];
    if (!folder) return;
    folder.collapsed = !folder.collapsed;
    saveLwTree();
    renderSidebar();
}

function askFolderName(options = {}) {
    return new Promise(resolve => {
        const {
            title = '폴더 이름',
            placeholder = '새 폴더',
            initialValue = '',
            okLabel = '확인'
        } = options;

        const prev = document.getElementById('lw-folder-name-back');
        if (prev) prev.remove();

        const back = document.createElement('div');
        back.id = 'lw-folder-name-back';
        back.className = 'lw-folder-name-back';
        back.innerHTML = `
            <div class="lw-folder-name-modal" role="dialog" aria-modal="true" aria-label="${title}" onclick="event.stopPropagation()">
                <div class="lw-folder-name-title">${title}</div>
                <input type="text" id="lw-folder-name-input" class="lw-folder-name-input" placeholder="${placeholder}" value="${initialValue.replace(/"/g, '&quot;')}">
                <div class="lw-folder-name-actions">
                    <button class="lw-folder-name-btn lw-folder-name-btn-cancel" id="lw-folder-name-cancel">취소</button>
                    <button class="lw-folder-name-btn lw-folder-name-btn-ok" id="lw-folder-name-ok">${okLabel}</button>
                </div>
            </div>
        `;

        const close = (value) => {
            back.remove();
            resolve(value);
        };

        back.addEventListener('click', () => close(null));
        back.querySelector('#lw-folder-name-cancel')?.addEventListener('click', () => close(null));
        back.querySelector('#lw-folder-name-ok')?.addEventListener('click', () => {
            const value = back.querySelector('#lw-folder-name-input')?.value ?? '';
            close(value);
        });

        const input = back.querySelector('#lw-folder-name-input');
        if (input) {
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    back.querySelector('#lw-folder-name-ok')?.click();
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    close(null);
                }
            });
        }

        document.body.appendChild(back);
        requestAnimationFrame(() => {
            const i = document.getElementById('lw-folder-name-input');
            if (!i) return;
            i.focus();
            i.select();
        });
    });
}

async function sidebarNewFolder() {
    const raw = await askFolderName({
        title: '새 폴더 만들기',
        placeholder: '폴더 이름',
        initialValue: '새 폴더',
        okLabel: '만들기'
    });
    if (raw === null) return;
    const name = raw.trim() || '새 폴더';
    const id = `f_${Date.now()}`;

    lwTree.folders[id] = {
        id,
        name,
        collapsed: false,
        items: []
    };
    lwTree.root.push(folderRef(id));
    saveLwTree();
    renderSidebar();
}

async function sidebarRenameFolder(folderId) {
    const folder = lwTree.folders[folderId];
    if (!folder) return;
    const raw = await askFolderName({
        title: '폴더 이름 수정',
        placeholder: '폴더 이름',
        initialValue: folder.name || '새 폴더',
        okLabel: '저장'
    });
    if (raw === null) return;
    folder.name = raw.trim() || '새 폴더';
    saveLwTree();
    renderSidebar();
}

function removeMemoEverywhere(memoId) {
    const memoIdNum = Number(memoId);
    const ref = memoRef(memoIdNum);

    localStorage.removeItem(memoIdNum);
    removeRefFromTree(ref);

    const box = document.getElementById(`bx${memoIdNum}`);
    if (box && box.parentNode) {
        box.parentNode.removeChild(box);
    }

    if (Array.isArray(bxArr)) {
        bxArr = bxArr.filter(x => x.id !== memoIdNum);
        if (typeof saveBxArr === 'function') saveBxArr();
    }
}

function askDeleteFolderOptions(folderName, memoCount) {
    return new Promise(resolve => {
        const prev = document.getElementById('lw-folder-del-back');
        if (prev) prev.remove();

        const back = document.createElement('div');
        back.id = 'lw-folder-del-back';
        back.className = 'lw-folder-del-back';

        back.innerHTML = `
            <div class="lw-folder-del-modal" role="dialog" aria-modal="true" aria-label="폴더 삭제 확인" onclick="event.stopPropagation()">
                <div class="lw-folder-del-title">폴더를 삭제할까요?</div>
                <div class="lw-folder-del-desc">"${folderName}" 폴더를 삭제합니다. 폴더 안 메모 ${memoCount}개가 있습니다.</div>
                <label class="lw-folder-del-opt">
                    <input type="checkbox" id="lw-folder-del-check">
                    <span>폴더 안 메모도 함께 삭제</span>
                </label>
                <div class="lw-folder-del-note">체크하지 않으면 폴더만 삭제되고, 메모는 루트로 이동합니다.</div>
                <div class="lw-folder-del-actions">
                    <button class="lw-folder-del-btn lw-folder-del-btn-cancel" id="lw-folder-del-cancel">취소</button>
                    <button class="lw-folder-del-btn lw-folder-del-btn-danger" id="lw-folder-del-ok">삭제</button>
                </div>
            </div>
        `;

        const close = (result) => {
            back.remove();
            resolve(result);
        };

        back.addEventListener('click', () => close({ confirmed: false, deleteMemos: false }));
        back.querySelector('#lw-folder-del-cancel')?.addEventListener('click', () => close({ confirmed: false, deleteMemos: false }));
        back.querySelector('#lw-folder-del-ok')?.addEventListener('click', () => {
            const checked = !!back.querySelector('#lw-folder-del-check')?.checked;
            close({ confirmed: true, deleteMemos: checked });
        });

        document.body.appendChild(back);
    });
}

async function sidebarDeleteFolder(folderId) {
    const folder = lwTree.folders[folderId];
    if (!folder) return;

    const memoIds = (folder.items || [])
        .map(ref => parseRef(ref))
        .filter(p => p && p.type === 'memo')
        .map(p => p.id);

    const ask = await askDeleteFolderOptions(folder.name || '새 폴더', memoIds.length);
    if (!ask.confirmed) return;

    const ref = folderRef(folderId);
    const idx = lwTree.root.indexOf(ref);

    if (ask.deleteMemos) {
        memoIds.forEach(id => removeMemoEverywhere(id));
        if (idx >= 0) {
            lwTree.root.splice(idx, 1);
        }
    } else {
        if (idx >= 0) {
            lwTree.root.splice(idx, 1, ...folder.items);
        } else {
            lwTree.root.push(...folder.items);
        }
    }

    delete lwTree.folders[folderId];

    saveLwTree();
    renderSidebar();
    if (typeof applyMobileMemoLayout === 'function') applyMobileMemoLayout();
}

function toggleSidebar() {
    const lw = document.getElementById('lw');
    lw.classList.contains('open') ? closeSidebar(true) : openSidebar();
}

function openSidebar() {
    if (typeof isMobileViewport === 'function' && isMobileViewport()) {
        lwPinned = false;
        const pinBtn = document.getElementById('lw-pin-btn');
        if (pinBtn) pinBtn.classList.remove('active');
    }

    document.getElementById('lw').classList.add('open');
    document.getElementById('lw-back').classList.toggle('open', !lwPinned);
    updateRightBackdropsOffset();
    document.querySelector('.lw-handle').classList.add('open');
    closeLwSettings();
    renderSidebar();
    pushPanelHistory();
}

function closeSidebar(force = false) {
    if (lwPinned && !force && !(typeof isMobileViewport === 'function' && isMobileViewport())) return;
    document.getElementById('lw').classList.remove('open');
    document.getElementById('lw-back').classList.remove('open');
    updateRightBackdropsOffset();
    document.querySelector('.lw-handle').classList.remove('open');
    closeLwSettings();
}

function loadLwSettings() {
    try {
        const parsed = JSON.parse(localStorage.getItem(LW_SETTINGS_KEY) || '{}');
        lwSettings.showPreview = parsed.showPreview !== false;
    } catch (e) {
        lwSettings.showPreview = true;
    }
}

function saveLwSettings() {
    localStorage.setItem(LW_SETTINGS_KEY, JSON.stringify(lwSettings));
}

function updateLwSettingsUi() {
    const btn = document.getElementById('lw-settings-btn');
    const panel = document.getElementById('lw-settings-panel');
    const toggle = document.getElementById('lw-preview-toggle');
    if (toggle) {
        toggle.classList.toggle('active', !!lwSettings.showPreview);
        toggle.setAttribute('aria-pressed', lwSettings.showPreview ? 'true' : 'false');
    }
    if (btn && panel) {
        btn.setAttribute('aria-expanded', panel.classList.contains('open') ? 'true' : 'false');
    }
}

function toggleLwSettings() {
    const panel = document.getElementById('lw-settings-panel');
    if (!panel) return;
    panel.classList.toggle('open');
    updateLwSettingsUi();
}

function closeLwSettings() {
    const panel = document.getElementById('lw-settings-panel');
    if (!panel) return;
    panel.classList.remove('open');
    updateLwSettingsUi();
}

function toggleLwPreview() {
    lwSettings.showPreview = !lwSettings.showPreview;
    saveLwSettings();
    updateLwSettingsUi();
    renderSidebar();
}

function togglePin() {
    if (typeof isMobileViewport === 'function' && isMobileViewport()) {
        lwPinned = false;
        const pinBtnMobile = document.getElementById('lw-pin-btn');
        if (pinBtnMobile) pinBtnMobile.classList.remove('active');
        return;
    }

    lwPinned = !lwPinned;
    const pinBtn = document.getElementById('lw-pin-btn');
    const lw = document.getElementById('lw');
    const lwBack = document.getElementById('lw-back');

    if (pinBtn) pinBtn.classList.toggle('active', lwPinned);
    if (!lwBack) return;

    if (lwPinned) {
        // 고정 시에는 백드롭을 비활성화
        lwBack.classList.remove('open');
        updateRightBackdropsOffset();
        return;
    }

    // 고정 해제 시, 사이드바가 열려 있으면 백드롭 복구
    if (lw && lw.classList.contains('open')) {
        lwBack.classList.add('open');
    }
    updateRightBackdropsOffset();
}

function renderSidebar() {
    const listEl = document.getElementById('lw-list');
    if (!listEl) return;

    listEl.className = 'lw-list';
    listEl.innerHTML = '';

    syncLwTreeWithMemos();

    const q = (lwSearchQuery || '').trim().toLowerCase();
    const hasQuery = !!q;

    let renderedCount = 0;

    lwTree.root.forEach(ref => {
        const parsed = parseRef(ref);
        if (!parsed) return;

        if (parsed.type === 'memo') {
            const obj = bxArr.find(x => x.id === parsed.id);
            if (!obj) return;

            const title = getDisplayTitle(obj.id);
            const preview = getMemoPreviewById(obj.id);
            const hay = `${title} ${preview}`.toLowerCase();
            if (hasQuery && !hay.includes(q)) return;

            const item = document.createElement('div');
            item.dataset.id = obj.id;
            item.dataset.ref = ref;
            item.className = 'lw-list-item';
            if (lwSettings.showPreview) item.classList.add('has-preview');
            item.innerHTML = `
                <i class="fa-solid fa-grip-dots-vertical lw-item-icon"></i>
                <div class="lw-item-texts">
                    <span class="lw-item-title">${title}</span>
                    ${lwSettings.showPreview ? `<span class="lw-item-preview">${preview || '내용 없음'}</span>` : ''}
                </div>
            `;
            item.addEventListener('click', () => {
                if (shouldIgnoreSidebarItemClick()) return;
                focusBox(obj.id);
            });
            makeListDnDHandlers(item, ref, null, 'memo');
            listEl.appendChild(item);
            renderedCount += 1;
            return;
        }

        if (parsed.type === 'folder') {
            const folder = lwTree.folders[parsed.id];
            if (!folder) return;

            const childRows = [];
            folder.items.forEach(childRef => {
                const cp = parseRef(childRef);
                if (!cp || cp.type !== 'memo') return;
                const obj = bxArr.find(x => x.id === cp.id);
                if (!obj) return;

                const title = getDisplayTitle(obj.id);
                const preview = getMemoPreviewById(obj.id);
                const hay = `${title} ${preview}`.toLowerCase();
                if (hasQuery && !hay.includes(q)) return;

                childRows.push({ ref: childRef, id: obj.id, title, preview });
            });

            const folderMatch = (folder.name || '').toLowerCase().includes(q);
            if (hasQuery && !folderMatch && childRows.length === 0) return;

            const folderEl = document.createElement('div');
            folderEl.className = 'lw-list-item lw-folder-item';
            folderEl.dataset.ref = ref;
            folderEl.innerHTML = `
                <button class="lw-folder-toggle" onclick="event.stopPropagation(); toggleFolderCollapsed('${folder.id}')">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
                <i class="fa-regular fa-folder lw-item-icon"></i>
                <div class="lw-item-texts">
                    <span class="lw-item-title">${folder.name}</span>
                </div>
                <div class="lw-folder-actions">
                    <button class="lw-folder-act" onclick="event.stopPropagation(); sidebarRenameFolder('${folder.id}')" title="폴더 이름 변경">
                        <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                    <button class="lw-folder-act" onclick="event.stopPropagation(); sidebarDeleteFolder('${folder.id}')" title="폴더 삭제">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            `;
            folderEl.addEventListener('click', () => {
                if (shouldIgnoreSidebarItemClick()) return;
                toggleFolderCollapsed(folder.id);
            });
            folderEl.classList.toggle('is-collapsed', folder.collapsed && !hasQuery);
            makeListDnDHandlers(folderEl, ref, null, 'folder');
            listEl.appendChild(folderEl);
            renderedCount += 1;

            const childrenWrap = document.createElement('div');
            childrenWrap.className = 'lw-folder-children';
            childrenWrap.classList.toggle('dpnone', folder.collapsed && !hasQuery);
            childrenWrap.classList.toggle('is-empty', childRows.length === 0);

            childrenWrap.addEventListener('dragover', e => {
                if (!lwDragState.draggingRef || lwDragState.draggingType !== 'memo') return;
                e.preventDefault();
            });
            childrenWrap.addEventListener('drop', e => {
                if (!lwDragState.draggingRef || lwDragState.draggingType !== 'memo') return;
                e.preventDefault();
                e.stopPropagation();
                applyDropToTree(ref, null, 'inside');
            });

            childRows.forEach(child => {
                const memoEl = document.createElement('div');
                memoEl.className = 'lw-list-item lw-list-item--child';
                memoEl.dataset.id = child.id;
                memoEl.dataset.ref = child.ref;
                if (lwSettings.showPreview) memoEl.classList.add('has-preview');
                memoEl.innerHTML = `
                    <i class="fa-solid fa-grip-dots-vertical lw-item-icon"></i>
                    <div class="lw-item-texts">
                        <span class="lw-item-title">${child.title}</span>
                        ${lwSettings.showPreview ? `<span class="lw-item-preview">${child.preview || '내용 없음'}</span>` : ''}
                    </div>
                `;
                memoEl.addEventListener('click', () => {
                    if (shouldIgnoreSidebarItemClick()) return;
                    focusBox(child.id);
                });
                makeListDnDHandlers(memoEl, child.ref, folder.id, 'memo');
                childrenWrap.appendChild(memoEl);
                renderedCount += 1;
            });

            listEl.appendChild(childrenWrap);
        }
    });

    if (renderedCount === 0) {
        listEl.innerHTML = hasQuery
            ? '<p class="lw-empty">검색 결과가 없습니다</p>'
            : '<p class="lw-empty">메모/폴더가 없습니다</p>';
    }

    listEl.ondragover = e => {
        if (!lwDragState.draggingRef) return;
        e.preventDefault();
    };
    listEl.ondrop = e => {
        if (!lwDragState.draggingRef) return;
        e.preventDefault();
        applyDropToTree(null, null, 'inside');
    };

    if (typeof renderAllMemoMeta === 'function') {
        renderAllMemoMeta();
    }
}

// 메모를 최상위로 올리고 하이라이트
function focusBox(ID) {
    const box = document.getElementById(`bx${ID}`);
    if (!box) return;

    if (typeof showHiddenBox === 'function') {
        showHiddenBox(ID);
    }

    const boxes = document.querySelectorAll('.bx');
    const boxZ = parseInt(getComputedStyle(box).zIndex);
    boxes.forEach(x => {
        if (x !== box) {
            const xZ = parseInt(getComputedStyle(x).zIndex);
            if (xZ > boxZ) x.style.zIndex = xZ - 1;
        }
    });
    box.style.zIndex = boxes.length + 1;
    if (typeof applyMobileMemoLayout === 'function') {
        applyMobileMemoLayout(ID);
    }

    // 하이라이트 효과
    box.classList.add('lw-focus-highlight');
    setTimeout(() => box.classList.remove('lw-focus-highlight'), 1000);

    closeSidebar();
}

function sidebarNewMemo() {
    const newId = newBox();
    if (typeof renderSidebar === 'function') renderSidebar();
    if (typeof applyMobileMemoLayout === 'function') {
        applyMobileMemoLayout(newId);
    }

    if (typeof isMobileViewport === 'function' && isMobileViewport()) {
        closeSidebar(true);
    }
}

function lwSearch(q) {
    lwSearchQuery = q || '';
    renderSidebar();
}

// =============================================
// 우측 설정 사이드바
// =============================================
function toggleRw() {
    const rw = document.getElementById('rw');
    rw.classList.contains('open') ? closeRw() : openRw();
}

function openRw() {
    if (!isPinnedLeftOpen()) {
        closeSidebar(true);
    }
    closeWw();
    updateRightBackdropsOffset();
    document.getElementById('rw').classList.add('open');
    document.getElementById('rw-back').classList.add('open');
    pushPanelHistory();
}

function closeRw() {
    document.getElementById('rw').classList.remove('open');
    document.getElementById('rw-back').classList.remove('open');
    updateRightBackdropsOffset();
}

function toggleWw() {
    const ww = document.querySelector('.ww');
    ww.classList.contains('open') ? closeWw() : openWw();
}

function openWw() {
    if (!isPinnedLeftOpen()) {
        closeSidebar(true);
    }
    closeRw();
    updateRightBackdropsOffset();
    document.querySelector('.ww').classList.add('open');
    document.getElementById('ww-back').classList.add('open');
    pushPanelHistory();
}

function closeWw() {
    document.querySelector('.ww').classList.remove('open');
    document.getElementById('ww-back').classList.remove('open');
    updateRightBackdropsOffset();
}

// =============================================
// 배경 이미지 설정 모달
// =============================================
function openBgModal() {
    document.getElementById('bg-modal').classList.add('open');
    document.getElementById('bg-modal-back').classList.add('open');
    switchBgTab(currentBgTab);
    renderBgLibrary('');
    pushPanelHistory();
}

function closeBgModal() {
    document.getElementById('bg-modal').classList.remove('open');
    document.getElementById('bg-modal-back').classList.remove('open');
}

function switchBgTab(tab) {
    currentBgTab = tab;
    ['library', 'upload', 'link'].forEach(name => {
        const btn = document.getElementById(`bg-tab-${name}`);
        const panel = document.getElementById(`bg-panel-${name}`);
        if (btn) btn.classList.toggle('active', name === tab);
        if (panel) panel.classList.toggle('dpnone', name !== tab);
    });
}

function renderBgLibrary(query = '') {
    const grid = document.getElementById('bg-library-grid');
    if (!grid) return;

    const q = query.trim().toLowerCase();
    const mode = localStorage.getItem('bgMode') || 'theme';
    const value = localStorage.getItem('bgValue') || '';
    const items = bgLibraryItems.filter(item => !q || item.name.toLowerCase().includes(q));

    grid.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('button');
        card.className = 'bg-card';
        if (mode === 'library' && value === item.path) {
            card.classList.add('active');
        }
        card.innerHTML = `
            <div class="bg-card-image" style="background-image:url('${item.path}')"></div>
            <div class="bg-card-name">${item.name}</div>
        `;
        card.addEventListener('click', () => applyLibraryBackground(item));
        grid.appendChild(card);
    });
}

function applyLibraryBackground(item) {
    applyBackgroundMode('library', item.path, {
        source: 'library',
        updatedAt: Date.now(),
        name: item.name
    });
    renderBgLibrary(document.getElementById('bg-library-search')?.value || '');
}

async function handleBgUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 선택할 수 있습니다.');
        return;
    }

    const id = `bg-upload-${Date.now()}`;
    await saveBackgroundBlob(id, file);
    applyBackgroundMode('upload', id, {
        source: 'upload',
        updatedAt: Date.now(),
        name: file.name,
        size: file.size
    });
    event.target.value = '';
}

async function applyBgLink() {
    const input = document.getElementById('bg-link-input');
    if (!input) return;
    const link = input.value.trim();
    if (!link) return;

    try {
        new URL(link);
    } catch (e) {
        alert('올바른 URL 형식이 아닙니다.');
        return;
    }

    const ok = await validateImageUrl(link);
    if (!ok) {
        alert('이미지 로드에 실패했습니다. 링크를 확인해주세요.');
        return;
    }

    applyBackgroundMode('link', link, {
        source: 'link',
        updatedAt: Date.now()
    });
}

function clearCustomBackground() {
    applyBackgroundMode('theme', '', {
        source: 'theme',
        updatedAt: Date.now()
    });
    renderBgLibrary(document.getElementById('bg-library-search')?.value || '');
}

function setBodyBackground(url) {
    if (currentBgObjectUrl && currentBgObjectUrl !== url) {
        URL.revokeObjectURL(currentBgObjectUrl);
        currentBgObjectUrl = null;
    }
    document.body.style.backgroundImage = url ? `url("${url}")` : '';
}

async function applyBackgroundMode(mode, value, meta = {}) {
    localStorage.setItem('bgMode', mode);
    localStorage.setItem('bgValue', value || '');
    localStorage.setItem('bgMeta', JSON.stringify(meta));

    if (mode === 'theme' || !value) {
        setBodyBackground('');
        return;
    }
    if (mode === 'library' || mode === 'link') {
        setBodyBackground(value);
        return;
    }
    if (mode === 'upload') {
        const blob = await getBackgroundBlob(value);
        if (!blob) {
            setBodyBackground('');
            localStorage.setItem('bgMode', 'theme');
            localStorage.setItem('bgValue', '');
            return;
        }
        const objectUrl = URL.createObjectURL(blob);
        currentBgObjectUrl = objectUrl;
        setBodyBackground(objectUrl);
    }
}

async function loadBackgroundSetting() {
    const mode = localStorage.getItem('bgMode') || 'theme';
    const value = localStorage.getItem('bgValue') || '';
    await applyBackgroundMode(mode, value);
}

function validateImageUrl(url) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

function openBgDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(BG_DB_NAME, BG_DB_VERSION);
        req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(BG_STORE)) {
                db.createObjectStore(BG_STORE, { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveBackgroundBlob(id, blob) {
    const db = await openBgDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(BG_STORE, 'readwrite');
        const store = tx.objectStore(BG_STORE);
        store.put({
            id,
            blob,
            mime: blob.type,
            createdAt: Date.now()
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function getBackgroundBlob(id) {
    const db = await openBgDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(BG_STORE, 'readonly');
        const store = tx.objectStore(BG_STORE);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result ? req.result.blob : null);
        req.onerror = () => reject(req.error);
    });
}

// =============================================
// 테마 토글
// =============================================
function setTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    if (theme !== 'auto') document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
    ['light', 'auto', 'dark'].forEach(t => {
        const btn = document.getElementById(`btn-theme-${t}`);
        if (btn) btn.classList.toggle('active', t === theme);
    });
}

function loadTheme() {
    const saved = localStorage.getItem('theme') || 'auto';
    setTheme(saved);
}

loadTheme();
loadBackgroundSetting();
loadLwSettings();
loadLwTree();
updateLwSettingsUi();
updateRightBackdropsOffset();

window.addEventListener('resize', () => {
    updateRightBackdropsOffset();
});

document.addEventListener('click', e => {
    const panel = document.getElementById('lw-settings-panel');
    const btn = document.getElementById('lw-settings-btn');
    if (!panel || !btn) return;
    if (!panel.classList.contains('open')) return;
    if (panel.contains(e.target) || btn.contains(e.target)) return;
    closeLwSettings();
});

// =============================================
// ESC 키 + 브라우저 뒤로가기로 패널 닫기
// =============================================
function pushPanelHistory() {
    history.pushState({ panel: true }, '');
}

// ESC 키
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('bg-modal').classList.contains('open')) { closeBgModal(); return; }
    const checkedDoor = document.querySelector('.bx-set-door:checked');
    if (checkedDoor) { checkedDoor.checked = false; return; }
    if (document.querySelector('.ww').classList.contains('open')) { closeWw(); return; }
    if (document.getElementById('rw').classList.contains('open')) { closeRw(); return; }
    if (document.getElementById('lw').classList.contains('open')) { closeSidebar(); return; }
});

// bx-set 패널 열릴 때 history 추가
document.addEventListener('change', e => {
    if (e.target.classList.contains('bx-set-door') && e.target.checked) {
        pushPanelHistory();
    }
});

// 브라우저 뒤로가기
window.addEventListener('popstate', () => {
    if (document.getElementById('bg-modal').classList.contains('open')) { closeBgModal(); return; }
    const checkedDoor = document.querySelector('.bx-set-door:checked');
    if (checkedDoor) { checkedDoor.checked = false; return; }
    if (document.querySelector('.ww').classList.contains('open')) { closeWw(); return; }
    if (document.getElementById('rw').classList.contains('open')) { closeRw(); return; }
    if (document.getElementById('lw').classList.contains('open')) { closeSidebar(); return; }
});
