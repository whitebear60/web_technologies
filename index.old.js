import http from "node:http";

const port = 8080;
const hostname = "localhost";

/**
 *
 * @param {ServerResponse} res
 * @param {number} code
 */
const throwError = (res, code) => {
    console.log(`Throwing a ${code} error`)
    res.setHeader('Content-Type', "text/plain");
    res.writeHead(code);
    res.end("ERROR: Please provide two numbers in the URL")
}

/**
 * The main logic of the server
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 */
const listener = (req, res) => {
    console.info(`Request URL: ${req.url}`)
    const numbers = req.url.toLowerCase().slice(1).split("/");
    if (numbers.length !== 2) {
        throwError(res, 404);
        return;
    }
    for (let i = 0; i < numbers.length; i++){
        const el = numbers[i];
        if (/^[0-9]+$/.test(el)) {
            numbers[i] = parseInt(el);
        } else {
            throwError(res, 404);
            return;
        }
    }
    const result = numbers[0] * numbers[1];
    console.log(`Return value: ${result}`)
    res.setHeader('Content-Type', "text/plain");
    res.writeHead(200);
    res.end(result.toString());
}

const server = http.createServer(listener)

server.listen(port, hostname, () => {
    console.info(`Server is running at http://${hostname}:${port}`)
})