import { SHA256 } from "crypto-js";
import { pick } from "lodash";

import { Transaction, Block, Blockchain, IBlockchain } from ".";

const getRandomHash: () => string = (): string => {
  return SHA256(Math.random().toString()).toString();
};

// instantiate blockchain
const blockchain: Blockchain = new Blockchain();
console.log(JSON.stringify(blockchain, null, 2));
