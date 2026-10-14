import {DatabaseSync} from "node:sqlite";
import { databasePath } from "../constants.js";
import * as csv from "fast-csv";
import * as fs from 'fs';

var csvPath = process.argv[2];
var cityName = process.argv[3];
var database = new DatabaseSync(databasePath);
var q = database.prepare("delete from people where city = ?");
q.run(cityName);
q = database.prepare("insert or replace into city (name, tax) values (?, ?)");
q.run(cityName, parseFloat(process.argv[4]));

q = database.prepare("select * from establishment");
var establishments = q.all();
var time = Date.now();
var establishmentRequired = {};
var query = database.prepare("insert into people (id, name, gender, age, city, species, income, upkeep, \
    role1, role2, role3, role4, \
    house1, house2, house3, house4, \
    relationship1, relationship2, relationship3, relationship4, \
    relationship5, relationship6, relationship7, relationship8) \
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
fs.createReadStream(csvPath).pipe(csv.parse({headers: true}))
    .on('data', row =>
    {
        console.log("\rImporting " + row.Name + " for city " + cityName + "\r");
        query.run(row.ID, row.Name, row.Gender, parseInt(row.Age), cityName, row.Species, row.Income, row.Upkeep,
            row.Role1, row.Role2, row.Role3, row.Role4, row.House1, row.House2, row.House3, row.House4,
            row.Relationship1, row.Relationship2, row.Relationship3, row.Relationship4, 
            row.Relationship5, row.Relationship6, row.Relationship7, row.Relationship8);

        if(row.House1 != "")
        {
            if(establishmentRequired[row.House1] == null)
                establishmentRequired[row.House1] = 1;
            else
                establishmentRequired[row.House1]++;
        }
    })
    .on('end', (rowCount) => 
    { 
        query = database.prepare("insert into building(establishment_id, occupant_count, city) values (?, ?, ?)");
        for(var key in establishmentRequired)
        {
            var e = establishments.find(x => x.name == key);
            var count = establishmentRequired[key];
            while(count > 0)
            {
                console.log("Creating " + e.name);
                query.run(e.id, Math.min(e.capacity, count), cityName);
                count -= e.capacity;
            }
        }
        database.close(); 
        console.log("Done in " + (Date.now() - time) + " milliseconds.");
    });