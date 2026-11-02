// ==========================================
// 1. คลังข้อมูลเริ่มต้น (Initial Data State)
// ==========================================
let staffList = [
  "นาย ธีระภัทร ทรัพย์ทับมา",
  "นาย วัชรพล แสงทับทิม",
  "นาย เกียรติอนันต์ ซอนิมิตรเกิดลาภ",
  "นาย สหัสวรรษ ลิ้มสุวรรณมณี",
  "นาย ชัยมงคล จับจิตร์",
  "นาย อภิเทพ หงษ์ทอง",
  "นาย เกรียงไกร บุญเรือง",
  "นาย ธีรพงษ์  วงค์อ้าย",
  "นาย ชัชชานนท์ บุญอาจ",
  "นาย ศิริศักดิ์  จิตต์ประสาท",
  "นาย ศิวณัฐ    จิตต์ประสาท"
];

let tasks = [
  "ทำ Floor Plan จำนวนโคมไฟ งาน F14",
  "สำรวจหน้างานและปิดเคส CM",
  "เข้าสำรวจหน้างาน CB Trip อาคารบำบัดน้ำเสีย"
];

// โหลดประวัติการทำงานจาก LocalStorage ของเครื่อง
let otHistory = JSON.parse(localStorage.getItem('otHistoryRecords')) || [];
let yearlyChart = null;

// ==========================================
// 2. ฟังก์ชันเริ่มต้นทำงานเมื่อโหลดหน้าเว็บ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  document.getElementById('workDate').value = today.toISOString().split('T')[0];
  document.getElementById('filterMonth').value = today.toISOString().slice(0, 7);

  // 💡 โหลดค่าเวลาล่าสุดที่ผู้ใช้เคยกรอกไว้ (ถ้ามี) ถ้าไม่มีให้ใช้ค่าเริ่มต้น 00:00
  const savedStartTime = localStorage.getItem('lastStartTime');
  const savedEndTime = localStorage.getItem('lastEndTime');

  if (savedStartTime) {
    document.getElementById('startTime').value = savedStartTime;
  } else {
    document.getElementById('startTime').value = "00:00";
  }

  if (savedEndTime) {
    document.getElementById('endTime').value = savedEndTime;
  } else {
    document.getElementById('endTime').value = "00:00";
  }

  renderTasks();
  renderStaffCheckboxes();
  calculateTime();
  
  renderHistory();
  updateMonthlySummary();
  initYearlyChart();

  // ผูกเหตุการณ์ (Event Listeners) กับช่องเวลาเพื่อให้บันทึกค่าอัตโนมัติทันทีที่เปลี่ยน
  document.getElementById('startTime').addEventListener('change', (e) => {
    localStorage.setItem('lastStartTime', e.target.value);
    calculateTime();
  });

  document.getElementById('endTime').addEventListener('change', (e) => {
    localStorage.setItem('lastEndTime', e.target.value);
    calculateTime();
  });

  document.getElementById('addTaskBtn').addEventListener('click', addNewTaskField);
  document.getElementById('addNewStaffBtn').addEventListener('click', addNewStaffPrompt);
  document.getElementById('generateTextBtn').addEventListener('click', generateOutputText);
  document.getElementById('saveRecordBtn').addEventListener('click', saveOTRecord);
  document.getElementById('copyTextBtn').addEventListener('click', copyToClipboard);
  document.getElementById('filterMonth').addEventListener('change', updateMonthlySummary);
  document.getElementById('printHistoryBtn').addEventListener('click', printActiveText);
  document.getElementById('resetFormBtn').addEventListener('click', resetFormInputs);
});

