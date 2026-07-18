let boxesNow = document.querySelectorAll('.bx');
const BX_HIDE_ANIM_MS = 220;

//박스 바깥 클릭시 해제 => 셋 보기, 풀사이즈
function bsClick() {
  const boxes = event.target.querySelectorAll('.bx');
  boxes.forEach(function (x) {
    if (x.classList.contains('is-hidden')) return;
    x.querySelector('.bx-set-door').checked = false;

    const ID = parseInt(x.dataset.group, 10);
    bxF(ID, 'fullsize');

    document.getElementById('bxF' + ID).value = 'response';
  });
}

function applyBoxLayoutByState(ID) {
  const obj = bxArr.find(i => i.id === ID);
  const box = document.getElementById(`bx${ID}`);
  if (!obj || !box) return;

  const btn = document.getElementById(`bxF${ID}`);
  if (obj.statu === 'fullsize') {
    box.style.top = '30px';
    box.style.left = '30px';
    box.style.width = 'calc(100% - 60px)';
    box.style.height = 'calc(100% - 30px)';
    if (btn) btn.value = 'fullsize';
    return;
  }

  box.style.top = obj.top;
  box.style.left = obj.left;
  box.style.width = `${obj.width}px`;
  box.style.height = `${obj.height}px`;
  if (btn) btn.value = 'response';
}

function applyHiddenState(ID) {
  const obj = bxArr.find(i => i.id === ID);
  const box = document.getElementById(`bx${ID}`);
  const btn = document.getElementById(`bxM${ID}`);
  if (!obj || !box) return;

  box.classList.remove('is-hiding', 'is-showing', 'is-pre-show');
  box.classList.toggle('is-hidden', !!obj.hidden);
  if (!obj.hidden) applyBoxLayoutByState(ID);
  if (btn) btn.classList.toggle('active', !!obj.hidden);
  if (typeof applyMobileMemoLayout === 'function') applyMobileMemoLayout();
}

function animateHideBox(ID) {
  const box = document.getElementById(`bx${ID}`);
  if (!box) return;

  box.classList.remove('is-showing', 'is-pre-show');
  box.classList.add('is-hiding');

  const finalize = () => {
    box.classList.remove('is-hiding');
    box.classList.add('is-hidden');
  };

  let done = false;
  const onEnd = ev => {
    if (ev) {
      if (ev.target !== box) return;
      if (ev.propertyName !== 'transform' && ev.propertyName !== 'opacity') return;
    }
    if (done) return;
    done = true;
    box.removeEventListener('transitionend', onEnd);
    finalize();
  };

  box.addEventListener('transitionend', onEnd);
  setTimeout(onEnd, BX_HIDE_ANIM_MS + 40);
}

function animateShowBox(ID) {
  const box = document.getElementById(`bx${ID}`);
  if (!box) return;

  applyBoxLayoutByState(ID);
  box.classList.remove('is-hidden', 'is-hiding');
  box.classList.add('is-pre-show');

  const finalize = () => {
    box.classList.remove('is-showing');
  };

  let done = false;
  const onEnd = ev => {
    if (ev) {
      if (ev.target !== box) return;
      if (ev.propertyName !== 'transform' && ev.propertyName !== 'opacity') return;
    }
    if (done) return;
    done = true;
    box.removeEventListener('transitionend', onEnd);
    finalize();
  };

  box.addEventListener('transitionend', onEnd);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (done) return;
      box.classList.add('is-showing');
      box.classList.remove('is-pre-show');
    });
  });

  setTimeout(onEnd, BX_HIDE_ANIM_MS + 40);
}

