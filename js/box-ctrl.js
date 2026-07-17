let boxesNow = document.querySelectorAll('.bx');
const BX_HIDE_ANIM_MS = 220;

//박스 바깥 클릭시 해제 => 셋 보기, 풀사이즈 
function bsClick(){
  const boxes = event.target.querySelectorAll(".bx");
  boxes.forEach(function(x){
    if (x.classList.contains('is-hidden')) return;
    x.querySelector('.bx-set-door').checked = false;

    const ID = parseInt(x.dataset.group);
    bxF(ID,"fullsize");

    document.getElementById("bxF"+ID).value = 'response';
  })
}

function applyHiddenState(ID) {
  const obj = bxArr.find(i => i.id === ID);
  const box = document.getElementById(`bx${ID}`);
  const btn = document.getElementById(`bxM${ID}`);
  if (!obj || !box) return;

  box.classList.remove('is-hiding', 'is-showing', 'is-pre-show');
  box.classList.toggle('is-hidden', !!obj.hidden);
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
  const onEnd = () => {
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

  box.classList.remove('is-hidden', 'is-hiding');
  box.classList.add('is-pre-show');

  const finalize = () => {
    box.classList.remove('is-showing');
  };

  let done = false;
  const onEnd = () => {
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

  box.classList.remove('is-hidden', 'is-hiding', 'is-pre-show', 'is-showing');

  // Sidebar reopen should feel explicit: force scale-in animation even when class timing is skipped.
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
    const label = (typeof getMemoFolderLabel === 'function') ? getMemoFolderLabel(ID) : '루트';
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

  const options = (typeof listSidebarFolders === 'function') ? listSidebarFolders() : [];
  const activeFolderId = (typeof getMemoFolderId === 'function') ? getMemoFolderId(ID) : null;

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

function bxXConfirm(ID){// 클릭된 박스의 z보다 작은 애들은 내비두고 보다 큰 애들은 -1해서 다시 저장하기
  bxXCancel(ID);
  localStorage.removeItem(ID);

  const targetObj = bxArr.find(i => i.id === ID);//**클릭된 박스 오브젝트
  if (!targetObj) return;
  let z = targetObj.zindex;
  let t = targetObj.top;
  let l = targetObj.left;
  let w = targetObj.width;
  let h = targetObj.height;

  const thisBox = document.getElementById(`bx${ID}`);
  const thisZ = thisBox.style.zIndex;

  let boxes = document.querySelectorAll('.bx');
  boxes.forEach(function(x) {
    if(x !== thisBox){
      const OBJ = bxArr.find(i => i.id === parseInt(x.dataset.group));//**클릭된 박스 오브젝트
      let z = OBJ.zindex;
      let t = OBJ.top;
      let l = OBJ.left;
      let w = OBJ.width;
      let h = OBJ.height;
                  

      const xZ = parseInt(getComputedStyle(x).zIndex);
      if(xZ > thisZ){
        x.style.zIndex = parseInt(xZ - 1);
        z = parseInt(x.style.zIndex);
      }

      x.querySelector('.bx-set-door').checked = false;
      saveBoxZTLWH(OBJ,z,t,l,w,h);
      bsClick(); //셋 해제
    }
  })
  //클릭 박스 최상위 만들기
  thisBox.style.zIndex = parseInt(boxes.length);
  console.log(bxArr);
  console.log(bxArr);
  bs.removeChild(thisBox); 
  saveBoxZTLWH(targetObj,z,t,l,w,h);  
  bxArr = bxArr.filter(i => i.id != ID);
  saveBxArr();
  if (typeof renderSidebar === 'function') renderSidebar();
  if (typeof applyMobileMemoLayout === 'function') applyMobileMemoLayout();
  // console.log(bxArr);
}

//**************중요**************
//박스 활성화(클릭 시) 동작------------------------------------------
//박스 zIndex 재정렬, 셋 보기 해제
//클릭된 박스 zIndex 최상위...
//나머지 박스 재정렬
//나머지 박스(==전체 박스) 셋 보기 해제
//나머지 박스 풀사이즈 해제

// document.addEventListener('DOMContentLoaded', function() {
//   boxesNow = document.querySelectorAll('.bx');
//   boxesNow.forEach(function(box) {//**모든 박스 오브젝트
//     box.addEventListener('click', function() {
//         const thisZ = parseInt(this.style.zIndex);
//         boxesNow.forEach(function(x) {//다른박스들
//           if (x !== box) {//클릭되지 않은 박스들
//             const OBJ = bxArr.find(i => i.id === parseInt(x.dataset.group));//**클릭된 박스 오브젝트
//             let z = OBJ.zindex;
//             let t = OBJ.top;
//             let l = OBJ.left;
//             let w = OBJ.width;
//             let h = OBJ.height;
            
//             const xZ = parseInt(getComputedStyle(x).zIndex);
//             if (xZ > thisZ){
//               x.style.zIndex = parseInt(xZ - 1);
//               z = parseInt(x.style.zIndex);
//             }
//             x.querySelector('.bx-set-door').checked = false;
//             saveBoxZTLWH(OBJ,z,t,l,w,h);
//             bsClick(); //셋 해제
//           }
//         });

//         this.style.zIndex = parseInt(boxesNow.length);//박스 최상위
//         //박스 리사이징 감지 동작-------------------

//         const TOBJ = bxArr.find(i => i.id === parseInt(this.dataset.group));//**클릭된 박스 오브젝트
//         let z = TOBJ.zindex;
//         let t = TOBJ.top;
//         let l = TOBJ.left;
//         let w = TOBJ.width;
//         let h = TOBJ.height;
//         const targetBtnF = document.getElementById("bxF"+ this.dataset.group);
//         if(TOBJ.statu === "response"){
//           z = parseInt(this.style.zIndex);
//           t = (this.style.top).toString();
//           l = (this.style.left).toString();
//           w = parseInt(this.style.width);
//           h = parseInt(this.style.height);
//           targetBtnF.value = 'response';
//           // saveBoxZTLWH(TOBJ,z,t,l,w,h);
//         } else
//             if(TOBJ.statu === "fullsize"){
//               const fullW = parseInt(bs.clientWidth - 62);
//               const fullH = parseInt(bs.clientHeight - 32);
//               if (currentBoxResizeObserver) {currentBoxResizeObserver.disconnect();}
//               resize = new ResizeObserver((entries) => {
//                 entries.forEach((b) => {
//                   let ww = parseInt(b.target.clientWidth);
//                   let hh = parseInt(b.target.clientHeight);
//                   console.log("F"+fullW,"F"+fullH,ww,hh);
//                   if(ww === fullW && hh === fullH){
//                     z = TOBJ.zindex;
//                     t = TOBJ.top;
//                     l = TOBJ.left;
//                     w = TOBJ.width;
//                     h = TOBJ.height;
//                     targetBtnF.value = 'fullsize';
//                     TOBJ.statu = 'fullsize';
//                     // saveBoxZTLWH(TOBJ,z,t,l,w,h);
//                   }else{
//                     // z = parseInt(this.style.zIndex);
//                     // t = (this.style.top).toString();
//                     // l = (this.style.left).toString();
//                     // w = parseInt(this.style.width);
//                     // h = parseInt(this.style.height);
//                     targetBtnF.value = 'response';
//                     TOBJ.statu = 'response';
//                     // saveBoxZTLWH(TOBJ,z,t,l,w,h);
//                   }
//                 });
//               });
//               resize.observe(box);
//             }
//         //---------------------------------------
//       saveBoxZTLWH(TOBJ,z,t,l,w,h);
//     });
//   });
// });












// ++
function bxclick(){
boxesNow = document.querySelectorAll('.bx');
  boxesNow.forEach(function(box) {//**모든 박스 오브젝트
    box.addEventListener('click', function() {
        const thisZ = parseInt(this.style.zIndex);
        boxesNow.forEach(function(x) {//다른박스들
          if (x !== box) {//클릭되지 않은 박스들
            const OBJ = bxArr.find(i => i.id === parseInt(x.dataset.group));//**클릭된 박스 오브젝트
            let z = OBJ.zindex;
            let t = OBJ.top;
            let l = OBJ.left;
            let w = OBJ.width;
            let h = OBJ.height;
            
            const xZ = parseInt(getComputedStyle(x).zIndex);
            if (xZ > thisZ){
              x.style.zIndex = parseInt(xZ - 1);
              z = parseInt(x.style.zIndex);
            }
            x.querySelector('.bx-set-door').checked = false;
            saveBoxZTLWH(OBJ,z,t,l,w,h);
            bsClick(); //셋 해제
          }
        });

        this.style.zIndex = parseInt(boxesNow.length);//박스 최상위
        //박스 리사이징 감지 동작-------------------

        const TOBJ = bxArr.find(i => i.id === parseInt(this.dataset.group));//**클릭된 박스 오브젝트
        let z = TOBJ.zindex;
        let t = TOBJ.top;
        let l = TOBJ.left;
        let w = TOBJ.width;
        let h = TOBJ.height;
        const targetBtnF = document.getElementById("bxF"+ this.dataset.group);
        if(TOBJ.statu === "response"){
          z = parseInt(this.style.zIndex);
          t = (this.style.top).toString();
          l = (this.style.left).toString();
          w = parseInt(this.style.width);
          h = parseInt(this.style.height);
          targetBtnF.value = 'response';
          // saveBoxZTLWH(TOBJ,z,t,l,w,h);
        } else
            if(TOBJ.statu === "fullsize"){
              const fullW = parseInt(bs.clientWidth - 62);
              const fullH = parseInt(bs.clientHeight - 32);
              if (currentBoxResizeObserver) {currentBoxResizeObserver.disconnect();}
              resize = new ResizeObserver((entries) => {
                entries.forEach((b) => {
                  let ww = parseInt(b.target.clientWidth);
                  let hh = parseInt(b.target.clientHeight);
                  console.log("F"+fullW,"F"+fullH,ww,hh);
                  if(ww === fullW && hh === fullH){
                    z = TOBJ.zindex;
                    t = TOBJ.top;
                    l = TOBJ.left;
                    w = TOBJ.width;
                    h = TOBJ.height;
                    targetBtnF.value = 'fullsize';
                    TOBJ.statu = 'fullsize';
                    // saveBoxZTLWH(TOBJ,z,t,l,w,h);
                  }else{
                    // z = parseInt(this.style.zIndex);
                    // t = (this.style.top).toString();
                    // l = (this.style.left).toString();
                    // w = parseInt(this.style.width);
                    // h = parseInt(this.style.height);
                    targetBtnF.value = 'response';
                    TOBJ.statu = 'response';
                    // saveBoxZTLWH(TOBJ,z,t,l,w,h);
                  }
                });
              });
              resize.observe(box);
            }
        //---------------------------------------
      saveBoxZTLWH(TOBJ,z,t,l,w,h);
    });
  });

}
//**************중요**************

function showHiddenBox(ID) {
  const obj = bxArr.find(i => i.id === ID);
  if (!obj) return;
  if (obj.hidden) {
    obj.hidden = false;
    const btn = document.getElementById(`bxM${ID}`);
    if (btn) btn.classList.remove('active');
    animateShowFromSidebar(ID);
    saveBxArr();
  }
  if (typeof applyMobileMemoLayout === 'function') applyMobileMemoLayout(ID);
}

function saveBoxZTLWH(OBJ,z,t,l,w,h){
  const obj = bxArr.find(i => i === OBJ);
  console.log(OBJ,z,t,l,w,h);
  obj.zindex = z;
  obj.top = t;
  obj.left = l;
  obj.width = w;
  obj.height = h;
  obj.updatedAt = Date.now();
  saveBxArr();
  renderMemoMeta(obj.id);
}

//박스 풀사이즈 버튼
function bxF(ID,v){
  const bx = document.getElementById("bx"+ID);
  const targetBoxObj = bxArr.find(box => box.id === ID);
  if (!targetBoxObj) return;
  bx.style.transition = 'all .5s ease-in-out';
  if(v === "response"){
    bx.style.top = '30px';
    bx.style.left = '30px';
    bx.style.width = 'calc(100% - 60px)';
    bx.style.height = 'calc(100% - 30px)';
    targetBoxObj.statu = 'fullsize';
    event.target.value = 'fullsize';
    console.log(bxArr);
    
  } else {
    bx.style.top = targetBoxObj.top;
    bx.style.left = targetBoxObj.left;
    bx.style.width = `${targetBoxObj.width}px`;
    bx.style.height = `${targetBoxObj.height}px`;
    targetBoxObj.statu = 'response';
    event.target.value = 'response';
  }
  saveBxArr();
  setTimeout(() => {
    bx.style.transition = '';
  }, 500)
};



//박스 드래깅 컨트롤
let offsetX, offsetY;
let maxXPercent, maxYPercent;

function boxDragging(bxID,ID){
  console.log(bxArr);
  let boxes = document.querySelectorAll('.bx');
  const box = document.getElementById(bxID);
  const boxObj = bxArr.find(i => i.id === ID);//**클릭된 박스 오브젝트
  if (!boxObj || boxObj.hidden) return; // 숨김 상태면 드래그 불가
  if (boxObj.locked) return; // 위치 고정 시 드래그 불가
  let z = boxObj.zindex;
  let t = boxObj.top;
  let l = boxObj.left;
  let w = boxObj.width;
  let h = boxObj.height;


  let boxZ = parseInt(box.style.zIndex);
  boxes.forEach(function(x){
    if (x !== box) {
      const OBJ = bxArr.find(i => i.id === parseInt(x.dataset.group));//**클릭된 박스 오브젝트
      if (OBJ && OBJ.alwaysTop) return; // 최상위 고정 박스 z-index 유지
      let z = OBJ.zindex;
      let t = OBJ.top;
      let l = OBJ.left;
      let w = OBJ.width;
      let h = OBJ.height;

      const xZ = parseInt(getComputedStyle(x).zIndex);

      if (xZ > boxZ){
        x.style.zIndex = parseInt(xZ - 1);
        z = parseInt(x.style.zIndex);
      }
      
      x.querySelector('.bx-set-door').checked = false;
      saveBoxZTLWH(OBJ,z,t,l,w,h);
      bsClick(); //셋 해제
    }
    const targetBtnF = document.getElementById("bxF"+ID);
    targetBtnF.value = 'response';
  })
  //클릭 박스 최상위 만들기
  box.style.zIndex = parseInt(boxes.length+1);
  box.style.transform = 'scale(1.01)';

  
  const touch = event.type === 'touchstart' ? event.touches[0] : event;
  setTimeout(() => {
    document.body.style.cursor = 'grabbing';
    offsetX = touch.clientX - box.getBoundingClientRect().left;
    offsetY = touch.clientY - box.getBoundingClientRect().top;
    const startXPercent = (touch.clientX - offsetX) / window.innerWidth * 100;
    const startYPercent = (touch.clientY - offsetY) / window.innerHeight * 100;
    maxXPercent = 100 - (box.offsetWidth / window.innerWidth * 100);
    maxYPercent = 100 - (box.offsetHeight / window.innerHeight * 100);
    // touch.clientX는 뷰포트 기준 터치 지점X
    // console.log(offsetX,offsetY,startXPercent,startYPercent,maxXPercent,maxYPercent);
    document.addEventListener('mouseup', () => {endDrag();});
    document.addEventListener('touchend', () => {endDrag();});
    function endDrag() {
        document.body.style.cursor = 'auto';
        box.style.webkitUserSelect = '';
        box.style.transform = 'scale(1)';

        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('touchmove', moveHandler);
    }
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('touchmove', moveHandler);
    function moveHandler(e) {
        const touch = e.type === 'touchmove' ? e.touches[0] : e;
        let xPercent = (touch.clientX - offsetX) / window.innerWidth * 100;
        let yPercent = (touch.clientY - offsetY) / window.innerHeight * 100;
        xPercent = Math.min(maxXPercent, Math.max(0, xPercent));
        yPercent = Math.min(maxYPercent, Math.max(0, yPercent));
        box.style.left = `${xPercent}%`; 
        box.style.top = `${yPercent}%`;
        const OBJ = bxArr.find(i => i.id === parseInt(box.dataset.group));
        let z = OBJ.zindex;
        let t = box.style.top;
        let l = box.style.left;
        let w = OBJ.width;
        let h = OBJ.height;
        saveBoxZTLWH(OBJ,z,t,l,w,h);
      }
  })
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
    if (titleEl) titleEl.textContent = getDisplayTitle(ID);
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

// 표시할 제목 반환 (비어있으면 텍스트의 첫 줄)
function getDisplayTitle(ID) {
    const bxObj = bxArr.find(b => b.id === ID);
    if (!bxObj) return '';
    
    // 제목이 있으면 그것 사용
    if (bxObj.name && bxObj.name.trim()) {
        return bxObj.name;
    }
    
    // 제목이 없으면 텍스트의 첫 줄 가져오기
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