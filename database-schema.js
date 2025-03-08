// This is a sample database schema for the Bible Quiz application
// You can use this as a reference for implementing your database

// Users Table
const usersTable = `
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  church VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);
`

// Levels Table
const levelsTable = `
CREATE TABLE levels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_number INT NOT NULL,
  questions_count INT DEFAULT 12,
  is_active BOOLEAN DEFAULT TRUE
);
`

// Questions Table
const questionsTable = `
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  level_id INT REFERENCES levels(id),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL,
  difficulty INT DEFAULT 1
);
`

// User Progress Table
const userProgressTable = `
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  level_id INT REFERENCES levels(id),
  is_completed BOOLEAN DEFAULT FALSE,
  stars INT DEFAULT 0,
  best_time_seconds INT,
  last_played TIMESTAMP,
  UNIQUE(user_id, level_id)
);
`

// Quiz Attempts Table
const quizAttemptsTable = `
CREATE TABLE quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  level_id INT REFERENCES levels(id),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  time_elapsed_seconds INT,
  correct_answers INT DEFAULT 0,
  incorrect_answers INT DEFAULT 0,
  stars_earned INT DEFAULT 0
);
`

// User Answers Table
const userAnswersTable = `
CREATE TABLE user_answers (
  id SERIAL PRIMARY KEY,
  attempt_id INT REFERENCES quiz_attempts(id),
  question_id INT REFERENCES questions(id),
  user_answer CHAR(1),
  is_correct BOOLEAN,
  time_taken_seconds INT
);
`

// Rankings Table
const rankingsTable = `
CREATE TABLE rankings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  score INT DEFAULT 0,
  completed_levels INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  incorrect_answers INT DEFAULT 0,
  average_time_seconds INT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);
`

// Achievements Table
const achievementsTable = `
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INT NOT NULL
);
`

// User Achievements Table
const userAchievementsTable = `
CREATE TABLE user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  achievement_id INT REFERENCES achievements(id),
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);
`

// Sample data insertion for levels
const insertLevels = `
INSERT INTO levels (name, description, order_number) VALUES
('Gênesis', 'Perguntas sobre o livro de Gênesis', 1),
('Êxodo', 'Perguntas sobre o livro de Êxodo', 2),
('Levítico', 'Perguntas sobre o livro de Levítico', 3),
('Números', 'Perguntas sobre o livro de Números', 4),
('Deuteronômio', 'Perguntas sobre o livro de Deuteronômio', 5);
`

// Sample data insertion for achievements
const insertAchievements = `
INSERT INTO achievements (name, description, requirement_type, requirement_value) VALUES
('Iniciante', 'Completou 10 fases', 'completed_levels', 10),
('Estudioso', 'Completou 50 fases', 'completed_levels', 50),
('Mestre Bíblico', 'Completou 100 fases', 'completed_levels', 100),
('Perfeição', 'Conseguiu 3 estrelas em 10 fases', 'three_stars', 10),
('Velocista', 'Completou uma fase em menos de 1 minuto', 'fast_completion', 60),
('Dedicado', 'Jogou por 7 dias consecutivos', 'consecutive_days', 7);
`

// Example of how to query user progress
const getUserProgressQuery = `
SELECT 
  u.name, 
  l.name as level_name, 
  up.is_completed, 
  up.stars, 
  up.best_time_seconds,
  up.last_played,
  (SELECT COUNT(*) FROM user_answers ua 
   JOIN quiz_attempts qa ON ua.attempt_id = qa.id 
   WHERE qa.user_id = u.id AND qa.level_id = l.id AND ua.is_correct = TRUE) as correct_answers,
  (SELECT COUNT(*) FROM user_answers ua 
   JOIN quiz_attempts qa ON ua.attempt_id = qa.id 
   WHERE qa.user_id = u.id AND qa.level_id = l.id AND ua.is_correct = FALSE) as incorrect_answers
FROM users u
JOIN user_progress up ON u.id = up.user_id
JOIN levels l ON up.level_id = l.id
WHERE u.id = $1
ORDER BY l.order_number;
`

// Example of how to query rankings
const getRankingsQuery = `
SELECT 
  u.id,
  u.name,
  u.church,
  r.score,
  r.completed_levels,
  r.correct_answers,
  r.incorrect_answers,
  r.average_time_seconds
FROM rankings r
JOIN users u ON r.user_id = u.id
ORDER BY r.score DESC
LIMIT 10;
`

