import {html} from 'htm/preact';

import Router from 'preact-router';

import Wallets from './Wallets.js';
import EthMinter from "./eth_minter/EthMinter.js";
import Nav from "./Nav.js";
import Settings from "./Settings";

function App() {
    return html`
    <div>
        <${Nav} />
        <${Router}>
            <${Wallets} path="/wallets" />
            <${EthMinter} path="/eth-tasks" />
            <${Settings} path="/settings" />
        </${Router}>
    </div>
    `
}

export default App;