function animateShowFromSidebar(ID) {
  const box = document.getElementById(`bx${ID}`);
  if (!box) return;

  applyBoxLayoutByState(ID);
  box.classList.remove('is-hidden', 'is-hiding', 'is-pre-show', 'is-showing');

  if (typeof box.animate === 'function') {
    const anim = box.animate(
      [
        { transform: 'scale(0.02)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
      ],
      {
        duration: 260,
        easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        fill: 'both'
      }
    );
    anim.onfinish = () => {
      box.style.transform = '';
      box.style.opacity = '';
    };
    return;
  }

  animateShowBox(ID);
}

function touchMemoUpdatedAt(ID) {
  const obj = bxArr.find(i => i.id === ID);
  if (!obj) return;
  obj.updatedAt = Date.now();
}

function formatMemoDate(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '-';
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yy}-${mm}-${dd} ${hh}:${mi}`;
}

function renderMemoMeta(ID) {
  const obj = bxArr.find(i => i.id === ID);
  if (!obj) return;

  const folderEl = document.getElementById(`bxMetaFolder${ID}`);
  const createdEl = document.getElementById(`bxMetaCreated${ID}`);
  const updatedEl = document.getElementById(`bxMetaUpdated${ID}`);

  if (folderEl) {
    const label = typeof getMemoFolderLabel === 'function' ? getMemoFolderLabel(ID) : '루트';
    folderEl.textContent = label;
  }
  if (createdEl) createdEl.textContent = formatMemoDate(obj.createdAt || obj.id);
  if (updatedEl) updatedEl.textContent = formatMemoDate(obj.updatedAt || obj.id);
}

function renderAllMemoMeta() {
  if (!Array.isArray(bxArr)) return;
  bxArr.forEach(obj => renderMemoMeta(obj.id));
}

function closeAllMemoFolderPickers() {
  document.querySelectorAll('.bx-folder-picker.open').forEach(el => el.classList.remove('open'));
}

function renderMemoFolderPicker(ID) {
  const picker = document.getElementById(`bxFolderPicker${ID}`);
  if (!picker) return;

  const options = typeof listSidebarFolders === 'function' ? listSidebarFolders() : [];
  const activeFolderId = typeof getMemoFolderId === 'function' ? getMemoFolderId(ID) : null;

  picker.innerHTML = '';

  const rootBtn = document.createElement('button');
  rootBtn.className = `bx-folder-picker-item${activeFolderId ? '' : ' active'}`;
  rootBtn.textContent = '루트';
  rootBtn.addEventListener('click', e => {
    e.stopPropagation();
    setMemoFolderFromPicker(ID, null);
  });
  picker.appendChild(rootBtn);

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = `bx-folder-picker-item${activeFolderId === opt.id ? ' active' : ''}`;
    btn.textContent = opt.name;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      setMemoFolderFromPicker(ID, opt.id);
    });
    picker.appendChild(btn);
  });
}

function toggleMemoFolderPicker(ID, ev) {
  if (ev) ev.stopPropagation();
  const picker = document.getElementById(`bxFolderPicker${ID}`);
  if (!picker) return;

  const willOpen = !picker.classList.contains('open');
  closeAllMemoFolderPickers();
  if (!willOpen) return;

  renderMemoFolderPicker(ID);
  picker.classList.add('open');
}

function setMemoFolderFromPicker(ID, folderId) {
  if (typeof moveMemoToFolder !== 'function') return;
  moveMemoToFolder(ID, folderId);
  touchMemoUpdatedAt(ID);
  saveBxArr();
  renderMemoMeta(ID);
  closeAllMemoFolderPickers();
}

document.addEventListener('click', e => {
  if (e.target.closest('.bx-set-meta-line--folder')) return;
  if (e.target.closest('.bx-folder-picker')) return;
  closeAllMemoFolderPickers();
});

function bxM(ID) {
  const obj = bxArr.find(i => i.id === ID);
  if (!obj) return;
  obj.hidden = !obj.hidden;
  touchMemoUpdatedAt(ID);

  const btn = document.getElementById(`bxM${ID}`);
  if (btn) btn.classList.toggle('active', !!obj.hidden);

  if (obj.hidden) {
    animateHideBox(ID);
  } else {
    animateShowBox(ID);
  }

  if (typeof applyMobileMemoLayout === 'function') applyMobileMemoLayout();
  saveBxArr();
  renderMemoMeta(ID);
  if (typeof renderSidebar === 'function') renderSidebar();
}

//박스 삭제**********
function bxX(ID) {
  const popup = document.getElementById(`bxDelConfirm${ID}`);
  if (!popup) return;
  popup.classList.add('open');
}

function bxXCancel(ID) {
  const popup = document.getElementById(`bxDelConfirm${ID}`);
  if (!popup) return;
  popup.classList.remove('open');
}

function bxXConfirm(ID) {
  bxXCancel(ID);
  localStorage.removeItem(ID);

  const targetObj = bxArr.find(i => i.id === ID);
  if (!targetObj) return;
  let z = targetObj.zindex;
  let t = targetObj.top;
  let l = targetObj.left;
  let w = targetObj.width;
  let h = targetObj.height;

  const thisBox = document.getElementById(`bx${ID}`);
  const thisZ = thisBox.style.zIndex;

  let boxes = document.querySelectorAll('.bx');
  boxes.forEach(function (x) {
    if (x !== thisBox) {
      const OBJ = bxArr.find(i => i.id === parseInt(x.dataset.group, 10));
      let z = OBJ.zindex;
      let t = OBJ.top;
      let l = OBJ.left;
      let w = OBJ.width;
      let h = OBJ.height;

      const xZ = parseInt(getComputedStyle(x).zIndex, 10);
      if (xZ > thisZ) {
        x.style.zIndex = parseInt(xZ - 1, 10);
        z = parseInt(x.style.zIndex, 10);
      }

      x.querySelector('.bx-set-door').checked = false;
      saveBoxZTLWH(OBJ, z, t, l, w, h);
      bsClick();
    }
  });

  thisBox.style.zIndex = parseInt(boxes.length, 10);
  bs.removeChild(thisBox);
  saveBoxZTLWH(targetObj, z, t, l, w, h);
  bxArr = bxArr.filter(i => i.id !== ID);
  saveBxArr();
  if (typeof renderSidebar === 'function') renderSidebar();
  if (typeof applyMobileMemoLayout === 'function') applyMobileMemoLayout();
}

function bxclick() {
  boxesNow = document.querySelectorAll('.bx');
  boxesNow.forEach(function (box) {
    box.addEventListener('click', function () {
      const thisZ = parseInt(this.style.zIndex, 10);
      boxesNow.forEach(function (x) {
        if (x !== box) {
          const OBJ = bxArr.find(i => i.id === parseInt(x.dataset.group, 10));
          let z = OBJ.zindex;
          let t = OBJ.top;
          let l = OBJ.left;
          let w = OBJ.width;
          let h = OBJ.height;

          const xZ = parseInt(getComputedStyle(x).zIndex, 10);
          if (xZ > thisZ) {
            x.style.zIndex = parseInt(xZ - 1, 10);
            z = parseInt(x.style.zIndex, 10);
          }
          x.querySelector('.bx-set-door').checked = false;
          saveBoxZTLWH(OBJ, z, t, l, w, h);
          bsClick();
        }
      });

      this.style.zIndex = parseInt(boxesNow.length, 10);

      const TOBJ = bxArr.find(i => i.id === parseInt(this.dataset.group, 10));
      let z = TOBJ.zindex;
      let t = TOBJ.top;
      let l = TOBJ.left;
      let w = TOBJ.width;
      let h = TOBJ.height;
      const targetBtnF = document.getElementById('bxF' + this.dataset.group);
      if (TOBJ.statu === 'response') {
        z = parseInt(this.style.zIndex, 10);
        t = this.style.top.toString();
        l = this.style.left.toString();
        w = parseInt(this.style.width, 10);
        h = parseInt(this.style.height, 10);
        targetBtnF.value = 'response';
      } else if (TOBJ.statu === 'fullsize') {
        z = TOBJ.zindex;
        t = TOBJ.top;
        l = TOBJ.left;
        w = TOBJ.width;
        h = TOBJ.height;
        targetBtnF.value = 'fullsize';
        applyBoxLayoutByState(TOBJ.id);
      }
      saveBoxZTLWH(TOBJ, z, t, l, w, h);
    });
  });
}

function showHiddenBox(ID) {
  const obj = bxArr.find(i => i.id === ID);
  if (!obj) return;
  if (obj.hidden) {
    obj.hidden = false;
    const btn = document.getElementById(`bxM${ID}`);
    if (btn) btn.classList.remove('active');
    animateShowFromSidebar(ID);
    applyBoxLayoutByState(ID);
    saveBxArr();
  }
  if (typeof applyMobileMemoLayout === 'function') applyMobileMemoLayout(ID);
}

function saveBoxZTLWH(OBJ, z, t, l, w, h) {
  const obj = bxArr.find(i => i === OBJ);
  if (!obj) return;
  obj.zindex = z;
  if (obj.statu !== 'fullsize') {
    obj.top = t;
    obj.left = l;
    obj.width = w;
    obj.height = h;
  }
  obj.updatedAt = Date.now();
  saveBxArr();
  renderMemoMeta(obj.id);
}

//박스 풀사이즈 버튼
function bxF(ID, v) {
  const bx = document.getElementById('bx' + ID);
  const btn = document.getElementById(`bxF${ID}`);
  const targetBoxObj = bxArr.find(box => box.id === ID);
  if (!targetBoxObj) return;
  bx.style.transition = 'all .5s ease-in-out';
  if (v === 'response') {
    bx.style.top = '30px';
    bx.style.left = '30px';
    bx.style.width = 'calc(100% - 60px)';
    bx.style.height = 'calc(100% - 30px)';
    targetBoxObj.statu = 'fullsize';
    if (btn) btn.value = 'fullsize';
  } else {
    bx.style.top = targetBoxObj.top;
    bx.style.left = targetBoxObj.left;
    bx.style.width = `${targetBoxObj.width}px`;
    bx.style.height = `${targetBoxObj.height}px`;
    targetBoxObj.statu = 'response';
    if (btn) btn.value = 'response';
  }
  saveBxArr();
  setTimeout(() => {
    bx.style.transition = '';
  }, 500);
}

//박스 드래깅 컨트롤
let offsetX, offsetY;
let maxXPercent, maxYPercent;
let activeBoxMoveHandler = null;
let activeBoxEndHandler = null;
let activeResizeMoveHandler = null;
let activeResizeEndHandler = null;

function clearActiveBoxDrag() {
  if (activeBoxMoveHandler) {
    document.removeEventListener('mousemove', activeBoxMoveHandler);
    document.removeEventListener('touchmove', activeBoxMoveHandler);
    activeBoxMoveHandler = null;
  }
  if (activeBoxEndHandler) {
    document.removeEventListener('mouseup', activeBoxEndHandler);
    document.removeEventListener('touchend', activeBoxEndHandler);
    activeBoxEndHandler = null;
  }
}

function clearActiveBoxResize() {
  if (activeResizeMoveHandler) {
    document.removeEventListener('mousemove', activeResizeMoveHandler);
    document.removeEventListener('touchmove', activeResizeMoveHandler);
    activeResizeMoveHandler = null;
  }
  if (activeResizeEndHandler) {
    document.removeEventListener('mouseup', activeResizeEndHandler);
    document.removeEventListener('touchend', activeResizeEndHandler);
    activeResizeEndHandler = null;
  }
}

function boxDragging(bxID, ID) {
  if (event && event.cancelable) {
    event.preventDefault();
  }

  clearActiveBoxResize();

  let boxes = document.querySelectorAll('.bx');
  const box = document.getElementById(bxID);
  const boxObj = bxArr.find(i => i.id === ID);
  if (!boxObj || boxObj.hidden) return;
  if (boxObj.locked) return;
  if (boxObj.statu === 'fullsize') return;

  let boxZ = parseInt(box.style.zIndex, 10);
  boxes.forEach(function (x) {
    if (x !== box) {
      const OBJ = bxArr.find(i => i.id === parseInt(x.dataset.group, 10));
      if (OBJ && OBJ.alwaysTop) return;
      let z = OBJ.zindex;
      let t = OBJ.top;
      let l = OBJ.left;
      let w = OBJ.width;
      let h = OBJ.height;

      const xZ = parseInt(getComputedStyle(x).zIndex, 10);
      if (xZ > boxZ) {
        x.style.zIndex = parseInt(xZ - 1, 10);
        z = parseInt(x.style.zIndex, 10);
      }

      x.querySelector('.bx-set-door').checked = false;
      saveBoxZTLWH(OBJ, z, t, l, w, h);
      bsClick();
    }
    const targetBtnF = document.getElementById('bxF' + ID);
    targetBtnF.value = 'response';
  });

  box.style.zIndex = parseInt(boxes.length + 1, 10);
  box.style.transform = 'scale(1.01)';
  document.body.classList.add('is-dragging-memo');

  const touch = event.type === 'touchstart' ? event.touches[0] : event;
  setTimeout(() => {
    document.body.style.cursor = 'grabbing';
    offsetX = touch.clientX - box.getBoundingClientRect().left;
    offsetY = touch.clientY - box.getBoundingClientRect().top;
    maxXPercent = 100 - (box.offsetWidth / window.innerWidth * 100);
    maxYPercent = 100 - (box.offsetHeight / window.innerHeight * 100);

    const endDrag = () => {
      document.body.style.cursor = 'auto';
      document.body.classList.remove('is-dragging-memo');
      box.style.webkitUserSelect = '';
      box.style.transform = 'scale(1)';
      clearActiveBoxDrag();
    };

    const moveHandler = e => {
      if (e.cancelable) e.preventDefault();
      const t = e.type === 'touchmove' ? e.touches[0] : e;
      let xPercent = ((t.clientX - offsetX) / window.innerWidth) * 100;
      let yPercent = ((t.clientY - offsetY) / window.innerHeight) * 100;
      xPercent = Math.min(maxXPercent, Math.max(0, xPercent));
      yPercent = Math.min(maxYPercent, Math.max(0, yPercent));
      box.style.left = `${xPercent}%`;
      box.style.top = `${yPercent}%`;

      const OBJ = bxArr.find(i => i.id === parseInt(box.dataset.group, 10));
      if (!OBJ) return;
      saveBoxZTLWH(OBJ, OBJ.zindex, box.style.top, box.style.left, OBJ.width, OBJ.height);
    };

    clearActiveBoxDrag();
    activeBoxMoveHandler = moveHandler;
    activeBoxEndHandler = endDrag;

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
  });
}

function boxResizeStart(bxID, ID, dir) {
  const ev = event;
  if (!ev) return;
  if (ev.cancelable) ev.preventDefault();
  ev.stopPropagation();

  clearActiveBoxDrag();
  clearActiveBoxResize();

  const box = document.getElementById(bxID);
  const obj = bxArr.find(i => i.id === ID);
  if (!box || !obj) return;
  if (obj.hidden || obj.locked || obj.statu === 'fullsize') return;

  const touch = ev.type === 'touchstart' ? ev.touches[0] : ev;
  const board = typeof bs !== 'undefined' && bs ? bs : document.body;
  const boardRect = board.getBoundingClientRect();
  const rect = box.getBoundingClientRect();

  const startX = touch.clientX;
  const startY = touch.clientY;
  const startL = rect.left - boardRect.left;
  const startT = rect.top - boardRect.top;
  const startW = rect.width;
  const startH = rect.height;
  const startR = startL + startW;
  const startB = startT + startH;
  const boardW = board.clientWidth;
  const boardH = board.clientHeight;
  const minW = 250;
  const minH = Math.max(120, parseInt(getComputedStyle(box).minHeight, 10) || 0);

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  document.body.classList.add('is-resizing-memo');

  const endResize = () => {
    document.body.classList.remove('is-resizing-memo');
    clearActiveBoxResize();
  };

  const moveResize = e => {
    if (e.cancelable) e.preventDefault();
    const p = e.type === 'touchmove' ? e.touches[0] : e;
    const dx = p.clientX - startX;
    const dy = p.clientY - startY;

    let newL = startL;
    let newT = startT;
    let newW = startW;
    let newH = startH;

    if (dir.includes('e')) {
      newW = clamp(startW + dx, minW, boardW - startL);
    }
    if (dir.includes('w')) {
      newL = clamp(startL + dx, 0, startR - minW);
      newW = startR - newL;
    }
    if (dir.includes('s')) {
      newH = clamp(startH + dy, minH, boardH - startT);
    }
    if (dir.includes('n')) {
      newT = clamp(startT + dy, 0, startB - minH);
      newH = startB - newT;
    }

    const outL = Math.round(newL);
    const outT = Math.round(newT);
    const outW = Math.round(newW);
    const outH = Math.round(newH);

    box.style.left = `${outL}px`;
    box.style.top = `${outT}px`;
    box.style.width = `${outW}px`;
    box.style.height = `${outH}px`;

    saveBoxZTLWH(obj, obj.zindex, `${outT}px`, `${outL}px`, outW, outH);
  };

  activeResizeMoveHandler = moveResize;
  activeResizeEndHandler = endResize;

  document.addEventListener('mousemove', moveResize);
  document.addEventListener('touchmove', moveResize, { passive: false });
  document.addEventListener('mouseup', endResize);
  document.addEventListener('touchend', endResize);
}

// =============================================
// 박스 패널 기능
// =============================================
function bxSetTitle(ID, value) {
  const obj = bxArr.find(i => i.id === ID);
  if (!obj) return;
  obj.name = value.trim() || '';
  touchMemoUpdatedAt(ID);
  const titleEl = document.querySelector(`#hdr${ID} .bx-title`);
  if (titleEl) titleEl.textContent = getHeaderDisplayTitle(ID);
  applyTitleVisibility(ID);
  saveBxArr();
  renderMemoMeta(ID);
  if (typeof renderSidebar === 'function') renderSidebar();
}

