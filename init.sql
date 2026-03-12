-- Создание таблиц
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    fio VARCHAR(100) NOT NULL,
    birthday DATE NOT NULL,
    passport VARCHAR(11) NOT NULL,
    contact VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    position_id INTEGER REFERENCES positions(id) ON DELETE SET NULL,
    salary NUMERIC(8,2) NOT NULL,
    hire_date DATE NOT NULL,
    is_fired BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_employee_fio ON employees (LOWER(fio));

-- Тестовые данные
INSERT INTO departments (name) VALUES 
('IT отдел'), ('Бухгалтерия'), ('HR'), ('Продажи'), ('Маркетинг')
ON CONFLICT (name) DO NOTHING;

INSERT INTO positions (name) VALUES 
('Senior Developer'), ('Junior Developer'), ('Бухгалтер'), 
('HR Manager'), ('Менеджер по продажам')
ON CONFLICT (name) DO NOTHING;

INSERT INTO employees (fio, birthday, passport, contact, address, department_id, position_id, salary, hire_date) VALUES 
('Иванов Иван Иванович', '1990-05-15', '1234 567890', '+7(999)123-45-67', 'г. Москва, ул. Ленина, д.10', 1, 1, 150000.00, '2023-01-15'),
('Петров Петр Петрович', '1995-03-22', '4321 098765', '+7(999)234-56-78', 'г. Москва, ул. Пушкина, д.5', 1, 2, 80000.00, '2024-03-01')
ON CONFLICT DO NOTHING;
