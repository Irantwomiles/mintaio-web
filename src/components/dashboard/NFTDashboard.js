import {html} from 'htm/preact';
import {useEffect, useState} from "preact/compat";
import {Toast, Dropdown} from 'bootstrap';
import logo from '../../images/mintaio-logo.png';
import {fixAddress} from "../../utils/utils";

function mapByContract(arr) {

}

function NFTDashboard({state}) {

    const [wallets, setWallets] = useState([]);
    const [selectedWallets, setSelectedWallets] = useState([]);
    const [data, setData] = useState([]);
    const [toastInfo, setToastInfo] = useState(null)

    const addWallet = (wallet) => {
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

        }).catch(e => {
            console.log(e);
        })

        setToastInfo({
            message: `Checking ${selectedWallets.length} wallets, please wait a few seconds.`,
            class: 'toast-success'
        });
    }

    useEffect(() => {

        if(state === null) {
            return;
        }

        const walletsStream = state.walletsStream.subscribe((data) => {
            setWallets(data);
        })

        return () => {
            walletsStream.unsubscribe();
        }

    }, [state]);

    useEffect(() => {
        if(toastInfo === null) return;

        Toast.getOrCreateInstance(document.querySelector('#toast-message')).show();
    }, [toastInfo]);

    return html`
        <div class="p-3 w-100">
            
            <div class="d-flex">
                <div class="dropdown me-2">

                    <div class="label">Wallets</div>
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
            </div>

            <div class="d-flex flex-wrap mt-2">
                ${
                        selectedWallets.map(w => (
                                html`
                                    <div class="selected-wallet me-1" onclick=${() => removeSelectedWallet(w)}>${w.name}
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
                        <div class="nft me-2 mb-2">
                            <div class="nft-image h-100 m-3">
                                <img class="w-100 h-100" src=${d.media.length === 0 ? logo : d.media[0].gateway} alt="Image missing" />
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

export default NFTDashboard;