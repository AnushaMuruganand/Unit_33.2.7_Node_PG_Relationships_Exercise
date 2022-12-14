const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT id, comp_code FROM invoices`);
        return res.json({ invoices: results.rows });
    } catch (e) {
        return next(e);
    }
});

/** GET /[id] => detail on invoice
 *
 * =>  {invoices: {id,
 *                amt,
 *                paid,
 *                add_date,
 *                paid_date,
 *                company: {code, name, description}}}
 *
 * */

router.get("/:id", async function (req, res, next) {
    try {
        let id = req.params.id;
  
        const result = await db.query(
            `SELECT i.id, 
                    i.comp_code, 
                    i.amt, 
                    i.paid, 
                    i.add_date, 
                    i.paid_date, 
                    c.name, 
                    c.description 
             FROM invoices AS i
               INNER JOIN companies AS c ON (i.comp_code = c.code)  
             WHERE id = $1`,
            [id]);
  
        if (result.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404);
        }
  
        const data = result.rows[0];
        const invoice = {
            id: data.id,
            company: {
                code: data.comp_code,
                name: data.name,
                description: data.description,
            },
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
        };
  
        return res.json({ "invoice": invoice });
    }
  
    catch (err) {
        return next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const result = await db.query('INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *', [comp_code, amt]);
        return res.status(201).json({ invoice: result.rows[0] });
    } catch (e) {
        return next(e);
    }
});
  
router.patch('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt, paid } = req.body;

        let paidDate = null;

        // Getting the "paid" and "paid_date" column value based off of ID
        const currResult = await db.query('SELECT paid, paid_date FROM invoices WHERE id = $1',[id]);

        if (currResult.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404);
        }

        // Storing the "paid_date" to a variable
        const currPaidDate = currResult.rows[0].paid_date;

        /** If paying unpaid invoice: sets paid_date to today
            If un-paying: sets paid_date to null
            Else: keep current paid_date */
        if (!currPaidDate && paid) {
            paidDate = new Date();
        } else if (!paid) {
            paidDate = null;
        } else {
            paidDate = currPaidDate;
        }

        const result = await db.query('UPDATE invoices SET  amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING *', [amt, paid, paidDate, id]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Can't update an invoice with id of ${id}`, 404);
        }
        return res.send({ invoice: result.rows[0] });
    } catch (e) {
        return next(e);
    }
});
  
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM invoices WHERE id=$1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`Can't find the invoice with id of ${id}`, 404);
        }
        return res.send({ status: "deleted" });  
    } catch (e) {
        return next(e);
    }
});

module.exports = router;