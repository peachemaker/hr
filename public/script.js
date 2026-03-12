// Глобальные переменные
let departments = [];

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", async function () {
  await loadDepartments();
  document.getElementById("empForm").onsubmit = formHandler;
  fetchEmployees();
});

// Загрузка отделов из БД
async function loadDepartments() {
  try {
    const response = await fetch("/api/departments");
    departments = await response.json();

    const select = document.getElementById("filterDept");
    select.innerHTML = '<option value="">Все отделы</option>';

    departments.forEach((dept) => {
      const option = document.createElement("option");
      option.value = dept.id;
      option.textContent = dept.name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Ошибка загрузки отделов:", err);
    document.getElementById("filterDept").innerHTML =
      '<option value="">Ошибка загрузки</option>';
  }
}

// Загрузка сотрудников
async function fetchEmployees() {
  const search = document.getElementById("searchInput").value;
  const dept = document.getElementById("filterDept").value;

  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (dept) params.append("dept", dept);

    const response = await fetch(`/api/employees?${params}`);
    const employees = await response.json();
    renderTable(employees);
  } catch (err) {
    console.error("Ошибка загрузки:", err);
  }
}

function maskPassport(input) {
  let v = input.value.replace(/\D/g, "");
  if (v.length > 4) v = v.slice(0, 4) + " " + v.slice(4, 10);
  input.value = v;
}

function maskPhone(input) {
  let v = input.value.replace(/\D/g, "");
  if (v.length > 0) {
    let res = "+7 (";
    if (v.startsWith("7") || v.startsWith("8")) v = v.slice(1);
    if (v.length > 0) res += v.slice(0, 3);
    if (v.length > 3) res += ") " + v.slice(3, 6);
    if (v.length > 6) res += "-" + v.slice(6, 8);
    if (v.length > 8) res += "-" + v.slice(8, 10);
    input.value = res;
  }
}

function renderTable(data) {
  const tbody = document.getElementById("employeeTable");
  tbody.innerHTML = "";

  data.forEach((emp) => {
    const tr = document.createElement("tr");
    if (emp.is_fired) tr.classList.add("fired-row");

    tr.innerHTML = `
      <td>
        <strong>${emp.fio}</strong><br>
        <small>ДР: ${new Date(emp.birthday).toLocaleDateString()}</small>
      </td>
      <td>${emp.department_name || "—"}<br><small>${emp.position_name || "—"}</small></td>
      <td>${emp.contact}<br><small>Паспорт: ${emp.passport}</small></td>
      <td>
        <span class="status-badge ${emp.is_fired ? "status-fired" : "status-active"}">
          ${emp.is_fired ? "Уволен" : "Работает"}
        </span>
      </td>
      <td class="actions-cell"></td>
    `;

    const actionsCell = tr.querySelector(".actions-cell");

    const editBtn = document.createElement("button");
    editBtn.className = "btn-edit";
    editBtn.innerText = "⚙️";
    editBtn.disabled = emp.is_fired;
    editBtn.onclick = () => editEmployee(emp);
    actionsCell.appendChild(editBtn);

    if (!emp.is_fired) {
      const fireBtn = document.createElement("button");
      fireBtn.className = "btn-fire";
      fireBtn.innerText = "❌";
      fireBtn.onclick = () => fireEmployee(emp.id);
      actionsCell.appendChild(fireBtn);
    }

    tbody.appendChild(tr);
  });
}

async function formHandler(e) {
  e.preventDefault();
  const id = document.getElementById("empId").value;

  const payload = {
    fio: document.getElementById("fio").value,
    birthday: document.getElementById("birthday").value,
    passport: document.getElementById("passport").value,
    contact: document.getElementById("contact").value,
    address: document.getElementById("address").value,
    department_id: 1,
    position_id: 1,
    salary: parseFloat(document.getElementById("salary").value || 0),
    hire_date: new Date().toISOString().split("T")[0],
  };

  try {
    await fetch(id ? `/api/employees/${id}` : "/api/employees", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    closeModal();
    fetchEmployees();
  } catch (err) {
    console.error("Ошибка сохранения:", err);
  }
}

function openModal(emp = null) {
  document.getElementById("empForm").reset();
  document.getElementById("empId").value = "";
  document.getElementById("modalTitle").innerText = "Новый сотрудник";
  document.getElementById("modal").style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

function editEmployee(emp) {
  openModal();
  document.getElementById("modalTitle").innerText = "Редактирование";
  document.getElementById("empId").value = emp.id;
  document.getElementById("fio").value = emp.fio;
  document.getElementById("birthday").value = emp.birthday.split("T")[0];
  document.getElementById("passport").value = emp.passport;
  document.getElementById("contact").value = emp.contact;
  document.getElementById("address").value = emp.address;
  document.getElementById("department").value = emp.department_name;
  document.getElementById("position").value = emp.position_name;
  document.getElementById("salary").value = emp.salary;
}

async function fireEmployee(id) {
  if (confirm("Уволить сотрудника? Редактирование будет заблокировано.")) {
    try {
      await fetch(`/api/employees/${id}/fire`, { method: "PATCH" });
      fetchEmployees();
    } catch (err) {
      console.error("Ошибка увольнения:", err);
    }
  }
}
