import {DatabaseSync} from "node:sqlite";

const database = new DatabaseSync("database.sqlite");
database.exec("alter table inventory add column selecting integer default 0 check(selecting between 0 and 1)");
database.exec("update inventory set selecting = 1 where ROWID in (select ROWID from inventory group by character)");
database.close();