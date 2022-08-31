import { saveAs } from 'file-saver';

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

/**
 * Fetch a collection from opensea
 * @param slug
 * @returns {Promise<Response>}
 */
export function getOpenSeaCollection(slug) {
    return fetch(`https://api.opensea.io/api/v1/collection/${slug}`);
}

export function getEthPrice() {
    return fetch('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD');
}

export function getGasPrices() {
    return fetch('https://blocknative-api.herokuapp.com/data');
}

export function downloadLocalData() {

    let data = {};

    Object.keys(localStorage).forEach((key) => {
        if(key !== 'abi-list') {
            const val = localStorage.getItem(key);
            data[key] = isJson(val) ? JSON.parse(val) : val;
        }
    })

    console.log(data);

    const fileToSave = new Blob([JSON.stringify(data)], {
        type: 'application/json'
    });
    saveAs(fileToSave, 'filename')
}

export function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}