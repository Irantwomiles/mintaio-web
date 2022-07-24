import {html} from 'htm/preact';

import Router from 'preact-router';

import Wallets from './Wallets.js';
import EthMinter from "./eth_minter/EthMinter.js";
import Nav from "./Nav.js";
import Settings from "./Settings";

function App({state}) {
    return html`
    <div>
        <${Nav} />
        <${Router}>
            <${Wallets} state=${state} path="/wallets" />
            <${EthMinter} state=${state} path="/eth-tasks" />
            <${Settings} state=${state} path="/settings" />
        </${Router}>
    </div>
    `
}

export default App;