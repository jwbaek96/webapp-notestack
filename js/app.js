//박스 앱
//텍스트
function apptext(v,ID){
    const obj = localStorage.getItem(ID);
    const reObj = JSON.parse(obj);
    reObj.textContent = v;
    console.log(v);
    console.log(reObj.textContent);
    console.log(reObj);
    
    localStorage.setItem(ID,JSON.stringify(reObj))

    // 제목이 비어있으면 첫 줄을 자동으로 제목으로 설정
    const bxObj = bxArr.find(b => b.id === ID);
    if (bxObj && (!bxObj.name || bxObj.name === 'title' || bxObj.name === '')) {
        bxObj.name = '';
        saveBxArr();
    }
    
    // 헤더 제목 업데이트 (비어있으면 첫 줄 표시)
    const titleEl = document.querySelector(`#hdr${ID} .bx-title`);
    if (titleEl && typeof getDisplayTitle === 'function') {
        titleEl.textContent = getDisplayTitle(ID);
    }
    
    // 사이드바 업데이트
    if (typeof renderSidebar === 'function') {
        renderSidebar();
    }

    let textarea = document.getElementById(`txt${ID}`);
    textarea.addEventListener("keyup", e => {
        textarea.style.height = 'auto';
        let scHeight = e.target.scrollHeight;
        textarea.style.height = `${scHeight}px`;
    })
}
