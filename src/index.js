import {render} from 'preact';
import {html} from 'htm/preact';

import './utils/main.js';
import WalletManager from "./utils/wallet_manager.js";

import App from './components/App.js';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@popperjs/core';
import '../style.scss';

render(html`<${App}/>`, document.getElementById('root'));

if(typeof window.walletManager === 'undefined') {
    window.walletManager = new WalletManager();
}