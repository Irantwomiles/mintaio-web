import HDWalletProvider from "@truffle/hdwallet-provider";
import { OpenSeaSDK, Network } from 'opensea-js'
import {fixAddress, getOpenSeaCollection} from "./utils";

class OpenSeaSniper {

    static ID = 0;
    static GREEN = '#49a58b';
    static YELLOW = '#d7ba5a';
    static RED = '#f58686';
    static WHITE = '#FFF';
    static BLUE = '#3674e0';
    static PINK = '#d58ce0';

    static loadOpenSeaSnipers(state) {

        if(localStorage.getItem("os-snipers") === null) {
            localStorage.setItem("os-snipers", JSON.stringify([]));
        }

        const snipers = JSON.parse(localStorage.getItem("os-snipers"));
        const _snipers = [];

        for(const s of snipers) {

            const wallet = state.wallets.find((w, index) => {
                const _address = fixAddress(w.account.address);
                const _sAddress = fixAddress(s.wallet);

                return _sAddress.toLowerCase() === _address.toLowerCase();
            });

            if(typeof wallet === 'undefined') continue;

            const sniper = new OpenSeaSniper({
                slug: s.slug,
                contractAddress: s.contractAddress,
                wallet: wallet,
                price: s.price,
                traits: s.traits
            });

            _snipers.push(sniper);
        }

        state.openseaSnipers = _snipers;
        state.openseaSniperStream.next(_snipers);
    }

    constructor({slug, contractAddress, wallet, price, traits = []}) {
        this.id = OpenSeaSniper.ID++;
        this.slug = slug;
        this.contractAddress = contractAddress;
        this.price = price;
        this.traits = traits;
        this.wallet = wallet;
        this.walletProvider = null;
        this.openseaSDK = null;
        this.stopped = true;

        this.interval = null;

        this.status = {
            message: 'Inactive',
            color: OpenSeaSniper.WHITE
        };

    }