function applyTitleVisibility(ID) {
  const obj = bxArr.find(i => i.id === ID);
  if (!obj) return;

  const titleEl = document.querySelector(`#hdr${ID} .bx-title`);
  if (titleEl) {
    const visible = obj.showTitle !== false;
    titleEl.style.visibility = visible ? 'visible' : 'hidden';
  }

  const btn = document.getElementById(`bxShowTitle${ID}`);
  if (btn) btn.classList.toggle('active', obj.showTitle !== false);
}

function bxToggleTitleVisibility(ID) {
  const obj = bxArr.find(i => i.id === ID);
  if (!obj) return;
  obj.showTitle = !(obj.showTitle !== false);
  touchMemoUpdatedAt(ID);
  applyTitleVisibility(ID);
  saveBxArr();
  renderMemoMeta(ID);
}

function getDisplayTitle(ID) {
  const bxObj = bxArr.find(b => b.id === ID);
  if (!bxObj) return '';
  if (bxObj.name && bxObj.name.trim()) {
    return bxObj.name;
  }

  const textData = localStorage.getItem(ID);
  if (textData) {
    try {
      const obj = JSON.parse(textData);
      if (obj.textContent) {
        const firstLine = obj.textContent.split('\n')[0].trim();
        const cleaned = firstLine
          .replace(/^\s*-\s*\[[ xX]\]\s*/, '')
          .replace(/^\s*[☐☑]\s*/, '')
          .trim();
        return cleaned || '제목 없음';
      }
    } catch (e) {
      console.error('getDisplayTitle parse error:', e);
    }
  }

  return '제목 없음';
}

