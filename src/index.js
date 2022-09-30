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

const mainState = new Main();

QuickTaskProfile.loadProfiles(mainState);
Wallet.loadWallets(mainState);
Task.loadEthTasks(mainState);
OpenSeaSniper.loadOpenSeaSnipers(mainState);

if(typeof window.state === 'undefined') {
    window.state = mainState;
}

render(html`<${App} state=${mainState} />`, document.getElementById('root'));
