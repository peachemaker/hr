const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// Настройки подключения к БД
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "hr",
  password: process.env.DB_PASSWORD || "Gav!nBels0n",
  port: process.env.DB_PORT || 5432,
});
pool.on('connect', () => console.log('✅ Подключен к PostgreSQL'));
pool.on('error', (err) => console.error('❌ Ошибка БД:', err));
// Получение списка
app.get("/api/employees", async (req, res) => {
  try {
    const { dept, pos, search } = req.query;

    let query = `
      SELECT 
        e.*,
        d.name as department_name,
        p.name as position_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE 1=1
    `;
    const values = [];

    if (dept) {
      values.push(dept);
      query += ` AND department_id = $${values.length}`;
    }

    if (pos) {
      values.push(pos);
      query += ` AND position_id = $${values.length}`;
    }

    if (search) {
      values.push(`%${search}%`);
      query += ` AND fio ILIKE $${values.length}`;
    }

    query += " ORDER BY id DESC";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Создание сотрудника
app.post("/api/employees", async (req, res) => {
  try {
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);

    if (fields.length === 0) {
      return res.status(400).json({ error: "Нет данных для вставки" });
    }

    const columns = fields.map((f) => `"${f}"`).join(", ");
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");

    const text = `INSERT INTO employees (${columns}) VALUES (${placeholders}) RETURNING *`;

    const result = await pool.query(text, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Редактирование (только если не уволен)
app.put("/api/employees/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const check = await pool.query(
      "SELECT is_fired FROM employees WHERE id = $1",
      [id]
    );

    if (check.rowCount === 0) {
      return res.status(404).json({ error: "Сотрудник не найден" });
    }

    if (check.rows[0].is_fired) {
      return res.status(403).json({ error: "Нельзя редактировать уволенного" });
    }

    const keys = Object.keys(updates);
    if (keys.length === 0) {
      return res.status(400).json({ error: "Нет полей для обновления" });
    }

    const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(", ");

    const values = Object.values(updates);
    values.push(id);

    const text = `UPDATE employees SET ${setClause} WHERE id = $${
      keys.length + 1
    }`;

    await pool.query(text, values);
    res.json({ message: "Обновлено" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Увольнение
app.patch("/api/employees/:id/fire", async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE employees SET is_fired = true WHERE id = $1",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Сотрудник не найден" });
    }
    res.json({ message: "Сотрудник уволен" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/departments', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM departments ORDER BY name');
    console.log('Отделы API:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('ОТДЕЛЫ:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/positions', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM positions ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Должности:', err);
    res.status(500).json({ error: err.message });
  }
});


app.listen(3000, () => console.log("http://localhost:3000"));
