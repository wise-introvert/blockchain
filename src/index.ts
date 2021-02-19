import { SHA256 } from "crypto-js";
import express, { Application, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { v4 } from "uuid";

import { Block, Blockchain, IBlockchain, Transaction } from "./blockchain";

const { PORT = 2300 } = process.env;
const app: Application = express();
const thisNodeAddress: string = SHA256(v4()).toString();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const blockchain: IBlockchain = new Blockchain();

app.get(
  "/blockchain/chain",
  (_, res: Response<{ blockchain: IBlockchain }>): void => {
    res.status(StatusCodes.OK).json({
      blockchain,
    });
  }
);

app.post(
  "/blockchain/transaction",
  (
    req: Request<{ transaction: Omit<Transaction, "timestamp"> }>,
    res: Response<{ blockIndex: number }>
  ): void => {
    const blockIndex: number = blockchain.createNewTransaction(
      req.body.transaction.amount,
      req.body.transaction.sender,
      req.body.transaction.recipient
    );

    res.status(StatusCodes.CREATED).json({
      blockIndex,
    });
  }
);

app.get(
  "/blockchain/mine",
  (req: Request, res: Response<{ block: Block }>): void => {
    // reward
    blockchain.createNewTransaction(12.5, "00", thisNodeAddress);

    // mine
    const newBlock: Block = blockchain.mine();

    // response
    res
      .status(StatusCodes.CREATED)
      .json({
        block: newBlock,
      })
      .end();
  }
);

app.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});
