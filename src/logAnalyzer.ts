import * as readline from 'readline';
import * as fs from 'fs';
const Table = require('cli-table3');

const logFilePath = process.cwd()+'/';

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

function timeDifference(first_line: String, last_line: String){

  const dateTimePattern = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2} \+\d{2}:\d{2}):/;

  const match1 = first_line.match(dateTimePattern);
  const match2 = last_line.match(dateTimePattern);

  if (match1 && match2) {
    const date1 = new Date(match1[1]);
    const date2 = new Date(match2[1]);
    const timeDifferenceMin = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60));
    return timeDifferenceMin;
  } else {
    return -1;
  }
}


async function analyseLog(log_file_name: String){

  let total_api_count = 0, interval_time = 0, first_line=null, last_line=null;

  const table = new Table({
    head: ['(index)', 'Status Code', 'Count'],
  });
  
  const endpointCounts: { [key: string]: number } = {};
  const statusCodeCounts: { [key: string]: number } = {};


  const readStream = readline.createInterface({
    input: fs.createReadStream(logFilePath+log_file_name)
  });
  
  const logLinePattern = /"([A-Z]+) ([^"]+)" (\d+) (\d+|-) "[^"]*" "[^"]*"/;
  
  readStream.on('line', (line: string) => {

    if(!first_line){
      first_line = line;
    }

    last_line = line;

    const match = line.match(logLinePattern);
    if (match) {
      const endpoint = match[2];
      const statusCode = match[3];
      endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
      statusCodeCounts[statusCode] = (statusCodeCounts[statusCode] || 0) + 1;
    }
  });


  readStream.on('close', () => {

    let time_interval = timeDifference(first_line, last_line)

    for (const endpoint in endpointCounts) {
      table.push([endpoint, endpointCounts[endpoint]]);
    }
  
    for (const statusCode in statusCodeCounts) {
      total_api_count += statusCodeCounts[statusCode]
      table.push([map[String(statusCode)], statusCode, statusCodeCounts[statusCode]]);
    }

    const api_calls_per_min = total_api_count/time_interval;

    table.push(['Total Count', "-", total_api_count]);

    table.push(["Total Count Per Min", "-", api_calls_per_min]);

    console.log("Log File Name: ", log_file_name)

    console.log(table.toString());
  });
  
}

const log_files = ["prod-api-prod-out.log", "api-dev-out.log", "api-prod-out.log"]


try{
  log_files.forEach(async function (log) {
    await analyseLog(log)
  });
}
catch(error){
  console.log("error", error)
}

