import HDWalletProvider from "@truffle/hdwallet-provider";
import { OpenSeaSDK, Network } from 'opensea-js'

function fixAddress(address) {
    if(address.startsWith('0x')) {
        return address.toLowerCase();
    }

    return `0x${address}`.toLowerCase();
}

class OpenSeaSniper {

    constructor({state, slug, contractAddress, wallet, price, traits = []}) {
        this.state = state;
        this.slug = slug;
        this.contractAddress = contractAddress;
        this.price = price;
        this.traits = traits;
        this.wallet = wallet;
        this.walletProvider = null;
        this.openseaSDK = null;

        this.tokenCache = [];
    }

    fetchAssetListings() {

        let checking = false;

        this.interval = setInterval(() => {

            if(checking) return;

            fetch(`https://api.opensea.io/api/v1/events?event_type=created&collection_slug=${this.slug}`, {
                headers: {
                    'x-api-key': '852d4657fe794045abf12f206af777ad'
                }
            }).then(response => {

                if(response.status !== 200) {
                    checking = false;
                    return;
                }

                const validTokens = [];

                response.json().then((result) => {

                    for(const asset of result.asset_events) {

                        const currentPrice = Number.parseFloat(`${this.state.globalWeb3.utils.fromWei(asset.starting_price, 'ether')}`);

                        //console.log(`Token ID:${asset.asset.token_id} Current Price: ${currentPrice} Price Wanted: ${this.price} Quantity: ${asset.quantity}`);

                        if(currentPrice <= Number.parseFloat(this.price) && asset.payment_token.symbol === 'ETH' && asset.quantity === '1') {
                            validTokens.push(asset.asset.token_id);
                        }

                    }

                    if(validTokens.length === 0) {
                        checking = false;
                        return;
                    }

                    const assetUrl = `https://api.opensea.io/api/v1/assets?include_orders=true&collection_slug=${this.slug}&token_ids=${validTokens.join('&token_ids=')}`

                    console.log(assetUrl);

                    fetch(assetUrl, {
                        headers: {
                            'x-api-key': '852d4657fe794045abf12f206af777ad'
                        }
                    }).then(assetsResponse => {

                        if(assetsResponse.status !== 200) {
                            checking = false;
                            return;
                        }

                        assetsResponse.json().then(assetsResult => {

                            const validAssets = [];

                            for(const asset of assetsResult.assets) {

                                if(asset.seaport_sell_orders === null) continue;

                                const assetPrice = Number.parseFloat(`${this.state.globalWeb3.utils.fromWei(asset.seaport_sell_orders[0].current_price, 'ether')}`);

                                if(assetPrice > Number.parseFloat(this.price)) continue;

                                if(this.traits.length === 0) {
                                    //sendTransaction here
                                    validAssets.push({
                                        tokenId: asset.token_id,
                                        price: assetPrice
                                    });
                                } else {

                                    if(asset.traits === null || asset.traits.length === 0) continue;

                                    const assetTraits = [];
                                    let valid = true;

                                    for(const t of asset.traits) {
                                        assetTraits.push(t['trait_type'].toLowerCase() + '|m|' + t['value'].toLowerCase());
                                        console.log("Traits:", t['trait_type'].toLowerCase() + '|m|' + t['value'].toLowerCase())
                                    }

                                    for(const t of this.traits) {
                                        console.log("Comparing", t);
                                        if(assetTraits.includes(t.toLowerCase())) {
                                            console.log("Contains", t)
                                            continue;
                                        }

                                        console.log("Reached here", t);
                                        valid = false;
                                        break;
                                    }

                                    if(valid) {
                                        validAssets.push({
                                            tokenId: asset.token_id,
                                            price: assetPrice
                                        });
                                    }

                                }
                            }

                            if(validAssets.length === 0) {
                                console.log("No valid assets");
                                // checking = false;
                                return;
                            }

                            validAssets.sort(compare);

                            console.log(validAssets);
                            console.log('Should attempt to buy', validAssets[0])
                            checking = false;

                            clearInterval(this.interval);
                            console.log("Cleared interval, stopping task here!");

                        }).catch(e => {
                            checking = false;
                            console.log("[1]", e);
                        })

                    }).catch(e => {
                        checking = false;
                        console.log("[2]", e);
                    })
                })
            }).catch(e => {
                checking = false;
                console.log("[3]", e);
            })

            checking = true;

        }, 1000);

    }

    async fillOrder(tokenId) {

        if(this.wallet.isLocked()) {
            return;
        }

        // 0xc4524796d8d0d43c854bd592d17791b094fa8ecddb8e7eabdbedfd989d8bf83a

        if(this.walletProvider === null || this.openseaSDK === null) {
            this.walletProvider = new HDWalletProvider([fixAddress(this.wallet.account.privateKey)], this.state.globalWeb3, 0, 1);

            this.openseaSDK = new OpenSeaSDK(this.walletProvider, {
                networkName: Network.Rinkeby,
                //apiKey: '852d4657fe794045abf12f206af777ad'
            });
        }



        const order = await this.openseaSDK.api.getOrder({
            side: "ask",
            assetContractAddress: this.contractAddress,
            tokenId: tokenId
        })

        console.log(typeof order);

        const transaction = await this.openseaSDK.fulfillOrder({
            order,
            accountAddress: fixAddress(this.wallet.account.address)
        })

        console.log(transaction);
    }

}

function compare( a, b ) {
    if ( a.price < b.price ){
        return -1;
    }
    if ( a.price > b.price ){
        return 1;
    }
    return 0;
}

export default OpenSeaSniper;