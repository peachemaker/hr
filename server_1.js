const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// Настройки подключения к БД
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "hr",
  password: "Gav!nBels0n",
  port: 5432,
});

app.listen(3000, () => console.log("http://localhost:3000"));