function getHeaderDisplayTitle(ID) {
  const title = getDisplayTitle(ID);
  return title === '제목 없음' ? '' : title;
}

function bxFavorite(ID) {
  const obj = bxArr.find(i => i.id === ID);
  if (!obj) return;
  obj.favorite = !obj.favorite;
  touchMemoUpdatedAt(ID);
  const btn = document.getElementById(`bxFav${ID}`);
  if (btn) btn.classList.toggle('active', obj.favorite);
  saveBxArr();
  renderMemoMeta(ID);
}

function bxAlwaysTop(ID) {
  const obj = bxArr.find(i => i.id === ID);
  if (!obj) return;
  obj.alwaysTop = !obj.alwaysTop;
  touchMemoUpdatedAt(ID);
  const bx = document.getElementById(`bx${ID}`);
  if (bx) bx.style.zIndex = obj.alwaysTop ? 9999 : obj.zindex;
  const btn = document.getElementById(`bxTop${ID}`);
  if (btn) btn.classList.toggle('active', obj.alwaysTop);
  saveBxArr();
  renderMemoMeta(ID);
}

function bxLock(ID) {
  const obj = bxArr.find(i => i.id === ID);
  if (!obj) return;
  obj.locked = !obj.locked;
  touchMemoUpdatedAt(ID);
  const bar = document.getElementById(`bar${ID}`);
  if (bar) {
    bar.style.pointerEvents = obj.locked ? 'none' : '';
    bar.style.cursor = obj.locked ? 'default' : '';
  }
  const btn = document.getElementById(`bxLock${ID}`);
  if (btn) btn.classList.toggle('active', obj.locked);
  saveBxArr();
  renderMemoMeta(ID);
}
