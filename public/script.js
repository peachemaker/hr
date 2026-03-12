// Глобальные переменные
let employees = [];
let departments = [];
let positions = [];

// Загрузка данных при старте
async function init() {
  await Promise.all([
    fetchDepartments(),
    fetchPositions(),
    fetchEmployees()
  ]);
  populateFilters();
  renderTable();
}

// Отделы
async function fetchDepartments() {
  try {
    const res = await fetch('/api/departments');
    departments = await res.json();
  } catch (e) {
    console.error('Ошибка загрузки отделов:', e);
  }
}

// Должности
async function fetchPositions() {
  try {
    const res = await fetch('/api/positions');
    positions = await res.json();
  } catch (e) {
    console.error('Ошибка загрузки должностей:', e);
  }
}

// Сотрудники
async function fetchEmployees() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const deptId = document.getElementById('filterDept').value;
  
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (deptId) params.append('dept', deptId);
    
    const res = await fetch(`/api/employees?${params}`);
    employees = await res.json();
    renderTable();
  } catch (e) {
    console.error('Ошибка загрузки сотрудников:', e);
  }
}

// Заполнение фильтров
function populateFilters() {
  const filterDept = document.getElementById('filterDept');
  filterDept.innerHTML = '<option value="">Все отделы</option>';
  
  departments.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept.id;
    option.textContent = dept.name;
    filterDept.appendChild(option);
  });
}

function populateModalSelects(editId = null) {
  const deptSelect = document.getElementById('department');
  const posSelect = document.getElementById('position');
  
  // Отделы
  deptSelect.innerHTML = '<option value="">Выберите отдел</option>';
  departments.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept.id;
    option.textContent = dept.name;
    deptSelect.appendChild(option);
  });
  
  // Должности
  posSelect.innerHTML = '<option value="">Выберите должность</option>';
  positions.forEach(pos => {
    const option = document.createElement('option');
    option.value = pos.id;
    option.textContent = pos.name;
    posSelect.appendChild(option);
  });
  
  // Заполнить при редактировании
  if (editId) {
    const emp = employees.find(e => e.id == editId);
    if (emp) {
      document.getElementById('department').value = emp.department_id || '';
      document.getElementById('position').value = emp.position_id || '';
    }
  }
}


// Открыть модалку
function openModal(editId = null) {
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('modalTitle').textContent = 
    editId ? 'Редактировать сотрудника' : 'Новый сотрудник';
  
  // Очистить форму
  document.getElementById('empForm').reset();
  document.getElementById('empId').value = editId || '';
  
  populateModalSelects(editId);
  document.getElementById('modal').scrollIntoView();
}

// Закрыть модалку
function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

// Сохранить сотрудника
document.getElementById('empForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    fio: document.getElementById('fio').value,
    birthday: document.getElementById('birthday').value,
    passport: document.getElementById('passport').value.replace(/\s/g, ''),
    contact: document.getElementById('contact').value.replace(/\D/g, ''),
    address: document.getElementById('address').value,
    department_id: parseInt(document.getElementById('department').value),
    position_id: parseInt(document.getElementById('position').value),
    salary: parseFloat(document.getElementById('salary').value) || 0,
    is_fired: false
  };
  
  const empId = document.getElementById('empId').value;
  
  try {
    if (empId) {
      // Обновление
      await fetch(`/api/employees/${empId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    } else {
      // Создание
      await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    }
    
    closeModal();
    fetchEmployees();
  } catch (e) {
    alert('Ошибка сохранения: ' + e.message);
  }
});

// Рендер таблицы
function renderTable() {
  const tbody = document.getElementById('employeeTable');
  tbody.innerHTML = '';
  
  employees.forEach(emp => {
    const dept = departments.find(d => d.id == emp.department_id)?.name || '—';
    const pos = positions.find(p => p.id == emp.position_id)?.name || '—';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${emp.fio}</td>
      <td>${dept} / ${pos}</td>
      <td>${emp.contact} ${emp.address ? `<br><small>${emp.address}</small>` : ''}</td>
      <td>
        ${emp.is_fired ? 
          '<span class="status fired">Уволен</span>' : 
          '<span class="status active">Работает</span>'
        }
      </td>
      <td>
        <button onclick="openModal(${emp.id})" ${emp.is_fired ? 'disabled' : ''}>Редактировать</button>
        ${!emp.is_fired ? 
          `<button onclick="fireEmployee(${emp.id})">Уволить</button>` : 
          ''
        }
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Уволить сотрудника
async function fireEmployee(id) {
  if (!confirm('Уволить сотрудника?')) return;
  
  try {
    await fetch(`/api/employees/${id}/fire`, { method: 'PATCH' });
    fetchEmployees();
  } catch (e) {
    alert('Ошибка увольнения: ' + e.message);
  }
}

// Маски ввода
function maskPassport(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length >= 4) value = value.slice(0,4) + ' ' + value.slice(4);
  input.value = value.slice(0,11);
}

function maskPhone(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length >= 1) value = '+7(' + value.slice(0,3);
  if (value.length >= 6) value = value.slice(0,6) + ') ' + value.slice(6,9);
  if (value.length >= 10) value = value.slice(0,10) + '-' + value.slice(10,11);
  if (value.length >= 12) value = value.slice(0,13) + '-' + value.slice(13,15);
  input.value = value.slice(0,18);
}

init();
