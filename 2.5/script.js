document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const saveDataBtn = document.getElementById('saveData');
    const loadDataBtn = document.getElementById('loadData');
    const loadDataInput = document.getElementById('loadDataInput');
    const monthlyReportBtn = document.getElementById('monthlyReport');
    const exportWebpageBtn = document.getElementById('exportWebpage');
    const recordsBody = document.getElementById('recordsBody');
    const totalCostCell = document.getElementById('totalCost');
    const monthlyModal = document.getElementById('monthlyModal');
    const monthlyStats = document.getElementById('monthlyStats');
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const costCalculationDiv = document.getElementById('costCalculation');
    
    // 新增记录的表单元素
    const newCallDateInput = document.getElementById('newCallDate');
    const newCallDurationInput = document.getElementById('newCallDuration');
    const newCallCostInput = document.getElementById('newCallCost');
    const newCallImageInput = document.getElementById('newCallImage');
    const addNewRecordBtn = document.getElementById('addNewRecord');
    const newBillingMethodSelect = document.getElementById('newBillingMethod');
    const customBillingFields = document.getElementById('customBillingFields');
    const customFirstMinuteInput = document.getElementById('customFirstMinute');
    const customAdditionalMinuteInput = document.getElementById('customAdditionalMinute');
    const imagePreviewsContainer = document.getElementById('imagePreviews');
    const newCallNoteInput = document.getElementById('newCallNote');
    const pasteArea = document.getElementById('pasteArea');
    
    // 存储所有记录的数组
    let records = [];
    let lastSelectedDate = new Date().toISOString().slice(0, 10);
    let imagePreviews = [];
    
    // 初始化日期输入
    function initDateInput() {
        newCallDateInput.value = lastSelectedDate;
        newCallDateInput.addEventListener('change', function() {
            lastSelectedDate = this.value;
        });
    }
    
    // 计算通话费用并返回计算过程
    function calculateCost(duration, billingMethod = '5start') {
        if (duration <= 0) return { cost: 0, calculation: '0' };
        
        let cost = 0;
        let calculation = '';
        
        switch(billingMethod) {
            case '5start':
                cost = duration <= 1 ? 5 : 5 + (duration - 1) * 2;
                calculation = duration <= 1 ? '5' : `5 + 2 × ${duration - 1} = ${cost}`;
                break;
            case '6start':
                cost = duration <= 1 ? 6 : 6 + (duration - 1) * 1.89;
                calculation = duration <= 1 ? '6' : `6 + 1.89 × ${duration - 1} = ${cost.toFixed(2)}`;
                break;
            case '5permin':
                cost = duration * 2;
                calculation = `2 × ${duration} = ${cost}`;
                break;
            case '6permin':
                cost = duration * 1.89;
                calculation = `1.89 × ${duration} = ${cost.toFixed(2)}`;
                break;
            case 'custom':
                const firstMinute = parseFloat(customFirstMinuteInput.value) || 5;
                const additionalMinute = parseFloat(customAdditionalMinuteInput.value) || 2;
                cost = duration <= 1 ? firstMinute : firstMinute + (duration - 1) * additionalMinute;
                calculation = duration <= 1 ? `${firstMinute}` : 
                    `${firstMinute} + ${additionalMinute} × ${duration - 1} = ${cost.toFixed(2)}`;
                break;
            default:
                cost = duration <= 1 ? 5 : 5 + (duration - 1) * 2;
                calculation = duration <= 1 ? '5' : `5 + 2 × ${duration - 1} = ${cost}`;
        }
        
        return { cost, calculation };
    }
    
    // 更新费用计算
    function updateCostCalculation() {
        const duration = parseInt(newCallDurationInput.value) || 0;
        const billingMethod = newBillingMethodSelect.value;
        
        const result = calculateCost(duration, billingMethod);
        newCallCostInput.value = result.cost.toFixed(2);
        costCalculationDiv.textContent = result.calculation;
    }
    
    // 处理图片上传
    function handleImageUpload(event) {
        imagePreviews = [];
        imagePreviewsContainer.innerHTML = '';
        
        const files = event.target.files;
        for (let i = 0; i < Math.min(files.length, 3); i++) {
            const file = files[i];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                if (imagePreviews.length < 3) {
                    imagePreviews.push(e.target.result);
                    renderImagePreviews();
                }
            };
            
            reader.readAsDataURL(file);
        }
    }
    
    // 渲染图片预览
    function renderImagePreviews() {
        imagePreviewsContainer.innerHTML = '';
        
        imagePreviews.forEach((imageUrl, index) => {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'image-preview';
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.className = 'thumbnail';
            img.addEventListener('click', () => {
                modalImage.src = imageUrl;
                imageModal.classList.remove('hidden');
            });
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-image-btn';
            removeBtn.innerHTML = '×';
            removeBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                imagePreviews = imagePreviews.filter((_, i) => i !== index);
                renderImagePreviews();
            });
            
            previewDiv.appendChild(img);
            previewDiv.appendChild(removeBtn);
            imagePreviewsContainer.appendChild(previewDiv);
        });
    }
    
    // 处理粘贴事件
    function handlePaste(event) {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    if (imagePreviews.length < 3) {
                        imagePreviews.push(e.target.result);
                        renderImagePreviews();
                    } else {
                        alert('最多只能添加3张图片');
                    }
                };
                
                reader.readAsDataURL(blob);
                break;
            }
        }
        
        pasteArea.classList.remove('paste-active');
        event.preventDefault();
    }
    
    // 更新总计
    function updateTotals() {
        const totalCost = records.reduce((sum, record) => sum + (isNaN(record.cost) ? 0 : record.cost), 0);
        totalCostCell.textContent = totalCost.toFixed(2);
    }
    
    // 渲染记录表格
    function renderRecords() {
        const addRow = document.getElementById('addRow');
        recordsBody.innerHTML = '';
        recordsBody.appendChild(addRow);
        
        records.forEach((record, index) => {
            const row = document.createElement('tr');
            
            // 序号单元格
            const indexCell = document.createElement('td');
            indexCell.textContent = index + 1;
            
            // 日期单元格
            const dateCell = document.createElement('td');
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.value = record.date;
            dateInput.addEventListener('change', (e) => {
                records[index].date = e.target.value;
                updateTotals();
            });
            dateCell.appendChild(dateInput);
            
            // 时长单元格
            const durationCell = document.createElement('td');
            const durationInput = document.createElement('input');
            durationInput.type = 'number';
            durationInput.min = '1';
            durationInput.value = record.duration;
            durationInput.addEventListener('change', (e) => {
                const duration = parseInt(e.target.value);
                records[index].duration = duration;
                
                if (!records[index].manualCost) {
                    const result = calculateCost(duration, records[index].billingSettings.method);
                    records[index].cost = result.cost;
                    records[index].calculation = result.calculation;
                    renderRecords();
                }
                updateTotals();
            });
            durationCell.appendChild(durationInput);
            
            // 计费方式单元格
            const billingCell = document.createElement('td');
            const billingSelect = document.createElement('select');
            
            // 创建计费方式选项
            const option5start = document.createElement('option');
            option5start.value = '5start';
            option5start.textContent = '5元起步';
            
            const option6start = document.createElement('option');
            option6start.value = '6start';
            option6start.textContent = '6元起步';
            
            const option5permin = document.createElement('option');
            option5permin.value = '5permin';
            option5permin.textContent = '5元续费';
            
            const option6permin = document.createElement('option');
            option6permin.value = '6permin';
            option6permin.textContent = '6元续费';
            
            const customOption = document.createElement('option');
            customOption.value = 'custom';
            customOption.textContent = '自定义计费';
            
            billingSelect.appendChild(option5start);
            billingSelect.appendChild(option6start);
            billingSelect.appendChild(option5permin);
            billingSelect.appendChild(option6permin);
            billingSelect.appendChild(customOption);
            
            // 设置当前值
            billingSelect.value = record.billingSettings.method;
            
            // 自定义计费字段容器
            const customFieldsContainer = document.createElement('div');
            customFieldsContainer.className = 'custom-billing-fields';
            
            const firstMinuteInput = document.createElement('input');
            firstMinuteInput.type = 'number';
            firstMinuteInput.min = '0';
            firstMinuteInput.placeholder = '首分钟费用';
            firstMinuteInput.value = record.billingSettings.firstMinute || 5;
            firstMinuteInput.step = '0.01';
            
            const additionalMinuteInput = document.createElement('input');
            additionalMinuteInput.type = 'number';
            additionalMinuteInput.min = '0';
            additionalMinuteInput.placeholder = '后续每分钟';
            additionalMinuteInput.value = record.billingSettings.additionalMinute || 2;
            additionalMinuteInput.step = '0.01';
            
            if (record.billingSettings.method === 'custom') {
                customFieldsContainer.appendChild(firstMinuteInput);
                customFieldsContainer.appendChild(additionalMinuteInput);
            }
            
            billingSelect.addEventListener('change', function() {
                if (this.value === 'custom') {
                    customFieldsContainer.innerHTML = '';
                    customFieldsContainer.appendChild(firstMinuteInput);
                    customFieldsContainer.appendChild(additionalMinuteInput);
                    
                    records[index].billingSettings = {
                        method: 'custom',
                        firstMinute: parseFloat(firstMinuteInput.value) || 5,
                        additionalMinute: parseFloat(additionalMinuteInput.value) || 2
                    };
                } else {
                    customFieldsContainer.innerHTML = '';
                    records[index].billingSettings = {
                        method: this.value
                    };
                }
                
                if (!records[index].manualCost) {
                    const result = calculateCost(
                        records[index].duration,
                        records[index].billingSettings.method
                    );
                    records[index].cost = result.cost;
                    records[index].calculation = result.calculation;
                    renderRecords();
                }
                updateTotals();
            });
            
            firstMinuteInput.addEventListener('change', function() {
                records[index].billingSettings.firstMinute = parseFloat(this.value) || 5;
                
                if (!records[index].manualCost) {
                    const result = calculateCost(
                        records[index].duration,
                        records[index].billingSettings.method,
                        records[index].billingSettings.firstMinute,
                        records[index].billingSettings.additionalMinute
                    );
                    records[index].cost = result.cost;
                    records[index].calculation = result.calculation;
                    renderRecords();
                }
                updateTotals();
            });
            
            additionalMinuteInput.addEventListener('change', function() {
                records[index].billingSettings.additionalMinute = parseFloat(this.value) || 2;
                
                if (!records[index].manualCost) {
                    const result = calculateCost(
                        records[index].duration,
                        records[index].billingSettings.method,
                        records[index].billingSettings.firstMinute,
                        records[index].billingSettings.additionalMinute
                    );
                    records[index].cost = result.cost;
                    records[index].calculation = result.calculation;
                    renderRecords();
                }
                updateTotals();
            });
            
            billingCell.appendChild(billingSelect);
            billingCell.appendChild(customFieldsContainer);
            
            // 费用单元格
            const costCell = document.createElement('td');
            const costContainer = document.createElement('div');
            costContainer.className = 'cost-container';
            
            const costInput = document.createElement('input');
            costInput.type = 'number';
            costInput.step = '0.01';
            costInput.min = '0';
            costInput.value = record.cost.toFixed(2);
            costInput.className = 'cost-input';
            
            costInput.addEventListener('change', (e) => {
                records[index].cost = parseFloat(e.target.value) || 0;
                records[index].manualCost = true;
                updateTotals();
            });
            
            costInput.addEventListener('dblclick', (e) => {
                if (confirm('切换为自动计算模式吗？')) {
                    const result = calculateCost(
                        records[index].duration,
                        records[index].billingSettings.method,
                        records[index].billingSettings.firstMinute,
                        records[index].billingSettings.additionalMinute
                    );
                    records[index].cost = result.cost;
                    records[index].calculation = result.calculation;
                    records[index].manualCost = false;
                    renderRecords();
                }
            });
            
            const calculationDiv = document.createElement('div');
            calculationDiv.className = 'calculation-text';
            calculationDiv.textContent = record.calculation || '';
            
            costContainer.appendChild(costInput);
            costContainer.appendChild(calculationDiv);
            costCell.appendChild(costContainer);
            
            // 图片单元格
            const imageCell = document.createElement('td');
            const imagePreviewsDiv = document.createElement('div');
            imagePreviewsDiv.className = 'image-previews';
            
            if (record.imageUrls && record.imageUrls.length > 0) {
                record.imageUrls.forEach((imageUrl, imgIndex) => {
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'image-preview';
                    
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.className = 'thumbnail';
                    img.addEventListener('click', () => {
                        modalImage.src = imageUrl;
                        imageModal.classList.remove('hidden');
                    });
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-image-btn';
                    removeBtn.innerHTML = '×';
                    removeBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        records[index].imageUrls.splice(imgIndex, 1);
                        renderRecords();
                    });
                    
                    previewDiv.appendChild(img);
                    previewDiv.appendChild(removeBtn);
                    imagePreviewsDiv.appendChild(previewDiv);
                });
            }
            
            const imageInput = document.createElement('input');
            imageInput.type = 'file';
            imageInput.accept = 'image/*';
            imageInput.multiple = true;
            imageInput.style.display = 'none';
            
            const addImageBtn = document.createElement('button');
            addImageBtn.textContent = '添加图片';
            addImageBtn.className = 'small-btn';
            addImageBtn.addEventListener('click', () => {
                imageInput.click();
            });
            
            imageInput.addEventListener('change', function(e) {
                const files = e.target.files;
                for (let i = 0; i < Math.min(files.length, 3 - (record.imageUrls ? record.imageUrls.length : 0)); i++) {
                    const file = files[i];
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        if (!record.imageUrls) {
                            record.imageUrls = [];
                        }
                        if (record.imageUrls.length < 3) {
                            record.imageUrls.push(e.target.result);
                            renderRecords();
                        }
                    };
                    
                    reader.readAsDataURL(file);
                }
            });
            
            imageCell.appendChild(imagePreviewsDiv);
            imageCell.appendChild(addImageBtn);
            imageCell.appendChild(imageInput);
            
            // 备注单元格
            const noteCell = document.createElement('td');
            const noteInput = document.createElement('input');
            noteInput.type = 'text';
            noteInput.className = 'note-input';
            noteInput.value = record.note || '';
            noteInput.addEventListener('change', (e) => {
                records[index].note = e.target.value;
            });
            noteCell.appendChild(noteInput);
            
            // 操作单元格
            const actionCell = document.createElement('td');
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '删除';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', () => {
                if (confirm('确定要删除这条记录吗？')) {
                    records.splice(index, 1);
                    renderRecords();
                    updateTotals();
                }
            });
            actionCell.appendChild(deleteBtn);
            
            // 组装行
            row.appendChild(indexCell);
            row.appendChild(dateCell);
            row.appendChild(durationCell);
            row.appendChild(billingCell);
            row.appendChild(costCell);
            row.appendChild(imageCell);
            row.appendChild(noteCell);
            row.appendChild(actionCell);
            
            recordsBody.insertBefore(row, addRow);
        });
        
        updateTotals();
    }
    
    // 添加新记录
    function addNewRecord() {
        const date = newCallDateInput.value;
        const duration = parseInt(newCallDurationInput.value);
        const billingMethod = newBillingMethodSelect.value;
        const note = newCallNoteInput.value;
        
        if (!date || isNaN(duration)) {
            alert('请填写完整的通话信息');
            return;
        }
        
        const result = calculateCost(duration, billingMethod);
        let billingSettings;
        
        if (billingMethod === 'custom') {
            const firstMinute = parseFloat(customFirstMinuteInput.value) || 0;
            const additionalMinute = parseFloat(customAdditionalMinuteInput.value) || 0;
            billingSettings = {
                method: 'custom',
                firstMinute,
                additionalMinute
            };
        } else {
            billingSettings = { method: billingMethod };
        }
        
        records.push({
            date,
            duration,
            cost: result.cost,
            billingSettings,
            imageUrls: [...imagePreviews],
            note,
            manualCost: false,
            calculation: result.calculation
        });
        
        // 重置表单
        newCallDurationInput.value = '';
        newCallCostInput.value = '';
        costCalculationDiv.textContent = '';
        newCallImageInput.value = '';
        newCallNoteInput.value = '';
        imagePreviews = [];
        imagePreviewsContainer.innerHTML = '';
        
        renderRecords();
        lastSelectedDate = date;
    }
    
    // 保存数据到JSON文件
    function saveDataToFile() {
        if (records.length === 0) {
            alert('没有数据可保存');
            return;
        }
        
        const dataStr = JSON.stringify(records, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const dataUrl = URL.createObjectURL(dataBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = dataUrl;
        downloadLink.download = 'phone_records_' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        setTimeout(() => {
            URL.revokeObjectURL(dataUrl);
        }, 100);
    }
    
    // 从文件加载数据
    function loadDataFromFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const loadedData = JSON.parse(e.target.result);
                if (Array.isArray(loadedData)) {
                    records = loadedData.map(record => ({
                        ...record,
                        manualCost: record.manualCost || false,
                        calculation: record.calculation || ''
                    }));
                    renderRecords();
                    alert('数据已从文件加载');
                } else {
                    alert('文件格式不正确');
                }
            } catch (error) {
                alert('读取文件失败: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
    
    // 导出为静态网页
    function exportAsWebpage() {
        if (records.length === 0) {
            alert('没有数据可导出');
            return;
        }

        const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>电话计费记录 - ${new Date().toLocaleDateString()}</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
        }
        body {
            background-color: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
            text-align: center;
            margin-bottom: 20px;
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        tfoot {
            font-weight: bold;
            background-color: #f2f2f2;
        }
        .thumbnail {
            max-width: 50px;
            max-height: 50px;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .thumbnail:hover {
            transform: scale(1.05);
        }
        .month-stat {
            margin-bottom: 10px;
            padding: 10px;
            background-color: #f2f2f2;
            border-radius: 4px;
        }
        .month-stat h3 {
            margin-bottom: 5px;
            color: #333;
        }
        .image-previews {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        
        /* 图片放大模态框样式 */
        .image-modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            overflow: auto;
            animation: fadeIn 0.3s;
        }
        @keyframes fadeIn {
            from {opacity: 0;}
            to {opacity: 1;}
        }
        .image-modal-content {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            padding: 20px;
        }
        .modal-image {
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            animation: zoomIn 0.3s;
        }
        @keyframes zoomIn {
            from {transform: scale(0.8);}
            to {transform: scale(1);}
        }
        .close-modal {
            position: absolute;
            top: 20px;
            right: 35px;
            color: #f1f1f1;
            font-size: 40px;
            font-weight: bold;
            transition: 0.3s;
            cursor: pointer;
        }
        .close-modal:hover {
            color: #bbb;
        }
        .prev, .next {
            cursor: pointer;
            position: absolute;
            top: 50%;
            width: auto;
            padding: 16px;
            margin-top: -22px;
            color: white;
            font-weight: bold;
            font-size: 20px;
            transition: 0.3s;
            user-select: none;
            background-color: rgba(0, 0, 0, 0.5);
            border-radius: 0 3px 3px 0;
        }
        .next {
            right: 0;
            border-radius: 3px 0 0 3px;
        }
        .prev:hover, .next:hover {
            background-color: rgba(0, 0, 0, 0.8);
        }
        .image-caption {
            text-align: center;
            color: #ccc;
            padding: 10px 0;
            position: absolute;
            bottom: 0;
            width: 100%;
            background-color: rgba(0, 0, 0, 0.7);
        }
        .thumbnail-container {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 10px;
        }
        .thumbnail-img {
            width: 80px;
            height: 80px;
            object-fit: cover;
            margin: 5px;
            cursor: pointer;
            opacity: 0.7;
            transition: 0.3s;
        }
        .thumbnail-img:hover {
            opacity: 1;
        }
        .active-thumbnail {
            opacity: 1;
            border: 2px solid #4CAF50;
        }
        .calculation-text {
            font-size: 12px;
            color: #666;
        }
        @media (max-width: 768px) {
            .modal-image {
                max-width: 100%;
                max-height: 80%;
            }
            .close-modal {
                top: 10px;
                right: 20px;
                font-size: 30px;
            }
            .prev, .next {
                padding: 10px;
                font-size: 18px;
            }
            .thumbnail-img {
                width: 60px;
                height: 60px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>电话计费记录 - ${new Date().toLocaleDateString()}</h1>
        
        <div class="records-table">
            <table>
                <thead>
                    <tr>
                        <th>序号</th>
                        <th>通话日期</th>
                        <th>通话时长(分钟)</th>
                        <th>计费方式</th>
                        <th>通话费用(元)</th>
                        <th>图片</th>
                        <th>备注</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map((record, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${record.date}</td>
                        <td>${record.duration}</td>
                        <td>${record.billingSettings.method === '5start' ? '5元起步' : 
                             record.billingSettings.method === '6start' ? '6元起步' :
                             record.billingSettings.method === '5permin' ? '5元续费' :
                             record.billingSettings.method === '6permin' ? '6元续费' :
                             `自定义(首${record.billingSettings.firstMinute}元, 后${record.billingSettings.additionalMinute}元/分钟)`}</td>
                        <td>
                            ${record.cost.toFixed(2)}
                            <div class="calculation-text">${record.calculation || ''}</div>
                        </td>
                        <td>
                            ${record.imageUrls && record.imageUrls.length > 0 ? 
                             `<div class="image-previews">
                                ${record.imageUrls.map(url => 
                                  `<img src="${url}" class="thumbnail" onclick="openImageModal('${url}', ${index})">`
                                ).join('')}
                              </div>` : '无'}
                        </td>
                        <td>${record.note || '-'}</td>
                    </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3">总计</td>
                        <td></td>
                        <td>${records.reduce((sum, record) => sum + record.cost, 0).toFixed(2)}</td>
                        <td colspan="2"></td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <div class="monthly-stats">
            <h2>月度统计</h2>
            ${(() => {
                const monthlyData = {};
                records.forEach(record => {
                    const date = new Date(record.date);
                    const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                    
                    if (!monthlyData[monthYear]) {
                        monthlyData[monthYear] = {
                            count: 0,
                            totalDuration: 0,
                            totalCost: 0
                        };
                    }
                    
                    monthlyData[monthYear].count++;
                    monthlyData[monthYear].totalDuration += record.duration;
                    monthlyData[monthYear].totalCost += record.cost;
                });
                
                return Object.entries(monthlyData).map(([monthYear, data]) => `
                    <div class="month-stat">
                        <h3>${monthYear}</h3>
                        <p>通话次数: ${data.count}</p>
                        <p>总通话时长: ${data.totalDuration} 分钟</p>
                        <p>总通话费用: ${data.totalCost.toFixed(2)} 元</p>
                        <p>平均每次通话费用: ${(data.totalCost / data.count).toFixed(2)} 元</p>
                    </div>
                `).join('');
            })()}
        </div>
        
        <!-- 图片模态框 -->
        <div id="imageModal" class="image-modal">
            <span class="close-modal" onclick="closeImageModal()">&times;</span>
            <div class="image-modal-content">
                <img id="modalImage" class="modal-image">
                <div class="image-caption"></div>
            </div>
            <a class="prev" onclick="changeImage(-1)">&#10094;</a>
            <a class="next" onclick="changeImage(1)">&#10095;</a>
            <div class="thumbnail-container" id="thumbnailContainer"></div>
        </div>
    </div>
    
    <script>
        let currentImageIndex = 0;
        let allImages = [];
        
        // 打开图片模态框
        function openImageModal(imgSrc, index) {
            currentImageIndex = index;
            allImages = Array.from(document.querySelectorAll('.thumbnail')).map(img => img.src);
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            modalImg.src = imgSrc;
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            updateThumbnails();
        }
        
        // 关闭图片模态框
        function closeImageModal() {
            document.getElementById('imageModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // 切换图片
        function changeImage(step) {
            currentImageIndex = (currentImageIndex + step + allImages.length) % allImages.length;
            document.getElementById('modalImage').src = allImages[currentImageIndex];
            updateThumbnails();
        }
        
        // 更新缩略图
        function updateThumbnails() {
            const container = document.getElementById('thumbnailContainer');
            container.innerHTML = '';
            
            allImages.forEach((img, index) => {
                const thumb = document.createElement('img');
                thumb.src = img;
                thumb.className = \`thumbnail-img \${index === currentImageIndex ? 'active-thumbnail' : ''}\`;
                thumb.onclick = () => {
                    currentImageIndex = index;
                    document.getElementById('modalImage').src = img;
                    updateThumbnails();
                };
                container.appendChild(thumb);
            });
        }
        
        // 点击模态框外部关闭
        window.onclick = function(event) {
            const modal = document.getElementById('imageModal');
            if (event.target === modal) {
                closeImageModal();
            }
        };
        
        // 键盘导航
        document.onkeydown = function(e) {
            const modal = document.getElementById('imageModal');
            if (modal.style.display === 'block') {
                e = e || window.event;
                if (e.keyCode === 37) { // 左箭头
                    changeImage(-1);
                } else if (e.keyCode === 39) { // 右箭头
                    changeImage(1);
                } else if (e.keyCode === 27) { // ESC键
                    closeImageModal();
                }
            }
        };
    </script>
</body>
</html>
        `;

        // 创建下载链接
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `电话计费记录_${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // 显示月度报表
    function showMonthlyReport() {
        if (records.length === 0) {
            alert('没有记录可生成报表');
            return;
        }
        
        const monthlyData = {};
        
        records.forEach(record => {
            const date = new Date(record.date);
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = {
                    count: 0,
                    totalDuration: 0,
                    totalCost: 0
                };
            }
            
            monthlyData[monthYear].count++;
            monthlyData[monthYear].totalDuration += record.duration;
            monthlyData[monthYear].totalCost += record.cost;
        });
        
        let reportHTML = '';
        
        for (const [monthYear, data] of Object.entries(monthlyData)) {
            reportHTML += `
                <div class="month-stat">
                    <h3>${monthYear}</h3>
                    <p>通话次数: ${data.count}</p>
                    <p>总通话时长: ${data.totalDuration} 分钟</p>
                    <p>总通话费用: ${data.totalCost.toFixed(2)} 元</p>
                    <p>平均每次通话费用: ${(data.totalCost / data.count).toFixed(2)} 元</p>
                </div>
            `;
        }
        
        monthlyStats.innerHTML = reportHTML;
        monthlyModal.classList.remove('hidden');
    }
    
    // 事件监听器
    saveDataBtn.addEventListener('click', saveDataToFile);
    loadDataBtn.addEventListener('click', () => loadDataInput.click());
    loadDataInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            loadDataFromFile(e.target.files[0]);
        }
    });
    monthlyReportBtn.addEventListener('click', showMonthlyReport);
    exportWebpageBtn.addEventListener('click', exportAsWebpage);
    addNewRecordBtn.addEventListener('click', addNewRecord);
    
    // 计费方式变化监听
    newBillingMethodSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customBillingFields.classList.remove('hidden');
        } else {
            customBillingFields.classList.add('hidden');
        }
        updateCostCalculation();
    });
    
    // 输入变化监听
    newCallDurationInput.addEventListener('input', updateCostCalculation);
    customFirstMinuteInput.addEventListener('input', updateCostCalculation);
    customAdditionalMinuteInput.addEventListener('input', updateCostCalculation);
    newCallImageInput.addEventListener('change', handleImageUpload);
    
    // 粘贴区域事件监听
    pasteArea.addEventListener('paste', handlePaste);
    pasteArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        pasteArea.classList.add('paste-active');
    });
    pasteArea.addEventListener('dragleave', () => {
        pasteArea.classList.remove('paste-active');
    });
    pasteArea.addEventListener('drop', (e) => {
        e.preventDefault();
        pasteArea.classList.remove('paste-active');
    });
    pasteArea.addEventListener('click', () => {
        newCallImageInput.click();
    });
    
    // 全局粘贴事件
    document.addEventListener('paste', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                handlePaste(e);
                break;
            }
        }
    });
    
    // 关闭模态框
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').classList.add('hidden');
        });
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.add('hidden');
        }
    });
    
    // 初始化
    initDateInput();
    renderRecords();
});