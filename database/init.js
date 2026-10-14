import {DatabaseSync} from "node:sqlite";

const database = new DatabaseSync("database.sqlite");

database.exec('CREATE TABLE IF NOT EXISTS  character(\
    id INTEGER PRIMARY KEY, \
    owner TEXT, \
    name TEXT UNIQUE NOT NULL, \
    link TEXT UNIQUE, \
    workweek INTEGER DEFAULT 0, \
    coin REAL DEFAULT 0, \
    current INTEGER CHECK(current BETWEEN 0 AND 1) DEFAULT 0, \
    guest INTEGER CHECK(guest BETWEEN 0 AND 1) DEFAULT 0, \
    last_active TEXT DEFAULT current_timestamp) \
    STRICT');
database.exec('CREATE TABLE IF NOT EXISTS  item(\
    id INTEGER PRIMARY KEY, \
    name TEXT UNIQUE, \
    weight REAL, \
    price REAL, \
    consumable INTEGER CHECK(consumable BETWEEN 0 AND 1))');
database.exec('CREATE TABLE IF NOT EXISTS  guild(\
    id INTEGER PRIMARY KEY, \
    name TEXT, \
    coin INTEGER DEFAULT 0)');
database.exec('CREATE TABLE IF NOT EXISTS  discord_channel(\
    id INTEGER PRIMARY KEY, \
    for TEXT,\
    channel_id TEXT)');
database.exec('create table if not exists inventory(\
    item_id integer null, \
    character integer not null, \
    item_name text not null, \
    amount integer default 0, \
    primary key (character, item_name))')
database.exec('create table if not exists shop(\
    id integer primary key, \
    name text unique, \
    npc1 integer default 0, \
    npc2 integer default 0, \
    npc3 integer default 0)');
database.exec('create table if not exists people( \
    id integer not null, \
    name text, \
    city text not null, \
    gender text, \
    age int, \
    species text, \
    income text not null, \
    upkeep text not null, \
    wealth int default 0, \
    role1 text, \
    role2 text, \
    role3 text, \
    role4 text, \
    house1 text, \
    house2 text, \
    house3 text, \
    house4 text, \
    relationship1 text, \
    relationship2 text, \
    relationship3 text, \
    relationship4 text, \
    relationship5 text, \
    relationship6 text, \
    relationship7 text, \
    relationship8 text, \
    primary key(id, city))');
database.exec('create table if not exists city( \
    id integer primary key, \
    name text unique, \
    tax real, \
    treasury default 0)');
database.exec('create table if not exists occupation( \
    id integer primary key, \
    name text unique, \
    income text, \
    upkeep text, \
    employer text, \
    establishment text)');
database.exec('create table if not exists establishment( \
    id integer primary key, \
    name text not null, \
    capacity integer not null, \
    upkeep text, \
    upkeepperoccupant text)');
database.exec('create table if not exists building( \
    id integer primary key, \
    establishment_id integer not null, \
    occupant_count integer, \
    city text not null)');
database.exec('create table if not exists configuration( \
    name text primary key, \
    role text, \
    channel text)');
database.exec('create table if not exists button( \
    custom_id text primary key, \
    expire_at number not null, \
    message_id text not null, \
    channel_id text not null)');
database.exec('create table if not exists workweek_click( \
    button_id text not null, \
    character integer not null, \
    primary key(button_id, character))');
/*database.exec('CREATE TABLE schedule(\
    id INTEGER PRIMARY KEY, \
    channel_id TEXT, \
    role TEXT, \
    message TEXT, \
    cron TEXT, \
    owner TEXT)')*/

database.close();