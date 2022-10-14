import { OpenSeaSDK, Network } from 'opensea-js'
import HDWalletProvider from "@truffle/hdwallet-provider";
import {fixAddress} from "./utils";

export default class OpenSeaListing {

    constructor({wallet}) {
        this.wallet = wallet;
        this.assets = [];

        this.walletProvider = null;
        this.openseaSDK = null;

        this.setupWalletProvider();
    }

    setupWalletProvider() {

        let rpc = localStorage.getItem("globalRpc");

        if(rpc.length === 0) {
            return;
        }

        if(this.wallet.isLocked()) {
            console.log("Wallet is locked");
            return;
        }

        this.walletProvider = new HDWalletProvider([fixAddress(this.wallet.account.privateKey)], rpc, 0, 1);

        this.openseaSDK = new OpenSeaSDK(this.walletProvider, {
            networkName: Network.Main,
            apiKey: 'e6cc4c87a86740de959622f78c8bca8a'
        });
    }

    addListingToList({contractAddress, tokenId, price, expiration}) {
        this.assets.push(new OpenSeaAsset({contractAddress, tokenId, price, expiration}));
    }

    createListing(asset) {

        // Expire this auction one day from now.
        // Note that we convert from the JavaScript timestamp (milliseconds):
        const expirationTime = Math.round(Date.now() / 1000 + 60 * 60 * asset.expiration)

        this.openseaSDK.createSellOrder({
            asset: {
                tokenId: asset.tokenId,
                tokenAddress: asset.contractAddress,
            },
            accountAddress: this.wallet.account.address,
            startAmount: asset.price,
            // If `endAmount` is specified, the order will decline in value to that amount until `expirationTime`. Otherwise, it's a fixed-price order:
            endAmount: asset.price,
            expirationTime
        })

    }

    startListingAssets() {

        if(this.assets.length === 0) {
            console.log("assets length is 0");
            return;
        }

        for(let i = 0; i < this.assets.length; i++) {

            const asset = this.assets[i];

            if(asset.timeout !== null) continue;

            asset.timeout = setTimeout(() => {

                this.createListing(asset);

            }, (i + 1) * 1000);

        }

    }

}

class OpenSeaAsset {
    constructor({contractAddress, tokenId, price, expiration}) {

        this.status = 'Inactive';

        this.contractAddress = contractAddress;
        this.tokenId = tokenId;
        this.price = price;
        this.expiration = expiration;

        this.timeout = null;
    }
}