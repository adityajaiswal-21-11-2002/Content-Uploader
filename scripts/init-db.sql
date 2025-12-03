-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('coder', 'pepper')),
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create daily uploads tracking table
CREATE TABLE IF NOT EXISTS daily_uploads (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  insta_done BOOLEAN DEFAULT FALSE,
  youtube_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, date)
);

-- Create weekly stats table
CREATE TABLE IF NOT EXISTS weekly_stats (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  insta_count INTEGER DEFAULT 0,
  youtube_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, week_start_date)
);

-- Create topics table for admin suggestions
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  topic_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed employees
INSERT INTO employees (id, name, role, email) VALUES
(1, 'Aditya Jaiswal', 'coder', 'aditya.jaiswal@example.com'),
(2, 'Vipin Sharma', 'coder', 'vipin.sharma@example.com'),
(3, 'Vikash Sharma', 'coder', 'vikash.sharma@example.com'),
(4, 'Rohit', 'pepper', 'rohit@example.com'),
(5, 'Pawan Sharma', 'pepper', 'pawan.sharma@example.com'),
(6, 'Annu', 'pepper', 'annu@example.com')
ON CONFLICT DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_uploads_date ON daily_uploads(date);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_week ON weekly_stats(week_start_date);
CREATE INDEX IF NOT EXISTS idx_topics_date ON topics(date);
