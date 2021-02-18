interface Transaction {}

interface Block {
  transactions: Transaction[];
  nonce: number;
  hash: string;
  previousBlockHash: string;
  timestamp: Date | number;
  index: number;
}

interface IBlockchain {
  createNewBlock: (
    _nonce: number,
    _previousBlockHash: string,
    _hash: string
  ) => Block;
  getChain: () => Block[];
}

class Blockchain implements IBlockchain {
  private chain: Block[];
  private newTransactions: Transaction[];

  constructor() {
    this.chain = [];
    this.newTransactions = [];
  }

  createNewBlock = (
    _nonce: number,
    _previousBlockHash: string,
    _hash: string
  ): Block => {
    const block: Block = {
      transactions: this.newTransactions,
      nonce: _nonce,
      hash: _hash,
      previousBlockHash: _previousBlockHash,
      timestamp: Date.now(),
      index: this.chain.length + 1,
    };

    this.chain.push(block);
    this.newTransactions = [];

    return block;
  };

  getChain = (): Block[] => {
    return this.chain;
  };
}

const blockchain: Blockchain = new Blockchain();
console.log(blockchain.getChain());
blockchain.createNewBlock(1, "abc", "def");
console.log(blockchain.getChain());
