
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || `http://localhost:${PORT}/api/expenses`;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/api/config", (_req, res) => {
    res.json({ apiUrl: API_URL });
});

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

pool.connect()
    .then((client) => {
        console.log("Connected to PostgreSQL successfully!");
        client.release();
    })
    .catch((err) => {
        console.error("Database connection error:", err.message);
    });

const expenseColumns = `
    id,
    title,
    amount::float8 AS amount,
    category,
    to_char(date, 'YYYY-MM-DD') AS date
`;

const allowedCategories = [
    "Food",
    "Transport",
    "Bills",
    "Entertainment",
    "Other"
];

function validateExpense(body) {
    const { title, amount, category, date } = body;

    if (typeof title !== "string" || !title.trim()) {
        return "Title is required.";
    }

    if (title.trim().length > 100) {
        return "Title must not exceed 100 characters.";
    }

    if (
        amount === undefined ||
        amount === null ||
        amount === "" ||
        !Number.isFinite(Number(amount)) ||
        Number(amount) <= 0
    ) {
        return "Amount must be a number greater than 0.";
    }

    if (Math.round(Number(amount) * 100) !== Number(amount) * 100) {
        return "Amount must have at most two decimal places.";
    }

    if (!allowedCategories.includes(category)) {
        return "Category must be Food, Transport, Bills, Entertainment, or Other.";
    }

    if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
        return "Date must be in YYYY-MM-DD format.";
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date
    ) {
        return "Please provide a valid date.";
    }

    return null;
}

function validateId(id) {
    return /^\d+$/.test(id) &&
        Number.isSafeInteger(Number(id)) &&
        Number(id) > 0;
}

app.get("/", (req, res) => {
    res.send("Expenses Tracker API is running!");
});


// GET All Expenses
app.get("/api/expenses", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ${expenseColumns}
            FROM expenses
            ORDER BY id ASC
        `);

        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error fetching expenses:", err.message);

        res.status(500).json({
            message: "Failed to fetch expenses."
        });
    }
});

// GET Expense by ID
app.get("/api/expenses/:id", async (req, res) => {
    const { id } = req.params;

    if (!validateId(id)) {
        return res.status(400).json({
            message: "Invalid expense ID."
        });
    }

    try {
        const result = await pool.query(
            `SELECT ${expenseColumns}
            FROM expenses
            WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching expense:", err.message);

        res.status(500).json({
            message: "Failed to fetch expense."
        });
    }
});

// CREATE Expense
app.post("/api/expenses", async (req, res) => {
    const error = validateExpense(req.body);

    if (error) {
        return res.status(400).json({
            message: error
        });
    }

    const { title, amount, category, date } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO expenses
                (title, amount, category, date)
            VALUES ($1, $2, $3, $4)
            RETURNING ${expenseColumns}`,
            [title.trim(), amount, category, date]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating expense:", err.message);

        res.status(500).json({
            message: "Failed to create expense."
        });
    }
});

// PUT Expense
app.put("/api/expenses/:id", async (req, res) => {
    const { id } = req.params;

    if (!validateId(id)) {
        return res.status(400).json({
            message: "Invalid expense ID."
        });
    }

    const error = validateExpense(req.body);

    if (error) {
        return res.status(400).json({
            message: error
        });
    }

    const { title, amount, category, date } = req.body;

    try {
        const result = await pool.query(
            `UPDATE expenses
            SET title = $1,
            amount = $2,
            category = $3,
            date = $4
            WHERE id = $5
            RETURNING ${expenseColumns}`,
            [title.trim(), amount, category, date, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Error updating expense:", err.message);

        res.status(500).json({
            message: "Failed to update expense."
        });
    }
});

// DELETE Expense
app.delete("/api/expenses/:id", async (req, res) => {
    const { id } = req.params;

    if (!validateId(id)) {
        return res.status(400).json({
            message: "Invalid expense ID."
        });
    }

    try {
        const result = await pool.query(
            `DELETE FROM expenses
            WHERE id = $1
            RETURNING id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found."
            });
        }

        res.status(200).json({
            message: "Expense deleted successfully.",
            id: result.rows[0].id
        });
    } catch (err) {
        console.error("Error deleting expense:", err.message);

        res.status(500).json({
            message: "Failed to delete expense."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
