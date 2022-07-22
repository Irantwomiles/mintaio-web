import {html} from 'htm/preact';

import EthMinter from "./eth_minter/EthMinter.js";
import Nav from "./Nav.js";

function App() {
    return html`
    <div>
        <${Nav} />
        <${EthMinter} />
    </div>
    `
}

export default App;