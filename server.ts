import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Pool } = pkg;

// Load environment variables early (in dev modes Vite loads this after, but we need DB URL immediately)
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

app.use(express.json());

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Typical for Neon/cloud DBs
});

// Create tables if they don't exist
async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn("WARNING: DATABASE_URL is not set. Please configure it in your Secrets.");
    return;
  }
  
  try {
    console.log("Initializing database tables...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        target_amount NUMERIC(12, 2) NOT NULL,
        current_amount NUMERIC(12, 2) DEFAULT 0,
        deadline DATE,
        category VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}
initDb();

const JWT_SECRET = process.env.JWT_SECRET || 'senha-super-secreta-fallback-dev';

// Auth Middleware
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check if user exists
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, hash]
    );

    const token = jwt.sign({ id: newUser.rows[0].id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }
    
    const user = userResult.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: any, res: any) => {
  try {
    const userResult = await pool.query('SELECT id, email FROM users WHERE id = $1', [req.userId]);
    res.json({ user: userResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});


// --- GOALS ROUTES ---
app.get('/api/goals', authMiddleware, async (req: any, res: any) => {
  try {
    const goalsResult = await pool.query('SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at ASC', [req.userId]);
    const formattedGoals = goalsResult.rows.map(g => ({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.target_amount),
      currentAmount: Number(g.current_amount),
      deadline: g.deadline ? g.deadline.toISOString() : undefined,
      category: g.category,
      createdAt: g.created_at.toISOString()
    }));
    res.json(formattedGoals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar metas.' });
  }
});

app.post('/api/goals', authMiddleware, async (req: any, res: any) => {
  const { name, targetAmount, deadline, category } = req.body;
  try {
    const newGoal = await pool.query(
      `INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, category) 
       VALUES ($1, $2, $3, 0, $4, $5) RETURNING *`,
      [req.userId, name, targetAmount, deadline || null, category]
    );
    const g = newGoal.rows[0];
    res.json({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.target_amount),
      currentAmount: Number(g.current_amount),
      deadline: g.deadline ? g.deadline.toISOString() : undefined,
      category: g.category,
      createdAt: g.created_at.toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar meta.' });
  }
});

app.put('/api/goals/:id', authMiddleware, async (req: any, res: any) => {
  const { id } = req.params;
  const { name, targetAmount, currentAmount, deadline, category } = req.body;
  
  try {
    // Check ownership first
    const check = await pool.query('SELECT id FROM goals WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Meta não encontrada.' });

    const updated = await pool.query(
      `UPDATE goals SET name = $1, target_amount = $2, current_amount = $3, deadline = $4, category = $5
       WHERE id = $6 RETURNING *`,
      [name, targetAmount, currentAmount, deadline || null, category, id]
    );

    const g = updated.rows[0];
    res.json({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.target_amount),
      currentAmount: Number(g.current_amount),
      deadline: g.deadline ? g.deadline.toISOString() : undefined,
      category: g.category,
      createdAt: g.created_at.toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar meta.' });
  }
});

app.delete('/api/goals/:id', authMiddleware, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Meta não encontrada.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar meta.' });
  }
});


// --- VITE DEV OR PROD STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
