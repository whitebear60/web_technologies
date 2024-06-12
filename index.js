import express from 'express';
import mysql from 'mysql2';
import fs from "node:fs"
import path from "node:path";
import url from "node:url";
import formidable from "formidable";
import {firstValues} from "formidable/src/helpers/firstValues.js";
import {StatusCodes} from 'http-status-codes'
import {GroupDto} from "./model/GroupDto.js";
import {ClassDto} from "./model/ClassDto.js";
import {ClassTimeDto} from "./model/ClassTimeDto.js";
import {ClassroomDto} from "./model/ClassroomDto.js";
import {ScheduleDto} from "./model/ScheduleDto.js";
import {StudentDto} from "./model/StudentDto.js";
import {TeacherDto} from "./model/TeacherDto.js";

/**
 * Basic SQL error handler
 * @param {mysql.QueryError} err
 * @param {e.Response} res
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
const config = JSON.parse(fs.readFileSync("config.json").toString());

const port = config.port;
const dbName = config.mysql.database;
const sql = mysql.createConnection({
    host: config.mysql.hostname,
    user: config.mysql.username,
    password: config.mysql.password,
    database: dbName
});

/**
 * @param {string} auth
 * @param {express.Response} res
 */
/*
const verifyJWT = async (auth, res) => {
    if (!auth) {
        const msg = "Authorization information not specified, please file a bug report"
        res.status(StatusCodes.UNAUTHORIZED).send(msg)
        console.log(msg)
        return
    }
    if (!auth.startsWith("Bearer")) {
        const msg = "Authorization header is incorrectly specified"
        res.status(StatusCodes.UNAUTHORIZED).send(msg)
        console.log(msg)
        return
    }
    const jwt = auth.split(" ")[1]
    const secret = new TextEncoder().encode(
        atob("c2VjcmV0X3Bhc3N3b3JkX2Zvcl9kaWdpdGFsX3NpZ25hdHVyZV9vZl90aGVfdG9rZW5fYnlfc3VuYnVyc3Q0"),
    )
    try {
        const msg = await jose.jwtVerify(jwt, secret)
        console.log(msg)
        return { protectedHeader: msg.protectedHeader, payload: msg.payload }
    } catch (err) {
        let message;
        switch (err.code) {
            case "ERR_JWT_EXPIRED":
                message = "This token is expired"
                console.log(err)
                break
            case 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED':
                message = "The signature verification has failed, this token is likely to have been tampered with"
                break
            default:
                message = "This token is invalid"
                console.log(err)
        }
        res.status(StatusCodes.UNAUTHORIZED).send(message)
        console.log("Unauthorized")
        return undefined
    }
}
*/

sql.connect((err) => {
    if (err) throw err;
    console.log("Connected!");
})

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
const handleGet = async (req, res) => {
/*    const verifiedJWT = await verifyJWT(req.headers.authorization, res)
    if (!verifiedJWT) return;*/

    const route = req.route.path.split("/")[1];
    const table = req.url.split('/')[1].toUpperCase();
    let query;

    // const column = "id";
    // const column = table.toLowerCase().concat("_id");
    let description = [];
    const joinIds = [];
    await sql.promise().query(`DESCRIBE ${dbName}.${table}`).then((out) => {
        const rows = out[0]
        rows.forEach((el) => {
            description.push(`\`${table}\`.\`${el.Field}\``)
            if (el.Field !== `${route}_id` && el.Field.endsWith("_id")) joinIds.push(el.Field)
        })
        console.log(`rows: ${JSON.stringify(rows)}`)
        // console.log(`fields: ${JSON.stringify(fields)}`)
    })
    if (!Object.keys(req.params).length) description = description.filter(item => item !== "picture")
    console.log("DESCRIBE: ", description)
    console.log("TABLE: ", table)
    query = `SELECT ${[...description]} FROM \`${table}\``;
    console.log("JOIN_ID: ", joinIds)
    switch (table.toLowerCase()) {
        case "classes":
            query = query.replace("`CLASSES`.`teacher`", "CONCAT_WS(\" \", T.last_name, T.first_name, T.middle_name) teacher")
            query = query.concat(` JOIN \`TEACHER\` T ON T.id = ${table}.teacher`)
            break;
        case "student":
            query = query.replace("`STUDENT`.`group`", "CONCAT_WS(\"-\", G.year, G.name) `group`")
            query = query.concat(` JOIN \`GROUP\` G ON G.id = ${table}.group`)
            break;
        case "schedule":
            query = query.replace("`SCHEDULE`.`time`", "CONCAT_WS(\", \", T.day, T.class_time) `time`")
            query = query.concat(` JOIN \`CLASSTIME\` T ON T.id = ${table}.time`)
            query = query.replace("`SCHEDULE`.`subject`", "C.class_name `subject`")
            query = query.concat(` JOIN \`CLASSES\` C ON C.id = ${table}.subject`)
            query = query.replace("`SCHEDULE`.`group`", "CONCAT_WS(\"-\", G.year, G.name) `group`")
            query = query.concat(` JOIN \`GROUP\` G ON G.id = ${table}.group`)
    }
/*    joinIds.forEach(el => {
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
    })*/
    // const dateFields = ["end", "packing_date", "date", "buy_date"]
    if (req.params.id) {
        query = query.concat(` WHERE \`${table}\`.id = ${req.params.id}`)
    }
    if(table.toUpperCase() === "GROUP" && !req.params.id) {
        query = query.concat(` ORDER BY \`year\`, \`name\``)
    }
    if(table.toUpperCase() === "SCHEDULE" && !req.params.id) {
        query = query.concat(` ORDER BY \`group\`, \`T\`.\`id\``)
    }
    console.log(query);
    sql.query(query, (err, rows) => {
        if(err) {
            handleSqlError(err, res);
            return;
        }
        const out = [];
        console.log(rows)

        switch (table) {
            case 'CLASSES':
                rows.forEach(el => out.push(new ClassDto(el)));
                break;
            case 'CLASSTIME':
                rows.forEach(el => out.push(new ClassTimeDto(el)));
                break;
            case 'CLASSROOM':
                rows.forEach(el => out.push(new ClassroomDto(el)));
                break;
            case 'GROUP':
                rows.forEach(el => out.push(new GroupDto(el)));
                break;
            case 'SCHEDULE':
                rows.forEach(el => out.push(new ScheduleDto(el)));
                break;
            case 'STUDENT':
                rows.forEach(el => out.push(new StudentDto(el)));
                break;
            case 'TEACHER':
                rows.forEach(el => out.push(new TeacherDto(el)));
                break;
        }
        console.log(out)
        out.forEach(dto => {
        console.log(dto)
            /*dateFields.forEach(el => {
                if (dto[el]) {
                    dto[el] = Intl.DateTimeFormat("uk-ua", {
                        "day": "numeric",
                        "month": "long",
                        "year": "numeric"
                    }).format(new Date(dto[el]))
                }
            })*/
        })

        res.status(StatusCodes.OK);
        if (out.length === 0) {
            res.sendStatus(StatusCodes.NOT_FOUND)
        } else {
            // out.length === 1 ? res.send(out[0]) : res.send(out);
            res.send(out);
        }
    })
}

