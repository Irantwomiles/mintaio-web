import {html} from 'htm/preact';

function SidebarNav({page}) {

    return html`
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
    `
}

export default SidebarNav;