// ==========================================
// 3. ฟังก์ชันคำนวณเวลาและโอที (Time Calculation)
// ==========================================
function calculateTime() {
  const startVal = document.getElementById('startTime').value;
  const endVal = document.getElementById('endTime').value;

  if (!startVal || !endVal) return;

  const [startH, startM] = startVal.split(':').map(Number);
  const [endH, endM] = endVal.split(':').map(Number);

  let startTotalMins = startH * 60 + startM;
  let endTotalMins = endH * 60 + endM;

  if (endTotalMins < startTotalMins) {
    endTotalMins += 24 * 60;
  }

  const totalMins = endTotalMins - startTotalMins;
  const normalLimitMins = 9 * 60; // 9 ชั่วโมงรวมพัก 1 ชั่วโมง

  let normalEndTotal = startTotalMins + normalLimitMins;
  let normalEndH = Math.floor((normalEndTotal % (24 * 60)) / 60);
  let normalEndM = normalEndTotal % 60;
  let normalEndTimeStr = `${String(normalEndH).padStart(2, '0')}:${String(normalEndM).padStart(2, '0')}`;

  let normalMins = 0;
  let otMins = 0;
  let otStartTimeStr = "";

  if (totalMins > normalLimitMins) {
    normalMins = normalLimitMins;
    otMins = totalMins - normalLimitMins;
    otStartTimeStr = normalEndTimeStr;
  } else {
    normalMins = totalMins;
    otMins = 0;
  }

  const otHDisplay = Math.floor(otMins / 60);
  const otMDisplay = otMins % 60;
  let otTextDisplay = `${otHDisplay} ชั่วโมง`;
  if (otMDisplay > 0) otTextDisplay += ` ${otMDisplay} นาที`;

  const summaryBox = document.getElementById('timeSummaryBox');
  summaryBox.innerHTML = `
    <strong>🕑 เวลาเริ่มงาน :</strong> ${startVal}-${normalEndTimeStr} น.<br>
    <strong>📌 รวม :</strong> 9 ชม. (รวมพัก 1 ชั่วโมง)<br>
    ${otMins > 0 ? `
      <strong>เวลาเริ่มโอที :</strong> ${otStartTimeStr}-${endVal} น.<br>
      <strong>📌 รวม :</strong> ${otTextDisplay}
    ` : '<em>ไม่มีชั่วโมงโอที (ทำงานไม่เกิน 9 ชั่วโมง)</em>'}
  `;

  summaryBox.dataset.otMins = otMins;
  summaryBox.dataset.otText = otTextDisplay;
  summaryBox.dataset.otStartStr = otStartTimeStr;
  summaryBox.dataset.normalEndTime = normalEndTimeStr;
}

// ==========================================
// 4. ฟังก์ชันรีเซ็ตข้อมูลฟอร์ม
// ==========================================
function resetFormInputs() {
  if (confirm("คุณต้องการล้างข้อมูลในฟอร์มทั้งหมดให้ว่างใช่หรือไม่?")) {
    const today = new Date();
    document.getElementById('workDate').value = today.toISOString().split('T')[0];

    // รีเซ็ตเวลาเป็น 00:00 และล้างค่าความจำใน LocalStorage ของเวลาด้วย
    document.getElementById('startTime').value = "00:00";
    document.getElementById('endTime').value = "00:00";
    localStorage.removeItem('lastStartTime');
    localStorage.removeItem('lastEndTime');

    document.getElementById('projectName').value = "";
    document.getElementById('locationName').value = "";
    document.getElementById('obstacleText').value = "-";

    tasks = [""];
    renderTasks();

    document.querySelectorAll('.staff-check').forEach(cb => cb.checked = false);
    document.getElementById('outputResult').value = "";

    calculateTime();

    alert("🔄 รีเซ็ตข้อมูลฟอร์มเรียบร้อยแล้ว!");
  }
}

// ==========================================
// 5. ฟังก์ชันจัดการรายการงาน (Tasks)
// ==========================================
function renderTasks() {
  const container = document.getElementById('taskList');
  container.innerHTML = '';

  tasks.forEach((task, index) => {
    const div = document.createElement('div');
    div.className = 'task-item-row';
    div.innerHTML = `
      <input type="text" class="mac-input" value="${task}" onchange="tasks[${index}]=this.value">
      <button type="button" class="btn btn-danger" onclick="removeTask(${index})">✕</button>
    `;
    container.appendChild(div);
  });
}

