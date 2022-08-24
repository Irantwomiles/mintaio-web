import HDWalletProvider from "@truffle/hdwallet-provider";
import { OpenSeaSDK, Network } from 'opensea-js'

class OpenSeaBid {

    constructor(wallet) {
        this.walletProvider = new HDWalletProvider(['0xb3daad1f66fad028d6ce0a5c9c3324d262fb785b33b642ac024c04b7137cba5e'], 'wss://eth-mainnet.g.alchemy.com/v2/AMkm4ceqbFzP6YEEL1-Ye1PuGma3Ey6T', 0, 1);

        this.openseaSDK = new OpenSeaSDK(this.walletProvider, {
            networkName: Network.Main,
            apiKey: '852d4657fe794045abf12f206af777ad'
        });

    }

    async bid(contractAddress, tokenId, schema, bidPrice) {
        const placedBid = await this.openseaSDK.createBuyOrder({
            asset: {
                tokenAddress: contractAddress,
                tokenId: tokenId,
                schemaName: schema
            },
            accountAddress: '0xe253BBFC95b6F80886761757067EF916503f96E8',
            startAmount: bidPrice
        })

        console.log(placedBid);
    }

}

export default OpenSeaBid;