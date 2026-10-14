import {DatabaseSync} from "node:sqlite";
import { databasePath } from "../constants.js";
import * as csv from "fast-csv";
import * as fs from 'fs';

var csvPath = process.argv[2];
var time = Date.now();
var database = new DatabaseSync(databasePath);
var query = database.prepare("insert or replace into occupation (name, income, upkeep, employer, establishment) values (?, ?, ?, ?, ?)");
fs.createReadStream(csvPath).pipe(csv.parse({headers: true}))
    .on('data', row =>
    {
        console.log("Importing " + row.Name + "...");
        query.run(row.Name, row.Income, row.Upkeep, row["Income from"], row.Establishment);
    })
    .on('end', (rowCount) => 
    { 
        database.close(); 
        console.log("Done in " + (Date.now() - time) + " milliseconds.");
    });