function addNewTaskField() {
  tasks.push('');
  renderTasks();
}

function removeTask(index) {
  tasks.splice(index, 1);
  renderTasks();
}

// ==========================================
// 6. ฟังก์ชันจัดการรายชื่อพนักงาน (Staff)
// ==========================================
function renderStaffCheckboxes() {
  const container = document.getElementById('staffCheckboxContainer');
  container.innerHTML = '';

  staffList.forEach((name, idx) => {
    const label = document.createElement('label');
    label.className = 'staff-checkbox-item';
    const isChecked = idx < 3 ? 'checked' : '';
    label.innerHTML = `
      <input type="checkbox" value="${name}" class="staff-check" ${isChecked}>
      <span>${name}</span>
    `;
    container.appendChild(label);
  });
}

function addNewStaffPrompt() {
  const newName = prompt("กรุณากรอกชื่อ-นามสกุล พนักงานใหม่:");
  if (newName && newName.trim() !== "") {
    staffList.push(newName.trim());
    renderStaffCheckboxes();
  }
}

// ==========================================
// 7. ฟังก์ชันแปลงวันที่เป็นภาษาไทย
// ==========================================
function formatThaiDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const dayNames = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
  const dayName = dayNames[d.getDay()];
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear() + 543;
  return `${dayName} ที่ ${day}/${month}/${year}`;
}

// ==========================================
// 8. ฟังก์ชันสร้างข้อความขออนุมัติ OT
// ==========================================
function generateOutputText() {
  const rawDate = document.getElementById('workDate').value;
  const project = document.getElementById('projectName').value;
  const location = document.getElementById('locationName').value;
  const startVal = document.getElementById('startTime').value;
  const endVal = document.getElementById('endTime').value;
  const obstacle = document.getElementById('obstacleText').value;

  const summaryBox = document.getElementById('timeSummaryBox');
  const otMins = Number(summaryBox.dataset.otMins || 0);
  const otText = summaryBox.dataset.otText || '';
  const otStartStr = summaryBox.dataset.otStartStr || '';
  const normalEndTimeStr = summaryBox.dataset.normalEndTime || '16:00';

  const selectedStaff = Array.from(document.querySelectorAll('.staff-check:checked')).map(cb => cb.value);

  let taskTextLines = tasks.filter(t => t.trim() !== '').map((t, i) => `${i + 1}. ${t}`);
  taskTextLines.push(`${taskTextLines.length + 1}. เดินทางกลับ Office`);

  let staffTextLines = selectedStaff.map((s, i) => `${i + 1}. ${s}`);

  let result = `ขออนุมัติโอที
****${formatThaiDate(rawDate)}****
โครงการ : ${project}
สถานที่ : ${location}
🕑เวลาเริ่มงาน : ${startVal}-${normalEndTimeStr} น.
📌รวม 9 ชม. (รวมพัก 1 ชั่วโมง)`;

  if (otMins > 0) {
    result += `\nเวลาเริ่มโอที : ${otStartStr}-${endVal} น.
📌รวม ${otText}`;
  }

  result += `\n——————————————
📝 รายละเอียดงาน :
${taskTextLines.join('\n')}

‼️ปัญหาและอุปสรรค : ${obstacle}
———————————————
👷‍♂️ชื่อผู้ปฏิบัติงาน จำนวน ${selectedStaff.length} คน
${staffTextLines.join('\n')}
@`;

  document.getElementById('outputResult').value = result;
  return result;
}

