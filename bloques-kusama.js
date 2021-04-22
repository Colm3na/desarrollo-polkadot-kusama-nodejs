// Required imports
const { ApiPromise, WsProvider } = require('@polkadot/api');

async function main () {
  // Initialise the provider to connect to the local node
  const provider = new WsProvider('wss://kusama-rpc.polkadot.io');

  // Create the API and wait until ready
  const api = await ApiPromise.create({ provider });

  // We only display a couple, then unsubscribe
  let count = 0;

  // Subscribe to the new headers on-chain. The callback is fired when new headers
  // are found, the call itself returns a promise with a subscription that can be
  // used to unsubscribe from the newHead subscription
  const unsubscribe = await api.rpc.chain.subscribeNewHeads(async (header) => {
    console.log(`Chain is at block: #${header.number}`);

    // block information
    const blockHash = await api.rpc.chain.getBlockHash(header.number);
    const { block } = await api.rpc.chain.getBlock(blockHash);
    console.log(JSON.stringify(block, null, 2));
    
    // block events
    console.log(`Events at block: #${header.number}`);
    const blockEvents = await api.query.system.events.at(blockHash);
    blockEvents.forEach(async (record, index) => {
      const { event, phase } = record;
      console.log(event.section, event.method, phase.toString(), JSON.stringify(event.data));
    });

    // block extrinsics
    console.log(`Extrinsics at block: #${header.number}`);
    block.extrinsics.forEach(async (extrinsic, index) => {
      const { isSigned } = extrinsic;
      const signer = isSigned ? extrinsic.signer.toString() : '';
      const { section } = extrinsic.toHuman().method;
      const { method } = extrinsic.toHuman().method;
      const args = JSON.stringify(extrinsic.args);
      const hash = extrinsic.hash.toHex();
      const doc = extrinsic.meta.documentation.toString().replace(/'/g, "''");
      console.log(isSigned, signer, section, method, args, hash, doc);
    });

    if (++count === 256) {
      unsubscribe();
      process.exit(0);
    }
  });
}

main().catch(console.error);