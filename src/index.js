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

const mainState = new Main();

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



if(typeof window.state === 'undefined') {
    window.state = mainState;
}

render(html`<${App} state=${mainState} />`, document.getElementById('root'));
