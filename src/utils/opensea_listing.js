import { OpenSeaSDK, Network } from 'opensea-js'
import HDWalletProvider from "@truffle/hdwallet-provider";
import {fixAddress} from "./utils";

export default class OpenSeaListing {

    static getTimerMultiplier() {
        if(this.multiplier) {
            return ++this.multiplier;
        }

        this.multiplier = 1;
        return this.multiplier;
    }

    constructor({wallet}) {
        this.wallet = wallet;
        this.assets = [];

        this.waiting = 0;
        this.success = 0;
        this.failed = 0;

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
            apiKey: 'd81bee3e75c64ae79541373f4c32295b'
        });
    }

    addListingToList({contractAddress, tokenId, price, expiration}) {

        for(const asset of this.assets) {
            const id = `${fixAddress(contractAddress)}:${tokenId}`;
            const compare = `${fixAddress(asset.contractAddress)}:${asset.tokenId}`;

            if(id === compare) {
                console.log(id, compare, id === compare);
                return false;
            }
        }

        this.assets.push(new OpenSeaAsset({contractAddress, tokenId, price, expiration}));
        this.waiting++;
        return true;
    }

    createListing(asset, state) {

        // Expire this auction one day from now.
        // Note that we convert from the JavaScript timestamp (milliseconds):
        const expirationTime = Math.round(Date.now() / 1000 + 60 * 60 * asset.expiration)
        console.log("Creating listing now for", asset);

        try {
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
            }).then((r) => {
                console.log("Success:", r);
                this.success++;
                this.waiting--;
                state.postOpenSeaListingUpdate();
            }).catch(e => {
                console.log("catch:", e);
                this.failed++;
                this.waiting--;
                state.postOpenSeaListingUpdate();
            })
        } catch(e) {
            console.log('error', e);
            this.failed++;
            this.waiting--;
            state.postOpenSeaListingUpdate();
        }

    }

    startListingAssets(state) {

        if(this.assets.length === 0) {
            console.log("assets length is 0");
            return;
        }

        for(let i = 0; i < this.assets.length; i++) {

            const asset = this.assets[i];

            if(asset.timeout !== null) continue;

            asset.timeout = setTimeout(() => {

                this.createListing(asset, state);

            }, OpenSeaListing.getTimerMultiplier() * 1500);

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