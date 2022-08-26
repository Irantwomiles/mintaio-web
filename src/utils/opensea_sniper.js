class OpenSeaSniper {

    constructor(state, slug, price) {
        this.state = state;
        this.slug = slug;
        this.price = price;
        this.traits = [];

        this.tokenCache = [];
    }

    fetchAssetListings() {

        fetch(`https://api.opensea.io/api/v1/events?event_type=created&collection_slug=${this.slug}`, {
            headers: {
                'x-api-key': '852d4657fe794045abf12f206af777ad'
            }
        }).then(response => {

            if(response.status !== 200) {
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

                if(validTokens.length === 0) return;

                const assetUrl = `https://api.opensea.io/api/v1/assets?include_orders=true&collection_slug=${this.slug}&token_ids=${validTokens.join('&token_ids=')}`

                console.log(assetUrl);

                fetch(assetUrl, {
                    headers: {
                        'x-api-key': '852d4657fe794045abf12f206af777ad'
                    }
                }).then(assetsResponse => {

                    if(assetsResponse.status !== 200) {
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
                            }

                            // compare traits here
                        }

                        validAssets.sort(compare);

                        console.log(validAssets);
                    })

                })
            })
        })

        /*this.interval = setInterval(() => {



        }, 5000);*/



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