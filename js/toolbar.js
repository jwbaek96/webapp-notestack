// 툴바 시계
const toptime = document.querySelector('.top-time');
const miniCalendarEl = document.getElementById('mini-calendar');
const clockWrapEl = document.getElementById('tb-clock-wrap');
const widgetViewportEl = document.getElementById('widget-carousel-viewport');
const widgetTrackEl = document.getElementById('widget-carousel-track');
const widgetDotsEl = document.getElementById('widget-dots');
const widgetSettingsBtnEl = document.getElementById('widget-settings-btn');
const widgetSettingsPanelEl = document.getElementById('widget-settings-panel');
const widgetSettingsListEl = document.getElementById('widget-settings-list');
const clockHourFormatEls = document.querySelectorAll('input[name="clock-hour-format"]');
const clockToggleEls = {
    year: document.getElementById('clock-setting-year'),
    month: document.getElementById('clock-setting-month'),
    day: document.getElementById('clock-setting-day'),
    weekday: document.getElementById('clock-setting-weekday'),
    hour: document.getElementById('clock-setting-hour'),
    minute: document.getElementById('clock-setting-minute'),
    second: document.getElementById('clock-setting-second')
};
const WIDGET_SETTINGS_KEY = 'widget-search-settings-v1';
const CLOCK_SETTINGS_KEY = 'toolbar-clock-settings-v1';
const WIDGET_ENGINES = {
    google: '구글',
    naver: '네이버',
    youtube: '유튜브'
};
let widgetSlideIndex = 0;
let widgetDragEngine = null;
let widgetSettings = {
    order: ['google', 'naver', 'youtube'],
    enabled: { google: true, naver: true, youtube: true }
};
let clockSettings = getDefaultClockSettings();

const miniCalState = (() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
})();

function getDefaultClockSettings() {
    return {
        show: {
            year: false,
            month: false,
            day: false,
            weekday: true,
            hour: true,
            minute: true,
            second: false
        },
        hourFormat: '12'
    };
}

function normalizeClockSettings(raw) {
    const defaults = getDefaultClockSettings();
    const fields = Object.keys(defaults.show);
    const show = { ...defaults.show };

    fields.forEach(field => {
        if (typeof raw?.show?.[field] === 'boolean') {
            show[field] = raw.show[field];
        }
    });

    const hourFormat = raw?.hourFormat === '24' ? '24' : '12';
    return { show, hourFormat };
}

function loadClockSettings() {
    try {
        const parsed = JSON.parse(localStorage.getItem(CLOCK_SETTINGS_KEY) || '{}');
        clockSettings = normalizeClockSettings(parsed);
    } catch (e) {
        clockSettings = getDefaultClockSettings();
    }
}

function saveClockSettings() {
    localStorage.setItem(CLOCK_SETTINGS_KEY, JSON.stringify(clockSettings));
}

function renderClockSettingsControls() {
    Object.entries(clockToggleEls).forEach(([field, el]) => {
        if (!el) return;
        el.checked = !!clockSettings.show[field];
    });

    clockHourFormatEls.forEach(el => {
        el.checked = el.value === clockSettings.hourFormat;
    });
}

function setClockFieldEnabled(field, enabled) {
    if (!Object.prototype.hasOwnProperty.call(clockSettings.show, field)) return;
    clockSettings.show[field] = enabled;
    saveClockSettings();
    getTime();
}

function setClockHourFormat(mode) {
    clockSettings.hourFormat = mode === '24' ? '24' : '12';
    saveClockSettings();
    getTime();
}

function initClockSettings() {
    loadClockSettings();
    renderClockSettingsControls();

    Object.entries(clockToggleEls).forEach(([field, el]) => {
        if (!el) return;
        el.addEventListener('change', () => {
            setClockFieldEnabled(field, el.checked);
        });
    });

    clockHourFormatEls.forEach(el => {
        el.addEventListener('change', () => {
            if (!el.checked) return;
            setClockHourFormat(el.value);
        });
    });

    getTime();
}

