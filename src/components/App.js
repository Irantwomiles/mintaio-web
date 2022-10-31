import {html} from 'htm/preact';
import {useEffect, useState} from "preact/compat";

import Router from 'preact-router';

import Wallets from './Wallets.js';
import EthMinter from "./eth_minter/EthMinter.js";
import Settings from "./Settings.js";
import Information from "./Information.js";
import Dashboard from "./dashboard/Dashboard";
import OpenSeaSniperComp from "./opensea/OpenSeaSniperComp";
import ProfitAndLoss from "./dashboard/ProfitAndLoss";
import SidebarNav from "./SidebarNav";
import NFTManager from "./dashboard/NFTManager";

function App({state}) {

    return html`
    <div class="d-flex" style="position: relative;">
        <${SidebarNav} />
        
        <${Router}>
            <${Dashboard} state=${state} path="" />
            <${NFTManager} state=${state} path="/nft-manager" />
            <${Settings} state=${state} path="/settings" />
            <${Wallets} state=${state} path="/wallets" />
            <${EthMinter} state=${state} path="/eth-tasks" />
            <${Information} state=${state} path="/info" />
            <${OpenSeaSniperComp} state=${state} path="/opensea" />
            <${ProfitAndLoss} state=${state} path="/profit-tracker" />
        </${Router}>
    </div>
    `
}

export default App;