// ==========================================
// 9. ฟังก์ชันคัดลอกข้อความ
// ==========================================
function copyToClipboard() {
  const txtArea = document.getElementById('outputResult');
  if (!txtArea.value) generateOutputText();

  txtArea.select();
  navigator.clipboard.writeText(txtArea.value).then(() => {
    alert('📋 คัดลอกข้อความเรียบร้อยแล้ว!');
  });
}

// ==========================================
// 10. ฟังก์ชันบันทึกประวัติลง LocalStorage
// ==========================================
function saveOTRecord() {
  const rawDate = document.getElementById('workDate').value;
  const summaryBox = document.getElementById('timeSummaryBox');
  const otMins = Number(summaryBox.dataset.otMins || 0);
  const fullText = generateOutputText();

  if (!rawDate) {
    alert('กรุณาเลือกวันที่ปฏิบัติงาน');
    return;
  }

  const newRecord = {
    id: Date.now(),
    date: rawDate,
    project: document.getElementById('projectName').value,
    otMins: otMins,
    fullText: fullText
  };

  otHistory.unshift(newRecord);
  localStorage.setItem('otHistoryRecords', JSON.stringify(otHistory));

  alert('💾 บันทึกประวัติลงเครื่องเรียบร้อยแล้ว!');
  renderHistory();
  updateMonthlySummary();
  initYearlyChart();
}

// ==========================================
// 11. ฟังก์ชันแสดงประวัติย้อนหลัง & ระบบ Drag & Drop
// ==========================================
function renderHistory() {
  const container = document.getElementById('historyListContainer');
  container.innerHTML = '';

  if (otHistory.length === 0) {
    container.innerHTML = '<p style="color:#888; text-align:center;">ยังไม่มีประวัติการบันทึกโอที</p>';
    return;
  }

  otHistory.forEach((rec, index) => {
    const otH = Math.floor(rec.otMins / 60);
    const otM = rec.otMins % 60;
    
    const div = document.createElement('div');
    div.className = 'history-item';
    div.setAttribute('draggable', 'true');
    div.dataset.index = index;

    div.innerHTML = `
      <div class="history-left">
        <span class="drag-handle" title="คลิกค้างเพื่อลากสลับตำแหน่ง">☰</span>
        <div class="reorder-btns">
          <button onclick="moveHistory(${index}, -1)" title="เลื่อนขึ้น">▲</button>
          <button onclick="moveHistory(${index}, 1)" title="เลื่อนลง">▼</button>
        </div>
        <div class="history-info">
          <h4>${formatThaiDate(rec.date)} (${rec.project})</h4>
          <p>⏱️ OT: ${otH} ชั่วโมง ${otM} นาที</p>
        </div>
      </div>
      <div class="history-actions">
        <button class="btn btn-secondary btn-sm" onclick="loadHistoryToText('${rec.id}')">ดูข้อความ</button>
        <button class="btn btn-warning btn-sm" onclick="editHistory('${rec.id}')">✏️ แก้ไข</button>
        <button class="btn btn-danger btn-sm" onclick="deleteHistory('${rec.id}')">ลบ</button>
      </div>
    `;

    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleDrop);
    div.addEventListener('dragend', handleDragEnd);

    container.appendChild(div);
  });
}

let draggedIndex = null;

function handleDragStart(e) {
  draggedIndex = Number(this.dataset.index);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
  e.preventDefault();
  const targetIndex = Number(this.dataset.index);

  if (draggedIndex !== null && draggedIndex !== targetIndex) {
    const movedItem = otHistory.splice(draggedIndex, 1)[0];
    otHistory.splice(targetIndex, 0, movedItem);
    localStorage.setItem('otHistoryRecords', JSON.stringify(otHistory));
    renderHistory();
  }
}

function handleDragEnd() {
  this.classList.remove('dragging');
  draggedIndex = null;
}

// ==========================================
// 12. ฟังก์ชันสลับลำดับประวัติ
// ==========================================
function moveHistory(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= otHistory.length) return;

  const item = otHistory.splice(index, 1)[0];
  otHistory.splice(newIndex, 0, item);
  
  localStorage.setItem('otHistoryRecords', JSON.stringify(otHistory));
  renderHistory();
}

