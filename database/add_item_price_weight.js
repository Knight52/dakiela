import {DatabaseSync} from "node:sqlite";

const database = new DatabaseSync("database.sqlite");
database.exec('create table if not exists new_inventory(\
    item_id integer null, \
    character integer not null, \
    item_name text not null, \
    amount integer default 0, \
    price real, \
    weight real, \
    selecting integer default 0 check(selecting between 0 and 1), \
    primary key (character, item_name))');
database.exec("insert into new_inventory (item_id, character, item_name, amount, selecting) \
    select item_id, character, item_name, amount, selecting from inventory");
database.exec("drop table inventory");
database.exec("alter table new_inventory rename to inventory");
database.close();