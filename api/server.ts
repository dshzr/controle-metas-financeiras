import express from 'express';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { Pool } = pkg;
const app = express();

app.use(express.json());

// Verifica se a URL do banco está configurada para evitar que o PG tente conectar no localhost(127.0.0.1) por padrão.
app.use((req, res, next) => {
  if (!process.env.DATABASE_URL) {
    console.error("ERRO CRÍTICO: DATABASE_URL não está definida!");
    return res.status(500).json({ 
      error: 'Variável DATABASE_URL não configurada no servidor (Vercel). Acesse as configurações do seu projeto na Vercel e adicione-a.' 
    });
  }
  next();
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDb() {
  if (!process.env.DATABASE_URL) return;
  try {
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

      CREATE TABLE IF NOT EXISTS bills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        description VARCHAR(255) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        due_date DATE NOT NULL,
        is_recurring BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}
initDb();

const JWT_SECRET = process.env.JWT_SECRET || 'senha-super-secreta-fallback-dev';

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

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ error: 'Email já cadastrado.' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, hash]
    );

    const token = jwt.sign({ id: newUser.rows[0].id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err: any) {
    console.error("Register Error:", err);
    res.status(500).json({ error: 'Erro no servidor: ' + (err.message || String(err)) });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(400).json({ error: 'Credenciais inválidas.' });
    
    const user = userResult.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Credenciais inválidas.' });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err: any) {
    console.error("Login Error:", err);
    res.status(500).json({ error: 'Erro no servidor: ' + (err.message || String(err)) });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: any, res: any) => {
  try {
    const userResult = await pool.query('SELECT id, email FROM users WHERE id = $1', [req.userId]);
    res.json({ user: userResult.rows[0] });
  } catch (err: any) {
    console.error("Auth Me Error:", err);
    res.status(500).json({ error: 'Erro no servidor: ' + (err.message || String(err)) });
  }
});

app.get('/api/goals', authMiddleware, async (req: any, res: any) => {
  try {
    const goalsResult = await pool.query(`
      SELECT *, TO_CHAR(deadline, 'YYYY-MM-DD') as deadline_str 
      FROM goals WHERE user_id = $1 ORDER BY created_at ASC
    `, [req.userId]);
    const formattedGoals = goalsResult.rows.map(g => ({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.target_amount),
      currentAmount: Number(g.current_amount),
      deadline: g.deadline_str || undefined,
      category: g.category,
      createdAt: g.created_at.toISOString()
    }));
    res.json(formattedGoals);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar metas.' });
  }
});

app.post('/api/goals', authMiddleware, async (req: any, res: any) => {
  const { name, targetAmount, deadline, category } = req.body;
  try {
    const newGoal = await pool.query(
      `INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, category) 
       VALUES ($1, $2, $3, 0, $4, $5) RETURNING *, TO_CHAR(deadline, 'YYYY-MM-DD') as deadline_str`,
      [req.userId, name, targetAmount, deadline || null, category]
    );
    const g = newGoal.rows[0];
    res.json({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.target_amount),
      currentAmount: Number(g.current_amount),
      deadline: g.deadline_str || undefined,
      category: g.category,
      createdAt: g.created_at.toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar meta.' });
  }
});

app.put('/api/goals/:id', authMiddleware, async (req: any, res: any) => {
  const { id } = req.params;
  const { name, targetAmount, currentAmount, deadline, category } = req.body;
  try {
    const check = await pool.query('SELECT id FROM goals WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Meta não encontrada.' });

    const updated = await pool.query(
      `UPDATE goals SET name = $1, target_amount = $2, current_amount = $3, deadline = $4, category = $5
       WHERE id = $6 RETURNING *, TO_CHAR(deadline, 'YYYY-MM-DD') as deadline_str`,
      [name, targetAmount, currentAmount, deadline || null, category, id]
    );
    const g = updated.rows[0];
    res.json({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.target_amount),
      currentAmount: Number(g.current_amount),
      deadline: g.deadline_str || undefined,
      category: g.category,
      createdAt: g.created_at.toISOString()
    });
  } catch (err) {
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

// --- BILLS ROUTES ---
app.get('/api/bills', authMiddleware, async (req: any, res: any) => {
  try {
    const billsResult = await pool.query(`
      SELECT *, TO_CHAR(due_date, 'YYYY-MM-DD') as due_date_str 
      FROM bills WHERE user_id = $1 ORDER BY due_date ASC
    `, [req.userId]);
    const formattedBills = billsResult.rows.map(b => ({
      id: b.id,
      description: b.description,
      amount: Number(b.amount),
      dueDate: b.due_date_str,
      isRecurring: b.is_recurring,
      status: b.status,
      createdAt: b.created_at.toISOString()
    }));
    res.json(formattedBills);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar contas.' });
  }
});

app.post('/api/bills', authMiddleware, async (req: any, res: any) => {
  const { description, amount, dueDate, isRecurring, status } = req.body;
  try {
    const newBill = await pool.query(
      `INSERT INTO bills (user_id, description, amount, due_date, is_recurring, status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *, TO_CHAR(due_date, 'YYYY-MM-DD') as due_date_str`,
      [req.userId, description, amount, dueDate, isRecurring || false, status || 'pending']
    );
    const b = newBill.rows[0];
    res.json({
      id: b.id,
      description: b.description,
      amount: Number(b.amount),
      dueDate: b.due_date_str,
      isRecurring: b.is_recurring,
      status: b.status,
      createdAt: b.created_at.toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar conta.' });
  }
});

app.put('/api/bills/:id', authMiddleware, async (req: any, res: any) => {
  const { id } = req.params;
  const { description, amount, dueDate, isRecurring, status } = req.body;
  try {
    const check = await pool.query('SELECT id FROM bills WHERE id = $1 AND user_id = $2', [id, req.userId]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Conta não encontrada.' });

    const updated = await pool.query(
      `UPDATE bills SET description = $1, amount = $2, due_date = $3, is_recurring = $4, status = $5
       WHERE id = $6 RETURNING *, TO_CHAR(due_date, 'YYYY-MM-DD') as due_date_str`,
      [description, amount, dueDate, isRecurring, status, id]
    );
    const b = updated.rows[0];
    res.json({
      id: b.id,
      description: b.description,
      amount: Number(b.amount),
      dueDate: b.due_date_str,
      isRecurring: b.is_recurring,
      status: b.status,
      createdAt: b.created_at.toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar conta.' });
  }
});

app.delete('/api/bills/:id', authMiddleware, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM bills WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Conta não encontrada.' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar conta.' });
  }
});

export default app;
