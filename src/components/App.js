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
import NFTWatchList from "./dashboard/NFTWatchList";
import ProfitAndLoss from "./dashboard/ProfitAndLoss";

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
            <${NFTWatchList} state=${state} path="/nft-watchlist" />
            <${ProfitAndLoss} state=${state} path="/profit-tracker" />
        </${Router}>
    </div>
    `
}

export default App;