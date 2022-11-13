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

            <a class="sidebar-item ${page === 'nft-manager' ? 'active-sidebar' : ''}" href="/nft-manager" onclick=${() => setPage("nft-manager")}>
                <span class="material-symbols-outlined me-2">photo_library</span>
                <span>NFT Manager</span>
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
                <span>Sniping</span>
            </a>

            <a class="sidebar-item d-none ${page === 'opensea-bidder' ? 'active-sidebar' : ''}" href="/opensea-bidder" onclick=${() => setPage("opensea-bidder")}>
                <span class="material-symbols-outlined me-2">gavel</span>
                <span>Mass Bidding</span>
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