function getTime() {
    if (!toptime) return;

    const date = new Date();
    const show = clockSettings.show;
    const weekdayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

    const dateParts = [];
    if (show.year) dateParts.push(`${date.getFullYear()}년`);
    if (show.month) dateParts.push(`${date.getMonth() + 1}월`);
    if (show.day) dateParts.push(`${date.getDate()}일`);
    if (show.weekday) dateParts.push(weekdayNames[date.getDay()]);

    const timeParts = [];
    if (show.hour) {
        if (clockSettings.hourFormat === '24') {
            timeParts.push(String(date.getHours()).padStart(2, '0'));
        } else {
            const hours = date.getHours();
            const period = hours >= 12 ? 'PM' : 'AM';
            const hour12 = hours % 12 || 12;
            timeParts.push(`${period} ${hour12}`);
        }
    }
    if (show.minute) timeParts.push(String(date.getMinutes()).padStart(2, '0'));
    if (show.second) timeParts.push(String(date.getSeconds()).padStart(2, '0'));

    const dateText = dateParts.join(' ');
    const timeText = timeParts.join(':');
    const now = [dateText, timeText].filter(Boolean).join(' ').trim();

    toptime.textContent = now;
}

function renderMiniCalendar() {
    if (!miniCalendarEl) return;

    const { year, month } = miniCalState;
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const weekdayNames = ['일', '월', '화', '수', '목', '금', '토'];

    const cells = [];
    for (let i = 0; i < startWeekday; i += 1) {
        cells.push(`<div class="mini-cal-cell muted">${prevMonthDays - startWeekday + i + 1}</div>`);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
        cells.push(`<div class="mini-cal-cell${isToday ? ' today' : ''}">${day}</div>`);
    }
    while (cells.length % 7 !== 0) {
        cells.push(`<div class="mini-cal-cell muted">${cells.length % 7 + 1}</div>`);
    }

    miniCalendarEl.innerHTML = `
        <div class="mini-cal-head">
            <button class="mini-cal-nav" onclick="changeMiniCalendarMonth(-1)">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <div class="mini-cal-title">${year}년 ${monthNames[month]}</div>
            <button class="mini-cal-nav" onclick="changeMiniCalendarMonth(1)">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
        <div class="mini-cal-week">
            ${weekdayNames.map(name => `<span>${name}</span>`).join('')}
        </div>
        <div class="mini-cal-grid">
            ${cells.join('')}
        </div>
    `;
}

function toggleMiniCalendar() {
    if (!miniCalendarEl) return;
    const willOpen = !miniCalendarEl.classList.contains('open');
    if (willOpen) renderMiniCalendar();
    miniCalendarEl.classList.toggle('open', willOpen);
}

function closeMiniCalendar() {
    if (!miniCalendarEl) return;
    miniCalendarEl.classList.remove('open');

    const now = new Date();
    miniCalState.year = now.getFullYear();
    miniCalState.month = now.getMonth();
}

function changeMiniCalendarMonth(delta) {
    miniCalState.month += delta;
    if (miniCalState.month < 0) {
        miniCalState.month = 11;
        miniCalState.year -= 1;
    }
    if (miniCalState.month > 11) {
        miniCalState.month = 0;
        miniCalState.year += 1;
    }
    renderMiniCalendar();
}

function updateWidgetDots() {
    const dots = document.querySelectorAll('#widget-dots .widget-dot');
    dots.forEach((dot, idx) => dot.classList.toggle('active', idx === widgetSlideIndex));
}

function setWidgetSlide(index) {
    if (!widgetViewportEl) return;
    const maxIdx = Math.max(0, getVisibleWidgetSlides().length - 1);
    widgetSlideIndex = Math.max(0, Math.min(maxIdx, index));
    const pageWidth = widgetViewportEl.clientWidth;
    widgetViewportEl.scrollTo({
        left: pageWidth * widgetSlideIndex,
        behavior: 'smooth'
    });
    updateWidgetDots();
}

function initWidgetSwipe() {
    if (!widgetViewportEl) return;

    let ticking = false;
    widgetViewportEl.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const pageWidth = widgetViewportEl.clientWidth || 1;
            const idx = Math.round(widgetViewportEl.scrollLeft / pageWidth);
            const maxIdx = Math.max(0, getVisibleWidgetSlides().length - 1);
            widgetSlideIndex = Math.max(0, Math.min(maxIdx, idx));
            updateWidgetDots();
            ticking = false;
        });
    }, { passive: true });
}

function getVisibleWidgetSlides() {
    return Array.from(document.querySelectorAll('.widget-slide')).filter(slide => slide.style.display !== 'none');
}