/**
 * @param {Request} req
 * @param {Response} res
 */
const handleDelete = async (req, res) => {
    // const jwt = await verifyJWT(req.headers.authorization, res)
    // console.log(jwt)
    // if (!jwt.payload.roles.includes("administrator")) {
    //     res.sendStatus(StatusCodes.FORBIDDEN)
    //     return
    // }

    const table = req.url.split('/')[1].toUpperCase();
    if (!req.params.id) {
        res.sendStatus(StatusCodes.NOT_FOUND);
        console.error("Don't know what to delete")
    } else {
        let query = `DELETE FROM \`${table}\` WHERE \`${table}_id\` = \`${req.params.id}\``;
        sql.query(query, (err) => {
            if (err) {
                handleSqlError(err, res)
                return;
            }

            res.sendStatus(StatusCodes.OK);
        })
    }
}


/**
 * @param {Request} req
 * @param {Response} res
 * @param {string} route
 */
const handlePost = async (req, res, route) => {
    // const verifiedJWT = await verifyJWT(req.headers.authorization, res)
    // if (!verifiedJWT) return;
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

        console.log("fields: ", fields)
        Object.keys(fields).forEach(key => {
            console.log(fields[key]);
            console.log(key);
            if (typeof fields[key] === "string") {
                fields[key] = addslashes(fields[key])
            }
        })
        console.log("files: ", files)

        let dto;
        switch (route.toUpperCase()) {
            case 'CLASSES':
                dto = new ClassDto(fields);
                break;
            case 'CLASSTIME':
                dto = new ClassTimeDto(fields);
                break;
            case 'CLASSROOM':
                dto = new ClassroomDto(fields);
                break;
            case 'GROUP':
                dto = new GroupDto(fields);
                break;
            case 'SCHEDULE':
                dto = new ScheduleDto(fields);
                break;
            case 'STUDENT':
                dto = new StudentDto(fields);
                break;
            case 'TEACHER':
                dto = new TeacherDto(fields);
                break;
            default:
                // Default case if route doesn't match any known DTO
                res.status(StatusCodes.BAD_REQUEST).send('Invalid route');
                return;
        }
/*        if (files.picture) {
            const file = fs.readFileSync(files.picture[0].filepath)
            dto.picture = file.toString('base64')
        }*/
        const expectedInts = ['id', 'day', 'class_time', 'year', 'time', 'group'];

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
        for (let i = 0; i < values.length; i++) {
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
            /*if (key === "id") {
                query_fields = query_fields.concat(`\`${route.toLowerCase()}_${key}\`, `)
            } else {
                query_fields = query_fields.concat(`\`${key}\`, `)
            }*/
            query_fields = query_fields.concat(`\`${key}\`, `)

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
        const query = `INSERT INTO \`${route.toUpperCase()}\` (${query_fields}) VALUES (${query_values});`
        console.log(query)
        if (query) {
            sql.query(query, (err, result) => {
                if (err) {
                    if (err.code === 'ER_DATA_TOO_LONG') {
                        res.status(StatusCodes.REQUEST_TOO_LONG).send("The image is too large")
                        console.log("The image was too large")
                    } else {
                        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Internal server error")
                        console.error(err)
                    }
                } else {
                    console.log(result)
                    res.status(StatusCodes.OK).send({elementId: result.insertId});
                    // res.status(200).send(result.insertId);
                }
            })
        }
    });
};
app.use('/', express.static(path.join(currDir(import.meta.url), 'static')))

const standard_routes = ['classes', 'classtime', 'classroom', 'group', 'schedule', 'student', 'teacher']

standard_routes.forEach((route) => {
    app.get(`/${route}`, (req, res) => handleGet(req, res))
       .post(`/${route}`, (req, res) => handlePost(req, res, route))

    app.get(`/${route}/:id`, (req, res) => handleGet(req, res))
        .delete(`/${route}/:id`, (req, res) => handleDelete(req, res));

})

app.use(`/getconfig`, express.static("./static/get_fields.json"))

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

function addslashes( str ) {
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}
