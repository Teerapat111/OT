// ==========================================
// 1. คลังข้อมูลเริ่มต้น (Initial Data State)
// ==========================================
let staffList = [
  "นาย ธีระภัทร ทรัพย์ทับมา",
  "นาย วัชรพล แสงทับทิม",
  "นาย เกียรติอนันต์ ซอนิมิตรเกิดลาภ",
  "นาย นาย สหัสวรรษ ลิ้มสุวรรณมณี",
  "นาย อภิเทพ หงษ์ทอง",
  "นาย เกรียงไกร บุญเรือง",
  "นาย ธีรพงษ์  วงค์อ้าย",
  "นาย ชัชชานนท์ บุญอาจ",
  "นาย ศิริศักดิ์  จิตต์ประสาท",
  "นาย ศิวณัฐ    จิตต์ประสาท",
  "นาย ชัยมงคล จับจิตร์"
];

// โหลดรายละเอียดงานล่าสุดจากหน่วยความจำเครื่อง (ถ้าไม่มีให้เริ่มต้นด้วยค่าว่างเปล่า 1 บรรทัด)
let tasks = JSON.parse(localStorage.getItem('lastTasks')) || [""];

// โหลดประวัติการทำงานย้อนหลังทั้งหมดจาก LocalStorage
let otHistory = JSON.parse(localStorage.getItem('otHistoryRecords')) || [];
let yearlyChart = null;

// ==========================================
// 2. ฟังก์ชันเริ่มต้นทำงานเมื่อโหลดหน้าเว็บ (DOM Content Loaded)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  document.getElementById('workDate').value = today.toISOString().split('T')[0];
  document.getElementById('filterMonth').value = today.toISOString().slice(0, 7);

  // โหลดค่าชื่อโครงการล่าสุด (ถ้าไม่มีในเครื่อง ให้เป็นค่าว่างเปล่า "")
  const savedProject = localStorage.getItem('lastProjectName');
  document.getElementById('projectName').value = savedProject !== null ? savedProject : "";

  // โหลดค่าสถานที่ปฏิบัติงานล่าสุด (ถ้าไม่มีในเครื่อง ให้เป็นค่าว่างเปล่า "")
  const savedLocation = localStorage.getItem('lastLocationName');
  document.getElementById('locationName').value = savedLocation !== null ? savedLocation : "";

  // โหลดค่าปัญหาและอุปสรรคล่าสุด (ถ้าไม่มีให้เป็น "-")
  const savedObstacle = localStorage.getItem('lastObstacleText');
  document.getElementById('obstacleText').value = savedObstacle !== null ? savedObstacle : "-";

  // โหลดเวลาเริ่มงานล่าสุด (ถ้าไม่มีให้เป็น 00:00)
  const savedStartTime = localStorage.getItem('lastStartTime');
  document.getElementById('startTime').value = savedStartTime ? savedStartTime : "00:00";

  // โหลดเวลาเลิกงานล่าสุด (ถ้าไม่มีให้เป็น 00:00)
  const savedEndTime = localStorage.getItem('lastEndTime');
  document.getElementById('endTime').value = savedEndTime ? savedEndTime : "00:00";

  // แสดงผลตารางงาน รายชื่อพนักงาน และคำนวณเวลาเริ่มต้น
  renderTasks();
  renderStaffCheckboxes();
  calculateTime();
  
  renderHistory();
  updateMonthlySummary();
  initYearlyChart();

  // ผูกเหตุการณ์บันทึกข้อมูลชื่อโครงการอัตโนมัติทันทีที่พิมพ์
  document.getElementById('projectName').addEventListener('input', (e) => {
    localStorage.setItem('lastProjectName', e.target.value);
  });

  // ผูกเหตุการณ์บันทึกสถานที่ปฏิบัติงานอัตโนมัติเมื่อพิมพ์
  document.getElementById('locationName').addEventListener('input', (e) => {
    localStorage.setItem('lastLocationName', e.target.value);
  });

  // ผูกเหตุการณ์บันทึกปัญหาและอุปสรรคอัตโนมัติเมื่อพิมพ์
  document.getElementById('obstacleText').addEventListener('input', (e) => {
    localStorage.setItem('lastObstacleText', e.target.value);
  });

  // ผูกเหตุการณ์บันทึกเวลาเริ่มงานอัตโนมัติเมื่อมีการเปลี่ยนแปลง
  document.getElementById('startTime').addEventListener('change', (e) => {
    localStorage.setItem('lastStartTime', e.target.value);
    calculateTime();
  });

  // ผูกเหตุการณ์บันทึกเวลาเลิกงานอัตโนมัติเมื่อมีการเปลี่ยนแปลง
  document.getElementById('endTime').addEventListener('change', (e) => {
    localStorage.setItem('lastEndTime', e.target.value);
    calculateTime();
  });

  // ผูกฟังก์ชันปุ่มกดต่างๆ ภายในฟอร์ม
  document.getElementById('addTaskBtn').addEventListener('click', addNewTaskField);
  document.getElementById('refreshTaskBtn').addEventListener('click', refreshTasksData);
  document.getElementById('refreshStaffBtn').addEventListener('click', refreshStaffData);
  document.getElementById('addNewStaffBtn').addEventListener('click', addNewStaffPrompt);
  document.getElementById('generateTextBtn').addEventListener('click', generateOutputText);
  document.getElementById('saveRecordBtn').addEventListener('click', saveOTRecord);
  document.getElementById('copyTextBtn').addEventListener('click', copyToClipboard);
  document.getElementById('filterMonth').addEventListener('change', updateMonthlySummary);
  document.getElementById('resetFormBtn').addEventListener('click', resetFormInputs);
});