    fetchAssetListings(state) {

        if(this.interval !== null) {
            console.log("Sniper already active");
            return;
        }

        // After 50 iterations we will fetch floor price
        let fetchFloorPrice = 0;

        let throttleTimer = 0;
        let checking = false;
        this.stopped = false;

        this.status = {
            message: 'Searching...',
            color: OpenSeaSniper.BLUE
        };

        state.postOpenSeaSniperUpdate();

        this.interval = setInterval(async () => {

            console.log(`"Checking ${this.slug} for ${this.price}`);

            if(checking) return;

            if(throttleTimer > 0) {
                throttleTimer--;

                this.status = {
                    message: `Waiting ${throttleTimer} seconds`,
                    color: OpenSeaSniper.YELLOW
                };

                state.postOpenSeaSniperUpdate();
                return;
            }

            /*if(fetchFloorPrice <= 0) {
                const collection = await getOpenSeaCollection(this.slug);

                if(collection.status === 200) {
                    const data = await collection.json();
                    const floorPrice = data.collection.stats.floor_price;

                    if(Number.parseFloat(`${floorPrice}`) < Number.parseFloat(`${this.price}`)) {
                        this.stopFetchingAssets(state);
                        console.log(`Stopped fetching assets, floor price (${floorPrice}) is lower than search price (${this.price})`);
                        this.stopped = true;
                        return;
                    }
                }

                fetchFloorPrice = 50;
            }*/

            fetchFloorPrice--;

            fetch(`https://api.opensea.io/api/v1/events?event_type=created&collection_slug=${this.slug}`, {
                headers: {
                    'x-api-key': '852d4657fe794045abf12f206af777ad'
                }
            }).then(response => {

                if(response.status !== 200) {
                    checking = false;

                    if(response.status >= 400 && response.status <= 499) {
                        throttleTimer = 5;
                    }

                    this.status = {
                        message: `Status ${response.status}`,
                        color: OpenSeaSniper.YELLOW
                    };

                    state.postOpenSeaSniperUpdate();
                    return;
                }

                const validTokens = [];

                response.json().then((result) => {

                    for(const asset of result.asset_events) {

                        const currentPrice = Number.parseFloat(`${state.globalWeb3.utils.fromWei(asset.starting_price, 'ether')}`);

                        //console.log(`Price status: (${currentPrice}, ${Number.parseFloat(this.price)}) ${currentPrice <= Number.parseFloat(this.price)} Token Symbol: ${asset.payment_token.symbol === 'ETH'} Quantity: ${asset.quantity === '1'} Overall: ${currentPrice <= Number.parseFloat(this.price) && asset.payment_token.symbol === 'ETH' && asset.quantity === '1'}`);

                        if(currentPrice <= Number.parseFloat(this.price) && asset.payment_token.symbol === 'ETH' && asset.quantity === '1') {
                            validTokens.push(asset.asset.token_id);
                        }

                    }

                    if(validTokens.length === 0) {
                        checking = false;
                        return;
                    }

                    const assetUrl = `https://api.opensea.io/api/v1/assets?include_orders=true&collection_slug=${this.slug}&token_ids=${validTokens.join('&token_ids=')}`

                    fetch(assetUrl, {
                        headers: {
                            'x-api-key': '852d4657fe794045abf12f206af777ad'
                        }
                    }).then(assetsResponse => {

                        if(assetsResponse.status !== 200) {
                            checking = false;

                            if(response.status >= 400 && response.status <= 499) {
                                throttleTimer = 5;
                            }

                            this.status = {
                                message: `Status ${response.status}`,
                                color: OpenSeaSniper.YELLOW
                            };

                            state.postOpenSeaSniperUpdate();
                            return;
                        }

                        assetsResponse.json().then(assetsResult => {

                            const validAssets = [];

                            for(const asset of assetsResult.assets) {

                                if(asset.seaport_sell_orders === null) continue;

                                const assetPrice = Number.parseFloat(`${state.globalWeb3.utils.fromWei(asset.seaport_sell_orders[0].current_price, 'ether')}`);

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
                                    }

                                    for(const t of this.traits) {
                                        if(assetTraits.includes(t.toLowerCase())) {
                                            continue;
                                        }

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
                                checking = false;
                                return;
                            }

                            validAssets.sort(compare);

                            checking = false;

                            clearInterval(this.interval);
                            this.interval = null;

                            if(this.stopped) return;

                            this.status = {
                                message: `Found listing...`,
                                color: OpenSeaSniper.GREEN
                            };

                            state.postOpenSeaSniperUpdate();

                            this.fillOrder(state, validAssets[0].tokenId);


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

    stopFetchingAssets(state) {
        if(this.interval === null) {
            return;
        }

        clearInterval(this.interval);
        this.interval = null;
        this.stopped = true;

        this.status = {
            message: 'Stopped Searching',
            color: OpenSeaSniper.YELLOW
        }

        state.postOpenSeaSniperUpdate();
    }

    async fillOrder(state, tokenId) {

        // Stop sending transaction if wallet is locked.
        if(this.wallet.isLocked()) {
            this.status = {
                message: `Unlock Wallet`,
                color: OpenSeaSniper.RED
            };

            this.stopped = true;

            state.postOpenSeaSniperUpdate();
            return;
        }

        // if it's already stopped, then we don't need to send anymore tx
        if(this.stopped) {
            console.log(`${this.slug} Was stopped, not buying`)
            return;
        }

        // set stopped to true to prevent another tx from being sent.
        this.stopped = true;

        try {

            if(this.walletProvider === null || this.openseaSDK === null) {

                let rpc = localStorage.getItem("globalRpc");

                if(rpc.length === 0) {
                    return;
                }

                if(rpc.startsWith('https')) {
                    rpc = rpc.replace('https', 'wss');
                }

                this.walletProvider = new HDWalletProvider([fixAddress(this.wallet.account.privateKey)], rpc, 0, 1);

                this.openseaSDK = new OpenSeaSDK(this.walletProvider, {
                    networkName: Network.Main,
                    apiKey: 'e6cc4c87a86740de959622f78c8bca8a'
                });
            }

            this.openseaSDK.api.getOrder({
                side: "ask",
                assetContractAddress: this.contractAddress,
                tokenId: tokenId
            }).then(order => {
                this.status = {
                    message: `Found order`,
                    color: OpenSeaSniper.PINK
                };

                console.log("Order", order);

                state.snipeDebugMessage(this.slug, this.price, order, 'https://discord.com/api/webhooks/1009917503000019004/HJG-m8J5FBL7ok6N-KzXS1cJK7eFEbffhkS_2f9uWR2U3OU1QjdKIWcDQw6i7QG1Z29U');

                state.postOpenSeaSniperUpdate();

                this.openseaSDK.fulfillOrder({
                    order,
                    accountAddress: fixAddress(this.wallet.account.address)
                }).then(transaction => {

                    this.status = {
                        message: `Listing Sniped!`,
                        color: OpenSeaSniper.GREEN
                    };

                    state.postOpenSeaSniperUpdate();

                    state.snipeSuccessMessage(this.slug, transaction, this.price, state.webhook);
                    state.snipeSuccessMessage(this.slug, transaction, this.price, 'https://discord.com/api/webhooks/1009917503000019004/HJG-m8J5FBL7ok6N-KzXS1cJK7eFEbffhkS_2f9uWR2U3OU1QjdKIWcDQw6i7QG1Z29U');
                    state.snipeSuccessMessage(this.slug, transaction, this.price, 'https://discord.com/api/webhooks/933193586013519912/XMVYDZuSbI5Rf2_Hlb3qKJEQX-cSyore1TbJttLwd79MKVlsNz9LG0EIheCdaAcNXNBw');

                }).catch(e => {
                    console.log("error while sniping:", e);

                    this.status = {
                        message: `Error while Sniping`,
                        color: OpenSeaSniper.RED
                    };

                    state.postOpenSeaSniperUpdate();

                    state.snipeErrorMessage(this.slug, this.price, e, state.webhook);
                    state.snipeErrorMessage(this.slug, this.price, e, 'https://discord.com/api/webhooks/1009917503000019004/HJG-m8J5FBL7ok6N-KzXS1cJK7eFEbffhkS_2f9uWR2U3OU1QjdKIWcDQw6i7QG1Z29U');

                    if(!this.stopped) {
                        // Start again if failed.
                        this.fetchAssetListings(state);
                    }


                })


            }).catch(e => {
                console.log("error while getting order:", e);

                this.status = {
                    message: `Error getting Order`,
                    color: OpenSeaSniper.RED
                };

                state.postOpenSeaSniperUpdate();

                state.snipeErrorMessage(this.slug, this.price, e, state.webhook);
                state.snipeErrorMessage(this.slug, this.price, e, 'https://discord.com/api/webhooks/1009917503000019004/HJG-m8J5FBL7ok6N-KzXS1cJK7eFEbffhkS_2f9uWR2U3OU1QjdKIWcDQw6i7QG1Z29U');

                if(!this.stopped) {
                    // Start again if failed.
                    this.fetchAssetListings(state);
                }

            })

        } catch(e) {

            console.log(e);

            this.status = {
                message: `Error Occurred`,
                color: OpenSeaSniper.RED
            };

            this.stopped = true;
        }
    }

    save() {
        if(localStorage.getItem('os-snipers') === null) {
            localStorage.setItem('os-snipers', JSON.stringify([]));
        }

        let _snipers = JSON.parse(localStorage.getItem('os-snipers'));

        _snipers = _snipers.filter(t => t.id !== this.id);

        _snipers.push({
            id: this.id,
            slug: this.slug,
            contractAddress: this.contractAddress,
            price: this.price,
            traits: this.traits,
            wallet: this.wallet.account.address
        });

        localStorage.setItem('os-snipers', JSON.stringify(_snipers));
    }

    delete(state) {
        if(localStorage.getItem('os-snipers') === null) {
            localStorage.setItem('os-snipers', JSON.stringify([]));
        }

        let _snipers = JSON.parse(localStorage.getItem('os-snipers'));

        this.stopFetchingAssets(state);

        _snipers = _snipers.filter(t => t.id !== this.id);
        localStorage.setItem('os-snipers', JSON.stringify(_snipers));
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