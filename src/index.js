import {render} from 'preact';
import {html} from 'htm/preact';

import Main from "./utils/main";
import Wallet from './utils/wallet'
import App from './components/App.js';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@popperjs/core';
import '../style.scss';

const mainState = new Main();

if(localStorage.getItem("wallets") === null) {
    localStorage.setItem("wallets", JSON.stringify([]));
} else {

    const encryptedWallets = JSON.parse(localStorage.getItem("wallets"));
    const _wallets = [];

    for(const w of encryptedWallets) {
        const wallet = new Wallet(w.name, w.account);
        _wallets.push(wallet);
    }
    mainState.walletsStream.next(_wallets);
}

render(html`<${App} state=${mainState} />`, document.getElementById('root'));
