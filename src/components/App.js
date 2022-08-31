import {html} from 'htm/preact';
import {useEffect, useState} from "preact/compat";

import Router from 'preact-router';

import Wallets from './Wallets.js';
import EthMinter from "./eth_minter/EthMinter.js";
import Nav from "./Nav.js";
import Settings from "./Settings.js";
import Information from "./Information.js";
import Dashboard from "./dashboard/Dashboard";
import OpenSeaSniperComp from "./opensea/OpenSeaSniperComp";

import io from 'socket.io-client';

function App({state}) {

    /*const [socket, setSocket] = useState(null);

    useEffect(() => {
        if(socket === null) {
            const _socket = io.connect('http://localhost:3001');
            setSocket(_socket);
        }
    }, []);

    useEffect(() => {
        if(socket === null) {
            return;
        }

        socket.emit('mintaio-join', `A user is connected to the socket.io client.`);

    }, [socket]);*/

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