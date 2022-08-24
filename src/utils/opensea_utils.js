

/**
 * Fetch assets from IPFS
 * @param url: IPFS Url
 * @param number optional: If the IPFS Url is for a single asset include the asset number
 * @param ending optional: If the IPFS Url is for a single asset and ends with a .json or something else include that here.
 */
export async function fetchAssetTraits(url, number, ending) {

    const data = [];

    let counter = 0;
    const interval = setInterval(async () => {
        const requests = [];

        if(counter >= 10000) {
            clearInterval(interval);
        } else {
            for(let i = 1; i <= 100; i++) {
                requests.push(fetch(`https://ipfs.io/ipfs/QmQFkLSQysj94s5GvTHPyzTxrawwtjgiiYS2TBLgrvw8CW/${i + counter}`));
            }

            const _data = await Promise.all(requests);
            data.push(..._data);
            counter += 100;

            console.log(_data);
        }


    }, 1000 * 2)

    const flat = [].concat(...data);

    console.log(flat);
    return data;
}
