document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    const yearInput = document.getElementById('year');
    const monthInput = document.getElementById('month');
    const renderButton = document.getElementById('renderButton');
    const textInput = document.getElementById('textInput');
    const parseButton = document.getElementById('parseButton');
    const clearButton = document.getElementById('clearButton');
    const selectedCountEl = document.getElementById('selectedCount');

    let selectedDays = new Set();

    renderButton.addEventListener('click', function() {
        const year = parseInt(yearInput.value);
        const month = parseInt(monthInput.value);
        selectedDays.clear();
        selectedCountEl.textContent = '0';
        renderCalendar(year, month);
    });

    parseButton.addEventListener('click', function() {
        const text = textInput.value;
        const year = parseInt(yearInput.value);
        const month = parseInt(monthInput.value);
        const days = parseTextToDays(text, year, month);
        highlightDays(days);
    });

    clearButton.addEventListener('click', function() {
        selectedDays.clear();
        selectedCountEl.textContent = '0';
        clearSelectedDays();
    });

    // 默认加载当前月份
    const today = new Date();
    yearInput.value = today.getFullYear();
    monthInput.value = today.getMonth() + 1;
    renderCalendar(today.getFullYear(), today.getMonth() + 1);

    async function renderCalendar(year, month) {
        calendarEl.innerHTML = '';

        // 获取中国和日本的法定假日
        const [chinaHolidays, japanHolidays] = await Promise.all([
            fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/CN`).then(res => res.json()),
            fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/JP`).then(res => res.json())
        ]);

        const holidays = [
            ...chinaHolidays.map(holiday => ({ ...holiday, country: '中国' })),
            ...japanHolidays.map(holiday => ({ ...holiday, country: '日本' }))
        ];

        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay();

        // 添加星期标题
        const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
        daysOfWeek.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.textContent = day;
            dayEl.style.fontWeight = 'bold';
            calendarEl.appendChild(dayEl);
        });

        // 填充空白
        for (let i = 0; i < startDay; i++) {
            const emptyEl = document.createElement('div');
            calendarEl.appendChild(emptyEl);
        }

        // 填充日期
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dateStr = date.toISOString().split('T')[0];
            const holiday = holidays.find(holiday => holiday.date === dateStr);

            const dayEl = document.createElement('div');
            dayEl.textContent = day;

            // 标注今天的日期
            const today = new Date();
            if (
                date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate()
            ) {
                dayEl.classList.add('today');
            }

            if (holiday) {
                dayEl.classList.add('holiday');
                dayEl.classList.add(holiday.country === '中国' ? 'china' : 'japan');
                dayEl.setAttribute('data-holiday-name', `${holiday.localName} (${holiday.country})`);
                dayEl.classList.add('rest-day'); // 休息日
            } else if (isAdjustRestDay(dateStr)) {
                dayEl.classList.add('adjust-rest-day'); // 调休休息日
            } else if (isAdjustWorkDay(dateStr)) {
                dayEl.classList.add('adjust-work-day'); // 调休工作日
            }

            // 点击选择日期
            dayEl.addEventListener('click', () => {
                if (dayEl.classList.contains('selected')) {
                    dayEl.classList.remove('selected');
                    selectedDays.delete(dateStr);
                } else {
                    dayEl.classList.add('selected');
                    selectedDays.add(dateStr);
                }
                selectedCountEl.textContent = selectedDays.size;
            });

            calendarEl.appendChild(dayEl);
        }
    }

    // 解析文本中的周几、星期几信息
    function parseTextToDays(text, year, month) {
        const dayMap = { '日': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6 };
        const regex = /(周|星期)([一二三四五六日])/g;
        const matches = [...text.matchAll(regex)];
        const days = [];

        matches.forEach(match => {
            const dayName = match[2];
            const dayOfWeek = dayMap[dayName];
            if (dayOfWeek !== undefined) {
                const dates = getAllDaysOfWeek(year, month, dayOfWeek);
                days.push(...dates);
            }
        });

        return days;
    }

    // 获取指定月份中所有指定周几的日期
    function getAllDaysOfWeek(year, month, dayOfWeek) {
        const dates = [];
        const date = new Date(year, month - 1, 1);
        while (date.getMonth() === month - 1) {
            if (date.getDay() === dayOfWeek) {
                dates.push(date.toISOString().split('T')[0]);
            }
            date.setDate(date.getDate() + 1);
        }
        return dates;
    }

    // 高亮选中的日期
    function highlightDays(days) {
        const calendarDays = calendarEl.querySelectorAll('div');
        calendarDays.forEach(dayEl => {
            const day = dayEl.textContent;
            if (day && !isNaN(day)) {
                const date = new Date(yearInput.value, monthInput.value - 1, day);
                const dateStr = date.toISOString().split('T')[0];
                if (days.includes(dateStr)) {
                    dayEl.classList.add('selected');
                    selectedDays.add(dateStr);
                }
            }
        });
        selectedCountEl.textContent = selectedDays.size;
    }

    // 清除所有选中的日期
    function clearSelectedDays() {
        const calendarDays = calendarEl.querySelectorAll('div');
        calendarDays.forEach(dayEl => {
            dayEl.classList.remove('selected');
        });
    }

    // 判断是否是调休休息日（示例逻辑，需根据实际调休规则调整）
    function isAdjustRestDay(dateStr) {
        const adjustRestDays = ['2023-10-06']; // 示例调休休息日
        return adjustRestDays.includes(dateStr);
    }

    // 判断是否是调休工作日（示例逻辑，需根据实际调休规则调整）
    function isAdjustWorkDay(dateStr) {
        const adjustWorkDays = ['2023-10-07']; // 示例调休工作日
        return adjustWorkDays.includes(dateStr);
    }
});