// ==========================================
// 3. ฟังก์ชันคำนวณเวลาและชั่วโมงโอที (Time & OT Calculation)
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
  const normalLimitMins = 9 * 60; // กำหนดเวลาทำงานปกติ 9 ชั่วโมงรวมพัก 1 ชั่วโมง

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
// 4. ฟังก์ชันรีเซ็ตข้อมูลฟอร์มทั้งหมด (Reset Form)
// ==========================================
function resetFormInputs() {
  if (confirm("คุณต้องการล้างข้อมูลในฟอร์มทั้งหมดให้ว่างใช่หรือไม่?")) {
    const today = new Date();
    document.getElementById('workDate').value = today.toISOString().split('T')[0];

    // ล้างค่าในช่องกรอกให้เป็นค่าว่างทั้งหมด
    document.getElementById('startTime').value = "00:00";
    document.getElementById('endTime').value = "00:00";
    document.getElementById('projectName').value = "";
    document.getElementById('locationName').value = "";
    document.getElementById('obstacleText').value = "-";

    // ล้างค่าความจำใน LocalStorage ทั้งหมด
    localStorage.removeItem('lastStartTime');
    localStorage.removeItem('lastEndTime');
    localStorage.removeItem('lastProjectName');
    localStorage.removeItem('lastLocationName');
    localStorage.removeItem('lastObstacleText');
    localStorage.removeItem('lastTasks');
    localStorage.removeItem('lastSelectedStaff');

    tasks = [""];
    renderTasks();

    // เอาติ๊กถูกรายชื่อพนักงานออกทั้งหมด
    document.querySelectorAll('.staff-check').forEach(cb => cb.checked = false);
    document.getElementById('outputResult').value = "";

    calculateTime();

    alert("🔄 รีเซ็ตข้อมูลฟอร์มเรียบร้อยแล้ว!");
  }
}

// ==========================================
// 5. ฟังก์ชันจัดการรายการงาน (Tasks & Refresh Tasks)
// ==========================================
function renderTasks() {
  const container = document.getElementById('taskList');
  container.innerHTML = '';

  tasks.forEach((task, index) => {
    const div = document.createElement('div');
    div.className = 'task-item-row';
    div.innerHTML = `
      <input type="text" class="mac-input" value="${task}" placeholder="กรอกรายละเอียดงาน..." oninput="updateTaskValue(${index}, this.value)">
      <button type="button" class="btn btn-danger" onclick="removeTask(${index})">✕</button>
    `;
    container.appendChild(div);
  });
}

function updateTaskValue(index, value) {
  tasks[index] = value;
  localStorage.setItem('lastTasks', JSON.stringify(tasks));
}

function addNewTaskField() {
  tasks.push('');
  renderTasks();
  localStorage.setItem('lastTasks', JSON.stringify(tasks));
}

function removeTask(index) {
  tasks.splice(index, 1);
  if (tasks.length === 0) tasks = [""];
  renderTasks();
  localStorage.setItem('lastTasks', JSON.stringify(tasks));
}

// ปุ่มรีเฟรชเฉพาะช่องรายละเอียดงาน (เคลียร์ให้เป็นค่าว่าง)
function refreshTasksData() {
  tasks = [""];
  localStorage.setItem('lastTasks', JSON.stringify(tasks));
  renderTasks();
  alert("🔄 รีเซ็ตช่องรายละเอียดงานให้ว่างเปล่าเรียบร้อยแล้ว!");
}

