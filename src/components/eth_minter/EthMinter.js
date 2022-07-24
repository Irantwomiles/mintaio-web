import {html} from 'htm/preact';
import {useEffect, useState, useRef} from "preact/compat";
import {Dropdown} from "bootstrap";
import SidebarNav from '../SidebarNav.js';

function EthMinter({state}) {

    /*
    wss://eth-mainnet.g.alchemy.com/v2/Q2Ntju4GCSIEphdaYNmBjweqQsfew2ws
    contract: 0x4a8C9D751EEAbc5521A68FB080DD7E72E46462aF
     */

    const globalRef = useRef();

    const [wallets, setWallets] = useState([]);
    const [tasks, setTasks] = useState([]);

    const [selectedWallets, setSelectedWallets] = useState([]);
    const [provider, setProvider] = useState("");
    const [contractAddress, setContractAddress] = useState("");
    const [price, setPrice] = useState(0);
    const [amount, setAmount] = useState(0);
    const [maxGas, setMaxGas] = useState(0);
    const [gasPriority, setGasPriority] = useState(0);
    const [gasLimit, setGasLimit] = useState("");
    const [mintMethod, setMintMethod] = useState(null);
    const [args, setArgs] = useState([]);
    const [nonce, setNonce] = useState("");
    const [abi, setAbi] = useState("");

    const [mintMethods, setMintMethods] = useState([]);
    const [readMethods, setReadMethods] = useState([]);

    const [walletsDropdown, setWalletsDropdown] = useState(null);
    const [mintDropdown, setMintDropdown] = useState(null);
    const [readDropdown, setReadDropdown] = useState(null);

    const handleGetContractInfo = async () => {

        let abi = await state.getContractAbi(contractAddress);

        if(abi === null) {
            console.log("error occurred while getting abi");
        }

        const contractInfo = state.getContractMethods(abi);

        if(contractInfo === null) {
            console.log("Could not get contract info.");
            return;
        }

        setMintMethods(contractInfo.mintMethods);
        setReadMethods(contractInfo.readMethods);
    }

    const addWallet = (wallet) => {
        if(selectedWallets.find(w => w.account.address === wallet.account.address)) {

            return;
        }

        setSelectedWallets([...selectedWallets, wallet]);
    }

    const handleInput = (e, index) => {
        let values = [...args];
        values[index].value = e.target.value;
        setArgs(values);
    }

    const handleCreateTasks = () => {

        if(selectedWallets.length === 0) {

            return;
        }

        if(provider.length === 0 || contractAddress.length === 0) {

            return;
        }



    }

    useEffect(() => {

        setWalletsDropdown(new Dropdown(globalRef.current.querySelector('#wallets-dropdown'), {}));
        setMintDropdown(new Dropdown(globalRef.current.querySelector('#mint-dropdown'), {}));
        //setReadDropdown(new Dropdown(globalRef.current.querySelector('#read-dropdown'), {}));

        setProvider(localStorage.getItem('globalRpc'));

    }, []);

    useEffect(() => {

        if(mintMethod === null) {
            setArgs([]);
            return;
        }

        let _args = [];
        for(const arg of mintMethod.inputs) {
            _args.push({name: arg.name, value: ''});
        }

        setArgs(_args);

    }, [mintMethod]);

    useEffect(() => {

        if(state === null) {
            return;
        }

        const walletsStream = state.walletsStream.subscribe((data) => {
            setWallets(data);
        })

        const tasksStream = state.ethTasksStream.subscribe((data) => {
            setTasks(data);
        })

        return () => {
            walletsStream.unsubscribe();
            tasksStream.unsubscribe();
        }

    }, [state]);

    return html`
    <div ref=${globalRef} class="d-flex">
        
        <${SidebarNav} page="eth-tasks" />
        
        <div class="p-3">
            
            <div>
                <div class="title">GENERAL INFORMATION <i class="fa-solid fa-keyboard ms-1"></i></div>
                
                <div class="d-flex align-items-center mt-2">
                    <div class="dropdown me-2">

                        <div class="label">Wallets</div>
                        <button class="button-dropdown dropdown-toggle" type="button" id="wallets-dropdown" data-bs-toggle="dropdown" aria-expanded="false" onclick=${() => {walletsDropdown.show()}}>
                            Select one or more Wallets
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="dropdown">
                            ${
                                    wallets.length === 0 ? '' :
                                            wallets.filter(w => !w.isLocked()).map((w) => (
                                                    html`
                                                <li class="dropdown-item" onclick=${() => {addWallet(w)}}>${w.name}</li>
                                            `
                                            ))
                            }
                        </ul>
                    </div>
                    
                    <div class=" ms-2">
                        <div class="label">RPC</div>
                        <input class="input" value=${provider} onchange=${(e) => {setProvider(e.target.value)}} placeholder="RPC Endpoint" />
                    </div>
                </div>
                
                <div class="d-flex flex-wrap mt-2">
                    ${
                        selectedWallets.map(w => (
                            html`
                            <div class="selected-wallet me-1">${w.name}</div>
                            `
                        ))
                    }
                </div>
            </div>
            
            <hr />
            
            <div class="mt-3">
                <div class="title">CONTRACT INFORMATION <i class="fa-solid fa-file-contract ms-1"></i></div>

                <div class="mt-2">
                    <div class="label">Contract Address</div>
                    <input class="input me-2" value=${contractAddress} onchange=${(e) => {setContractAddress(e.target.value)}} placeholder="0x123abc..." />
                    <button class="button-secondary ms-2" onclick=${handleGetContractInfo}>Get ABI</button>
                </div>

                <div class="mt-3">
                    <div class="dropdown">
                        <div class="label">Mint Function</div>
                        <button class="button-dropdown dropdown-toggle" type="button" id="mint-dropdown"
                                data-bs-toggle="dropdown" aria-expanded="false" onclick=${() => {
                            mintDropdown.show()
                        }}>
                            ${mintMethod === null ? 'Select a Mint Function' : mintMethod.name}
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="dropdown">
                            ${
                                    mintMethods.length === 0 ? '' :
                                            mintMethods.map((mint) => (
                                                    html`
                                                        <li class="dropdown-item" onclick=${() => {
                                                            setMintMethod(mint)
                                                        }}>${mint.name}
                                                        </li>
                                                    `
                                            ))
                            }
                        </ul>
                    </div>

                    <div class="${args.length === 0 ? 'd-none' : 'd-flex flex-wrap mt-3'}">
                        ${
                                args.length === 0 ? '' :
                                        args.map((arg, index) => (
                                                html`
                                                    <div class="me-2">
                                                        <div class="label">${arg.name}</div>
                                                        <input class="input" onchange=${(e) => {handleInput(e, index)}} placeholder=${arg.name} />
                                                    </div>
                                                `
                                        ))
                        }
                    </div>
                </div>
                
                <div class="d-flex mt-3">
                    <div class="me-2">
                        <div class="label">Price</div>
                        <input class="input" type="number" step="0.0001" min="0" value=${price} onchange=${(e) => {setPrice(e.target.value)}} placeholder="0.0" />
                    </div>
                    <div class="ms-2">
                        <div class="label">Amount</div>
                        <input class="input" type="number" step="1" min="1" value=${amount} onchange=${(e) => {setAmount(e.target.value)}} placeholder="0" />
                    </div> 
                </div>

                <div class="label mt-3 fw-bold">Total cost (gas not included): <span class="label fw-normal">${Number.parseFloat(`${price * amount}`).toFixed(4)} <i class="fa-brands fa-ethereum icon-color"></i></span></div>
                
            </div>

            <hr />
            
            <div class="mt-3">
                <div class="title">GAS SETTINGS <i class="fa-solid fa-gas-pump ms-1"></i></div>
                <div class="d-flex mt-3">
                    <div class="me-2">
                        <div class="label">Max Gas</div>
                        <input class="input" type="number" step="1" min="1" value=${maxGas} onchange=${(e) => {setMaxGas(e.target.value)}} placeholder="100" />
                    </div>
                    <div class="ms-2 me-2">
                        <div class="label">Priority Fee</div>
                        <input class="input" type="number" step="1" min="1" value=${gasPriority} onchange=${(e) => {setGasPriority(e.target.value)}} placeholder="10" />
                    </div>
                    <div class="ms-2">
                        <div class="label">Gas Limit</div>
                        <input class="input" value=${gasLimit} onchange=${(e) => {setGasLimit(e.target.value)}} placeholder="AUTO" />
                    </div>
                </div>
            </div>

            <hr />
            
            <div class="d-flex justify-content-end">
                <button class="button-outline-cancel me-2">Cancel</button>
                <button class="button-primary" onclick=${handleCreateTasks}>Create Task</button>
            </div>

        </div>

    </div>
    `
}

export default EthMinter;