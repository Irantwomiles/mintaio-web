import HDWalletProvider from "@truffle/hdwallet-provider";
import { OpenSeaSDK, Network } from 'opensea-js'

function fixAddress(address) {
    if(address.startsWith('0x')) {
        return address.toLowerCase();
    }

    return `0x${address}`.toLowerCase();
}

class OpenSeaSniper {

    static ID = 0;
    static GREEN = '#49a58b';
    static YELLOW = '#d7ba5a';
    static RED = '#f58686';
    static WHITE = '#FFF';
    static BLUE = '#3674e0';

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

        let throttleTimer = 0;
        let checking = false;
        this.stopped = false;

        this.status = {
            message: 'Searching...',
            color: OpenSeaSniper.BLUE
        };

        state.postOpenSeaSniperUpdate();

        this.interval = setInterval(() => {

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

                    console.log(assetUrl);

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

                            console.log(validAssets);
                            checking = false;

                            clearInterval(this.interval);
                            console.log("Cleared interval, stopping task here!");

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

        this.status = {
            message: 'Stopped Searching',
            color: OpenSeaSniper.YELLOW
        }

        state.postOpenSeaSniperUpdate();
    }

    async fillOrder(state, tokenId) {

        if(this.wallet.isLocked()) {
            this.status = {
                message: `Unlock Wallet`,
                color: OpenSeaSniper.RED
            };

            state.postOpenSeaSniperUpdate();
            return;
        }

        // 0xc4524796d8d0d43c854bd592d17791b094fa8ecddb8e7eabdbedfd989d8bf83a

        try {

            if(this.walletProvider === null || this.openseaSDK === null) {

                console.log(state.globalWeb3);

                state.globalWeb3.providers.HttpProvider.prototype.sendAsync = state.globalWeb3.providers.HttpProvider.prototype.send;

                this.walletProvider = new HDWalletProvider([fixAddress(this.wallet.account.privateKey)], state.globalWeb3.currentProvider, 0, 1);

                this.openseaSDK = new OpenSeaSDK(this.walletProvider, {
                    networkName: Network.Main,
                    apiKey: '852d4657fe794045abf12f206af777ad'
                });
            }

            this.openseaSDK.api.getOrder({
                side: "ask",
                assetContractAddress: this.contractAddress,
                tokenId: tokenId
            }).then(order => {
                this.status = {
                    message: `Found order`,
                    color: OpenSeaSniper.BLUE
                };

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
                    state.snipeErrorMessage(this.slug, this.price, e, 'https://discord.com/api/webhooks/933193586013519912/XMVYDZuSbI5Rf2_Hlb3qKJEQX-cSyore1TbJttLwd79MKVlsNz9LG0EIheCdaAcNXNBw');
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
                state.snipeErrorMessage(this.slug, this.price, e, 'https://discord.com/api/webhooks/933193586013519912/XMVYDZuSbI5Rf2_Hlb3qKJEQX-cSyore1TbJttLwd79MKVlsNz9LG0EIheCdaAcNXNBw');
            })

        } catch(e) {

            console.log(e);

            this.status = {
                message: `Error Occurred`,
                color: OpenSeaSniper.RED
            };
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

    delete() {
        if(localStorage.getItem('os-snipers') === null) {
            localStorage.setItem('os-snipers', JSON.stringify([]));
        }

        let _snipers = JSON.parse(localStorage.getItem('os-snipers'));

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