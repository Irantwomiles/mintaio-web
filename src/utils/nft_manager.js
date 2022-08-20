import {Alchemy, Network} from "alchemy-sdk";

class NFTManager {

    constructor() {

        const config = {
            apiKey: 'AMkm4ceqbFzP6YEEL1-Ye1PuGma3Ey6T',
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
