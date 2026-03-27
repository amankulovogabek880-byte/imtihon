const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const PORT = 3000;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "blog_platform",
  password: "root", 
  port: 5432,
});

app.post("/users", async (req, res) => {
  const { name, email } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO users(name, email) VALUES($1, $2) RETURNING *",
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User topilmadi" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "xato" });
  }
});

app.post("/posts", async (req, res) => {
  const { title, content, user_id } = req.body;
  try {
    const userCheck = await pool.query("SELECT * FROM users WHERE id = $1", [user_id]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User topilmadi" });
    }

    const result = await pool.query(
      "INSERT INTO posts(title, content, user_id) VALUES($1, $2, $3) RETURNING *",
      [title, content, user_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "xato" });
  }
});

app.get("/posts", async (req, res) => {
  let {
    page = 1,
    limit = 10,
    search = "",
    author,
    sortBy = "id",
    sortOrder = "asc",
  } = req.query;

  page = Number(page);
  limit = Number(limit);

  if (page < 1) page = 1;
  if (limit < 1) limit = 10;

  const offset = (page - 1) * limit;

  const allowedSortBy = ["id", "title", "created_at"];
  const allowedSortOrder = ["asc", "desc"];

  if (!allowedSortBy.includes(sortBy)) sortBy = "id";
  if (!allowedSortOrder.includes(sortOrder.toLowerCase())) sortOrder = "asc";

  let query = `
    SELECT posts.*, users.name AS author_name
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE 1=1
  `;

  const values = [];
  let index = 1;

  if (search) {
    query += ` AND (posts.title ILIKE $${index} OR posts.content ILIKE $${index})`;
    values.push(`%${search}%`);
    index++;
  }

  if (author) {
    query += ` AND posts.user_id = $${index}`;
    values.push(author);
    index++;
  }

  query += ` ORDER BY posts.${sortBy} ${sortOrder}`;
  query += ` LIMIT $${index} OFFSET $${index + 1}`;
  values.push(limit, offset);

  try {
    const result = await pool.query(query, values);
    res.json({
      page,
      limit,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({ error: "togri kiritmaguncha xato" });
  }
});

app.get("/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT posts.*, users.name AS author_name, users.email AS author_email
       FROM posts
       JOIN users ON posts.user_id = users.id
       WHERE posts.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post topilmadi" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "xato" });
  }
});
app.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM posts WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post topilmadi" });
    }

    res.json({ message: "Post ochirildi", deleted: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/comments", async (req, res) => {
  const { text, post_id, user_id } = req.body;
  try {
    const postCheck = await pool.query("SELECT * FROM posts WHERE id = $1", [post_id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: "Post topilmadi" });
    }

    const userCheck = await pool.query("SELECT * FROM users WHERE id = $1", [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User topilmadi" });
    }

    const result = await pool.query(
      "INSERT INTO comments(text, post_id, user_id) VALUES($1, $2, $3) RETURNING *",
      [text.trim(), post_id, user_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/posts/:id/comments", async (req, res) => {
  const { id } = req.params;

  try {
    const postCheck = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: "Post topilmadi" });
    }

    const result = await pool.query(
      `SELECT comments.*, users.name AS commenter_name, users.email AS commenter_email
       FROM comments
       JOIN users ON comments.user_id = users.id
       WHERE comments.post_id = $1
       ORDER BY comments.id ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/comments/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM comments WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Comment topilmadi" });
    }

    res.json({ message: "Comment ochirildi", deleted: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
app.delete("/posts/:id/like", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM likes WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "likiestopilmadi" });
    }

    res.json({ message: "likes ochirildi", deleted: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/users/:id/posts", async (req, res) => {
  const { id } = req.params;
  try {
    const userCheck = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User topilmadi" });
    }

    const result = await pool.query(
      "SELECT * FROM posts WHERE user_id = $1 ORDER BY id ASC",
      [id]
    );


    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "xatolik bor serverda " });
  }
});
app.get("/", (req, res) => {
  res.send("Blog Platform API ishlayapti");
});



app.get('/likes',async (req,res)=>{
  const {id}=req.body()

  c
})
app.listen(PORT, async () => {
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connected");
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (error) {
    console.log("xatolik bor:", error.message);
  }
});


