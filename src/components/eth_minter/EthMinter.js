import {html} from 'htm/preact';
import {useEffect, useState, useRef} from "preact/compat";
import {Dropdown, Modal} from "bootstrap";
import SidebarNav from '../SidebarNav.js';
import Task from '../../utils/task';

function shortenAddress(address) {
    return address.slice(0, 5) + "..." + address.slice(address.length - 6);
}

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
    const [network, setNetwork] = useState("mainnet");
    const [contractAddress, setContractAddress] = useState("");
    const [price, setPrice] = useState(0);
    const [amount, setAmount] = useState(0);
    const [maxGas, setMaxGas] = useState(0);
    const [gasPriority, setGasPriority] = useState(0);
    const [gasLimit, setGasLimit] = useState("");
    const [mintMethod, setMintMethod] = useState(null);
    const [args, setArgs] = useState([]);
    const [abi, setAbi] = useState("");

    const [mintMethods, setMintMethods] = useState([]);
    const [readMethods, setReadMethods] = useState([]);

    const [groupsDropdown, setGroupsDropdown] = useState(null);
    const [networksDropdown, setNetworksDropdown] = useState(null);
    const [walletsDropdown, setWalletsDropdown] = useState(null);
    const [mintDropdown, setMintDropdown] = useState(null);
    const [readDropdown, setReadDropdown] = useState(null);

    const [loadingAbi, setLoadingAbi] = useState(false);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState([]);

    const [newTaskModal, setNewTaskModal] = useState(null);

    const handleGetContractInfo = async () => {

        setLoadingAbi(true);

        let abi = await state.getContractAbi(contractAddress, network);

        setTimeout(() => {
            setLoadingAbi(false);
        }, 1000);

        if (abi === null) {
            console.log("error occurred while getting abi");
        }

        setAbi(abi);

        const contractInfo = state.getContractMethods(abi);

        if (contractInfo === null) {
            console.log("Could not get contract info.");
            return;
        }

        setMintMethods(contractInfo.mintMethods);
        setReadMethods(contractInfo.readMethods);
    }

    const addWallet = (wallet) => {
        if (selectedWallets.find(w => w.account.address === wallet.account.address)) {
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

        if (selectedWallets.length === 0) {
            return;
        }

        if (provider.length === 0 || contractAddress.length === 0) {
            return;
        }

        let _tasks = [];
        for (const w of selectedWallets) {
            const task = new Task(provider, contractAddress, w.account.address, price, amount, maxGas, gasPriority, gasLimit, mintMethod, args, abi);
            task.taskGroup = selectedGroup;

            _tasks.push(task);
        }

        state.ethTasksStream.next(_tasks);
    }

    useEffect(() => {

        setGroupsDropdown(new Dropdown(globalRef.current.querySelector('#groups-dropdown'), {}));
        setNetworksDropdown(new Dropdown(globalRef.current.querySelector('#networks-dropdown'), {}));
        setWalletsDropdown(new Dropdown(globalRef.current.querySelector('#wallets-dropdown'), {}));
        setMintDropdown(new Dropdown(globalRef.current.querySelector('#mint-dropdown'), {}));
        //setReadDropdown(new Dropdown(globalRef.current.querySelector('#read-dropdown'), {}));

        setNewTaskModal(Modal.getOrCreateInstance(globalRef.current.querySelector('#create-task-modal')));

        setProvider(localStorage.getItem('globalRpc'));

        setGroups(JSON.parse(localStorage.getItem('eth-groups')));

    }, []);

    useEffect(() => {

        if (mintMethod === null) {
            setArgs([]);
            return;
        }

        let _args = [];
        for (const arg of mintMethod.inputs) {
            _args.push({name: arg.name, value: ''});
        }

        setArgs(_args);

    }, [mintMethod]);

    useEffect(() => {

        if (state === null) {
            return;
        }

        const walletsStream = state.walletsStream.subscribe((data) => {
            setWallets(data);
        })

        const tasksStream = state.ethTasksStream.subscribe((data) => {
            setTasks(data);
            console.log("tasks", data);
        })

        return () => {
            walletsStream.unsubscribe();
            tasksStream.unsubscribe();
        }

    }, [state]);

    return html`
        <div ref=${globalRef} class="d-flex">

            <${SidebarNav} page="eth-tasks"/>

            <div class="p-3 w-100">

                <div>
                    <button class="button-primary fw-bold" onclick=${() => {newTaskModal.show()}}><i class="fa-solid fa-plus"></i> New Task</button>
                    <button class="button-secondary fw-bold ms-3"><i class="fa-solid fa-arrow-up"></i> Start All</button>
                </div>

                <hr />

                ${
                        groups.length > 0 ?
                            html`
                                <div class="d-flex">
                                ${
                                    groups.map(g => (
                                        html`
                                            <div class="group me-2">
                                                <div class="title m-2">${g}</div>
                                                <div class="d-flex align-items-center justify-content-between  m-2">
                                                    <div class="label">23 Tasks</div>
                                                    <i class="fa-solid fa-circle-play"></i>
                                                </div>
                                            </div>
                                        `
                                    ))
                                }
                                </div>
                            `

                        : ''
                }

                <hr />
                
                ${
                    tasks.map((t) => (
                        html`
                            <div class="task d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="title">${shortenAddress(t.contractAddress)}</div>
                                    <div class="label"><i class="fa-solid fa-wallet"></i> ${wallets.find(w => w.account.address === t.wallet).name}</div>
                                </div>

                                <div class="label">${t.network}</div>

                                <div class="label">Status: ${t.status}</div>

                                <div class="actions p-2">
                                    <i class="fa-solid fa-circle-play me-2"></i>
                                    <i class="fa-solid fa-circle-stop"></i>
                                </div>

                            </div>
                        `
                    ))
                }

            </div>

            <div id="create-task-modal" class="modal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title title">New Task</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div>
                                <div class="title">GENERAL INFORMATION <i class="fa-solid fa-keyboard ms-1"></i></div>

                                <div class="d-flex flex-wrap align-items-center mt-2">
                                    <div class="dropdown me-1">

                                        <div class="label">Wallets</div>
                                        <button class="button-dropdown dropdown-toggle" type="button"
                                                id="wallets-dropdown" data-bs-toggle="dropdown" aria-expanded="false"
                                                onclick=${() => {
                                                    walletsDropdown.show()
                                                }}>
                                            Select one or more Wallets
                                        </button>
                                        <ul class="dropdown-menu" aria-labelledby="dropdown">
                                            ${
                                                    wallets.length === 0 ? '' :
                                                            wallets.filter(w => !w.isLocked()).map((w) => (
                                                                    html`
                                                                        <li class="dropdown-item" onclick=${() => {
                                                                            addWallet(w)
                                                                        }}>${w.name}
                                                                        </li>
                                                                    `
                                                            ))
                                            }
                                        </ul>
                                    </div>

                                    <div class=" ms-1 me-1">
                                        <div class="label">RPC</div>
                                        <input class="input" value=${provider} onchange=${(e) => {
                                            setProvider(e.target.value)
                                        }} placeholder="RPC Endpoint"/>
                                    </div>

                                    <div class="dropdown ms-1 me-1">

                                        <div class="label">Network</div>
                                        <button class="button-dropdown dropdown-toggle" type="button"
                                                id="networks-dropdown" data-bs-toggle="dropdown" aria-expanded="false"
                                                onclick=${() => {
                                                    networksDropdown.show()
                                                }}>
                                            ${network}
                                        </button>
                                        <ul class="dropdown-menu" aria-labelledby="dropdown">
                                            <li class="dropdown-item" onclick=${() => {
                                                setNetwork('mainnet')
                                            }}>Mainnet
                                            </li>
                                            <li class="dropdown-item" onclick=${() => {
                                                setNetwork('ropsten')
                                            }}>Dev - Ropsten
                                            </li>
                                            <li class="dropdown-item" onclick=${() => {
                                                setNetwork('rinkeby')
                                            }}>Dev - Rinkeby
                                            </li>
                                        </ul>
                                    </div>

                                    <div class="dropdown ms-1">

                                        <div class="label">Group</div>
                                        <button class="button-dropdown dropdown-toggle" type="button"
                                                id="groups-dropdown" data-bs-toggle="dropdown" aria-expanded="false"
                                                onclick=${() => {
                                                    groupsDropdown.show()
                                                }}>
                                            ${selectedGroup.length > 0 ? selectedGroup : "Select a Group"}
                                        </button>
                                        <ul class="dropdown-menu" aria-labelledby="dropdown">
                                            ${groups.map(g => (
                                                html`
                                                    <li class="dropdown-item" onclick=${() => {
                                                        setSelectedGroup(g)
                                                    }}>${g}
                                                    </li>
                                                `
                                            ))}
                                            
                                            
                                        </ul>
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

                            <hr/>

                            <div class="mt-3">
                                <div class="title">CONTRACT INFORMATION <i class="fa-solid fa-file-contract ms-1"></i>
                                </div>
                                
                                <div class="label mt-2">Contract Address</div>
                                <div class="d-flex">
                                    <input class="input me-1 flex-grow-1" value=${contractAddress} onchange=${(e) => {
                                        setContractAddress(e.target.value)
                                    }} placeholder="0x123abc..."/>
                                    <button class="button-secondary ms-1" onclick=${handleGetContractInfo}>Get ABI
                                        ${loadingAbi ? html`<i class="fa-solid fa-spinner loading-icon"></i>` : ''}
                                    </button>
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
                                                                        <input class="input" onchange=${(e) => {
                                                                            handleInput(e, index)
                                                                        }} placeholder=${arg.name}/>
                                                                    </div>
                                                                `
                                                        ))
                                        }
                                    </div>
                                </div>

                                <div class="d-flex flex-wrap mt-3">
                                    <div class="me-1">
                                        <div class="label">Price</div>
                                        <input class="input" type="number" step="0.0001" min="0" value=${price}
                                               onchange=${(e) => {
                                                   setPrice(e.target.value)
                                               }} placeholder="0.0"/>
                                    </div>
                                    <div class="ms-1">
                                        <div class="label">Amount</div>
                                        <input class="input" type="number" step="1" min="1" value=${amount}
                                               onchange=${(e) => {
                                                   setAmount(e.target.value)
                                               }} placeholder="0"/>
                                    </div>
                                </div>

                                <div class="label mt-3 fw-bold">Total cost (gas not included): <span
                                        class="label fw-normal">${Number.parseFloat(`${price * amount}`).toFixed(4)} <i
                                        class="fa-brands fa-ethereum icon-color"></i></span></div>

                            </div>

                            <hr/>

                            <div class="mt-3">
                                <div class="title">GAS SETTINGS <i class="fa-solid fa-gas-pump ms-1"></i></div>
                                <div class="d-flex flex-wrap mt-3">
                                    <div class="me-1">
                                        <div class="label">Max Gas</div>
                                        <input class="input" type="number" step="1" min="1" value=${maxGas}
                                               onchange=${(e) => {
                                                   setMaxGas(e.target.value)
                                               }} placeholder="100"/>
                                    </div>
                                    <div class="ms-1 me-1">
                                        <div class="label">Priority Fee</div>
                                        <input class="input" type="number" step="1" min="1" value=${gasPriority}
                                               onchange=${(e) => {
                                                   setGasPriority(e.target.value)
                                               }} placeholder="10"/>
                                    </div>
                                    <div class="ms-1">
                                        <div class="label">Gas Limit</div>
                                        <input class="input" value=${gasLimit} onchange=${(e) => {
                                            setGasLimit(e.target.value)
                                        }} placeholder="AUTO"/>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div class="modal-footer">
                            <button class="button-outline-cancel me-2">Cancel</button>
                            <button class="button-primary" onclick=${handleCreateTasks}>Create Task</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `
}

export default EthMinter;