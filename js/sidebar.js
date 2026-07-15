// =============================================
// 좌측 사이드바 - 메모 목록
// =============================================
let lwView = 'list'; // 'list' | 'block'
let lwPinned = false;
let currentBgTab = 'library';
let currentBgObjectUrl = null;

const BG_DB_NAME = 'macnote-assets';
const BG_DB_VERSION = 1;
const BG_STORE = 'backgrounds';

const bgLibraryItems = [
    { id: 'light-default', name: 'Light 기본', path: 'assets/img/Light.png' },
    { id: 'dark-default', name: 'Dark 기본', path: 'assets/img/Dark.png' },
    { id: 'stock-00', name: 'Library 00', path: 'assets/img/stock/00.jpg' },
    { id: 'stock-1', name: 'Library 1', path: 'assets/img/stock/1.jpg' },
    { id: 'mac-light', name: 'macOS Light', path: 'assets/img/stock/macOS-Graphic-Light.png' },
    { id: 'mac-dark', name: 'macOS Dark', path: 'assets/img/stock/macOS-Graphic-Dark.png' },
    { id: 'clip-14227', name: 'Clip 14227', path: 'assets/img/stock/Clipped_image_20230920_014227.png' },
    { id: 'clip-14238', name: 'Clip 14238', path: 'assets/img/stock/Clipped_image_20230920_014238.png' }
];

function toggleSidebar() {
    const lw = document.getElementById('lw');
    lw.classList.contains('open') ? closeSidebar(true) : openSidebar();
}

function openSidebar() {
    document.getElementById('lw').classList.add('open');
    document.getElementById('lw-back').classList.add('open');
    document.querySelector('.lw-handle').classList.add('open');
    renderSidebar();
    pushPanelHistory();
}

function closeSidebar(force = false) {
    if (lwPinned && !force) return;
    document.getElementById('lw').classList.remove('open');
    document.getElementById('lw-back').classList.remove('open');
    document.querySelector('.lw-handle').classList.remove('open');
}

function togglePin() {
    lwPinned = !lwPinned;
    document.getElementById('lw-pin-btn').classList.toggle('active', lwPinned);
    // 고정 해제 시 사이드바가 열린 상태면 유지
}

function renderSidebar() {
    const listEl = document.getElementById('lw-list');
    if (!listEl) return;

    // 뷰 버튼 활성화 표시
    document.getElementById('lw-btn-list').classList.toggle('active', lwView === 'list');
    document.getElementById('lw-btn-block').classList.toggle('active', lwView === 'block');

    listEl.className = lwView === 'block' ? 'lw-list lw-list--block' : 'lw-list';
    listEl.innerHTML = '';

    if (!bxArr || bxArr.length === 0) {
        listEl.innerHTML = '<p class="lw-empty">메모가 없습니다</p>';
        return;
    }

    // zindex 내림차순(최근 클릭 순)으로 정렬
    const sorted = [...bxArr].sort((a, b) => b.zindex - a.zindex);

    sorted.forEach(obj => {
        const raw = localStorage.getItem(obj.id);
        const data = raw ? JSON.parse(raw) : {};
        const title = getDisplayTitle(obj.id);
        const preview = data.textContent
            ? data.textContent
                .replace(/\n/g, ' ')
                .replace(/\s*-\s*\[[ xX]\]\s*/g, ' ')
                .replace(/[☐☑]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 55)
            : '';

        const item = document.createElement('div');
        item.dataset.id = obj.id;

        if (lwView === 'list') {
            item.className = 'lw-list-item';
            item.innerHTML = `
                <i class="fa-solid fa-grip-dots-vertical lw-item-icon"></i>
                <span class="lw-item-title">${title}</span>
            `;
        } else {
            item.className = 'lw-block-item';
            item.innerHTML = `
                <div class="lw-block-title">${title}</div>
                <div class="lw-block-preview">${preview || '내용 없음'}</div>
            `;
        }

        item.addEventListener('click', () => focusBox(obj.id));
        listEl.appendChild(item);
    });
}

// 메모를 최상위로 올리고 하이라이트
function focusBox(ID) {
    const box = document.getElementById(`bx${ID}`);
    if (!box) return;

    const boxes = document.querySelectorAll('.bx');
    const boxZ = parseInt(getComputedStyle(box).zIndex);
    boxes.forEach(x => {
        if (x !== box) {
            const xZ = parseInt(getComputedStyle(x).zIndex);
            if (xZ > boxZ) x.style.zIndex = xZ - 1;
        }
    });
    box.style.zIndex = boxes.length + 1;

    // 하이라이트 효과
    box.classList.add('lw-focus-highlight');
    setTimeout(() => box.classList.remove('lw-focus-highlight'), 1000);

    closeSidebar();
}

function lwSetView(v) {
    lwView = v;
    renderSidebar();
}

function lwSearch(q) {
    const items = document.querySelectorAll('.lw-list-item, .lw-block-item');
    items.forEach(item => {
        const titleEl = item.querySelector('.lw-item-title, .lw-block-title');
        const match = !q || (titleEl && titleEl.textContent.toLowerCase().includes(q.toLowerCase()));
        item.style.display = match ? '' : 'none';
    });
}

// =============================================
// 우측 설정 사이드바
// =============================================
function toggleRw() {
    const rw = document.getElementById('rw');
    rw.classList.contains('open') ? closeRw() : openRw();
}

function openRw() {
    // lw가 열려있으면 닫기
    closeSidebar(true);
    closeWw();
    document.getElementById('rw').classList.add('open');
    document.getElementById('rw-back').classList.add('open');
    pushPanelHistory();
}

function closeRw() {
    document.getElementById('rw').classList.remove('open');
    document.getElementById('rw-back').classList.remove('open');
}

function toggleWw() {
    const ww = document.querySelector('.ww');
    ww.classList.contains('open') ? closeWw() : openWw();
}

function openWw() {
    closeSidebar(true);
    closeRw();
    document.querySelector('.ww').classList.add('open');
    document.getElementById('ww-back').classList.add('open');
    pushPanelHistory();
}

function closeWw() {
    document.querySelector('.ww').classList.remove('open');
    document.getElementById('ww-back').classList.remove('open');
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
    if (document.getElementById('lw').classList.contains('open')) { closeSidebar(true); return; }
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
    if (document.getElementById('lw').classList.contains('open')) { closeSidebar(true); return; }
});
