import {render} from 'preact';
import {html} from 'htm/preact';
import Main from "./utils/main.js";
import Wallet from './utils/wallet.js'
import App from './components/App.js';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@popperjs/core';
import '../style.scss';

import Task from "./utils/task.js";
import OpenSeaSniper from "./utils/opensea_sniper";
import QuickTaskProfile from "./utils/quick_task_profile";
import {getOpenSeaEventData, getEtherscanDOM, getInternalTransactions, getNormalTransactions} from "./utils/utils";

const mainState = new Main();

QuickTaskProfile.loadProfiles(mainState);

loadData();

test('0x2eF2780b849F11231558bf9423c141178eC6f34E');

async function test(address) {

    const apiKey = localStorage.getItem('etherscan-api');

    const successData = await (await getOpenSeaEventData(address, 'successful')).json();

    const sales = new Map();

    for(const data of successData.asset_events) {

        if(data.asset === null) {
            console.log("asset was null, skipping");
            continue;
        }

        const asset = data.asset;

        let obj = sales.get(asset.asset_contract.address);

        if(typeof obj === 'undefined') {
           obj = {
               contractAddress: asset.asset_contract.address,
               slug: data.collection_slug,
               name: asset.collection.name,
               sellerFee: asset.collection.fees,
               assets: [],
               count: 1
           }

            obj.assets.push({
                tokenId: asset.token_id,
                permalink: asset.permalink,
                salePrice: data.total_price,
                event_type: data.seller.address.toLowerCase() === address.toLowerCase() ? 'sold' : 'bought'
            })

        } else {
            obj.count = obj.count + 1;

            obj.assets.push({
                tokenId: asset.token_id,
                permalink: asset.permalink,
                salePrice: data.total_price,
                event_type: data.seller.address.toLowerCase() === address.toLowerCase() ? 'sold' : 'bought'
            })

        }

        sales.set(asset.asset_contract.address, obj);
    }

    const transferData = await (await getOpenSeaEventData(address, 'transfer')).json();

    const mints = new Map();

    const internalTx = await (await getInternalTransactions(address, apiKey)).json();
    const normalTx = await (await getNormalTransactions(address, apiKey)).json();

    for(const transfer of transferData.asset_events) {

        if(transfer.asset === null) {
            console.log("Asset was null in transfer, skipping");
            continue;
        }

        if(transfer.from_account.address === '0x0000000000000000000000000000000000000000') {

            let obj = mints.get(transfer.asset.asset_contract.address);
            const txHash = transfer.transaction.transaction_hash;

            const transaction = normalTx.result.find(n => n.hash.toString().toLowerCase() === txHash.toString().toLowerCase());
            const txExists = typeof transaction !== 'undefined';

            if(!txExists) {
                console.log(`Could not find tx ${txHash}`);
                continue;
            }

            const gas = transaction.gas;
            const gasUsed = Number.parseInt(transaction.gasUsed);
            const gasPrice = mainState.globalWeb3.utils.fromWei(transaction.gasPrice, 'gwei');
            const gasPriceFloat = Number.parseFloat(gasPrice);

            const totalGasPriceGwei = gasUsed * gasPriceFloat;
            const totalGasPriceWei = mainState.globalWeb3.utils.toWei(`${totalGasPriceGwei.toFixed(3)}`, 'gwei');
            const totalGasPriceEth = mainState.globalWeb3.utils.fromWei(`${totalGasPriceWei}`, 'ether');

            const value = mainState.globalWeb3.utils.fromWei(transaction.value, 'ether');

            //console.log(`Mint: ${value} ETH | Gas: ${totalGasPriceEth} ETH (${gasUsed} / ${gas}) | TxHash: ${transaction.hash}`);

            if(typeof obj === 'undefined') {

                obj = {
                    contractAddress: transfer.asset.asset_contract.address,
                    date: transfer.event_timestamp,
                    totalMintCost: Number.parseFloat(value),
                    totalGasFee: Number.parseFloat(totalGasPriceEth),
                    assets: []
                }

                obj.assets.push({
                    tokenId: transfer.asset.token_id,
                    image: transfer.asset.image_url,
                    url: transfer.asset.permalink,
                    gasFee: totalGasPriceEth,
                    gasUsed: gasUsed,
                    gas: gas,
                    value: value,
                    transactionHash: txHash
                })
            } else {

                obj.totalMintCost += Number.parseFloat(value);
                obj.totalGasFee += Number.parseFloat(totalGasPriceEth);

                obj.assets.push({
                    tokenId: transfer.asset.token_id,
                    image: transfer.asset.image_url,
                    url: transfer.asset.permalink,
                    gasFee: totalGasPriceEth,
                    gasUsed: gasUsed,
                    gas: gas,
                    value: value,
                    transactionHash: txHash
                })
            }

            mints.set(transfer.asset.asset_contract.address, obj);
        }

    }

    for(const key of mints.keys()) {

        const sale = sales.get(key);
        const exists = typeof sale !== 'undefined';

        if(exists) {
            console.log("Sale", sale.assets);
            console.log(`%cMint: ${key} | Total Spent: ${mints.get(key).totalMintCost} | Total Gas Spent: ${mints.get(key).totalGasFee} | %cTotal Sales: ${sale.count}`, 'color: orange;', 'color: green;');
        } else {
            console.log(`%cMint: ${key} | Total Spent: ${mints.get(key).totalMintCost} | Total Gas Spent: ${mints.get(key).totalGasFee}`, 'color: orange;');
        }


        for(const asset of mints.get(key).assets) {

            const assetSold = exists ? sale.assets.find(s => s.tokenId === asset.tokenId) : undefined;

            console.log(`${asset.tokenId}: Value: ${asset.value}ETH | Gas: ${asset.gasFee}ETH (${asset.gasUsed}/${asset.gas}) | ${asset.transactionHash} 
            ${typeof assetSold !== 'undefined' ? `| Sold: ${mainState.globalWeb3.utils.fromWei(assetSold.salePrice, 'ether')}ETH` : ''}`);
        }

        console.log("-----------------------------------------------------------------")
    }

    /*console.log(internalTx.result.length, internalTx);
    console.log(normalTx.result.length, normalTx);*/

}


