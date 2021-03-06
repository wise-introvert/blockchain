import { SHA256 } from "crypto-js";
import express, { Application, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import axios, { AxiosResponse } from "axios";
import { v4 } from "uuid";
import { isEmpty } from "lodash";
import morgan from "morgan";

import { Block, Blockchain, IBlockchain, Transaction } from "./blockchain";

const PORT: number = parseInt(process.argv[2]);
const app: Application = express();
const thisNodeAddress: string = SHA256(v4()).toString();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

const blockchain: IBlockchain = new Blockchain();

interface BulkNetworkRegistrationResponse {
  success: boolean;
}

app.get(
  "/blockchain/genisis",
  async (_, res: Response<{ block: Block }>): Promise<void> => {
    const genisis: Block = blockchain.mine();
    let promises: Promise<AxiosResponse<any>>[] = [];

    [...blockchain.network, blockchain.currentNodeURL].map(
      (node: string): void => {
        promises.push(
          axios.post(
            `${node}/blockchain/mine`,
            {
              block: genisis,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
        );
      }
    );

    await Promise.all(promises);
    res
      .status(StatusCodes.CREATED)
      .json({
        block: genisis,
      })
      .end();
  }
);

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
    req: Request<{ transaction: Transaction }>,
    res: Response<{ blockIndex: number }>
  ): void => {
    // register the new transaction
    const blockIndex: number = blockchain.registerNewTransaction(
      req.body.transaction
    );

    res
      .status(StatusCodes.ACCEPTED)
      .json({
        blockIndex,
      })
      .end();
  }
);

app.post(
  "/blockchain/transaction/broadcast",
  async (
    req: Request<{ transaction: Omit<Transaction, "timestamp" | "id"> }>,
    res: Response<{ blockIndex: number }>
  ): Promise<void> => {
    // create a transaction
    const newTransaction: Transaction = blockchain.createNewTransaction(
      req.body.transaction.amount,
      req.body.transaction.sender,
      req.body.transaction.recipient
    );

    let broadcastPromises: Promise<any>[] = [];

    // sync network nodes to have this, new, transaction
    [...blockchain.network, blockchain.currentNodeURL].map(
      (node: string): void => {
        broadcastPromises.push(
          axios.post(
            `${node}/blockchain/transaction`,
            { transaction: newTransaction },
            { headers: { "Content-Type": "application/json" } }
          )
        );
      }
    );

    await Promise.all(broadcastPromises);

    res
      .status(StatusCodes.ACCEPTED)
      .json({
        blockIndex:
          (isEmpty(blockchain.getLastBlock())
            ? { index: 0 }
            : blockchain.getLastBlock()
          ).index + 1,
      })
      .end();
  }
);

app.get(
  "/blockchain/mine/broadcast",
  async (_, res: Response<{ chain: Block[] }>): Promise<void> => {
    // prepare reward
    const amount: number = 12.5,
      sender: string = "00",
      recipient: string = thisNodeAddress;

    await axios.post(
      `${blockchain.currentNodeURL}/blockchain/transaction/broadcast`,
      { transaction: { amount, sender, recipient } },
      { headers: { "Content-Type": "application/json" } }
    );

    // mine the new block
    const newBlock: Block = blockchain.mine();

    let broadcastPromises: Promise<{ chain: Block[] }>[] = [];

    // broadcast newly mined block
    [...blockchain.network, blockchain.currentNodeURL].map(
      (node: string): void => {
        broadcastPromises.push(
          axios.post(
            `${node}/blockchain/mine`,
            {
              block: newBlock,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
        );
      }
    );

    await Promise.all(broadcastPromises);
    res
      .status(StatusCodes.CREATED)
      .json({
        chain: blockchain.getChain(),
      })
      .end();
  }
);

app.post(
  "/blockchain/mine",
  (
    req: Request<{ block: Block }>,
    res: Response<{ chain: Block[] } | { error: string }>
  ): void => {
    if (blockchain.getChain().length === 0) {
      // genisis block
      // do not validate
      blockchain.registerBlock(req.body.block);

      res
        .status(StatusCodes.ACCEPTED)
        .json({
          chain: blockchain.getChain(),
        })
        .end();
    } else {
      const newBlock: Block = req.body.block;
      const lastBlock: Block = blockchain.getLastBlock();

      // validate the new block
      const correctHash: boolean =
        lastBlock.hash === newBlock.previousBlockHash;
      const correctIndex: boolean = lastBlock.index + 1 === newBlock.index;
      const isBlockValid: boolean = correctHash && correctIndex;

      console.log({
        hash: {
          lastBlock: lastBlock.hash,
          newBlock: newBlock.previousBlockHash,
        },
        index: { lastBlock: lastBlock.index, newBlock: newBlock.index },
        isBlockValid,
        correctHash,
        correctIndex,
      });

      if (isBlockValid) {
        console.log("inside if");
        // push the new block into the chain
        blockchain.registerBlock(req.body.block);

        res
          .status(StatusCodes.ACCEPTED)
          .json({
            chain: blockchain.getChain(),
          })
          .end();
      } else {
        console.log("inside else");
        res
          .status(StatusCodes.CONFLICT)
          .json({
            error: "Invalid block",
          })
          .end();
      }
    }
  }
);

app.get("/network", (_, res: Response<{ network: string[] }>): void => {
  res
    .status(StatusCodes.OK)
    .json({
      network: blockchain.network,
    })
    .end();
});

app.post(
  "/network/broadcast",
  async (
    req: Request<{ newNodeURL: string }>,
    res: Response<{
      confirmation: BulkNetworkRegistrationResponse;
    }>
  ): Promise<void> => {
    const { newNodeURL } = req.body;
    let updatedNetwork: string[] = blockchain.network;
    let broadcastPromises: Promise<any>[] = [];

    // save it to the current network
    if (blockchain.network.indexOf(newNodeURL) === -1) {
      updatedNetwork = blockchain.updateNetwork(newNodeURL);
    }

    // broadcast it to the entire network
    updatedNetwork.map((node: string): void => {
      broadcastPromises.push(
        axios.post(`${node}/network/register`, { newNodeURL })
      );
    });

    await Promise.all(broadcastPromises);

    // revert back the network data to new node
    const data: AxiosResponse<BulkNetworkRegistrationResponse> = await axios.post(
      `${newNodeURL}/network/bulk`,
      { network: [...updatedNetwork, blockchain.currentNodeURL] }
    );

    res
      .status(StatusCodes.ACCEPTED)
      .json({
        confirmation: data.data,
      })
      .end();
  }
);

app.post(
  "/network/register",
  async (
    req: Request<{ newNodeURL: string }>,
    res: Response<{ network: string[] }>
  ): Promise<void> => {
    const { newNodeURL } = req.body;
    if (
      blockchain.network.indexOf(newNodeURL) === -1 &&
      newNodeURL !== blockchain.currentNodeURL
    ) {
      blockchain.updateNetwork(newNodeURL);
    }

    res
      .status(StatusCodes.ACCEPTED)
      .json({ network: blockchain.network })
      .end();
  }
);

app.post(
  "/network/bulk",
  async (
    req: Request<{ network: string[] }>,
    res: Response<{ success: boolean }>
  ): Promise<void> => {
    const { network }: { network: string[] } = req.body;

    // update this node's network
    network.map((node: string): void => {
      node !== blockchain.currentNodeURL &&
      blockchain.network.indexOf(node) === -1
        ? blockchain.updateNetwork(node)
        : null;
    });

    res
      .status(StatusCodes.ACCEPTED)
      .json({
        success: true,
      })
      .end();
  }
);

app.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});
