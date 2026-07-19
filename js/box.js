const bs = document.querySelector('.bs');
let currentBoxResizeObserver;
let mobileActiveBoxId = null;
// -- 박스 만들기
let bxArr = [];//전체 박스 정보저장

function isMobileViewport() {
    return window.matchMedia('(max-width: 500px)').matches;
}

function pickTopVisibleBoxId() {
    const visible = bxArr
        .filter(obj => !obj.hidden)
        .sort((a, b) => (b.zindex || 0) - (a.zindex || 0));
    return visible.length ? visible[0].id : null;
}

function applyMobileMemoLayout(preferredId = null) {
    const boxes = document.querySelectorAll('.bx');
    const mobile = isMobileViewport();

    if (!mobile) {
        boxes.forEach(box => box.classList.remove('mobile-active'));
        return;
    }

    const requestedId = preferredId ?? mobileActiveBoxId;
    const requestedObj = bxArr.find(obj => obj.id === requestedId && !obj.hidden);
    const activeId = requestedObj ? requestedObj.id : pickTopVisibleBoxId();
    mobileActiveBoxId = activeId;

    boxes.forEach(box => {
        const id = parseInt(box.dataset.group, 10);
        box.classList.toggle('mobile-active', activeId !== null && id === activeId);
    });
}

function newBox() {
    const Length = bxArr.length;
    const z = Length+1;
    const defaultWidth = 380;
    const defaultHeight = 350;
    const boardWidth = bs ? bs.clientWidth : window.innerWidth;
    const boardHeight = bs ? bs.clientHeight : window.innerHeight;
    const centeredLeft = Math.max(0, Math.round((boardWidth - defaultWidth) / 2));
    const centeredTop = Math.max(0, Math.round((boardHeight - defaultHeight) / 2));
    const nbxObj = {
        id: Date.now(),
        zindex: z,
        width: defaultWidth,
        height: defaultHeight,
        top: `${centeredTop}px`,
        left: `${centeredLeft}px`,
        statu: 'response',
        name: 'title',
        showTitle: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        hidden: false,
    }; 
    bxArr.push(nbxObj);
    addNewBox(nbxObj); // 새로운 앱 요소 생성 및 추가
    saveBxArr(); // appsArr 저장
    if (isMobileViewport()) {
        if (typeof closeSidebar === 'function') closeSidebar(true);
        if (typeof closeRw === 'function') closeRw();
        if (typeof closeWw === 'function') closeWw();
    }
    applyMobileMemoLayout(nbxObj.id);
    if (typeof renderSidebar === 'function') renderSidebar();
    const bxs = document.querySelectorAll(".bx");
    bxs.forEach(function(bx){
      bx.querySelector('.bx-set-door').checked = false;})

    return nbxObj.id;
}

