import {html} from 'htm/preact';

import Router from 'preact-router';

import Wallets from './Wallets.js';
import EthMinter from "./eth_minter/EthMinter.js";
import Nav from "./Nav.js";
import Settings from "./Settings.js";
import Information from "./Information.js";
import Dashboard from "./dashboard/Dashboard";
import OpenSeaSniperComp from "./opensea/OpenSeaSniperComp";

function App({state}) {
    return html`
    <div>
        <${Nav} />
        <${Router}>
            <${Settings} state=${state} path="" />
            <${Wallets} state=${state} path="/wallets" />
            <${EthMinter} state=${state} path="/eth-tasks" />
            <${Information} state=${state} path="/info" />
            <${Dashboard} state=${state} path="/dashboard" />
            <${OpenSeaSniperComp} state=${state} path="/opensea" />
        </${Router}>
    </div>
    `
}

export default App;