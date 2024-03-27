import express from 'express';
import mysql from 'mysql2';
import fs from "node:fs"
import path from "node:path";
import url from "node:url";
import {SortDto} from "./model/SortDto.js";
import {ClientDto} from "./model/ClientDto.js";
import {SellerDto} from "./model/SellerDto.js";
import {PackingDto} from "./model/PackingDto.js";
import {NewSortDto} from "./model/newSortDto.js";
import {BatchDto} from "./model/BatchDto.js";
import {PurchaseDto} from "./model/PurchaseDto.js";
import {PaymentDto} from "./model/PaymentDto.js";
import formidable from "formidable";
import {firstValues} from "formidable/src/helpers/firstValues.js";
import {readBooleans} from "formidable/src/helpers/readBooleans.js";

/**
 * Basic SQL error handler
 * @param {mysql.QueryError} err
 * @param {Response<ResBody, LocalsObj>} res
 */
const handleSqlError = (err, res) => {
    console.log(500);
    res.sendStatus(500);
    console.error(err);
}

const currDir = (fileUrl) => {
    const __filename = url.fileURLToPath(fileUrl);
    return path.dirname(__filename);
}

const app = express();
const config = JSON.parse(fs.readFileSync("config.local.json").toString());

const port = config.port;

const sql = mysql.createConnection({
    host: config.mysql.hostname,
    user: config.mysql.username,
    password: config.mysql.password,
    database: config.mysql.database
});

sql.connect((err) => {
    if (err) throw err;
    console.log("Connected!");
})

/**
 * @param {express.Request<P, ResBody, ReqBody, ReqQuery, LocalsObj>} req
 * @param {express.Response<ResBody, LocalsObj>} res
 */
const handleGet = async (req, res) => {
    console.log(req.route)
    const table = req.url.split('/')[1].toUpperCase();
    let query = ""

        const column = table.toLowerCase().concat("_id");
    let description = [];
    await sql.promise().query(`DESCRIBE herb_institute.${table}`).then((out) => {
        const rows = out[0]
        const fields = out[1]
        rows.forEach(el => {
            description.push(el.Field)
        })
    })
    if (!Object.keys(req.params).length) description = description.filter(item => item !== "picture")
    console.log("DESCRIBE: ", description)
    console.log("TABLE: ", table)
    query = `SELECT ${[...description]} FROM ${table}`;
    console.log(query);
    if (table.toUpperCase() !== "PAYMENT") {
        if (req.params.id) query = query.concat(` WHERE ${column} = ${req.params.id}`);
    } else {
        if (req.params.batch_id && req.params.purchase_id) {
            const batch_id = req.params.batch_id;
            const purchase_id = req.params.purchase_id;
            console.log("BATCH_ID: ", batch_id);
            console.log(purchase_id);
            query = query.concat(` WHERE batch_id = ${batch_id} AND purchase_id = ${purchase_id}`);
        }
    }
    sql.query(query, (err, rows) => {
        if(err) {
            handleSqlError(err, res);
            return;
        }
        const out = [];
        // console.log(rows)

        switch (table) {
            case 'SORT':
                rows.forEach(el => {
                    const dto = new SortDto(el);
                    if (dto.picture) {
                        dto.picture = dto.picture.toString()
                    }
                    out.push(dto);
                });
                break;
            case 'BATCH':
                rows.forEach(el => out.push(new BatchDto(el)));
                break;
            case 'CLIENT':
                rows.forEach(el => out.push(new ClientDto(el)));
                break;
            case 'NEW_SORT':
                rows.forEach(el => out.push(new NewSortDto(el)));
                break;
            case 'PACKING':
                rows.forEach(el => out.push(new PackingDto(el)));
                break;
            case 'PURCHASE':
                rows.forEach(el => out.push(new PurchaseDto(el)));
                break;
            case 'SELLER':
                rows.forEach(el => out.push(new SellerDto(el)));
                break;
            case 'PAYMENT':
                rows.forEach(el => out.push(new PaymentDto(el)));
                break;
        }

        res.status = 200;
        if (out.length === 0) {
            res.sendStatus(404)
        } else {
            out.length === 1 ? res.send(out[0]) : res.send(out);
        }
    })
}

/**
 * @param {Request<P, ResBody, ReqBody, ReqQuery, LocalsObj>} req
 * @param {Response<ResBody, LocalsObj>} res
 */
const handleDelete = (req, res) => {
    const table = req.url.split('/')[1].toUpperCase();
    if (!req.params.id) {
        if (req.params.purchase_id && req.params.batch_id) {
            console.log(req.baseUrl)
            const query = `DELETE FROM PAYMENT WHERE purchase_id = ${req.params.purchase_id} AND batch_id = ${req.params.batch_id}`;
            sql.query(query, (err) => {
                if (err) {
                    handleSqlError(err, res);
                } else {
                    res.sendStatus(200);
                }
            })
        } else {
            res.sendStatus(401);
            console.error("Don't know what to delete")
        }
    } else {
        let query = `DELETE FROM ${table} WHERE ${table}_id = ${req.params.id}`;
        sql.query(query, (err, rows) => {
            if(err) {
                handleSqlError(err, res)
                return;
            }

            res.sendStatus(200);
        })
    }
}