function saveBxArr() {localStorage.setItem('bxArr', JSON.stringify(bxArr));}
function addNewBox(obj) {
    const ID = obj.id;
    const bx = document.createElement('div');
    const w = obj.width;
    const h = obj.height;
    const z = obj.zindex;
    const top = obj.top;
    const left = obj.left;
    const statu = obj.statu;

    bx.id = `bx${obj.id}`;
    bx.classList.add('bx');
    bx.dataset.group = obj.id;
    bx.setAttribute('style',`position:absolute;z-index:${z};top:${top};left:${left}; width:${w}px; height:${h}px`)
    bx.setAttribute('onclick','bxclick()');
    bx.innerHTML = `
    <input type="checkbox" id="door${ID}" class="bx-set-door dpnone">
    <section class="bx-set" id="set${ID}">
        <div class="bx-set-main">
            <div class="bx-set-row bx-set-row--title">
                <input type="text" class="bx-set-title-input" id="bxTitle${ID}"
                    placeholder="제목 입력..."
                    value="${obj.name !== 'title' ? obj.name : ''}"
                    oninput="bxSetTitle(${ID}, this.value)">
            </div>
            <div class="bx-set-row bx-set-toggle-row" onclick="if(event.target.closest('button')) return; bxToggleTitleVisibility(${ID})">
                <span class="bx-set-label"><i class="fa-solid fa-heading"></i>제목 표시</span>
                <button class="bx-set-tgl${obj.showTitle !== false ? ' active' : ''}" id="bxShowTitle${ID}" onclick="event.stopPropagation(); bxToggleTitleVisibility(${ID})"></button>
            </div>
            <div class="bx-set-row bx-set-toggle-row" onclick="if(event.target.closest('button')) return; bxFavorite(${ID})">
                <span class="bx-set-label"><i class="fa-solid fa-star"></i>즐겨찾기</span>
                <button class="bx-set-tgl${obj.favorite ? ' active' : ''}" id="bxFav${ID}" onclick="event.stopPropagation(); bxFavorite(${ID})"></button>
            </div>
            <div class="bx-set-row bx-set-toggle-row" onclick="if(event.target.closest('button')) return; bxAlwaysTop(${ID})">
                <span class="bx-set-label"><i class="fa-solid fa-angles-up"></i>최상위</span>
                <button class="bx-set-tgl${obj.alwaysTop ? ' active' : ''}" id="bxTop${ID}" onclick="event.stopPropagation(); bxAlwaysTop(${ID})"></button>
            </div>
            <div class="bx-set-row bx-set-toggle-row" onclick="if(event.target.closest('button')) return; bxLock(${ID})">
                <span class="bx-set-label"><i class="fa-solid fa-lock"></i>위치 고정</span>
                <button class="bx-set-tgl${obj.locked ? ' active' : ''}" id="bxLock${ID}" onclick="event.stopPropagation(); bxLock(${ID})"></button>
            </div>
            <div class="bx-set-meta" id="bxMeta${ID}">
                <div class="bx-set-meta-line bx-set-meta-line--folder" onclick="toggleMemoFolderPicker(${ID}, event)"><span class="k">폴더</span><span class="v" id="bxMetaFolder${ID}">-</span></div>
                <div class="bx-folder-picker" id="bxFolderPicker${ID}"></div>
                <div class="bx-set-meta-line"><span class="k">생성</span><span class="v" id="bxMetaCreated${ID}">-</span></div>
                <div class="bx-set-meta-line"><span class="k">수정</span><span class="v" id="bxMetaUpdated${ID}">-</span></div>
            </div>
        </div>
    </section>
    <section class="bx-ctrl" id="ctrl${ID}">
        <button class="tool bx-x" id="bxX${ID}" onclick="bxX(${ID})"></button>
        <button class="tool bx-m${obj.hidden ? ' active' : ''}" id="bxM${ID}" onclick="bxM(${ID})"></button>
        <button class="tool bx-f" id="bxF${ID}" onclick="bxF(${ID},this.value)" value="${statu}"></button>
    </section>
    <section class="bx-delete-confirm" id="bxDelConfirm${ID}" onclick="bxXCancel(${ID})">
        <div class="bx-delete-confirm-card" onclick="event.stopPropagation()">
            <div class="bx-delete-confirm-title">메모를 삭제할까요?</div>
            <div class="bx-delete-confirm-desc">삭제한 메모는 복구할 수 없습니다.</div>
            <div class="bx-delete-confirm-actions">
                <button class="bx-delete-btn bx-delete-btn-cancel" onclick="bxXCancel(${ID})">취소</button>
                <button class="bx-delete-btn bx-delete-btn-danger" onclick="bxXConfirm(${ID})">삭제</button>
            </div>
        </div>
    </section>
    <div class="bx-bar" id="bar${ID}" data-group="${ID}" onmousedown="boxDragging('bx${ID}',${ID})"></div>
    <div class="bx-rz bx-rz-n" onmousedown="boxResizeStart('bx${ID}',${ID},'n')" ontouchstart="boxResizeStart('bx${ID}',${ID},'n')"></div>
    <div class="bx-rz bx-rz-s" onmousedown="boxResizeStart('bx${ID}',${ID},'s')" ontouchstart="boxResizeStart('bx${ID}',${ID},'s')"></div>
    <div class="bx-rz bx-rz-e" onmousedown="boxResizeStart('bx${ID}',${ID},'e')" ontouchstart="boxResizeStart('bx${ID}',${ID},'e')"></div>
    <div class="bx-rz bx-rz-w" onmousedown="boxResizeStart('bx${ID}',${ID},'w')" ontouchstart="boxResizeStart('bx${ID}',${ID},'w')"></div>
    <div class="bx-rz bx-rz-ne" onmousedown="boxResizeStart('bx${ID}',${ID},'ne')" ontouchstart="boxResizeStart('bx${ID}',${ID},'ne')"></div>
    <div class="bx-rz bx-rz-nw" onmousedown="boxResizeStart('bx${ID}',${ID},'nw')" ontouchstart="boxResizeStart('bx${ID}',${ID},'nw')"></div>
    <div class="bx-rz bx-rz-se" onmousedown="boxResizeStart('bx${ID}',${ID},'se')" ontouchstart="boxResizeStart('bx${ID}',${ID},'se')"></div>
    <div class="bx-rz bx-rz-sw" onmousedown="boxResizeStart('bx${ID}',${ID},'sw')" ontouchstart="boxResizeStart('bx${ID}',${ID},'sw')"></div>
    <label for="door${ID}" class="bx-door">
        <i class="fa-solid fa-ellipsis-vertical"></i>
    </label>
    <section class="bx-view" id="view${ID}">
        <div class="bx-hdr" data-group="${ID}" id="hdr${ID}">
            <div class="c">
                <span class="bx-title">${obj.name !== 'title' ? obj.name : ''}</span>
            </div>
        </div>
        <div class="bx-main" id="main${ID}">
            <div class="bx-txt">
                <div class="app-editor" id="txt${ID}"></div>
            </div>
        </div>
    </section>
    `;
    bs.appendChild(bx);
    const bxObj = {
        link:0,
        tast:0,
        text:1,
        linkContent:[],
        taskContent:[],
        textContent: "",
        blocks: [{ type: 'text', text: '' }],
        hidden: false
    }
    localStorage.setItem(`${ID}`,JSON.stringify(bxObj));   
    if (typeof initMemoEditor === 'function') {
        initMemoEditor(ID);
    }
    if (typeof renderMemoMeta === 'function') {
        renderMemoMeta(ID);
    }
    applyMobileMemoLayout(ID);
    
    // 헤더 제목 업데이트 (첫 줄이 보이도록) + 사이드바 업데이트
    setTimeout(() => {
        const titleEl = document.querySelector(`#hdr${ID} .bx-title`);
        if (titleEl && typeof getHeaderDisplayTitle === 'function') {
            titleEl.textContent = getHeaderDisplayTitle(ID);
        } else if (titleEl && typeof getDisplayTitle === 'function') {
            titleEl.textContent = getDisplayTitle(ID);
        }
        if (typeof applyTitleVisibility === 'function') {
            applyTitleVisibility(ID);
        }
        if (typeof renderSidebar === 'function') {
            renderSidebar();
        }
    }, 50);


    // let boxes = document.querySelectorAll('.bx');
    // boxes.forEach(function(box) {//**모든 박스 오브젝트
    //     box.addEventListener('click', function() {
    //         const thisZ = parseInt(this.style.zIndex);
    //         boxes.forEach(function(x) {//다른박스들
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
    
    //         this.style.zIndex = parseInt(boxes.length);//박스 최상위
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
    // });
}
// 박스 로드, 프린트
function printBx(obj){
    const ID = obj.id;
    const bx = document.createElement('div');
    const z = obj.zindex;
    let w = obj.width;
    let h = obj.height;
    let top = obj.top;
    let left = obj.left;
    const statu = obj.statu;
    if(statu === "fullsize"){
        top = 30;
        left = 30;
        w = '';
        h = 'calc(100% - 30px)'; 
        bx.setAttribute('style',`
        position:absolute;
        z-index:${z};
        top:30px;left:30px; 
        width:calc(100% - 60px); height:calc(100% - 30px)`)
    } else {
        bx.setAttribute('style',`position:absolute;z-index:${z};top:${top};left:${left}; width:${w}px; height:${h}px`)
        bx.setAttribute('onclick','bxclick()');
    }
    
    bx.id = `bx${ID}`;
    bx.classList.add('bx');
    bx.dataset.group = ID;

    const localBX = localStorage.getItem(ID);
    const BX = JSON.parse(localBX);
    const linkArr = BX.linkContent;
    const taskArr = BX.taskContent;

    bx.innerHTML = `
    <input type="checkbox" id="door${ID}" class="bx-set-door dpnone">
    <section class="bx-set" id="set${ID}">
        <div class="bx-set-main">
            <div class="bx-set-row bx-set-row--title">
                <input type="text" class="bx-set-title-input" id="bxTitle${ID}"
                    placeholder="제목 입력..."
                    value="${obj.name !== 'title' ? obj.name : ''}"
                    oninput="bxSetTitle(${ID}, this.value)">
            </div>
            <div class="bx-set-row bx-set-toggle-row" onclick="if(event.target.closest('button')) return; bxToggleTitleVisibility(${ID})">
                <span class="bx-set-label"><i class="fa-solid fa-heading"></i>제목 표시</span>
                <button class="bx-set-tgl${obj.showTitle !== false ? ' active' : ''}" id="bxShowTitle${ID}" onclick="event.stopPropagation(); bxToggleTitleVisibility(${ID})"></button>
            </div>
            <div class="bx-set-row bx-set-toggle-row" onclick="if(event.target.closest('button')) return; bxFavorite(${ID})">
                <span class="bx-set-label"><i class="fa-solid fa-star"></i>즐겨찾기</span>
                <button class="bx-set-tgl${obj.favorite ? ' active' : ''}" id="bxFav${ID}" onclick="event.stopPropagation(); bxFavorite(${ID})"></button>
            </div>
            <div class="bx-set-row bx-set-toggle-row" onclick="if(event.target.closest('button')) return; bxAlwaysTop(${ID})">
                <span class="bx-set-label"><i class="fa-solid fa-angles-up"></i>최상위</span>
                <button class="bx-set-tgl${obj.alwaysTop ? ' active' : ''}" id="bxTop${ID}" onclick="event.stopPropagation(); bxAlwaysTop(${ID})"></button>
            </div>
            <div class="bx-set-row bx-set-toggle-row" onclick="if(event.target.closest('button')) return; bxLock(${ID})">
                <span class="bx-set-label"><i class="fa-solid fa-lock"></i>위치 고정</span>
                <button class="bx-set-tgl${obj.locked ? ' active' : ''}" id="bxLock${ID}" onclick="event.stopPropagation(); bxLock(${ID})"></button>
            </div>
            <div class="bx-set-meta" id="bxMeta${ID}">
                <div class="bx-set-meta-line bx-set-meta-line--folder" onclick="toggleMemoFolderPicker(${ID}, event)"><span class="k">폴더</span><span class="v" id="bxMetaFolder${ID}">-</span></div>
                <div class="bx-folder-picker" id="bxFolderPicker${ID}"></div>
                <div class="bx-set-meta-line"><span class="k">생성</span><span class="v" id="bxMetaCreated${ID}">-</span></div>
                <div class="bx-set-meta-line"><span class="k">수정</span><span class="v" id="bxMetaUpdated${ID}">-</span></div>
            </div>
        </div>
    </section>
    <section class="bx-ctrl" id="ctrl${ID}">
        <button class="tool bx-x" id="bxX${ID}" onclick="bxX(${ID})"></button>
        <button class="tool bx-m${obj.hidden ? ' active' : ''}" id="bxM${ID}" onclick="bxM(${ID})"></button>
        <button class="tool bx-f" id="bxF${ID}" onclick="bxF(${ID},this.value)" value="${statu}"></button>
    </section>
    <section class="bx-delete-confirm" id="bxDelConfirm${ID}" onclick="bxXCancel(${ID})">
        <div class="bx-delete-confirm-card" onclick="event.stopPropagation()">
            <div class="bx-delete-confirm-title">메모를 삭제할까요?</div>
            <div class="bx-delete-confirm-desc">삭제한 메모는 복구할 수 없습니다.</div>
            <div class="bx-delete-confirm-actions">
                <button class="bx-delete-btn bx-delete-btn-cancel" onclick="bxXCancel(${ID})">취소</button>
                <button class="bx-delete-btn bx-delete-btn-danger" onclick="bxXConfirm(${ID})">삭제</button>
            </div>
        </div>
    </section>
    <div class="bx-bar" id="bar${ID}" data-group="${ID}" onmousedown="boxDragging('bx${ID}',${ID})"></div>
    <div class="bx-rz bx-rz-n" onmousedown="boxResizeStart('bx${ID}',${ID},'n')" ontouchstart="boxResizeStart('bx${ID}',${ID},'n')"></div>
    <div class="bx-rz bx-rz-s" onmousedown="boxResizeStart('bx${ID}',${ID},'s')" ontouchstart="boxResizeStart('bx${ID}',${ID},'s')"></div>
    <div class="bx-rz bx-rz-e" onmousedown="boxResizeStart('bx${ID}',${ID},'e')" ontouchstart="boxResizeStart('bx${ID}',${ID},'e')"></div>
    <div class="bx-rz bx-rz-w" onmousedown="boxResizeStart('bx${ID}',${ID},'w')" ontouchstart="boxResizeStart('bx${ID}',${ID},'w')"></div>
    <div class="bx-rz bx-rz-ne" onmousedown="boxResizeStart('bx${ID}',${ID},'ne')" ontouchstart="boxResizeStart('bx${ID}',${ID},'ne')"></div>
    <div class="bx-rz bx-rz-nw" onmousedown="boxResizeStart('bx${ID}',${ID},'nw')" ontouchstart="boxResizeStart('bx${ID}',${ID},'nw')"></div>
    <div class="bx-rz bx-rz-se" onmousedown="boxResizeStart('bx${ID}',${ID},'se')" ontouchstart="boxResizeStart('bx${ID}',${ID},'se')"></div>
    <div class="bx-rz bx-rz-sw" onmousedown="boxResizeStart('bx${ID}',${ID},'sw')" ontouchstart="boxResizeStart('bx${ID}',${ID},'sw')"></div>
    <label for="door${ID}" class="bx-door">
        <i class="fa-solid fa-ellipsis-vertical"></i>
    </label>
    <section class="bx-view" id="view${ID}">
        <div class="bx-hdr" data-group="${ID}" id="hdr${ID}">
            <div class="c">
                <span class="bx-title">${obj.name !== 'title' ? obj.name : ''}</span>
            </div>
        </div>
        <div class="bx-main" id="main${ID}">
            <div class="bx-txt">
                <div class="app-editor" id="txt${ID}"></div>
            </div>
        </div>
    </section>
    `;


    bs.appendChild(bx);// bs안에 bx프린트
    if (obj.locked) {
        const bar = document.getElementById(`bar${ID}`);
        if (bar) { bar.style.pointerEvents = 'none'; bar.style.cursor = 'default'; }
    }
    if (obj.alwaysTop) bx.style.zIndex = 9999;
    if (typeof applyTitleVisibility === 'function') {
        applyTitleVisibility(ID);
    }
    if (typeof initMemoEditor === 'function') {
        initMemoEditor(ID);
    }
    if (typeof applyHiddenState === 'function') {
        applyHiddenState(ID);
    }
    if (typeof renderMemoMeta === 'function') {
        renderMemoMeta(ID);
    }
    applyMobileMemoLayout();
    // bxF(ID,statu);
    
}
// 페이지 로드 시 복원
function loadBox() {
    const localBxArr = localStorage.getItem('bxArr');
    if (localBxArr) {
        bxArr = JSON.parse(localBxArr);
        bxArr = migrateBxArr(bxArr); // 마이그레이션 적용
        bxArr.forEach(obj => printBx(obj));
        // 모든 메모 헤더 제목 업데이트 (첫 줄이 보이도록)
        setTimeout(() => {
            bxArr.forEach(obj => {
                const titleEl = document.querySelector(`#hdr${obj.id} .bx-title`);
                if (titleEl && typeof getHeaderDisplayTitle === 'function') {
                    titleEl.textContent = getHeaderDisplayTitle(obj.id);
                } else if (titleEl && typeof getDisplayTitle === 'function') {
                    titleEl.textContent = getDisplayTitle(obj.id);
                }
            });
        }, 100);
        applyMobileMemoLayout();
        // console.log(bxArr);
    }
}

// 데이터 마이그레이션 함수
function migrateBxArr(arr) {
    return arr.map(obj => {
        // v1.0 스키마뇁처로 업데이트
        return {
            ...obj,
            name: obj.name || '',               // 빠빠른 값 처리
            createdAt: obj.createdAt || obj.id, // 기본값 = id (timestamp)
            updatedAt: obj.updatedAt || obj.id,
            favorite: obj.favorite ?? false,    // null-coalescing
            alwaysTop: obj.alwaysTop ?? false,
            locked: obj.locked ?? false,
            showTitle: obj.showTitle ?? false,
            hidden: obj.hidden ?? false,
        };
    });
}
loadBox()

window.addEventListener('resize', () => {
    applyMobileMemoLayout();
});