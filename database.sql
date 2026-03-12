create table departments (
    id serial primary key,
    name varchar(100) not null unique
);
create table positions (
    id serial primary key,
    name varchar(100) not null unique
);
create table employees(
    id serial primary key,
    fio varchar(100) not null,
    birthday date not null,
    passport varchar(11) not null,
    contact varchar(20) not null,
    address text not null,
    department_id integer references departments(id) on delete
    set null,
        position_id integer references positions(id) on delete
    set null,
        salary numeric(8, 2) not null,
        hire_date date not null,
        is_fired boolean default false
);
create index idx_employee_fio on employees (lower(fio));