// Example of how to update user progress after completing a quiz
const updateUserProgressProcedure = `
CREATE OR REPLACE FUNCTION update_user_progress(
  p_user_id INT,
  p_level_id INT,
  p_time_elapsed INT,
  p_correct_answers INT,
  p_incorrect_answers INT
) RETURNS VOID AS $$
DECLARE
  p_stars INT;
  p_total_questions INT;
  p_completion_percentage FLOAT;
BEGIN
  -- Get total questions for this level
  SELECT questions_count INTO p_total_questions FROM levels WHERE id = p_level_id;
  
  -- Calculate stars based on correct answers percentage
  p_completion_percentage := (p_correct_answers::FLOAT / p_total_questions) * 100;
  
  IF p_completion_percentage >= 90 THEN
    p_stars := 3;
  ELSIF p_completion_percentage >= 70 THEN
    p_stars := 2;
  ELSIF p_completion_percentage >= 50 THEN
    p_stars := 1;
  ELSE
    p_stars := 0;
  END IF;
  
  -- Update or insert user progress
  INSERT INTO user_progress (user_id, level_id, is_completed, stars, best_time_seconds, last_played)
  VALUES (p_user_id, p_level_id, TRUE, p_stars, p_time_elapsed, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id, level_id) 
  DO UPDATE SET 
    is_completed = TRUE,
    stars = GREATEST(user_progress.stars, p_stars),
    best_time_seconds = LEAST(user_progress.best_time_seconds, p_time_elapsed),
    last_played = CURRENT_TIMESTAMP;
    
  -- Update rankings
  INSERT INTO rankings (user_id, score, completed_levels, correct_answers, incorrect_answers, average_time_seconds)
  SELECT 
    p_user_id,
    (SELECT COUNT(*) * 50 + SUM(stars) * 10 FROM user_progress WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM user_progress WHERE user_id = p_user_id AND is_completed = TRUE),
    (SELECT SUM(correct_answers) FROM quiz_attempts WHERE user_id = p_user_id),
    (SELECT SUM(incorrect_answers) FROM quiz_attempts WHERE user_id = p_user_id),
    (SELECT AVG(time_elapsed_seconds) FROM quiz_attempts WHERE user_id = p_user_id AND completed_at IS NOT NULL)
  ON CONFLICT (user_id)
  DO UPDATE SET
    score = (SELECT COUNT(*) * 50 + SUM(stars) * 10 FROM user_progress WHERE user_id = p_user_id),
    completed_levels = (SELECT COUNT(*) FROM user_progress WHERE user_id = p_user_id AND is_completed = TRUE),
    correct_answers = (SELECT SUM(correct_answers) FROM quiz_attempts WHERE user_id = p_user_id),
    incorrect_answers = (SELECT SUM(incorrect_answers) FROM quiz_attempts WHERE user_id = p_user_id),
    average_time_seconds = (SELECT AVG(time_elapsed_seconds) FROM quiz_attempts WHERE user_id = p_user_id AND completed_at IS NOT NULL),
    last_updated = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
`

// Print the schema to demonstrate the database structure
console.log("Bible Quiz Database Schema")
console.log("\n=== Users Table ===")
console.log(usersTable)
console.log("\n=== Levels Table ===")
console.log(levelsTable)
console.log("\n=== Questions Table ===")
console.log(questionsTable)
console.log("\n=== User Progress Table ===")
console.log(userProgressTable)
console.log("\n=== Quiz Attempts Table ===")
console.log(quizAttemptsTable)
console.log("\n=== User Answers Table ===")
console.log(userAnswersTable)
console.log("\n=== Rankings Table ===")
console.log(rankingsTable)
console.log("\n=== Achievements Table ===")
console.log(achievementsTable)
console.log("\n=== User Achievements Table ===")
console.log(userAchievementsTable)

console.log("\n=== Database Relationships ===")
console.log(`
1. Each user can have multiple quiz attempts
2. Each quiz attempt belongs to one user and one level
3. Each user answer belongs to one quiz attempt and one question
4. Each user can have progress records for multiple levels
5. Each user can earn multiple achievements
6. Each user has one ranking record that is updated after each quiz
`)

console.log("\n=== How to track player progress ===")
console.log(`
The database schema allows tracking:
1. Where players stopped (user_progress table with level_id and is_completed)
2. How many correct and incorrect answers (quiz_attempts table)
3. Best time for each level (user_progress.best_time_seconds)
4. Last played date (user_progress.last_played)
5. Stars earned per level (user_progress.stars)
6. Detailed answer history (user_answers table)
7. Overall ranking with correct/incorrect counts (rankings table)
`)

