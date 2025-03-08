// This script demonstrates how to initialize an empty database for the Bible Quiz app
// In a real application, you would run this script once when setting up the database

// Import database connection (this is just a placeholder)
// const db = require('./db-connection');

// Function to create database tables
async function createTables() {
  console.log("Creating database tables...")

  try {
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        church VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `)

    // Create levels table
    await db.query(`
      CREATE TABLE IF NOT EXISTS levels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        order_number INT NOT NULL,
        questions_count INT DEFAULT 12,
        is_active BOOLEAN DEFAULT TRUE
      )
    `)

    // Create questions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        level_id INT REFERENCES levels(id),
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer CHAR(1) NOT NULL,
        difficulty INT DEFAULT 1
      )
    `)

    // Create user_progress table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_progress (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        level_id INT REFERENCES levels(id),
        is_completed BOOLEAN DEFAULT FALSE,
        stars INT DEFAULT 0,
        best_time_seconds INT,
        last_played TIMESTAMP,
        UNIQUE(user_id, level_id)
      )
    `)

    // Create quiz_attempts table
    await db.query(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        level_id INT REFERENCES levels(id),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        time_elapsed_seconds INT,
        correct_answers INT DEFAULT 0,
        incorrect_answers INT DEFAULT 0,
        stars_earned INT DEFAULT 0
      )
    `)

    // Create user_answers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_answers (
        id SERIAL PRIMARY KEY,
        attempt_id INT REFERENCES quiz_attempts(id),
        question_id INT REFERENCES questions(id),
        user_answer CHAR(1),
        is_correct BOOLEAN,
        time_taken_seconds INT
      )
    `)

    // Create rankings table - initially empty
    await db.query(`
      CREATE TABLE IF NOT EXISTS rankings (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        score INT DEFAULT 0,
        completed_levels INT DEFAULT 0,
        correct_answers INT DEFAULT 0,
        incorrect_answers INT DEFAULT 0,
        average_time_seconds INT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `)

    // Create achievements table
    await db.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        requirement_type VARCHAR(50) NOT NULL,
        requirement_value INT NOT NULL
      )
    `)

    // Create user_achievements table - initially empty
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        achievement_id INT REFERENCES achievements(id),
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement_id)
      )
    `)

    console.log("All tables created successfully!")
  } catch (error) {
    console.error("Error creating tables:", error)
    throw error
  }
}

// Function to initialize the database with basic data (levels, achievements, etc.)
async function initializeBasicData() {
  console.log("Initializing basic data...")

  try {
    // Insert Bible book levels
    await db.query(`
      INSERT INTO levels (name, description, order_number) VALUES
      ('Gênesis', 'Perguntas sobre o livro de Gênesis', 1),
      ('Êxodo', 'Perguntas sobre o livro de Êxodo', 2),
      ('Levítico', 'Perguntas sobre o livro de Levítico', 3),
      ('Números', 'Perguntas sobre o livro de Números', 4),
      ('Deuteronômio', 'Perguntas sobre o livro de Deuteronômio', 5),
      ('Josué', 'Perguntas sobre o livro de Josué', 6),
      ('Juízes', 'Perguntas sobre o livro de Juízes', 7),
      ('Rute', 'Perguntas sobre o livro de Rute', 8),
      ('1 Samuel', 'Perguntas sobre o livro de 1 Samuel', 9),
      ('2 Samuel', 'Perguntas sobre o livro de 2 Samuel', 10),
      ('1 Reis', 'Perguntas sobre o livro de 1 Reis', 11),
      ('2 Reis', 'Perguntas sobre o livro de 2 Reis', 12)
      -- Add more levels as needed
    `)

    // Insert achievements
    await db.query(`
      INSERT INTO achievements (name, description, requirement_type, requirement_value) VALUES
      ('Iniciante', 'Completou 10 fases', 'completed_levels', 10),
      ('Estudioso', 'Completou 50 fases', 'completed_levels', 50),
      ('Mestre Bíblico', 'Completou 100 fases', 'completed_levels', 100),
      ('Perfeição', 'Conseguiu 3 estrelas em 10 fases', 'three_stars', 10),
      ('Velocista', 'Completou uma fase em menos de 1 minuto', 'fast_completion', 60),
      ('Dedicado', 'Jogou por 7 dias consecutivos', 'consecutive_days', 7)
    `)

    // Insert sample questions for the first level (Gênesis)
    await db.query(`
      INSERT INTO questions (level_id, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES
      (1, 'Quem foi o primeiro homem criado por Deus?', 'Noé', 'Adão', 'Abraão', 'Moisés', 'B'),
      (1, 'Quantos dias Deus levou para criar o mundo segundo Gênesis?', '3 dias', '6 dias', '7 dias', '40 dias', 'B'),
      (1, 'Quem construiu a arca?', 'Abraão', 'Moisés', 'Noé', 'Davi', 'C')
      -- Add more questions as needed
    `)

    console.log("Basic data initialized successfully!")
  } catch (error) {
    console.error("Error initializing basic data:", error)
    throw error
  }
}

// Main function to set up the database
async function setupDatabase() {
  console.log("Setting up Bible Quiz database...")

  try {
    // Create tables
    await createTables()

    // Initialize basic data
    await initializeBasicData()

    console.log("Database setup completed successfully!")

    // Important note about rankings
    console.log("\nIMPORTANT: The rankings table is initially empty.")
    console.log("Rankings will be populated as users play the game.")
    console.log("The first player will automatically become #1 in the rankings!")
  } catch (error) {
    console.error("Database setup failed:", error)
  }
}

// This is a simulation - in a real app, you would actually execute this
console.log("=== Bible Quiz Database Initialization ===\n")
console.log("This script demonstrates how to initialize an empty database for the Bible Quiz app.")
console.log("In a real application, you would run this once when setting up the database.\n")

// Simulate the database setup process
console.log("Simulating database setup process...\n")
console.log("1. Creating tables (users, levels, questions, progress, attempts, answers, rankings)")
console.log("2. Initializing basic data (Bible book levels, achievements, sample questions)")
console.log("3. Verifying empty rankings table\n")

console.log("Database initialization complete!")
console.log("\nIMPORTANT: The rankings table starts empty.")
console.log("Rankings will be populated as users play the game.")
console.log("The first player will automatically become #1 in the rankings!")

