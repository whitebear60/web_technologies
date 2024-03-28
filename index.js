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
 * @param {Response} res
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
 * @param {express.Request} req
 * @param {express.Response} res
 */
const handleGet = async (req, res) => {
    const route = req.route.path.split("/")[1];
    const table = req.url.split('/')[1].toUpperCase();
    let query = ""

        const column = table.toLowerCase().concat("_id");
    let description = [];
    const joinIds = [];
    await sql.promise().query(`DESCRIBE herb_institute.${table}`).then((out) => {
        const rows = out[0]
        rows.forEach((el) => {
            description.push(el.Field)
            if (el.Field !== `${route}_id` && el.Field.endsWith("_id")) joinIds.push(el.Field)
        })
        console.log(`rows: ${JSON.stringify(rows)}`)
        // console.log(`fields: ${JSON.stringify(fields)}`)
    })
    console.log(joinIds)
    if (!Object.keys(req.params).length) description = description.filter(item => item !== "picture")
    console.log("DESCRIBE: ", description)
    console.log("TABLE: ", table)
    query = `SELECT ${[...description]} FROM ${table}`;
    joinIds.forEach(el => {
        switch (el) {
            case "client_id":
                query = query.replace("client_id", "C.company client_id")
                query = query.concat(`\nJOIN CLIENT C ON C.client_id = ${table}.client_id`)
                break;
            case "seller_id":
                query = query.replace("seller_id", "SL.seller_name seller_id")
                query = query.concat(`\nJOIN SELLER SL ON SL.seller_id = ${table}.seller_id`)
                break;
            case "sort_id":
                query = query.replace("sort_id", "S.name sort_id");
                query = query.concat(`\nLEFT JOIN SORT S ON S.sort_id = ${table}.sort_id`)
        }
    })
    const dateFields = ["end", "packing_date", "date", "buy_date"]
    if (req.params.id) query = query.concat(` WHERE ${column} = ${req.params.id}`);
    console.log(query);
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
        out.forEach(dto => {
        console.log(dto)
            // console.log(Object.keys(dto).get("end"))
            dateFields.forEach(el => {
                if (dto[el]) {
                    dto[el] = Intl.DateTimeFormat("uk-ua", {
                        "day": "numeric",
                        "month": "long",
                        "year": "numeric"
                    }).format(new Date(dto[el]))
                }
            })
        })

        res.status = 200;
        if (out.length === 0) {
            res.sendStatus(404)
        } else {
            out.length === 1 ? res.send(out[0]) : res.send(out);
        }
    })
}

/**
 * @param {Request} req
 * @param {Response} res
 */
const handleDelete = (req, res) => {
    const table = req.url.split('/')[1].toUpperCase();
    if (!req.params.id) {
        res.sendStatus(401);
        console.error("Don't know what to delete")
    } else {
        let query = `DELETE FROM ${table} WHERE ${table}_id = ${req.params.id}`;
        sql.query(query, (err) => {
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
                sql.query(query, (err, result) => {
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
