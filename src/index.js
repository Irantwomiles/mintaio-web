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

const mainState = new Main();

/*fetch('https://api.mintbot.click/auth', {
    credentials: 'include'
}).then((res) => {
    console.log("res:", res);
})*/

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
            console.log("Creating task");

            mainState.getContractAbi(t.contractAddress, t.network).then((abi) => {
                const task = new Task(t.provider, t.contractAddress, wallet, t.price, t.amount, t.maxGas, t.gasPriority, t.gasLimit, t.functionName, t.args, abi);

                task.network = t.network;
                task.taskGroup = t.taskGroup;

                task.save();
                _tasks.push(task);
            }).catch(console.log)

        }

    }
    // mainState.ethTasks = _tasks;
    mainState.ethTasksStream.next(_tasks);
}

if(localStorage.getItem("eth-groups") === null) {
    localStorage.setItem("eth-groups", JSON.stringify([]));
}

render(html`<${App} state=${mainState} />`, document.getElementById('root'));