function getDefaultWidgetSettings() {
    return {
        order: ['google', 'naver', 'youtube'],
        enabled: { google: true, naver: true, youtube: true }
    };
}

function normalizeWidgetSettings(raw) {
    const defaults = getDefaultWidgetSettings();
    const order = Array.isArray(raw?.order) ? raw.order.filter(key => Object.prototype.hasOwnProperty.call(WIDGET_ENGINES, key)) : defaults.order;
    const mergedOrder = [...new Set([...order, ...defaults.order])];
    const enabled = { ...defaults.enabled };
    mergedOrder.forEach(key => {
        enabled[key] = raw?.enabled?.[key] !== false;
    });
    return { order: mergedOrder, enabled };
}

function loadWidgetSettings() {
    try {
        const parsed = JSON.parse(localStorage.getItem(WIDGET_SETTINGS_KEY) || '{}');
        widgetSettings = normalizeWidgetSettings(parsed);
    } catch (e) {
        widgetSettings = getDefaultWidgetSettings();
    }
}

function saveWidgetSettings() {
    localStorage.setItem(WIDGET_SETTINGS_KEY, JSON.stringify(widgetSettings));
}

function applyWidgetSettings() {
    if (!widgetTrackEl) return;

    widgetSettings.order.forEach(engine => {
        const slide = widgetTrackEl.querySelector(`.widget-slide[data-engine="${engine}"]`);
        if (slide) widgetTrackEl.appendChild(slide);
    });

    widgetSettings.order.forEach(engine => {
        const slide = widgetTrackEl.querySelector(`.widget-slide[data-engine="${engine}"]`);
        if (slide) slide.style.display = widgetSettings.enabled[engine] ? '' : 'none';
    });

    rebuildWidgetDots();
    const maxIdx = Math.max(0, getVisibleWidgetSlides().length - 1);
    widgetSlideIndex = Math.min(widgetSlideIndex, maxIdx);
    widgetViewportEl.scrollTo({ left: widgetViewportEl.clientWidth * widgetSlideIndex, behavior: 'auto' });
    updateWidgetDots();
}

function rebuildWidgetDots() {
    if (!widgetDotsEl) return;
    const visibleEngines = widgetSettings.order.filter(engine => widgetSettings.enabled[engine]);
    widgetDotsEl.innerHTML = '';
    visibleEngines.forEach((engine, idx) => {
        const btn = document.createElement('button');
        btn.className = 'widget-dot';
        btn.type = 'button';
        btn.setAttribute('aria-label', `${WIDGET_ENGINES[engine]} 검색`);
        btn.addEventListener('click', () => setWidgetSlide(idx));
        widgetDotsEl.appendChild(btn);
    });
}

function moveWidgetEngineByDrop(dragged, target, placeAfter) {
    if (!dragged || !target || dragged === target) return;
    const nextOrder = widgetSettings.order.filter(engine => engine !== dragged);
    const targetIdx = nextOrder.indexOf(target);
    if (targetIdx < 0) return;
    const insertIdx = placeAfter ? targetIdx + 1 : targetIdx;
    nextOrder.splice(insertIdx, 0, dragged);
    widgetSettings.order = nextOrder;
    saveWidgetSettings();
    renderWidgetSettingsList();
    applyWidgetSettings();
}

function setWidgetEngineEnabled(engine, enabled) {
    const activeCount = widgetSettings.order.filter(key => widgetSettings.enabled[key]).length;
    if (!enabled && activeCount <= 1) return false;
    widgetSettings.enabled[engine] = enabled;
    saveWidgetSettings();
    renderWidgetSettingsList();
    applyWidgetSettings();
    return true;
}

