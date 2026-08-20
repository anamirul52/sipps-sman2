-- PostgreSQL Schema for SIPPS SMAN 2 Salatiga

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin','bk','piket','wali_kelas','parent','student')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    class_name VARCHAR(50) UNIQUE NOT NULL,
    homeroom_teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    nipd VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    class_id INT REFERENCES classes(id) ON DELETE SET NULL,
    parent_phone VARCHAR(50),
    total_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS violation_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    point_deduction INT NOT NULL,
    penalty_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_violations (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES violation_categories(id) ON DELETE CASCADE,
    reported_by_teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
    violation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    photo_proof_url VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending','processed','resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sanctions_letters (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    violation_summary TEXT,
    point_threshold INT NOT NULL,
    status_letter VARCHAR(255),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
