import {Alchemy, Network} from "alchemy-sdk";

class NFTManager {

    constructor() {
        // Xl9CjNo9SjtCLYcYH-X9cdQWqi4c5l39 mainnet
        // FHr5dIpL6Ka1lT4cfcuwePt1S_WfDWiA Goerli

        const config = {
            apiKey: 'Xl9CjNo9SjtCLYcYH-X9cdQWqi4c5l39',
            network: Network.ETH_MAINNET
        }

        this.alchemy = new Alchemy(config);
    }

    getNFTs(addresses) {

        const promises = [];

        for(const a of addresses) {
            promises.push(this.alchemy.nft.getNftsForOwner(a));
        }

        return Promise.all(promises);
    }

}

export default NFTManager;