function renderWidgetSettingsList() {
    if (!widgetSettingsListEl) return;
    widgetSettingsListEl.innerHTML = '';

    widgetSettings.order.forEach(engine => {
        const row = document.createElement('div');
        row.className = 'widget-settings-item';
        row.dataset.engine = engine;
        row.draggable = true;

        row.addEventListener('dragstart', e => {
            widgetDragEngine = engine;
            row.classList.add('dragging');
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', engine);
            }
        });

        row.addEventListener('dragover', e => {
            e.preventDefault();
            const rect = row.getBoundingClientRect();
            const placeAfter = (e.clientY - rect.top) > (rect.height / 2);
            row.classList.toggle('drop-before', !placeAfter);
            row.classList.toggle('drop-after', placeAfter);
        });

        row.addEventListener('dragleave', () => {
            row.classList.remove('drop-before', 'drop-after');
        });

        row.addEventListener('drop', e => {
            e.preventDefault();
            const placeAfter = row.classList.contains('drop-after');
            row.classList.remove('drop-before', 'drop-after');
            moveWidgetEngineByDrop(widgetDragEngine, engine, placeAfter);
        });

        row.addEventListener('dragend', () => {
            widgetDragEngine = null;
            document.querySelectorAll('.widget-settings-item').forEach(el => {
                el.classList.remove('dragging', 'drop-before', 'drop-after');
            });
        });

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `widget-setting-toggle-${engine}`;
        checkbox.className = 'widget-settings-toggle';
        checkbox.checked = widgetSettings.enabled[engine];
        checkbox.addEventListener('change', () => {
            const ok = setWidgetEngineEnabled(engine, checkbox.checked);
            if (!ok) checkbox.checked = true;
        });

        const label = document.createElement('span');
        label.className = 'widget-settings-item-label';
        label.textContent = WIDGET_ENGINES[engine];

        const dragHandle = document.createElement('span');
        dragHandle.className = 'widget-settings-drag';
        dragHandle.innerHTML = '≡';
        dragHandle.setAttribute('title', '드래그로 순서 변경');

        const toggleWrap = document.createElement('label');
        toggleWrap.className = 'widget-settings-switch';
        toggleWrap.setAttribute('for', checkbox.id);

        const toggleUi = document.createElement('span');
        toggleUi.className = 'widget-settings-switch-ui';

        toggleWrap.appendChild(checkbox);
        toggleWrap.appendChild(toggleUi);

        row.appendChild(dragHandle);
        row.appendChild(label);
        row.appendChild(toggleWrap);
        widgetSettingsListEl.appendChild(row);
    });
}

function toggleWidgetSettings() {
    if (!widgetSettingsPanelEl || !widgetSettingsBtnEl) return;
    const open = !widgetSettingsPanelEl.classList.contains('open');
    widgetSettingsPanelEl.classList.toggle('open', open);
    widgetSettingsBtnEl.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function closeWidgetSettings() {
    if (!widgetSettingsPanelEl || !widgetSettingsBtnEl) return;
    widgetSettingsPanelEl.classList.remove('open');
    widgetSettingsBtnEl.setAttribute('aria-expanded', 'false');
}

function initWidgetSettings() {
    loadWidgetSettings();
    renderWidgetSettingsList();
    applyWidgetSettings();
}

function initWidgetSearchClear() {
    const forms = document.querySelectorAll('.widget-searchbar');
    forms.forEach(form => {
        form.addEventListener('submit', () => {
            // Delay clear so the submitted query is not affected.
            setTimeout(() => {
                const input = form.querySelector('input[type="text"]');
                if (input) input.value = '';
            }, 0);
        });
    });
}

document.addEventListener('click', e => {
    if (!miniCalendarEl || !clockWrapEl) return;
    if (!miniCalendarEl.classList.contains('open')) return;
    if (!clockWrapEl.contains(e.target)) closeMiniCalendar();
});

document.addEventListener('click', e => {
    if (!widgetSettingsPanelEl || !widgetSettingsBtnEl) return;
    if (!widgetSettingsPanelEl.classList.contains('open')) return;
    if (widgetSettingsPanelEl.contains(e.target) || widgetSettingsBtnEl.contains(e.target)) return;
    closeWidgetSettings();
});

document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeMiniCalendar();
    closeWidgetSettings();
});
// const today = document.querySelector('h2#date');
// function getDate(){
//     const date = new Date();
//    
//     today.innerText = `${d} ${mArr[m]} ${y} ${wArr[dy]}`;
// }
initClockSettings();
setInterval(getTime, 1000);
initWidgetSwipe();
initWidgetSearchClear();
initWidgetSettings();
setWidgetSlide(0);

if (clockWrapEl) {
    clockWrapEl.addEventListener('click', e => {
        e.stopPropagation();
    });
}

if (miniCalendarEl) {
    miniCalendarEl.addEventListener('click', e => {
        e.stopPropagation();
    });
}