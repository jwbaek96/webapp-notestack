const bs = document.querySelector('.bs');
let currentBoxResizeObserver;
// -- 박스 만들기
let bxArr = [];//전체 박스 정보저장

function newBox() {
    const Length = bxArr.length;
    const z = Length+1;
    const nbxObj = {
        id: Date.now(),
        zindex: z,
        width: 300,
        height: 200,
        top: Length*30+30+'px',
        left: Length*15+30+'px',
        statu: 'response',
        name: 'title',
        showTitle: true,
    }; 
    bxArr.push(nbxObj);
    addNewBox(nbxObj); // 새로운 앱 요소 생성 및 추가
    saveBxArr(); // appsArr 저장
    if (typeof renderSidebar === 'function') renderSidebar();
    const bxs = document.querySelectorAll(".bx");
    bxs.forEach(function(bx){
      bx.querySelector('.bx-set-door').checked = false;})
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
            <div class="bx-set-row bx-set-toggle-row">
                <span class="bx-set-label"><i class="fa-solid fa-heading"></i>제목 표시</span>
                <button class="bx-set-tgl${obj.showTitle !== false ? ' active' : ''}" id="bxShowTitle${ID}" onclick="bxToggleTitleVisibility(${ID})"></button>
            </div>
            <div class="bx-set-row bx-set-toggle-row">
                <span class="bx-set-label"><i class="fa-solid fa-star"></i>즐겨찾기</span>
                <button class="bx-set-tgl${obj.favorite ? ' active' : ''}" id="bxFav${ID}" onclick="bxFavorite(${ID})"></button>
            </div>
            <div class="bx-set-row bx-set-toggle-row">
                <span class="bx-set-label"><i class="fa-solid fa-angles-up"></i>최상위</span>
                <button class="bx-set-tgl${obj.alwaysTop ? ' active' : ''}" id="bxTop${ID}" onclick="bxAlwaysTop(${ID})"></button>
            </div>
            <div class="bx-set-row bx-set-toggle-row">
                <span class="bx-set-label"><i class="fa-solid fa-lock"></i>위치 고정</span>
                <button class="bx-set-tgl${obj.locked ? ' active' : ''}" id="bxLock${ID}" onclick="bxLock(${ID})"></button>
            </div>
        </div>
    </section>
    <section class="bx-ctrl" id="ctrl${ID}">
        <button class="tool bx-x" id="bxX${ID}" onclick="bxX(${ID})"></button>
        <button class="tool bx-m" id="bxM${ID}"></button>
        <button class="tool bx-f" id="bxF${ID}" onclick="bxF(${ID},this.value)" value="${statu}"></button>
    </section>
    <div class="bx-bar" id="bar${ID}" data-group="${ID}" onmousedown="boxDragging('bx${ID}',${ID})"></div>
    <label for="door${ID}" class="bx-door">
        <i class="fa-solid fa-ellipsis-vertical"></i>
    </label>
    <section class="bx-view" id="view${ID}">
        <div class="bx-hdr" data-group="${ID}" id="hdr${ID}">
            <div class="c">
                <span class="bx-title">${obj.name !== 'title' ? obj.name : ''}</span>
            </div>
        </div>
        <label for="txt${ID}" class="bx-main" id="main${ID}">
            <div class="bx-txt">
                <textarea class="app-txt" id="txt${ID}" oninput="apptext(this.value, ${ID})" spellcheck="false"></textarea>
            </div>
        </label>
    </section>
    `;
    bs.appendChild(bx);
    const bxObj = {
        link:0,
        tast:0,
        text:1,
        linkContent:[],
        taskContent:[],
        textContent: ""
    }
    localStorage.setItem(`${ID}`,JSON.stringify(bxObj));   
    
    // 헤더 제목 업데이트 (첫 줄이 보이도록) + 사이드바 업데이트
    setTimeout(() => {
        const titleEl = document.querySelector(`#hdr${ID} .bx-title`);
        if (titleEl && typeof getDisplayTitle === 'function') {
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
    const txt = BX.textContent;
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
            <div class="bx-set-row bx-set-toggle-row">
                <span class="bx-set-label"><i class="fa-solid fa-heading"></i>제목 표시</span>
                <button class="bx-set-tgl${obj.showTitle !== false ? ' active' : ''}" id="bxShowTitle${ID}" onclick="bxToggleTitleVisibility(${ID})"></button>
            </div>
            <div class="bx-set-row bx-set-toggle-row">
                <span class="bx-set-label"><i class="fa-solid fa-star"></i>즐겨찾기</span>
                <button class="bx-set-tgl${obj.favorite ? ' active' : ''}" id="bxFav${ID}" onclick="bxFavorite(${ID})"></button>
            </div>
            <div class="bx-set-row bx-set-toggle-row">
                <span class="bx-set-label"><i class="fa-solid fa-angles-up"></i>최상위</span>
                <button class="bx-set-tgl${obj.alwaysTop ? ' active' : ''}" id="bxTop${ID}" onclick="bxAlwaysTop(${ID})"></button>
            </div>
            <div class="bx-set-row bx-set-toggle-row">
                <span class="bx-set-label"><i class="fa-solid fa-lock"></i>위치 고정</span>
                <button class="bx-set-tgl${obj.locked ? ' active' : ''}" id="bxLock${ID}" onclick="bxLock(${ID})"></button>
            </div>
        </div>
    </section>
    <section class="bx-ctrl" id="ctrl${ID}">
        <button class="tool bx-x" id="bxX${ID}" onclick="bxX(${ID})"></button>
        <button class="tool bx-m" id="bxM${ID}"></button>
        <button class="tool bx-f" id="bxF${ID}" onclick="bxF(${ID},this.value)" value="${statu}"></button>
    </section>
    <div class="bx-bar" id="bar${ID}" data-group="${ID}" onmousedown="boxDragging('bx${ID}',${ID})"></div>
    <label for="door${ID}" class="bx-door">
        <i class="fa-solid fa-ellipsis-vertical"></i>
    </label>
    <section class="bx-view" id="view${ID}">
        <div class="bx-hdr" data-group="${ID}" id="hdr${ID}">
            <div class="c">
                <span class="bx-title">${obj.name !== 'title' ? obj.name : ''}</span>
            </div>
        </div>
        <label for="txt${ID}" class="bx-main" id="main${ID}">
            <div class="bx-txt">
                <textarea class="app-txt" id="txt${ID}" oninput="apptext(this.value, ${ID})" spellcheck="false">${txt}</textarea>
            </div>
        </label>
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
    TextResize(ID);
    // bxF(ID,statu);
    
}
function TextResize(ID) {
    let textarea = document.getElementById(`txt${ID}`);
    let scHeight = textarea.scrollHeight;
    // let borderTop = parseInt(style.borderTop);
    textarea.style.height = scHeight + "px";
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
                if (titleEl && typeof getDisplayTitle === 'function') {
                    titleEl.textContent = getDisplayTitle(obj.id);
                }
            });
        }, 100);
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
            showTitle: obj.showTitle ?? true,
        };
    });
}
loadBox()