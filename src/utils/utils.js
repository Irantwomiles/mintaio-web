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
    return fetch('https://api.blocknative.com/gasprices/latest-block');
}

export function downloadLocalData() {

    let data = {};

    Object.keys(localStorage).forEach((key) => {
        if(key !== 'abi-list') {
            const val = localStorage.getItem(key);
            data[key] = isJson(val) ? JSON.parse(val) : val;
        }
    })

    const fileToSave = new Blob([JSON.stringify(data)], {
        type: 'application/json'
    });
    saveAs(fileToSave, 'local-data')
}

export function downloadProjectData() {

    let data = localStorage.getItem('project');

    if(data === null) {
        console.log("Data is null");
        return;
    }

    if(!isJson(data)) {
        console.log('data is not json');
        return;
    }

    const fileToSave = new Blob([data], {
        type: 'application/json'
    });
    saveAs(fileToSave, `project-${JSON.parse(data).slug}`)
}

export function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

export function fixAddress(address) {
    if(address.startsWith('0x')) {
        return address.toLowerCase();
    }

    return `0x${address}`.toLowerCase();
}

export function getOpenSeaEventData(address, event) {
    return fetch(`https://api.opensea.io/api/v1/events?only_opensea=false&account_address=${address}&event_type=${event}&limit=300`,{
        headers: {
            'x-api-key': '852d4657fe794045abf12f206af777ad'
        }
    })
}

export function getEtherscanDOM(address, page= 2) {
    const url = `https://etherscan.io/txs?a=${address}&p=${page}&bust=${Math.ceil(Math.random() * 100)}`;
    //const url = 'https://etherscan.io/txs?a=0x2ef2780b849f11231558bf9423c141178ec6f34e&ps=100&p=2';
    console.log(url);

    return fetch(`https://api.allorigins.win/get?url=${url}`);
}

export function getInternalTransactions(address, apiKey) {
    return fetch(`https://api.etherscan.io/api?module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc&apikey=${apiKey}`);
}

export function getNormalTransactions(address, apiKey) {
    return fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc&apikey=${apiKey}`);
}

export function shortenAddress(address) {
    return fixAddress(address).slice(0, 5) + "..." + address.slice(address.length - 6);
}

export function shortedText(text) {
    return text.length > 6 ? text.slice(0, 5) + "..." : text;
}

export function getFriendlyDate() {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentDate = new Date();

    return `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
}

export function getUpcomingMints() {
    return fetch(`https://mintaio-auth.herokuapp.com/calendar`);
}

export function getTimePassed(time) {
    const now = new Date().getTime();
    const before = new Date(time).getTime();

    const passedTime = Math.floor((now - before) / (1000 * 60));

    if(passedTime === 1) {
        return 'about 1 minute ago';
    } else if(passedTime > 1) {
        return `${passedTime} minutes ago`;
    } else {
        return `less than a minute ago`
    }
}

export function kFormatter(num) {
    return Math.abs(num) > 999 ? Math.sign(num)*((Math.abs(num)/1000).toFixed(1)) + 'k' : Math.sign(num)*Math.abs(num)
}

// This doesn't work, because etherscan is returning cached pages and preventing us from getting
// any other page, other than the first one we fetch. This might work if we used proxies and/or a
// a reverse proxy to fetch the data.
function scrapingEtherscanExample() {
    /*let text = await (await getEtherscanDOM('0x2ef2780b849f11231558bf9423c141178ec6f34e')).json();

    const parser = new DOMParser();
    const dom = parser.parseFromString(text.contents, "text/html");

    // Check to see if we need to fetch other pages to get all of the transaction data.
    let totalTransactionsStr = dom.querySelector('#ContentPlaceHolder1_topPageDiv').querySelector('span').innerText;
    totalTransactionsStr = totalTransactionsStr.replace(/[^0-9]/g,'');

    const totalTransactions = Number.parseInt(totalTransactionsStr);

    const table = dom.querySelector('#ContentPlaceHolder1_mainrow');
    const tableRows = table.querySelectorAll('tr');

    console.log("Total transactions:", totalTransactions);

    let parsedRows = [...tableRows];

    console.log(dom.querySelector('.pagination'));

    if((totalTransactions / 50) > 0) {

        let pages = Math.ceil(totalTransactions / 50);

        console.log("Pages:", pages);

        if(pages === 2) {
            let _text = await (await getEtherscanDOM('0x2ef2780b849f11231558bf9423c141178ec6f34e', 2)).json();

            const _dom = parser.parseFromString(_text.contents, "text/html");

            const _table = _dom.querySelector('#ContentPlaceHolder1_mainrow');
            const _tableRows = _table.querySelectorAll('tr');

            parsedRows = [...parsedRows, ..._tableRows];

        } else {

            for(let i = 2; i < pages + 1; i++) {
                let _text = await (await getEtherscanDOM('0x2ef2780b849f11231558bf9423c141178ec6f34e', i)).json();

                const _dom = parser.parseFromString(_text.contents, "text/html");

                const _table = _dom.querySelector('#ContentPlaceHolder1_mainrow');
                const _tableRows = _table.querySelectorAll('tr');

                console.log(_dom);

                parsedRows = [...parsedRows, ..._tableRows];
            }

        }

    }

    console.log("Parsed Rows:", parsedRows.length);

    const allTransactions = [];

    for(let i = 1; i < parsedRows.length; i++) {

        const r = parsedRows[i];

        try {
            const td = r.querySelectorAll('td');

            const txHash = td[1].querySelector('.hash-tag').innerText;
            const value = td[9].innerText;
            const fee = td[10].innerText;

            allTransactions.push({
                transactionHash: txHash,
                value,
                fee
            })
        } catch {
            console.log("Error at", i, r)
        }

    }

    console.log("All Transactions:", allTransactions, allTransactions.length)*/
}

