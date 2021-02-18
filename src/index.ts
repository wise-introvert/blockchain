import express, { Application, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const { PORT = 2300 } = process.env;
const app: Application = express();

app.get("/", (req: Request, res: Response): void => {
  res
    .status(StatusCodes.OK)
    .json({
      hello: "World!",
    })
    .end();
});

app.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});