// ==========================================
// 13. ฟังก์ชันโหลดข้อความเก่ามาดู
// ==========================================
function loadHistoryToText(id) {
  const rec = otHistory.find(r => r.id == id);
  if (rec) {
    document.getElementById('outputResult').value = rec.fullText;
    window.scrollTo({ top: document.getElementById('outputResult').offsetTop - 100, behavior: 'smooth' });
  }
}

// ==========================================
// 14. ฟังก์ชันแก้ไขประวัติย้อนหลัง
// ==========================================
function editHistory(id) {
  const rec = otHistory.find(r => r.id == id);
  if (!rec) return;

  const updatedText = prompt("แก้ไขข้อความขออนุมัติ OT:", rec.fullText);
  if (updatedText !== null) {
    rec.fullText = updatedText;
    localStorage.setItem('otHistoryRecords', JSON.stringify(otHistory));
    renderHistory();
    alert('✏️ แก้ไขข้อมูลเรียบร้อยแล้ว!');
  }
}

// ==========================================
// 15. ฟังก์ชันลบประวัติย้อนหลัง
// ==========================================
function deleteHistory(id) {
  if (confirm('คุณต้องการลบประวัตินี้ใช่หรือไม่?')) {
    otHistory = otHistory.filter(r => r.id != id);
    localStorage.setItem('otHistoryRecords', JSON.stringify(otHistory));
    renderHistory();
    updateMonthlySummary();
    initYearlyChart();
  }
}

// ==========================================
// 16. ฟังก์ชันพิมพ์รายงาน (Print)
// ==========================================
function printActiveText() {
  let textToPrint = document.getElementById('outputResult').value;
  if (!textToPrint && otHistory.length > 0) {
    textToPrint = otHistory[0].fullText;
  }

  if (!textToPrint) {
    alert('ยังไม่มีข้อมูลสำหรับพิมพ์ กรุณาสรุปข้อความก่อน');
    return;
  }

  document.getElementById('printArea').innerText = textToPrint;
  window.print();
}

// ==========================================
// 17. ฟังก์ชันสรุปสถิติ OT รายเดือน
// ==========================================
function updateMonthlySummary() {
  const selectedMonth = document.getElementById('filterMonth').value;
  if (!selectedMonth) return;

  const monthlyRecords = otHistory.filter(r => r.date && r.date.startsWith(selectedMonth));
  const totalMins = monthlyRecords.reduce((sum, r) => sum + r.otMins, 0);

  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  document.getElementById('monthlyOtTotal').innerText = `${h} ชั่วโมง ${m} นาที`;
}

// ==========================================
// 18. ฟังก์ชันวาดกราฟเส้นสรุป OT รายปี
// ==========================================
function initYearlyChart() {
  const ctx = document.getElementById('yearlyOtChart').getContext('2d');
  const currentYear = new Date().getFullYear();

  const monthlyData = new Array(12).fill(0);

  otHistory.forEach(rec => {
    if (rec.date) {
      const d = new Date(rec.date);
      if (d.getFullYear() === currentYear) {
        const monthIdx = d.getMonth();
        monthlyData[monthIdx] += (rec.otMins / 60);
      }
    }
  });

  if (yearlyChart) yearlyChart.destroy();

  yearlyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
      datasets: [{
        label: `ชั่วโมง OT รวมปี ${currentYear} (ชั่วโมง)`,
        data: monthlyData,
        borderColor: '#0071e3',
        backgroundColor: 'rgba(0, 113, 227, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#0071e3'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: { family: 'Noto Sans Thai' } } }
      },
      scales: {
        x: { ticks: { font: { family: 'Noto Sans Thai' } } },
        y: { beginAtZero: true, title: { display: true, text: 'ชั่วโมง' } }
      }
    }
  });
}