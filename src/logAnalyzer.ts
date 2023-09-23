import * as readline from 'readline';
import * as fs from 'fs';
const Table = require('cli-table3');

const logFilePath = '/Users/nia/Documents/Assignments/log-analysis/prod-api-prod-out.log';

const map = {
  "500": "Server Error",
  "404": "Not found",
  "200": "OK",
  "304": "Not changed",
  "206": "Partial Content",
  "400": "Bad Request",
  "401": "Unauthorized",
  "416": "Range Not Satisfiable",
  "422": "Unprocessable Entity"
}

const table = new Table({
  head: ['(index)', 'Status Code', 'Count'],
});

const endpointCounts: { [key: string]: number } = {};
const statusCodeCounts: { [key: string]: number } = {};

const readStream = readline.createInterface({
  input: fs.createReadStream(logFilePath)
});

const logLinePattern = /"([A-Z]+) ([^"]+)" (\d+) (\d+|-) "[^"]*" "[^"]*"/;

readStream.on('line', (line: string) => {

  const match = line.match(logLinePattern);
  if (match) {
    const endpoint = match[2];
    const statusCode = match[3];

    endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;

    statusCodeCounts[statusCode] = (statusCodeCounts[statusCode] || 0) + 1;
  }
});

readStream.on('close', () => {

  for (const statusCode in statusCodeCounts) {
    table.push([map[String(statusCode)], statusCode, statusCodeCounts[statusCode]]);
  }

  console.log(table.toString());
});
