import {render} from 'preact';
import {html} from 'htm/preact';

import Main from "./utils/main";
import Wallet from './utils/wallet'
import App from './components/App.js';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@popperjs/core';
import '../style.scss';
import Task from "./utils/task";

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
    mainState.walletsStream.next(_wallets);
}

if(localStorage.getItem("eth-tasks") === null) {
    localStorage.setItem("eth-tasks", JSON.stringify([]));
} else {

    const tasks = JSON.parse(localStorage.getItem("eth-tasks"));
    const _tasks = [];

    for(const t of tasks) {
        const task = new Task(t.provider, t.contractAddress, t.wallet, t.price, t.amount, t.maxGas, t.gasPriority, t.gasLimit, t.functionName, t.args, mainState.getContractAbi(t.contractAddress, t.network));
        _tasks.push(task);
    }
    mainState.ethTasksStream.next(_tasks);
}

if(localStorage.getItem("eth-groups") === null) {
    localStorage.setItem("eth-groups", JSON.stringify([]));
}

render(html`<${App} state=${mainState} />`, document.getElementById('root'));
