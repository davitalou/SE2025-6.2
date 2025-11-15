#!/usr/bin/env node
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sequelizePath = path.resolve("node_modules", ".bin", "sequelize-cli");
const configPath = path.resolve(__dirname, "config", "config.js");
const migrationsPath = path.resolve(__dirname, "migrations");
const seedersPath = path.resolve(__dirname, "seeders");

const command = process.argv[2];

function run(cmd) {
  const fullCmd = `${sequelizePath} ${cmd} --config ${configPath} --migrations-path ${migrationsPath} --seeders-path ${seedersPath}`;
  console.log(`Running: ${fullCmd}`);
  exec(fullCmd, (err, stdout, stderr) => {
    if (err) console.error("", stderr);
    else console.log(stdout, "\nDone");
  });
}

switch (command) {
  case "migrate":
    run("db:migrate");
    break;
  case "undo":
    run("db:migrate:undo:all");
    break;
  case "seed":
    run("db:seed:all");
    break;
  default:
    console.log("Usage: node node-console/cli.js [migrate|undo|seed]");
}
