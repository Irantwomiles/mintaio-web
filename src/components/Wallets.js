import {html} from 'htm/preact';
import SidebarNav from "./SidebarNav";
import {Modal} from 'bootstrap';
import {useState, useEffect, createRef} from "preact/compat";

function Wallets() {

    const globalRef = createRef();

    const [walletCreateModal, setWalletCreateModal] = useState(null);

    const [name, setName] = useState("");
    const [privateKey, setPrivateKey] = useState("");

    useEffect(() => {

        console.log(globalRef.current.querySelector('#new-wallet-modal'));
        setWalletCreateModal(Modal.getOrCreateInstance(globalRef.current.querySelector('#new-wallet-modal')));
    }, []);

    return html`
        <div ref=${globalRef} class="d-flex">

            <${SidebarNav} page="wallets" />

            <div class="p-3 w-100">

                <div>
                    <button class="button-primary fw-bold" onclick=${() => {walletCreateModal.show()}}><i class="fa-solid fa-plus"></i> New Wallet</button>
                    <button class="button-secondary fw-bold ms-3"><i class="fa-solid fa-arrow-up"></i> Import Wallets</button>
                </div>

                <hr/>

                <div class="d-flex flex-wrap">
                    <div class="wallet me-2 mb-2">
                        <div class="m-2 p-2">
                            <div class="top d-flex justify-content-between mb-3">
                                <div class="name pe-5">Wallet Name</div>
                                <div class="balance ps-5">0.123 <i class="fa-brands fa-ethereum icon-color"></i>
                                </div>
                            </div>

                            <div class="balance me-2 mb-2">0xA6B...76A</div>

                            <div class="d-flex justify-content-between align-items-center">
                                <button class="button-outline-primary">Export</button>
                                <div><i class="fa-solid fa-trash-can icon-color-delete"></i></div>
                            </div>
                        </div>
                    </div>

                    <div class="wallet me-2 mb-2">
                        <div class="m-2 p-2">
                            <div class="top d-flex justify-content-between mb-3">
                                <div class="name pe-5">Wallet Name</div>
                                <div class="balance ps-5">0.123 <i class="fa-brands fa-ethereum icon-color"></i>
                                </div>
                            </div>

                            <div class="balance me-2 mb-2">0xA6B...76A</div>

                            <div class="d-flex justify-content-between align-items-center">
                                <button class="button-outline-primary">Export</button>
                                <div><i class="fa-solid fa-trash-can icon-color-delete"></i></div>
                            </div>
                        </div>
                    </div>

                    <div class="wallet me-2 mb-2">
                        <div class="m-2 p-2">
                            <div class="top d-flex justify-content-between mb-3">
                                <div class="name pe-5">Wallet Name</div>
                                <div class="balance ps-5">0.123 <i class="fa-brands fa-ethereum icon-color"></i>
                                </div>
                            </div>

                            <div class="balance me-2 mb-2">0xA6B...76A</div>

                            <div class="d-flex justify-content-between align-items-center">
                                <button class="button-outline-primary">Export</button>
                                <div><i class="fa-solid fa-trash-can icon-color-delete"></i></div>
                            </div>
                        </div>
                    </div>

                    <div class="wallet me-2 mb-2">
                        <div class="m-2 p-2">
                            <div class="top d-flex justify-content-between mb-3">
                                <div class="name pe-5">Wallet Name</div>
                                <div class="balance ps-5">0.123 <i class="fa-brands fa-ethereum icon-color"></i>
                                </div>
                            </div>

                            <div class="balance me-2 mb-2">0xA6B...76A</div>

                            <div class="d-flex justify-content-between align-items-center">
                                <button class="button-outline-primary">Export</button>
                                <div><i class="fa-solid fa-trash-can icon-color-delete"></i></div>
                            </div>
                        </div>
                    </div>

                    <div class="wallet me-2 mb-2">
                        <div class="m-2 p-2">
                            <div class="top d-flex justify-content-between mb-3">
                                <div class="name pe-5">Wallet Name</div>
                                <div class="balance ps-5">0.123 <i class="fa-brands fa-ethereum icon-color"></i>
                                </div>
                            </div>

                            <div class="balance me-2 mb-2">0xA6B...76A</div>

                            <div class="d-flex justify-content-between align-items-center">
                                <button class="button-outline-primary">Export</button>
                                <div><i class="fa-solid fa-trash-can icon-color-delete"></i></div>
                            </div>
                        </div>
                    </div>

                    <div class="wallet me-2 mb-2">
                        <div class="m-2 p-2">
                            <div class="top d-flex justify-content-between mb-3">
                                <div class="name pe-5">Wallet Name</div>
                                <div class="balance ps-5">0.123 <i class="fa-brands fa-ethereum icon-color"></i>
                                </div>
                            </div>

                            <div class="balance me-2 mb-2">0xA6B...76A</div>

                            <div class="d-flex justify-content-between align-items-center">
                                <button class="button-outline-primary">Export</button>
                                <div><i class="fa-solid fa-trash-can icon-color-delete"></i></div>
                            </div>
                        </div>
                    </div>
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
                                <div class="label">Private Key</div>
                                <input type="password" class="input w-100" placeholder="0x123abc..." value=${privateKey} onchange=${(e) => {setPrivateKey(e.target.value)}} />
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="button-outline-cancel" data-bs-dismiss="modal">Cancel</button>
                            <button class="button-primary">Create</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

export default Wallets;