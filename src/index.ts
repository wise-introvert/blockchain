import { SHA256 } from "crypto-js";

export interface Transaction {
  amount: number;
  sender: string;
  recipient: string;
  timestamp: Date | number;
}

export interface UnMinedBlock
  extends Pick<Block, "transactions" | "previousBlockHash" | "nonce"> {}

export interface ProofOfWorkBlockData
  extends Pick<Block, "transactions" | "previousBlockHash"> {}

export interface Block {
  transactions: Transaction[];
  nonce: number;
  hash: string;
  previousBlockHash: string;
  timestamp: Date | number;
  index: number;
}

export interface IBlockchain {
  createNewBlock: (
    _nonce: number,
    _previousBlockHash: string,
    _hash: string
  ) => Block;
  getChain: () => Block[];
  getLastBlock: () => Block;
  createNewTransaction: (
    _amount: number,
    _sender: string,
    _recipient: string
  ) => number;
  hashBlockData: (block: UnMinedBlock) => string;
  proofOfWork: (blockData: ProofOfWorkBlockData) => number;
}

export class Blockchain implements IBlockchain {
  private chain: Block[];
  private pendingTransactions: Transaction[];
  private powTarget: RegExp = /^(0000)[^0](.*)/gi;

  constructor() {
    this.chain = [];
    this.pendingTransactions = [];

    // create genesis block
    this.createNewBlock(100, "0", "0");
  }

  /**
   * @description Create a new block and add it to the chain
   *
   * @param {number} _nonce - the nonce value
   * @param {string} _previousBlockHas - hash of the preceeding block (|| the most recent block)
   * @param {number} _hash - hash of the new block
   */
  createNewBlock = (
    _nonce: number,
    _previousBlockHash: string,
    _hash: string
  ): Block => {
    const block: Block = {
      transactions: this.pendingTransactions,
      nonce: _nonce,
      hash: _hash,
      previousBlockHash: _previousBlockHash,
      timestamp: Date.now(),
      index: this.chain.length + 1,
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

  hashBlockData = (blockData: UnMinedBlock): string => {
    return SHA256(JSON.stringify(blockData)).toString();
  };

  /**
   * @description Generate nonce value based on block data and target pow
   *
   * @param {ProofOfWorkBlockData} block - block that'll be used to generate the nonce
   *
   * @return {number} nonce - the mined nonce value
   */
  proofOfWork = (block: ProofOfWorkBlockData): number => {
    let nonce: number = 0;
    console.log({ reg: `/^(${this.powTarget})[^0](.*)/gi` });

    while (true) {
      const hash: string = this.hashBlockData({ ...block, nonce });
      console.log({
        nonce,
        start: hash.substr(0, 10),
      });
      if (this.powTarget.test(hash)) {
        console.log({ found: { nonce, hash } });
        return nonce;
      }
      nonce = nonce + 1;
    }
  };
}
