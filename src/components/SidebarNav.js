import {html} from 'htm/preact';
import {useEffect, useState} from "preact/compat";
import logo from '../images/mintaio-logo.png';

function SidebarNav() {

    const [userData, setUserData] = useState(null);
    const [data, setData] = useState({
        ethPrice: '--',
        maxFee: '--',
        priorityFee: '--',
        pendingBlock: '--'
    });
    const [page, setPage] = useState("dashboard")

    useEffect(() => {

        const ethDataStream = state.ethDataStream.subscribe((data) => {
            setData(Object.assign({}, data));
        })

        const _user = localStorage.getItem('discord-user');

        if(_user !== null) {
            setUserData(JSON.parse(_user));
        }

        return () => {
            ethDataStream.unsubscribe();
        }

    }, []);

    /*return html`
        <div class="sidebar col-auto col-md-3 col-xl-2 px-0">
            <div class="d-flex flex-column align-items-center align-items-sm-start px-3 pt-3 min-vh-100 text-white">
                <ul class="nav nav-pills flex-column mb-0 align-items-center align-items-sm-start w-100" id="menu">

                    <li class="nav-item sidebar-item w-100 mb-1 ${page === 'dashboard' ? 'active-sidebar' : ''}">
                        <a href="/dashboard" class="nav-link align-middle px-0">
                            <i class="fa-solid fa-newspaper mx-2 size-2"></i>
                            <span class="ms-1 d-none d-sm-inline size-2">Dashboard</span>
                        </a>
                    </li>
                    
                    <li class="nav-item sidebar-item w-100 mb-1 ${page === 'eth-tasks' ? 'active-sidebar' : ''}">
                        <a href="/eth-tasks" class="nav-link align-middle px-0">
                            <i class="fa-solid fa-bars-progress mx-2 size-2"></i> 
                            <span class="ms-1 d-none d-sm-inline size-2">Mint Bot</span>
                        </a>
                    </li>

                    <li class="nav-item sidebar-item w-100 mb-1 ${page === 'opensea' ? 'active-sidebar' : ''}">
                        <a href="/opensea" class="nav-link align-middle px-0">
                            <i class="fa-solid fa-location-crosshairs mx-2 size-2"></i>
                            <span class="ms-1 d-none d-sm-inline size-2">OpenSea</span>
                        </a>
                    </li>

                    <li class="nav-item sidebar-item w-100 mb-1 ${page === 'profit-tracker' ? 'active-sidebar' : ''}">
                        <a href="/profit-tracker" class="nav-link align-middle px-0">
                            <i class="fa-solid fa-chart-simple mx-2 size-2"></i>
                            <span class="ms-1 d-none d-sm-inline size-2">Profit Tracker</span>
                        </a>
                    </li>
                    
                    <li class="nav-item sidebar-item w-100 mb-1 ${page === 'nft-watchlist' ? 'active-sidebar' : ''}">
                        <a href="/nft-watchlist" class="nav-link align-middle px-0">
                            <i class="fa-solid fa-eye mx-2 size-2"></i>
                            <span class="ms-1 d-none d-sm-inline size-2">NFT Watch</span>
                        </a>
                    </li>
                    
                    <li class="nav-item sidebar-item w-100 mb-1 ${page === 'wallets' ? 'active-sidebar' : ''}">
                        <a href="/wallets" class="nav-link align-middle px-0">
                            <i class="fa-solid fa-wallet mx-2 size-2"></i>
                            <span class="ms-1 d-none d-sm-inline size-2">Multi-Wallet</span>
                        </a>
                    </li>
                    
                    <li class="nav-item sidebar-item w-100 mb-1 ${page === 'info' ? 'active-sidebar' : ''}">
                        <a href="/info" class="nav-link align-middle px-0">
                            <i class="fa-solid fa-circle-info mx-2 size-2"></i>
                            <span class="ms-1 d-none d-sm-inline size-2">Information</span>
                        </a>
                    </li>
                    
                    <li class="nav-item sidebar-item w-100 mb-1 ${page === 'settings' ? 'active-sidebar' : ''}">
                        <a href="/" class="nav-link align-middle px-0">
                            <i class="fa-solid fa-gear mx-2 size-2"></i>
                            <span class="ms-1 d-none d-sm-inline size-2">Settings</span>
                        </a>
                    </li>
                    
                </ul>
            </div>
        </div>
    `*/

    return html`
        <div class="sidebar">

            <div class="discord-info">
                <img class="discord-image"
                     src=${userData === null ? logo : `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}`} />
                <div class="discord-user-info">
                    <div class="discord-name">${userData === null ? 'MintAIO' : userData.username}#${userData === null ? '1234' : userData.discriminator}</div>
                    <div id="lifetime" class="discord-role">Web Access</div>
                </div>
            </div>

            <hr/>

            <a class="sidebar-item ${page === 'dashboard' ? 'active-sidebar' : ''}" href="/" onclick=${() => setPage("dashboard")}>
                <span class="material-symbols-outlined me-2">team_dashboard</span>
                <span>Dashboard</span>
            </a>

            <a class="sidebar-item d-none ${page === 'nft-manager' ? 'active-sidebar' : ''}" href="/dashboard" onclick=${() => setPage("nft-manager")}>
                <span class="material-symbols-outlined me-2">photo_library</span>
                <span>NFT Manager</span>
            </a>
            
            <a class="sidebar-item ${page === 'profit-tracker' ? 'active-sidebar' : ''}" href="/profit-tracker" onclick=${() => setPage("profit-tracker")}>
                <span class="material-symbols-outlined me-2">monitoring</span>
                <span>Profit Tracker</span>
            </a>

            <a class="sidebar-item ${page === 'eth-tasks' ? 'active-sidebar' : ''}" href="/eth-tasks" onclick=${() => setPage("eth-tasks")}>
                <span class="material-symbols-outlined me-2">smart_toy</span>
                <span>Mint Bot</span>
            </a>

            <a class="sidebar-item ${page === 'opensea' ? 'active-sidebar' : ''}" href="/opensea" onclick=${() => setPage("opensea")}>
                <span class="material-symbols-outlined me-2">track_changes</span>
                <span>OpenSea</span>
            </a>

            <a class="sidebar-item ${page === 'wallets' ? 'active-sidebar' : ''}" href="/wallets" onclick=${() => setPage("wallets")}>
                <span class="material-symbols-outlined me-2">wallet</span>
                <span>Wallets</span>
            </a>

            <a class="sidebar-item ${page === 'info' ? 'active-sidebar' : ''}" href="/info" onclick=${() => setPage("info")}>
                <span class="material-symbols-outlined me-2">info</span>
                <span>Information</span>
            </a>
            
            <a class="sidebar-item ${page === 'settings' ? 'active-sidebar' : ''}" href="/settings" onclick=${() => setPage("settings")}>
                <span class="material-symbols-outlined me-2">settings</span>
                <span>Settings</span>
            </a>

            <div class="sidebar-info">
                <div>
                    <div class="eth-price"><i class="fa-brands fa-ethereum icon-color me-1"></i> $${data.ethPrice}</div>
                    <div class="gas d-flex align-items-center justify-content-center">

                        <div class="d-flex align-items-center justify-content-center mx-1 my-1">
                            <span class="material-symbols-outlined" style="color: #ADEBD5;">local_gas_station</span>
                            <span style="color: white;">${data.maxFee}</span>
                        </div>

                        <div class="d-flex align-items-center justify-content-center mx-1 my-1">
                            <span class="material-symbols-outlined" style="color: #DD7C36;">local_fire_department</span>
                            <span style="color: white;">${data.priorityFee}</span>
                        </div>
                    </div>
                    <div class="eth-block">Block #${data.pendingBlock}</div>
                    <div class="version mt-2">Version 0.2.5</div>
                </div>

            </div>


        </div>
    `;
}

export default SidebarNav;