import { Blockchain, Block } from ".";

describe("Blockchain", () => {
  let blockchain: Blockchain;
  let genesisBlockRawMaterial: Pick<
    Block,
    "hash" | "previousBlockHash" | "nonce"
  > = {
    nonce: Math.random(),
    hash: "abc",
    previousBlockHash: "def",
  };

  beforeAll(() => {
    blockchain = new Blockchain();
  });

  it("adds the given new block to the chain", () => {
    const addedBlock: Block = blockchain.createNewBlock(
      genesisBlockRawMaterial.nonce,
      genesisBlockRawMaterial.previousBlockHash,
      genesisBlockRawMaterial.hash
    );

    expect(addedBlock.index).toBeTruthy();
    expect(addedBlock.timestamp).toBeTruthy();
    expect(addedBlock.nonce).toEqual(genesisBlockRawMaterial.nonce);
    expect(addedBlock.hash).toEqual(genesisBlockRawMaterial.hash);
    expect(addedBlock.previousBlockHash).toEqual(
      genesisBlockRawMaterial.previousBlockHash
    );
  });

  it("returns the last block when pop() method is called", () => {
    const lastBlock: Block = blockchain.getLastBlock();
    expect(lastBlock.nonce).toEqual(genesisBlockRawMaterial.nonce);
    expect(lastBlock.hash).toEqual(genesisBlockRawMaterial.hash);
    expect(lastBlock.previousBlockHash).toEqual(
      genesisBlockRawMaterial.previousBlockHash
    );
  });
});