app.use('/', express.static(path.join(currDir(import.meta.url), 'static')))

const standard_routes = ['batch', 'client', 'new_sort', 'packing', 'purchase', 'seller', 'sort']

/**
 * @param {Request} req
 * @param {Response} res
 * @param {string} route
 */
const handlePost = (req, res, route) => {
    {

        const form = formidable({
            allowEmptyFiles: true,
            minFileSize: 0
        });

        form.parse(req, (err, fieldsMultiple, files) => {
            if (err) {
                console.log(err);
                return;
            }

            const fields = firstValues(form, fieldsMultiple)

            // res.json({fields, file})
            const checkboxInputs = ['adaptation', 'frost', 'approved', 'is_cash']
            const parsedFields = readBooleans(fields, checkboxInputs)
            console.log("parsedFields: ", parsedFields)
            console.log("fields: ", fields)
            console.log("files: ", files)

            let dto;
            switch (route.toUpperCase()) {
                case 'SORT':
                    dto = new SortDto(parsedFields);
                    break;
                case 'BATCH':
                    dto = new BatchDto(parsedFields);
                    break;
                case 'CLIENT':
                    dto = new ClientDto(parsedFields);
                    break;
                case 'NEW_SORT':
                    dto = new NewSortDto(parsedFields);
                    break;
                case 'PACKING':
                    dto = new PackingDto(parsedFields);
                    break;
                case 'PURCHASE':
                    dto = new PurchaseDto(parsedFields);
                    break;
                case 'SELLER':
                    dto = new SellerDto(parsedFields);
                    break;
                case 'PAYMENT':
                    dto = new PaymentDto(parsedFields);
                    break;
                default:
                    // Default case if route doesn't match any known DTO
                    res.status(400).send('Invalid route');
                    return;
            }
            if (files.picture) {
                const file = fs.readFileSync(files.picture[0].filepath)
                dto.picture = file.toString('base64')
            }
            const expectedInts = ['id', 'year', 'period'];

            const keys = Object.keys(dto);
            let values = Object.values(dto);
            console.log("keys: ", keys)
            console.log(dto)
            console.log("values: ", values)
            for (let i = 0; i < keys.length; i++) {
                if (expectedInts.indexOf(keys[i]) !== -1) {
                    Object.defineProperty(dto, keys[i], {
                        "value": parseInt(values[i])
                    })
                }
            }

            console.log(dto)

            values = Object.values(dto);
            console.log("Values: ", values)
            let queryInput = {};
            for (let i = 0; i < values.length; i++){
                const el = values[i];
                if (el) {
                    console.log(Object.keys(dto)[i])
                    console.log(el)
                    Object.defineProperty(queryInput, Object.keys(dto)[i], {
                        value: el,
                        writable: true,
                        enumerable: true,
                        configurable: true
                    })
                }
            }
            let query_fields = "";
            let query_values = "";
            for (const key in queryInput) {
                if (key === "id") {
                    query_fields = query_fields.concat(`\`${route.toLowerCase()}_${key}\`, `)
                } else {
                    query_fields = query_fields.concat(`\`${key}\`, `)
                }
                const val = queryInput[key]
                if (typeof val === 'string') {
                    query_values = query_values.concat(`'${queryInput[key]}', `)
                } else {
                    query_values = query_values.concat(queryInput[key], ', ')
                }
            }
            query_fields = query_fields.split(", ")
            query_fields.pop()
            query_fields = query_fields.join(", ")

            query_values = query_values.split(", ")
            query_values.pop()
            query_values.join(", ")
            const query = `INSERT INTO ${route.toUpperCase()} (${query_fields}) VALUES (${query_values});`
            console.log(query)
            if (query) {
                sql.query(query, (err, result, fields) => {
                    if (err) {
                        if (err.code === 'ER_DATA_TOO_LONG') {
                            res.status(413).send("The image is too large")
                            console.log("The image was too large")
                        } else {
                            res.status(500).send("Internal server error")
                            console.error(err)
                        }
                    } else{
                        console.log(result)
                        res.status(200).send({elementId: result.insertId});
                        // res.status(200).send(result.insertId);
                    }
                })
            }
        });
        // console.log(req);
    }
};
standard_routes.forEach((route) => {
    app.get(`/${route}`, (req, res) => handleGet(req, res))
       .post(`/${route}`, (req, res) => handlePost(req, res, route))

    app.get(`/${route}/:id`, (req, res) => handleGet(req, res))
        .delete(`/${route}/:id`, (req, res) => handleDelete(req, res));

})

app.get(`/payment`, (req, res) => handleGet(req, res))
    .post(`/payment`, (req, res) => handlePost(req, res, "payment"))

app.get(`/payment/:purchase_id/:batch_id`, (req, res) => handleGet(req, res))
    .delete(`/payment/:purchase_id/:batch_id`, (req, res) => handleDelete(req, res));

app.use(`/getconfig`, express.static("./static/get_fields.json"))

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
