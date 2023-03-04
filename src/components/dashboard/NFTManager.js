import {html} from 'htm/preact';
import {useEffect, useState} from "preact/compat";
import {Toast, Dropdown} from 'bootstrap';
import logo from '../../images/mintaio-logo.png';
import {fixAddress, getBatchTokenInfo} from "../../utils/utils";
import {Modal, Toast, Dropdown} from 'bootstrap';

function NFTManager({state}) {

    const [wallets, setWallets] = useState([]);
    const [selectedWallets, setSelectedWallets] = useState([]);
    const [data, setData] = useState([]);
    const [toastInfo, setToastInfo] = useState(null)
    const [selectedAssets, setSelectedAssets] = useState([]);

    const [price, setPrice] = useState(0);
    const [expiration, setExpiration] = useState(0);

    const [listings, setListings] = useState([]);

    const addWallet = (wallet) => {

        if(selectedWallets.length > 0) {
            return;
        }

        if (selectedWallets.find(w => w.account.address === wallet.account.address)) {
            return;
        }

        setSelectedWallets([...selectedWallets, wallet]);
    }

    const removeSelectedWallet = (w) => {
        let clone = [...selectedWallets];

        clone = clone.filter(c => fixAddress(c.account.address) !== fixAddress(w.account.address));
        setSelectedWallets(clone);
    }

    const fetchNFTs = () => {

        if(selectedWallets.length === 0) {
            setToastInfo({
                message: 'Select at least one wallet to fetch NFTs for.',
                class: 'toast-error'
            });
            return;
        }

        const addresses = [];

        for(const w of selectedWallets) {
            addresses.push(fixAddress(w.account.address));
        }

        state.nftManager.getNFTs(addresses).then((result) => {
            const filtered = result.filter(r => r.ownedNfts.length > 0).map(d => d.ownedNfts);
            const flat = [].concat(...filtered);
            setData(flat);
            console.log(flat);
        }).catch(e => {
            console.log(e);
        })

        setToastInfo({
            message: `Checking ${selectedWallets.length} wallets, please wait a few seconds.`,
            class: 'toast-success'
        });
    }

    const addAssetToSelection = (d) => {

        let clone = [...selectedAssets];

        if(typeof clone.find(c => (c.contract.address + ":" + c.tokenId) === (d.contract.address + ":" + d.tokenId)) === 'undefined') {
            setSelectedAssets([...clone, d]);
        } else {
            clone = clone.filter(c => (c.contract.address + ":" + c.tokenId) !== (d.contract.address + ":" + d.tokenId))
            setSelectedAssets(clone);
        }

    }

    const createListing = () => {
        const listing = state.createOpenSeaListing(selectedWallets[0]);

        if(listing === null) {
            setToastInfo({
                message: `You must unlock your wallet before creating listings.`,
                class: 'toast-error'
            });
            return;
        }

        let count = 0;

        for(const asset of selectedAssets) {
            const added = listing.addListingToList({
                contractAddress: asset.contract.address,
                tokenId: asset.tokenId,
                price: price.toString(),
                expiration
            });

            if(added) count++;
        }

        if(count > 0) {
            setToastInfo({
                message: `Added ${count} asset(s) to be listed.`,
                class: 'toast-success'
            });
            return;
        }

        setToastInfo({
            message: `Did not add any assets to be listed.`,
            class: 'toast-warning'
        });
    }

    const startListingAll = () => {
        for(const listing of state.openseaListings) {
            listing.startListingAssets(state);
        }
    }

    useEffect(() => {

        if(state === null) {
            return;
        }

        console.log("State change", state);

        const walletsStream = state.walletsStream.subscribe((data) => {
            setWallets(data);
        })

        const listingsStream = state.openseaListingsStream.subscribe((data) => {
            setListings(data);
        })

        return () => {
            walletsStream.unsubscribe();
            listingsStream.unsubscribe();
        }

    }, [state]);

    useEffect(() => {
        if(toastInfo === null) return;

        Toast.getOrCreateInstance(document.querySelector('#toast-message')).show();
    }, [toastInfo]);

    return html`
        <div class="mint-bot view-container p-3 w-100">

            <div class="nft-manager-banner d-flex align-items-center justify-content-start p-4">
                <div class="ms-4 fw-bold">NFT Manager</div>
            </div>
            
            <div class="task-bar d-flex align-items-center mt-3 p-3">
                <div class="dropdown me-2">

                    <button class="button-dropdown dropdown-toggle" id="wallets-dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false"
                            onclick=${() => Dropdown.getOrCreateInstance(document.querySelector('#wallets-dropdown')).show()}>
                        Select Wallet
                    </button>
                    
                    <ul class="dropdown-menu" aria-labelledby="dropdown">
                        ${wallets.map(w => (
                            html`
                                <li class="dropdown-item" onclick=${() => {addWallet(w)}}>${w.name} (${w.balance})</li>
                            `
                        ))}

                    </ul>
                </div>

                <button class="button-secondary fw-bold mt-auto" onclick=${fetchNFTs}>Search Wallets</button>
                <button class="button-secondary fw-bold ms-auto me-2 mt-auto" onclick=${() => Modal.getOrCreateInstance(document.querySelector('#create-listing-modal')).show()}>Create Listings</button>
                <div class="button-outline-secondary fw-bold mt-auto" onclick=${() => Modal.getOrCreateInstance(document.querySelector('#view-listing-modal')).show()}><i class="fa-solid fa-bars"></i></div>
            </div>

            <div class="d-flex flex-wrap">
                ${
                    selectedWallets.map(w => (
                            html`
                                <div class="selected-wallet me-1 mt-2" onclick=${() => removeSelectedWallet(w)}>${w.name}
                                    <i class="fa-solid fa-xmark icon-color ms-2 delete-icon"></i>
                                </div>
                            `
                    ))
                }
            </div>
            
            <hr />
            
            <div class="d-flex flex-wrap">
                ${
                        data.map(d => (
                                html`
                        <div class="nft mb-2 me-2 ${typeof selectedAssets.find(c => (c.contract.address + ":" + c.tokenId) === (d.contract.address + ":" + d.tokenId)) !== 'undefined' ? 'nft-selected' : ''}" onclick=${() => addAssetToSelection(d)}>
                            <div class="nft-image h-100 m-3">
                                <img class="w-100 h-100" src=${d.media.length === 0 ? logo : d.media[0].thumbnail} alt="Image missing" />
                            </div>
                            <div class="mx-3">
                                <div class="title">${d.title.length === 0 ? html`<span style="color: #f58686;">Missing</span>` : d.title}</div>
                                <div class="links">
                                    <a class="icon-color start-icon me-1" href="https://opensea.io/assets/ethereum/${d.contract.address}/${d.tokenId}" target="_blank">
                                        <i class="fa-solid fa-sailboat"></i>
                                    </a>
                                    <a class="icon-color start-icon" href="https://etherscan.io/address/${d.contract.address}" target="_blank">
                                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    `
                        ))
                }
            </div>

            <div id="create-listing-modal" class="modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        
                        <div class="modal-header">
                            <h5 class="modal-title title">Create Listing</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">

                            <div>
                                <div class="label">Price (in ETH)</div>
                                <input class="input" placeholder="0.0" type="number" min="0" value=${price} onchange=${(e) => {setPrice(e.target.value)}} />
                            </div>

                            <div>
                                <div class="label">Expiration (in hours)</div>
                                <input class="input" placeholder="0" type="number" min="0" step="1" value=${expiration} onchange=${(e) => {setExpiration(e.target.value)}} />
                            </div>
                            
                            <div class="label mt-2">You have selected ${selectedAssets.length} to list.</div>
                            
                        </div>
                        <div class="modal-footer">
                            <button class="button-outline-cancel" data-bs-dismiss="modal">Cancel</button>
                            <button class="button-primary" onclick=${createListing}>Create Listing</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="view-listing-modal" class="modal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        
                        <div class="modal-header">
                            <h5 class="modal-title title">Listings</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">

                            ${listings.map(l => (
                                html`
                                <div class="d-flex task p-2 justify-content-between align-items-center">
                                    <div class="label fw-bold">${l.wallet.name}<span class="ms-2 fw-normal" style="color: #a1a1a1; font-size: 0.85rem;">(${fixAddress(l.wallet.account.address)})</span></div>
                                    
                                    <div class="d-flex align-items-center listing-pill fw-bold p-1" style="color: #a1a1a1;">
                                        <div class="me-1" style="color: white;">${l.waiting}</div>
                                        <div>/</div>
                                        <div class="ms-1 me-1" style="color: #49a58b;">${l.success}</div>
                                        <div>/</div>
                                        <div class="ms-1" style="color: #f58686;">${l.failed}</div>
                                    </div>
                                </div>
                                `
                            ))}
                            
                        </div>
                        <div class="modal-footer">
                            <button class="button-outline-cancel" data-bs-dismiss="modal">Close</button>
                            <button class="button-primary" onclick=${startListingAll}>List All</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="toast-message" class="toast align-items-center ${toastInfo === null ? '' : toastInfo.class} end-0 top-0 m-3" style="position: absolute" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex align-items-center justify-content-between py-3 mx-2">
                    <div class="toast-body">
                        ${toastInfo === null ? '' : toastInfo.message}
                    </div>
                    <i class="fa-regular fa-circle-xmark" data-bs-dismiss="toast"></i>
                </div>
            </div>
            
        </div>
    `
}

export default NFTManager;