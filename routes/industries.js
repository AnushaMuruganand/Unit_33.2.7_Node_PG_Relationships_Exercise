const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

// listing all industries, which should show the company code(s) for that industry
router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT i.code, i.industry, ci.company_code FROM industries AS i 
            LEFT JOIN companies_industries as ci
            ON i.code = ci.industry_code
            `);
        return res.json({ industries: results.rows });

    } catch (e) {
        return next(e);
    }
})

// adding an industry
router.post("/", async (req, res, next) => {
    try {
        const { code, industry } = req.body;
        const result = await db.query(
            `INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry`, [code, industry]);
        return res.status(201).json({ industry: result.rows[0] });

    } catch (e) {
        return next(e);
    }
})

module.exports = router;