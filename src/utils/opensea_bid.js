import HDWalletProvider from "@truffle/hdwallet-provider";
import { OpenSeaSDK, Network } from 'opensea-js'
import {fixAddress} from "./utils";

class OpenSeaBid {

    constructor(state, wallet) {

        let rpc = localStorage.getItem("globalRpc");

        this.wallet = wallet;

        this.walletProvider = new HDWalletProvider([fixAddress(this.wallet.account.privateKey)], rpc, 0, 1);

        this.openseaSDK = new OpenSeaSDK(this.walletProvider, {
            networkName: Network.Main,
            apiKey: '852d4657fe794045abf12f206af777ad'
        });

    }

    async bid({contractAddress, tokenId, accountAddress, schema, bidPrice}) {
        const placedBid = await this.openseaSDK.createBuyOrder({
            asset: {
                tokenAddress: contractAddress,
                tokenId: tokenId,
                schemaName: schema
            },
            accountAddress: accountAddress,
            startAmount: bidPrice
        })

        return placedBid;
    }

    async start() {

        const output = await this.bid({
            contractAddress: '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
            tokenId: '2961',
            schema: 'ERC721',
            accountAddress: fixAddress(this.wallet.account.address),
            bidPrice: 0.01
        })

        console.log(output);

    }

}

export default OpenSeaBid;