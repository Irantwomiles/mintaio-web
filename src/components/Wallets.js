import {html} from 'htm/preact';
import SidebarNav from "./SidebarNav.js";
import {Modal, Toast} from 'bootstrap';
import {useState, useEffect, createRef} from "preact/compat";
import Wallet from '../utils/wallet.js';

function shortenAddress(address) {
    return address.slice(0, 5) + "..." + address.slice(address.length - 6);
}

function Wallets({state}) {

    const globalRef = createRef();

    const [wallets, setWallets] = useState([]);

    const [walletCreateModal, setWalletCreateModal] = useState(null);
    const [unlockWalletModal, setUnlockWalletModal] = useState(null);
    const [toast, setToast] = useState(null);

    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [privateKey, setPrivateKey] = useState("");

    const [privateKeys, setPrivateKeys] = useState([]);

    const [unlockWallet, setUnlockWallet] = useState(null);

    const [toastInfo, setToastInfo] = useState({
        message: 'This is my Toast message here This is my Toast message here This is my Toast message here This is my Toast message here!',
        class: 'toast-success'
    })

    const handleAddWallet = () => {

        if(state === null) {
            setToastInfo({
                message: 'There was an error, please refresh your page.',
                class: 'toast-error'
            })

            toast.show();
            return;
        }

        if(state.globalWeb3 === null) {
            setToastInfo({
                message: 'There was an error, please refresh your page.',
                class: 'toast-error'
            })

            toast.show();
            return;
        }

        if(name.length === 0 || password.length === 0 || privateKeys.length === 0) {
            setToastInfo({
                message: 'You need to fill out all of the input fields.',
                class: 'toast-error'
            })

            toast.show();
            return;
        }

        if(name.length >= 15) {
            setToastInfo({
                message: "Wallet names can't be longer than 14 characters",
                class: 'toast-error'
            })

            toast.show();
            return;
        }

        for(const key of privateKeys) {
            try {
                const account = state.globalWeb3.eth.accounts.privateKeyToAccount(key.privateKey);

                console.log("Account created:", account);

                for(const w of wallets) {
                    if(account.address === w.account.address) {
                        setToastInfo({
                            message: 'That wallet has already been added.',
                            class: 'toast-error'
                        })

                        toast.show();
                        return;
                    }
                }

                state.walletsStream.next([...wallets, new Wallet(name, account)]);

                // Add encrypted wallet to localStorage.
                const encryptedWallets = JSON.parse(localStorage.getItem("wallets"));

                const encryptedData = state.globalWeb3.eth.accounts.encrypt(account.privateKey, password);

                console.log(encryptedData);

                encryptedWallets.push({name: name, account: encryptedData});

                localStorage.setItem("wallets", JSON.stringify(encryptedWallets));

            } catch(e) {
                console.log("error", e);
            }
        }

    }

    const handleUnlockWallet = () => {

        if(state === null) {
            setToastInfo({
                message: 'There was an error, please refresh your page.',
                class: 'toast-error'
            });

            toast.show();
            unlockWalletModal.hide();
            return;
        }

        if(state.globalWeb3 === null) {
            setToastInfo({
                message: 'There was an error, please refresh your page.',
                class: 'toast-error'
            });

            toast.show();
            unlockWalletModal.hide();
            return;
        }

        if(unlockWallet === null) {
            unlockWalletModal.hide();
            return;
        }

        if(!unlockWallet.isLocked()) {
            unlockWalletModal.hide();
            return;
        }

        try {

            const unlocked = state.unlockWallet(unlockWallet.account.address, password);

            if(unlocked) {
                setToastInfo({
                    message: 'Wallet Unlocked.',
                    class: 'toast-success'
                })

                toast.show();
                unlockWalletModal.hide();
                return;
            }

            setToastInfo({
                message: 'Could not unlock wallet.',
                class: 'toast-error'
            })

            toast.show();
            unlockWalletModal.hide();
            return;

        } catch(e) {
            console.log("error:", e);
        }

    }

    const handleOpenUnlockWallet = (w) => {

        setUnlockWallet(w);

        setPassword("");
        unlockWalletModal.show();
    }

    const copyPublicAddress = (address) => {
        navigator.clipboard.writeText(`${address.startsWith('0x') ? address : '0x' + address}`).then(() => console.log);
    }

    const handlePrivateKeysChange = (id, key, value) => {
        const clone = [...privateKeys];

        const _privateKey = clone.find(pk => pk.id === id);

        if(typeof _privateKey === 'undefined') return;

        _privateKey[key] = value;

        setPrivateKeys(clone);
    }

    const handleDeletePrivateKey = (id) => {
        let clone = [...privateKeys];
        clone = clone.filter(pk => pk.id !== id);
        setPrivateKeys(clone);
    }

    useEffect(() => {
        setToast(Toast.getOrCreateInstance(globalRef.current.querySelector('#message-toast')));

        setWalletCreateModal(Modal.getOrCreateInstance(globalRef.current.querySelector('#new-wallet-modal')));
        setUnlockWalletModal(Modal.getOrCreateInstance(globalRef.current.querySelector('#unlock-wallet-modal')));
    }, []);

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

    return html`
        <div ref=${globalRef} class="d-flex" style="position: relative;">

            <${SidebarNav} page="wallets" />

            <div class="p-3 w-100">

                <div>
                    <button class="button-primary fw-bold"><i class="fa-solid fa-plus"></i> Create Wallets</button>
                    <button class="button-secondary fw-bold ms-3" onclick=${() => {walletCreateModal.show()}}><i class="fa-solid fa-arrow-up"></i> Import Wallets</button>
                </div>

                <hr/>

                <div class="d-flex flex-wrap">
                    
                    ${
                        wallets.map((w) => (
                            html`
                                <div class="wallet me-2 mb-2">
                                    <div class="m-2 p-2">
                                        <div class="top d-flex justify-content-between mb-3">
                                            <div class="name pe-5">${w.name}</div>
                                            <div class="balance ps-5">
                                                ${w.balance === -1 ? html`<i class="fa-solid fa-spinner loading-icon"></i>` : 
                                                        html`${w.balance} <i class="fa-brands fa-ethereum icon-color"></i>`}
                                            </div>
                                        </div>

                                        <div class="balance me-2 mb-2" onclick=${() => copyPublicAddress(w.account.address)}>
                                                0x${shortenAddress(w.account.address)}
                                            <i class="fa-solid fa-copy ms-2" style="color: #a1a1a1;"></i>
                                        </div>

                                        <div class="d-flex justify-content-between align-items-center">
                                            <button class="button-outline-primary">Export</button>
                                            <div>
                                                ${w.isLocked() ? html`<i className="fa-solid fa-lock me-2 icon-color-unlock" onclick=${() => {handleOpenUnlockWallet(w)}}></i>` : ''}
                                                
                                                <i class="fa-solid fa-trash-can icon-color-delete"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `
                        ))
                    }
                </div>
            </div>
            
            <div id="message-toast" class="toast align-items-center ${toastInfo.class} end-0 top-0 m-3" style="position: absolute" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex align-items-center justify-content-between py-3 mx-2">
                    <div class="toast-body">
                        ${toastInfo.message}
                    </div>
                    <i class="fa-regular fa-circle-xmark" data-bs-dismiss="toast"></i>
                </div>
            </div>
            
            <div id="new-wallet-modal" class="modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title title">New Wallet</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div>
                                <div class="label">Name</div>
                                <input class="input" placeholder="Wallet Name" value=${name} onchange=${(e) => {setName(e.target.value)}} />
                            </div>

                            <div class="mt-2">
                                <div class="label">Password</div>
                                <input type="password" class="input w-75" placeholder="Wallet Password" value=${password} onchange=${(e) => {setPassword(e.target.value)}} />
                            </div>
                            
                            <div class="mt-2">

                                <div class="label">Private Keys</div>

                                ${
                                    privateKeys.map((p) => (
                                        html`
                                            <div class="d-flex mb-2">
                                                <div class="flex-grow-1">
                                                    <input type="${p.show ? 'text' : 'password'}" class="input w-100" placeholder="0x123abc..." value=${p.privateKey} onchange=${(e) => {handlePrivateKeysChange(p.id, 'privateKey', e.target.value)}} />
                                                </div>

                                                <div class="d-flex justify-content-center align-items-center pk-icons p-2 ms-1">
                                                    <i class="fa-solid fa-eye icon-color ${p.show ? 'd-none' : ''}" onclick=${(e) => {handlePrivateKeysChange(p.id, 'show', true)}}></i>
                                                    <i class="fa-solid fa-eye-slash icon-color ${!p.show ? 'd-none' : ''}" onclick=${(e) => {handlePrivateKeysChange(p.id, 'show', false)}}></i>
                                                </div>
                                                <div class="d-flex justify-content-center align-items-center pk-icons p-2 ms-1">
                                                    <i class="fa-solid fa-trash icon-color delete-icon" onclick=${() => {handleDeletePrivateKey(p.id)}}></i>
                                                </div>
                                            </div>
                                        `
                                    ))
                                
                                }

                                <button class="button-secondary" onclick=${() => {setPrivateKeys([...privateKeys, {id: "pk-" + Math.random().toString(16).slice(2) , privateKey: '', show: false}])} }>Add Private Key</button>

                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="button-outline-cancel" data-bs-dismiss="modal">Cancel</button>
                            <button class="button-primary" onclick=${handleAddWallet}>Import</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="unlock-wallet-modal" class="modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title title">Unlock Wallet</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
  
                            <div class="mt-2">
                                <div class="label">Password</div>
                                <input type="password" class="input w-75" placeholder="Wallet Password" value=${password} onchange=${(e) => {setPassword(e.target.value)}} />
                            </div>
                          
                        </div>
                        <div class="modal-footer">
                            <button class="button-outline-cancel" data-bs-dismiss="modal">Cancel</button>
                            <button class="button-primary" onclick=${handleUnlockWallet}>Unlock</button>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
        

    `
}

export default Wallets;