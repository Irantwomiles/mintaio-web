import {html} from 'htm/preact';
import SidebarNav from "./SidebarNav.js";
import {Modal, Toast, Dropdown} from 'bootstrap';
import {useState, useEffect, createRef} from "preact/compat";
import Wallet from '../utils/wallet.js';
import {fixAddress, getEthPrice, shortenAddress} from "../utils/utils";

function Wallets({state}) {

    const globalRef = createRef();

    const [wallets, setWallets] = useState([]);

    const [walletCreateModal, setWalletCreateModal] = useState(null);
    const [unlockWalletModal, setUnlockWalletModal] = useState(null);

    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [massPassword, setMassPassword] = useState("");
    const [amount, setAmount] = useState(1);
    const [totalBalance, setTotalBalance] = useState("--");
    const [ethPrice, setEthPrice] = useState(0)

    const [privateKeys, setPrivateKeys] = useState([]);
    const [disperseWallets, setDisperseWallets] = useState([]);

    const [disperseMain, setDisperseMain] = useState(null);
    const [deleteWallet, setDeleteWallet] = useState(null);

    const [unlockWallet, setUnlockWallet] = useState(null);

    const [toastInfo, setToastInfo] = useState(null)

    const handleAddWallet = () => {

        if(state === null) {
            setToastInfo({
                message: 'There was an error, please refresh your page.',
                class: 'toast-error'
            })
            return;
        }

        if(state.globalWeb3 === null) {
            setToastInfo({
                message: 'There was an error, please refresh your page.',
                class: 'toast-error'
            })
            return;
        }

        if(name.length === 0 || password.length === 0 || privateKeys.length === 0) {
            setToastInfo({
                message: 'You need to fill out all of the input fields.',
                class: 'toast-error'
            })
            return;
        }

        if(name.length >= 15) {
            setToastInfo({
                message: "Wallet names can't be longer than 14 characters",
                class: 'toast-error'
            })
            return;
        }

        let i = 1;

        for(const key of privateKeys) {
            try {
                const account = state.globalWeb3.eth.accounts.privateKeyToAccount(key.privateKey);

                for(const w of wallets) {
                    if(account.address === w.account.address) {
                        console.log("Wallet already added, skipping.")
                        continue;
                    }
                }

                const wallet = new Wallet(name + '-Import-' + (i + 1), account);
                wallet.getBalance(state);

                i++;

                state.walletsStream.next([...wallets, wallet]);

                // Add encrypted wallet to localStorage.
                const encryptedWallets = JSON.parse(localStorage.getItem("wallets"));

                const encryptedData = state.globalWeb3.eth.accounts.encrypt(account.privateKey, password);

                encryptedWallets.push({name: wallet.name, account: encryptedData});

                localStorage.setItem("wallets", JSON.stringify(encryptedWallets));

            } catch(e) {
                setToastInfo({
                    message: "Error while import wallet, check console.",
                    class: 'toast-error'
                })
                console.log("error", e);
            }
        }

        setName("");
        setPassword("");
        setPrivateKeys([]);

    }

    const handleUnlockWallet = () => {

        if(state === null) {
            setToastInfo({
                message: 'There was an error, please refresh your page.',
                class: 'toast-error'
            });
            unlockWalletModal.hide();
            return;
        }

        if(state.globalWeb3 === null) {
            setToastInfo({
                message: 'There was an error, please refresh your page.',
                class: 'toast-error'
            });
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
                unlockWalletModal.hide();
                return;
            }

            setToastInfo({
                message: 'Could not unlock wallet.',
                class: 'toast-error'
            })
            unlockWalletModal.hide();
            return;

        } catch(e) {
            console.log("error:", e);
        }

    }

    const massUnlockWallets = async () => {

        if(massPassword.length === 0) {
            setToastInfo({
                message: `You must input the password.`,
                class: 'toast-error'
            })
            return;
        }

        let i = 0;

        for(const w of wallets) {

            try {
                const unlocked = state.unlockWallet(w.account.address, massPassword);

                if(unlocked) {
                    i++;
                }

            } catch(e) {
            }
        }

        setToastInfo({
            message: `Unlocked ${i} wallets.`,
            class: 'toast-success'
        })

    }

    const handleOpenUnlockWallet = (w) => {

        setUnlockWallet(w);

        setPassword("");
        unlockWalletModal.show();
    }

    const handleCreateWallets = () => {
        if(typeof amount !== 'number') return;

        if(amount <= 0) return;

        if(name.length === 0) return;

        const _newWallets = [];

        try {
            for(let i = 0; i < amount; i++) {
                const account = state.globalWeb3.eth.accounts.create();
                const wallet = new Wallet(name + '-MintAIO-' + (i + 1), account);

                wallet.getBalance(state);

                _newWallets.push(wallet);
            }

            state.walletsStream.next([...wallets, ..._newWallets]);

            const encryptedWallets = JSON.parse(localStorage.getItem("wallets"));

            for(const w of _newWallets) {
                const encryptedData = state.globalWeb3.eth.accounts.encrypt(w.account.privateKey, password);

                encryptedWallets.push({
                    name: w.name,
                    account: encryptedData
                })

            }

            localStorage.setItem("wallets", JSON.stringify(encryptedWallets));

            setToastInfo({
                message: `Created ${amount} wallets.`,
                class: 'toast-success'
            })

            setName('');
            setPassword('');
            setAmount(1);

            Modal.getOrCreateInstance(document.querySelector('#create-wallets-modal')).hide();
        } catch(e) {
            console.log(e);
        }
    }

    const copyPublicAddress = (address) => {
        navigator.clipboard.writeText(`${address.startsWith('0x') ? address : '0x' + address}`).then(() => {
            setToastInfo({
                message: `Copied public address to clipboard.`,
                class: 'toast-success'
            });
        });
    }

    const copyPrivateKey = (wallet) => {

        if(wallet.isLocked()) {
            setToastInfo({
                message: `You must unlock the wallet first.`,
                class: 'toast-error'
            });
            return;
        }

        navigator.clipboard.writeText(wallet.account.privateKey).then(() => {
            setToastInfo({
                message: `Copied private key to clipboard.`,
                class: 'toast-success'
            });
            return;
        });
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

    const handleDeleteWallet = () => {
        if(deleteWallet === null) {
            setToastInfo({
                message: `Could not delete that wallet.`,
                class: 'toast-error'
            });

            Modal.getOrCreateInstance(document.querySelector('#delete-wallet-modal')).hide();
            return;
        }

        let taskCount = 0;

        for(const t of state.ethTasks) {
            if(fixAddress(t.wallet.account.address) === fixAddress(deleteWallet.account.address)) {
                taskCount++;
            }
        }

        if(taskCount > 0) {
            setToastInfo({
                message: `Please delete all ${taskCount} task(s) using this Wallet.`,
                class: 'toast-error'
            });
            Modal.getOrCreateInstance(document.querySelector('#delete-wallet-modal')).hide();
            return;
        }

        let clone = [...wallets]
        clone = clone.filter((w) => fixAddress(w.account.address) !== fixAddress(deleteWallet.account.address));

        state.walletsStream.next(clone);

        let encryptedWallets = JSON.parse(localStorage.getItem("wallets"));
        encryptedWallets = encryptedWallets.filter((w) => fixAddress(w.account.address) !== fixAddress(deleteWallet.account.address));

        localStorage.setItem('wallets', JSON.stringify(encryptedWallets));

        setToastInfo({
            message: `Deleted wallet ${deleteWallet.name}.`,
            class: 'toast-success'
        })
        Modal.getOrCreateInstance(document.querySelector('#delete-wallet-modal')).hide();
        return;
    }

    const availableDisperseWallets = () => {
        if(disperseMain === null) return [];

        let filtered = wallets.filter((w) => fixAddress(w.account.address) !== fixAddress(disperseMain.account.address));

        for(const disperse of disperseWallets) {
            filtered = filtered.filter((f) => fixAddress(f.account.address) !== fixAddress(disperse.wallet.account.address));
        }

        return filtered;
    }

    const handleDisperseChange = (wallet, key, value) => {
        const clone = [...disperseWallets];

        const _disperse = clone.find(d => fixAddress(d.wallet.account.address) === fixAddress(wallet.wallet.account.address));

        if(typeof _disperse === 'undefined') return;

        _disperse[key] = value;

        setDisperseWallets(clone);
    }

    const handleDeleteDisperse = (wallet) => {
        let clone = [...disperseWallets];
        const _disperse = clone.filter(d => fixAddress(d.wallet.account.address) !== fixAddress(wallet.wallet.account.address));
        setDisperseWallets(_disperse);
    }

    const getTotalBalance = () => {

        let total = 0.0;

        for(const w of wallets) {

            if(w.balance !== -1) {
                total += Number.parseFloat(`${w.balance}`);
            }

        }

        setTotalBalance(Number.parseFloat(`${total}`).toFixed(8));
    }

    const disperseFunds = () => {

        if(disperseMain === null) {
            setToastInfo({
                message: 'You must select a wallet to disperse from',
                class: 'toast-error'
            });
            return;
        }

        if(disperseMain.isLocked()) {
            setToastInfo({
                message: 'Your disperse wallet must be unlocked',
                class: 'toast-error'
            });
            return;
        }

        if(disperseWallets.length === 0) {
            setToastInfo({
                message: 'You must select at least one wallet to send funds to',
                class: 'toast-error'
            });
            return;
        }

        let totalValue = 0.000;
        const recipients = [];
        const values = [];

        for(let i = 0; i < disperseWallets.length; i++) {
            recipients[i] = fixAddress(disperseWallets[i].wallet.account.address);
            values[i] = state.globalWeb3.utils.toWei(`${disperseWallets[i].amount}`, 'ether');

            totalValue += Number.parseFloat(Number.parseFloat(disperseWallets[i].amount).toFixed(3));
        }

        state.disperseFunds(disperseMain, totalValue, recipients, values).then((output) => {

            state.refreshAllBalance();

            setToastInfo({
                message: 'Funds dispersed successfully',
                class: 'toast-success'
            });
        }).catch((e) => {
            setToastInfo({
                message: 'Error occurred while dispersing funds',
                class: 'toast-error'
            });

            console.log(e);
        });

        setToastInfo({
            message: 'Attempting to disperse funds, please wait a few seconds.',
            class: 'toast-warning'
        });

        setDisperseWallets([]);
        setDisperseMain(null);

        Modal.getOrCreateInstance(document.querySelector('#disperse-funds-modal')).hide();
    }

    const getTotalFundsDispersed = () => {
        let totalValue = 0.000;

        for(let i = 0; i < disperseWallets.length; i++) {
            totalValue += Number.parseFloat(Number.parseFloat(disperseWallets[i].amount).toFixed(3));
        }

        return totalValue;
    }

    useEffect(() => {

        getEthPrice().then((res) => {
            res.json().then(result => {
                setEthPrice(result['USD']);
            }).catch(e => {
                setEthPrice(0);
            })
        }).catch(e => {
            setEthPrice(0);
        })

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

    useEffect(() => {
        getTotalBalance();
    }, [wallets])

    useEffect(() => {

        if(deleteWallet === null) return;

        Modal.getOrCreateInstance(globalRef.current.querySelector('#delete-wallet-modal')).show();

    }, [deleteWallet]);

    useEffect(() => {
        if(toastInfo === null) return;

        Toast.getOrCreateInstance(document.querySelector('#toast-message')).show();
    }, [toastInfo]);

    return html`
        <div ref=${globalRef} class="d-flex" style="position: relative;">

            <${SidebarNav} page="wallets" />

            <div class="p-3 w-100">

                <div class="d-flex">
                    <button class="button-primary fw-bold" onclick=${() => {Modal.getOrCreateInstance(document.querySelector('#create-wallets-modal')).show()}}><i class="fa-solid fa-plus"></i> Create Wallets</button>
                    <button class="button-secondary fw-bold ms-2" onclick=${() => {walletCreateModal.show()}}><i class="fa-solid fa-arrow-up"></i> Import Wallets</button>
                    <button class="button-orange fw-bold ms-2" onclick=${() => {Modal.getOrCreateInstance(document.querySelector('#disperse-funds-modal')).show()}}><i class="fa-solid fa-arrow-right-arrow-left"></i> Disperse Funds</button>
                    
                    
                    <div class="total-balance ms-auto">
                        <div class="label">Total Balance</div>
                        <div>
                            <i class="fa-brands fa-ethereum icon-color me-1"></i>
                            <span>${totalBalance} 
                                <span class="dollar-value ms-1 fw-normal ${ethPrice === 0 ? 'd-none' : ''}">($
                                    ${totalBalance === '--' ? '' : 
                                    Number.parseFloat(`${Number.parseFloat(`${totalBalance * ethPrice}`)}`).toFixed(2)
                                    })
                                </span>
                            </span>
                        </div>
                    </div>
                    
                </div>

                <hr/>

                <div class="d-flex justify-content-between mb-3">
                    
                    <div>
                        <button class="button-primary fw-bold me-2" onclick=${() => {massUnlockWallets()}}><i class="fa-solid fa-unlock"></i> Mass Unlock</button>
                        <input class="input" placeholder="Password" type="password" value=${massPassword} onchange=${(e) => {setMassPassword(e.target.value)}} />
                    </div>
                    <div class="button-outline-secondary">
                        <div>
                            <i class="fa-solid fa-arrows-rotate me-2" onclick=${() => {
                            state.refreshAllBalance();
                            getTotalBalance();
                        }}></i>
                            Refresh Balances
                        </div>
                    </div>
                </div>
                
                <div class="d-flex flex-wrap">
                    
                    ${
                        wallets.map((w) => (
                            html`
                                <div class="wallet me-2 mb-2">
                                    <div class="m-2 p-2">
                                        <div class="top d-flex justify-content-between mb-3">
                                            <div class="name pe-5">${w.name}</div>
                                            <div class="d-flex align-items-baseline balance ps-5">
                                                ${w.balance === -1 ? html`<i class="fa-solid fa-spinner loading-icon"></i>` : 
                                                        html`${w.balance} <i class="fa-brands fa-ethereum icon-color ms-1"></i>`}
                                            </div>
                                        </div>

                                        <div class="balance me-2 mb-2" onclick=${() => copyPublicAddress(w.account.address)}>
                                                ${shortenAddress(w.account.address)}
                                            <i class="fa-solid fa-copy ms-2" style="color: #a1a1a1;"></i>
                                        </div>

                                        <div class="d-flex justify-content-between align-items-center">
                                            <button class="button-outline-primary" onclick=${() => copyPrivateKey(w)}>Export</button>
                                            <div>
                                                ${w.isLocked() ? html`<i className="fa-solid fa-lock me-2 icon-color-unlock" onclick=${() => {handleOpenUnlockWallet(w)}}></i>` : ''}
                                                
                                                <i class="fa-solid fa-trash-can icon-color-delete" onclick=${() => setDeleteWallet(w)}></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `
                        ))
                    }
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

            <div id="create-wallets-modal" class="modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        
                        <div class="modal-header">
                            <h5 class="modal-title title">Create Wallets</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">

                            <div>
                                <div class="label">Name</div>
                                <input class="input" placeholder="Wallet Name" value=${name} onchange=${(e) => {setName(e.target.value)}} />
                            </div>

                            <div class="mt-2">
                                <div class="label">Amount</div>
                                <input class="input" placeholder="Amount" type="number" min="1" value=${amount} onchange=${(e) => {setAmount(Number.parseInt(e.target.value))}} />
                            </div>
                            
                            <div class="mt-2">
                                <div class="label">Password</div>
                                <input type="password" class="input w-75" placeholder="Wallet Password" value=${password} onchange=${(e) => {setPassword(e.target.value)}} />
                            </div>

                        </div>
                        <div class="modal-footer">
                            <button class="button-outline-cancel" data-bs-dismiss="modal">Cancel</button>
                            <button class="button-primary" onclick=${handleCreateWallets}>Create</button>
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

            <div id="delete-wallet-modal" class="modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title title">Delete Wallet</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">

                            <div class="title">Wallet <span style="color: #f58686;">${deleteWallet !== null ? deleteWallet.name : ''}</span> (${deleteWallet !== null ? html`${deleteWallet.balance} <i class="fa-brands fa-ethereum icon-color"></i>` : ''})</div>
                            
                            <div class="mt-2 label">Are you sure you want to delete this wallet? Please make sure you have a backup of your Private Key, this action can NOT be reversed!</div>

                        </div>
                        <div class="modal-footer">
                            <button class="button-outline-cancel" data-bs-dismiss="modal">Cancel</button>
                            <button class="button-danger" onclick=${handleDeleteWallet}>Delete</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="disperse-funds-modal" class="modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title title">Disperse Funds</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">

                            <div>
                                <div class="dropdown">

                                    <div class="label">Main Wallet</div>
                                    <button class="button-dropdown dropdown-toggle" id="disperse-main-dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false"
                                    onclick=${() => Dropdown.getOrCreateInstance(document.querySelector('#disperse-main-dropdown')).show()}>
                                        ${disperseMain === null ? 'Select Wallet' : disperseMain.name}
                                    </button>
                                    <ul class="dropdown-menu" aria-labelledby="dropdown">
                                        ${wallets.filter(f => !f.isLocked()).map(w => (
                                            html`
                                                <li class="dropdown-item" onclick=${() => {setDisperseMain(w)}}>${w.name} (${w.balance})</li>
                                            `
                                        ))}

                                    </ul>
                                </div>
                                
                            </div>

                            <div class="mt-2">
                                
                                ${
                                        disperseWallets.map((w) => (
                                                html`
                                            <div class="mb-2">
                                                <div class="label">
                                                    ${w.wallet.name}
                                                </div>

                                                <div class="d-flex align-items-center justify-content-between">
                                                    <input class="input w-50" type="number" min="0" value=${w.amount} onchange=${(e) => {handleDisperseChange(w, 'amount', e.target.value)}} />
                                                    <i class="fa-solid fa-trash icon-color delete-icon pk-icons p-2 ms-1" onclick=${() => handleDeleteDisperse(w)}></i>
                                                </div>
                                            </div>
                                        `
                                        ))

                                }

                                <div class="dropdown ${disperseMain !== null ? '' : 'd-none'}">

                                    <button class="button-secondary dropdown-toggle" id="disperse-select-dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false"
                                            onclick=${() => Dropdown.getOrCreateInstance(document.querySelector('#disperse-select-dropdown')).show()}>
                                        Add Wallet
                                    </button>
                                    <ul class="dropdown-menu" aria-labelledby="dropdown">
                                        ${disperseMain !== null ?
                                            availableDisperseWallets().map(w => (
                                                html`
                                                <li class="dropdown-item" onclick=${() => {setDisperseWallets([...disperseWallets, {wallet: w, amount: 0}])}}>${w.name} (${w.balance})</li>
                                            `
                                        )) : ''
                                        }

                                    </ul>
                                </div>

                            </div>
                           
                            <div class="mt-3 label">Total (not including gas): <span>${getTotalFundsDispersed()} <i class="fa-brands fa-ethereum icon-color"></i></span></div>
                            
                        </div>
                        <div class="modal-footer">
                            <button class="button-outline-cancel" data-bs-dismiss="modal">Cancel</button>
                            <button class="button-primary" onclick=${() => disperseFunds()}>Send Transaction</button>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
        

    `
}

export default Wallets;