function loadData() {
    if(localStorage.getItem("wallets") === null) {
        localStorage.setItem("wallets", JSON.stringify([]));
    } else {

        const encryptedWallets = JSON.parse(localStorage.getItem("wallets"));
        const _wallets = [];

        for(const w of encryptedWallets) {
            const wallet = new Wallet(w.name, w.account);
            wallet.getBalance(mainState)
            _wallets.push(wallet);
        }

        mainState.wallets = _wallets;
        mainState.walletsStream.next(_wallets);
    }

    if(localStorage.getItem("eth-tasks") === null) {
        localStorage.setItem("eth-tasks", JSON.stringify([]));
    } else {

        const tasks = JSON.parse(localStorage.getItem("eth-tasks"));
        const _tasks = [];

        for(const t of tasks) {

            const wallet = mainState.wallets.find((w, index) => {
                const _address = `${w.account.address.includes('0x') ? '' : '0x'}${w.account.address}`;
                const _tAddress = `${t.wallet.includes('0x') ? '' : '0x'}${t.wallet}`;

                return _tAddress.toLowerCase() === _address.toLowerCase();
            });

            if(typeof wallet !== 'undefined') {

                mainState.getContractAbi(t.contractAddress, t.network).then((abi) => {
                    const task = new Task(t.provider, t.contractAddress, wallet, t.price, t.amount, t.maxGas, t.gasPriority, t.gasLimit, t.functionName, t.args, abi);

                    task.network = t.network;
                    task.taskGroup = t.taskGroup;
                    task.trigger = t.trigger;
                    task.startMode = t.startMode;
                    task.contractReadMethod = t.contractReadMethod;
                    task.readMethodCurrent = t.readMethodCurrent;
                    task.customHexData = t.customHexData;

                    task.save();
                    _tasks.push(task);
                }).catch(console.log)

            }

        }
        mainState.ethTasksStream.next(_tasks);
    }

    if(localStorage.getItem("os-snipers") === null) {
        localStorage.setItem("os-snipers", JSON.stringify([]));
    } else {

        const snipers = JSON.parse(localStorage.getItem("os-snipers"));
        const _snipers = [];

        for(const s of snipers) {

            const wallet = mainState.wallets.find((w, index) => {
                const _address = `${w.account.address.includes('0x') ? '' : '0x'}${w.account.address}`;
                const _sAddress = `${s.wallet.includes('0x') ? '' : '0x'}${s.wallet}`;

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

            sniper.save();
            _snipers.push(sniper);
        }
        mainState.openseaSniperStream.next(_snipers);
    }
}

if(typeof window.state === 'undefined') {
    window.state = mainState;
}

render(html`<${App} state=${mainState} />`, document.getElementById('root'));