// ==========================================
// 6. ฟังก์ชันจัดการรายชื่อพนักงาน (Staff Checkboxes & Refresh Staff)
// ==========================================
function renderStaffCheckboxes() {
  const container = document.getElementById('staffCheckboxContainer');
  container.innerHTML = '';

  let savedSelectedStaff = JSON.parse(localStorage.getItem('lastSelectedStaff'));

  staffList.forEach((name, idx) => {
    const label = document.createElement('label');
    label.className = 'staff-checkbox-item';
    
    let isChecked = false;
    // ถ้ามีข้อมูลในเครื่องให้เช็คตามนั้น ถ้าไม่มีให้เป็น false (ไม่ติ๊กใครเลย)
    if (savedSelectedStaff !== null) {
      isChecked = savedSelectedStaff.includes(name);
    } else {
      isChecked = false; 
    }

    label.innerHTML = `
      <input type="checkbox" value="${name}" class="staff-check" ${isChecked ? 'checked' : ''} onchange="saveStaffSelection()">
      <span>${name}</span>
    `;
    container.appendChild(label);
  });
}

function saveStaffSelection() {
  const selectedStaff = Array.from(document.querySelectorAll('.staff-check:checked')).map(cb => cb.value);
  localStorage.setItem('lastSelectedStaff', JSON.stringify(selectedStaff));
}

// ปุ่มรีเฟรชเฉพาะรายชื่อพนักงาน (เคลียร์ติ๊กออกทั้งหมด)
function refreshStaffData() {
  document.querySelectorAll('.staff-check').forEach(cb => cb.checked = false);
  localStorage.setItem('lastSelectedStaff', JSON.stringify([]));
  alert("🔄 เคลียร์รายชื่อผู้ปฏิบัติงานทั้งหมดเรียบร้อยแล้ว!");
}

function addNewStaffPrompt() {
  const newName = prompt("กรุณากรอกชื่อ-นามสกุล พนักงานใหม่:");
  if (newName && newName.trim() !== "") {
    staffList.push(newName.trim());
    renderStaffCheckboxes();
  }
}

// ==========================================
// 7. ฟังก์ชันแปลงวันที่เป็นรูปแบบภาษาไทย (Format Thai Date)
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
// 8. ฟังก์ชันสร้างข้อความสรุปขออนุมัติ OT (Generate Text)
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
// 9. ฟังก์ชันคัดลอกข้อความไปยังคลิปบอร์ด (Copy to Clipboard)
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
// 10. ฟังก์ชันบันทึกประวัติลง LocalStorage ของเครื่อง (Save Record)
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
// 11. ฟังก์ชันแสดงรายการประวัติย้อนหลัง พร้อมระบบลากสลับตำแหน่งและปุ่มปริ้นท์แยก
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
        <button class="btn btn-secondary btn-sm" onclick="printSingleRecord('${rec.id}')" title="ปริ้นท์รายการนี้หน้าเดียว">🖨️ ปริ้นท์</button>
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
// 12. ฟังก์ชันสลับลำดับประวัติขึ้น-ลงด้วยปุ่มลูกศร (Move History)
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
// 13. ฟังก์ชันโหลดข้อความประวัติเก่ามาแสดงที่กล่องข้อความด้านบน (Load to Text)
// ==========================================
function loadHistoryToText(id) {
  const rec = otHistory.find(r => r.id == id);
  if (rec) {
    document.getElementById('outputResult').value = rec.fullText;
    window.scrollTo({ top: document.getElementById('outputResult').offsetTop - 100, behavior: 'smooth' });
  }
}

// ==========================================
// 14. ฟังก์ชันแก้ไขข้อความในประวัติย้อนหลัง (Edit History)
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
// 15. ฟังก์ชันลบประวัติย้อนหลังออกจากเครื่อง (Delete History)
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
// 16. ฟังก์ชันพิมพ์รายงานเฉพาะรายการที่เลือก (Print Single Record)
// ==========================================
function printSingleRecord(id) {
  const rec = otHistory.find(r => r.id == id);
  if (!rec) return;

  document.getElementById('printArea').innerText = rec.fullText;
  window.print();
}

// ==========================================
// 17. ฟังก์ชันคำนวณและอัปเดตสถิติ OT รวมรายเดือน (Monthly Summary)
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
// 18. ฟังก์ชันวาดกราฟเส้นแสดงสถิติ OT รายปีด้วย Chart.js (Yearly Analytics Chart)
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