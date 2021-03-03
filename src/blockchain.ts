import { SHA256 } from "crypto-js";

const _currentNodeURL: string = `${
  process.env.NODE_ENV === "development"
    ? "http://localhost:"
    : "http://localhost:"
}${process.argv[2]}`;
const powTarget: RegExp = /^(0000)[^0](.*)/gi;

export interface Transaction {
  amount: number;
  sender: string;
  recipient: string;
  timestamp: Date | number;
}

export interface Block {
  transactions: Transaction[];
  nonce: number;
  hash: string;
  previousBlockHash: string;
  timestamp: Date | number;
  index: number;
}

export interface UnMinedBlock
  extends Pick<
    Block,
    "transactions" | "previousBlockHash" | "nonce" | "timestamp" | "index"
  > {}

export interface ProofOfWorkBlockData
  extends Pick<
    Block,
    "transactions" | "previousBlockHash" | "timestamp" | "index"
  > {}

export interface IBlockchain {
  mine: () => Block;
  getChain: () => Block[];
  getLastBlock: () => Block;
  createNewTransaction: (
    _amount: number,
    _sender: string,
    _recipient: string
  ) => number;
  hashBlockData: (data: string | number | object) => string;
  proofOfWork: (blockData: Omit<Block, "hash" | "nonce">) => number;
  updateNetwork: (newNodeURL: string) => string[];
  currentNodeURL: string;
  network: string[];
}

export class Blockchain implements IBlockchain {
  private chain: Block[];
  private pendingTransactions: Transaction[];
  public currentNodeURL: string;
  public network: string[];

  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.currentNodeURL = _currentNodeURL;
    this.network = [];

    // create genesis block
    this.mine();
  }

  /**
   * @description Create a new block and add it to the chain
   *
   * @param {number} _nonce - the nonce value
   * @param {string} _previousBlockHas - hash of the preceeding block (|| the most recent block)
   * @param {number} _hash - hash of the new block
   */
  mine = (): Block => {
    const previousBlockHash: string =
      this.chain.length === 0 ? "0" : this.getLastBlock().hash;

    const prematureBlock: Omit<Block, "hash" | "nonce"> = {
      transactions: this.pendingTransactions,
      timestamp: Date.now(),
      index: this.chain.length + 1,
      previousBlockHash,
    };

    const nonce: number = this.proofOfWork(prematureBlock);

    const block: Block = {
      ...prematureBlock,
      hash: this.hashBlockData({ ...prematureBlock, nonce }),
      nonce,
    };

    this.chain.push(block);
    this.pendingTransactions = [];

    return block;
  };

  /**
   * @description getter method to get the current chain
   *
   * @return {Block[]} chain - THE chain
   */
  getChain = (): Block[] => {
    return this.chain;
  };

  /**
   * @description getter method to get the last block in the chain
   *
   * @return {Block} block = the last block in the chain
   */
  getLastBlock = (): Block => {
    return this.chain[this.chain.length - 1];
  };

  /**
   * @description Create a new transaction object and place it in the array of pending transactions
   *
   * @param {number} _amount - amount in bitcoins
   * @param {string} _sender - address of sender
   * @param {string} _recipient - address of the recipient
   *
   * @return {number} index - index of the block containing the new transaction
   */
  createNewTransaction = (
    _amount: number,
    _sender: string,
    _recipient: string
  ): number => {
    const newTransaction: Transaction = {
      amount: _amount,
      sender: _sender,
      recipient: _recipient,
      timestamp: Date.now(),
    };

    this.pendingTransactions.push(newTransaction);
    return this.getLastBlock().index + 1;
  };

  hashBlockData = (data: string | number | object): string => {
    return SHA256(JSON.stringify(data)).toString();
  };

  /**
   * @description Generate nonce value based on block data and target pow
   *
   * @param { Omit<Block, "hash"> } block - block that'll be used to generate the nonce
   *
   * @return {number} nonce - the mined nonce value
   */
  proofOfWork = (block: Omit<Block, "hash" | "nonce">): number => {
    let nonce: number = 0;
    while (true) {
      const hash: string = this.hashBlockData({ ...block, nonce });
      if (powTarget.test(hash)) {
        return nonce;
      }
      nonce = nonce + 1;
    }
  };

  updateNetwork = (newNodeURL: string): string[] => {
    this.network?.push(newNodeURL);
    return this.network as string[];
  };
}
