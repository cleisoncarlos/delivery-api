import express from "express";
const app = express();
import { promises as fs } from "fs";
const { readFile, writeFile } = fs;


import deliveryRouter from './routes/delivery.js'
app.use(express.json());


app.use('/api', deliveryRouter)

const port = 3000;

const path =
  "C:/Users/Mentor/Desktop/delivery-api/src/data/pedidos.json";


app.listen(port, async () => {
  try {
    await readFile(path);
    console.log("API Started!");
  } catch (err) {
    const initialJson = {
      nextId: 1,
      pedidos: [],
    };

    writeFile(path, JSON.stringify(initialJson))
      .then(() => {
        console.log("API Started and File Created!");
      })
      .catch((err) => {
        console.log(err);
      });
  }
});
