// 툴바 시계
const toptime = document.querySelector('.top-time');

function getTime() {
    const date = new Date();
    let h = String(date.getHours());
    if (date.getHours() < 13) {
        h = `AM ${h}`;
    } else if (date.getHours() == 24) {
        h = `AM 00`;
    } else {
        h = `PM ${h - 12}`;
    }
    const m = String(date.getMinutes()).padStart(2,"0");
    const s = String(date.getSeconds()).padStart(2,"0");
    
    const wArrEN = new Array('Sun','Mon','Tue','Wed','Thur','Fri','Sat');
    const wArrKR = new Array('일요일','월요일','화요일','수요일','목요일','금요일','토요일');
    const mArr = new Array('January','February','March','April','May','June','July','August','September','October','November','December');
    const D = String(date.getDate());
    const M = date.getMonth();
    const Y = String(date.getFullYear());
    const DY = String(date.getDay());

    // const now = `${Y} ${mArr[M]} ${D} ${wArr[DY]} ${h}:${m}`
    const now = `${wArrKR[DY]} ${h}:${m}`

    toptime.innerText = now.toUpperCase();
}
// const today = document.querySelector('h2#date');
// function getDate(){
//     const date = new Date();
//    
//     today.innerText = `${d} ${mArr[m]} ${y} ${wArr[dy]}`;
// }
getTime();
setInterval(getTime, 1000);