import {html} from 'htm/preact';
import {useEffect, useState, useRef} from "preact/compat";
import {Dropdown, Modal} from "bootstrap";
import SidebarNav from '../SidebarNav.js';
import Task from '../../utils/task.js';

function fixAddress(address) {
    if(address.startsWith('0x')) {
        return address.toLowerCase();
    }

    return `0x${address}`.toLowerCase();
}

function groupToKey(arr, key, groups) {

    let obj = {};

    for (const i of arr) {

        if (obj.hasOwnProperty(i[key])) {
            obj[i[key]].push(i);
        } else {
            obj[i[key]] = [];
            obj[i[key]].push(i);
        }
    }

    return obj;
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
    const [gasLimit, setGasLimit] = useState("AUTO");
    const [mintMethod, setMintMethod] = useState(null);
    const [readMethod, setReadMethod] = useState(null);
    const [readValue, setReadValue] = useState("");
    const [args, setArgs] = useState([]);
    const [abi, setAbi] = useState("");
    const [mode, setMode] = useState("MANUAL");
    const [trigger, setTrigger] = useState("!=");

    const [mintMethods, setMintMethods] = useState([]);
    const [readMethods, setReadMethods] = useState([]);

    const [groupsDropdown, setGroupsDropdown] = useState(null);
    const [networksDropdown, setNetworksDropdown] = useState(null);
    const [walletsDropdown, setWalletsDropdown] = useState(null);
    const [mintDropdown, setMintDropdown] = useState(null);
    const [readDropdown, setReadDropdown] = useState(null);

    const [loadingAbi, setLoadingAbi] = useState(false);
    const [groups, setGroups] = useState([]);
    const [group, setGroup] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("");
    const [selectedColor, setSelectedColor] = useState('#49a58b');

    const [newTaskModal, setNewTaskModal] = useState(null);
    const [createGroupModal, setCreateGroupModal] = useState(null);

    const [groupedTasks, setGroupedTasks] = useState(null);

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

        const _args = [];

        for (const a of args) {
            _args.push(a.value);
        }

        let _tasks = [...tasks];
        for (const w of selectedWallets) {

            const task = new Task(provider, contractAddress, w, price, amount, maxGas, gasPriority, gasLimit, mintMethod, _args, abi);
            task.taskGroup = selectedGroup;
            task.network = network;
            task.trigger = trigger;
            task.startMode = mode;
            task.readMethodCurrent = readValue;
            task.contractReadMethod = readMethod;

            const _wallet = wallets.find(w => w.account.address === task.wallet.account.address);

            if (typeof _wallet !== 'undefined') {
                if (!_wallet.isLocked()) {
                    task.privateKey = _wallet.account.privateKey;
                }
            }

            _tasks.push(task);
            task.save();
        }

        state.ethTasksStream.next(_tasks);
        Modal.getOrCreateInstance(globalRef.current.querySelector('#create-task-modal')).hide();
    }

    const handleCreateGroup = () => {

        if (group.length === 0) return;

        if (groups.find(g => g.name === group)) return;

        setGroups([...groups, {
            name: group,
            color: selectedColor
        }]);

        setGroup("");
        setSelectedColor('#49a58b')
        createGroupModal.hide();
    }

    const deleteGroup = (g) => {
        const _clone = [...groups];

        const _groups = _clone.filter(gr => gr.name !== g.name);

        const _tasks = [...state.ethTasks];

        for(const t of _tasks) {
            if(t.taskGroup === g.name) {
                t.taskGroup = "";
                t.save();
            }
        }

        state.ethTasksStream.next(_tasks);
        setGroups(_groups);
    }

    const startGroupTasks = (g) => {
        const _tasks = tasks.filter(t => t.taskGroup === g.name);

        if(_tasks.length === 0) {
            return;
        }

        for(const t of _tasks) {
            t.start(state);
        }
    }

    const stopGroupTasks = (g) => {
        const _tasks = tasks.filter(t => t.taskGroup === g.name);

        if(_tasks.length === 0) {
            return;
        }

        for(const t of _tasks) {
            t.stop(state);
        }
    }

    const deleteGroupTasks = (g) => {
        const _tasks = tasks.filter(t => t.taskGroup === g.name);

        if(_tasks.length === 0) {
            return;
        }

        for(const t of _tasks) {
            state.deleteEthTask(t.id);
        }
    }

    const getTriggerName = () => {
        switch(trigger) {
            case '=':
                return 'Equals to'
            case '>':
                return 'Greater than'
            case '<':
                return 'Less than'
            default:
                return 'Not equals to'
        }
    }

    const startAllTasks = () => {

        if(tasks.length === 0) {
            return;
        }

        for(const t of tasks) {
            t.start(state);
        }
    }

    const removeSelectedWallet = (w) => {
        let clone = [...selectedWallets];

        clone = clone.filter(c => fixAddress(c.account.address) !== fixAddress(w.account.address));
        setSelectedWallets(clone);
    }

    useEffect(() => {

        setGroupsDropdown(new Dropdown(globalRef.current.querySelector('#groups-dropdown'), {}));
        setNetworksDropdown(new Dropdown(globalRef.current.querySelector('#networks-dropdown'), {}));
        setWalletsDropdown(new Dropdown(globalRef.current.querySelector('#wallets-dropdown'), {}));
        setMintDropdown(new Dropdown(globalRef.current.querySelector('#mint-dropdown'), {}));
        //setReadDropdown(new Dropdown(globalRef.current.querySelector('#read-dropdown'), {}));

        setNewTaskModal(Modal.getOrCreateInstance(globalRef.current.querySelector('#create-task-modal')));
        setCreateGroupModal(Modal.getOrCreateInstance(globalRef.current.querySelector('#create-group-modal')));

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
            setGroupedTasks(groupToKey(data, 'taskGroup', groups));
        })

        return () => {
            walletsStream.unsubscribe();
            tasksStream.unsubscribe();
        }

    }, [state]);

    useEffect(() => {

        const clone = groups.map(g => {
            return {
                name: g.name,
                color: g.color
            }
        });

        localStorage.setItem('eth-groups', JSON.stringify(clone));
    }, [groups]);

    return html`
        <div ref=${globalRef} class="d-flex">

            <${SidebarNav} page="eth-tasks"/>

            <div class="p-3 w-100">

                <div>
                    <button class="button-primary fw-bold" onclick=${() => {
                        newTaskModal.show()
                    }}><i class="fa-solid fa-plus"></i> New Task
                    </button>
                    <button class="button-secondary fw-bold ms-3" onclick=${startAllTasks}><i class="fa-solid fa-arrow-up"></i> Start All
                    </button>
                </div>

                <hr/>

                <div class="d-flex">

                    <div class="create-group d-flex align-items-center px-2 me-2">
                        <div class="text-center" onclick=${() => {
                            createGroupModal.show()
                        }}>
                            <div>Create Group</div>
                            <i class="fa-solid fa-circle-plus"></i>
                        </div>
                    </div>

                    ${
                            groups.length > 0 ?
                                    html`
                                        ${
                                                groups.map(g => (
                                                        html`
                                                            <div class="group me-2" style="border-color: ${g.color};">
                                                                <div class="title m-2 d-flex justify-content-between">
                                                                    <span>${g.name}</span>
                                                                    <i class="fa-solid fa-xmark delete-group-icon" onclick=${() => deleteGroup(g)}></i>
                                                                </div>
                                                                <div class="d-flex align-items-center justify-content-between m-2">
                                                                    <div class="label">
                                                                        ${tasks.filter(t => t.taskGroup === g.name).length}
                                                                        <span class="ms-1">Task(s)</span>
                                                                    </div>
                                                                    <div class="d-flex justify-content-evenly">
                                                                        <i class="fa-solid fa-circle-play icon-color start-icon me-1" onclick=${() => startGroupTasks(g)}></i>
                                                                        <i class="fa-solid fa-circle-stop icon-color stop-icon me-1" onclick=${() => stopGroupTasks(g)}></i>
                                                                        <i class="fa-solid fa-trash icon-color delete-icon" onclick=${() => deleteGroupTasks(g)}></i>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        `
                                                ))
                                        }
                                    `

                                    : ''
                    }

                </div>

                ${

                        groupedTasks === null ? '' :

                                Object.keys(groupedTasks).map(k => (
                                    html`
                                        <hr/>
                                        <div class="${k.length === 0 ? 'd-none' : 'mt-2'}">
                                            <label class="group-title" style="${k.length === 0 ? 'border: none;' : "border-color: " + groups.find(g => g.name === k).color};">${k}</label>
                                        </div>
                                        ${
                                            groupedTasks[k].map((t) => (
                                                html`
                                                    <div class="task d-flex justify-content-between align-items-center mt-2">
                                                        <div class="col-4">
                                                            <div class="title">
                                                                ${t.contractAddress}
                                                            </div>
                                                            <div class="label">
                                                                <i class="fa-solid fa-wallet me-2"></i>
                                                                <span class="me-4">${t.wallet.name}</span>
                                                                ${t.wallet.account.hasOwnProperty('privateKey') ?
                                                                        html`
                                                                            <i class="fa-solid fa-unlock icon-green"></i>` :
                                                                        html`<i class="fa-solid fa-lock icon-red"></i>`
                                                                }
                                                            </div>
                                                        </div>
    
                                                        <div class="label col-1 text-center">
                                                            ${Number.parseFloat(`${t.price * t.amount}`).toFixed(3)}
                                                            <i class="fa-brands fa-ethereum icon-color mx-1"></i>
                                                                (${t.amount}x)
                                                        </div>
                                                        
                                                        <div class="label col-1 text-center"><i class="fa-solid fa-gas-pump me-1"></i>
                                                            ${t.maxGas} + ${t.gasPriority}
                                                        </div>
    
                                                        <div class="label col-1 text-center">${t.network}</div>

                                                        <div class="label col-1 text-center">${t.startMode}</div>
    
                                                        <div class="label col-3 text-center" style="color: ${t.status.color}">${t.status.message}</div>
    
                                                        <div class="actions p-2 col-1 text-center">
                                                            <i class="fa-solid fa-circle-play me-2 icon-color start-icon"
                                                               onclick=${() => {
                                                                   t.start(state)
                                                               }}></i>
                                                            <i class="fa-solid fa-circle-stop me-2 icon-color stop-icon" 
                                                               onclick=${() => {
                                                                t.stop(state)
                                                            }}></i>
                                                            <i class="fa-solid fa-trash icon-color delete-icon"
                                                               onclick=${() => {
                                                                state.deleteEthTask(t.id)
                                                            }}></i>
                                                        </div>
    
                                                    </div>
                                                `
                                            ))
                                        }
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

                                    <div class="ms-1 me-1">
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
                                                            setSelectedGroup(g.name)
                                                        }}>${g.name}
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
                                                        <div class="selected-wallet me-1" onclick=${() => removeSelectedWallet(w)}>${w.name}
                                                            <i class="fa-solid fa-xmark icon-color ms-2 delete-icon"></i>
                                                        </div>
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
                                        ${loadingAbi ? html`<i class="fa-solid fa-spinner loading-icon ms-2"></i>` : ''}
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

                                <div class="d-flex flex-wrap">
                                    <div class="me-2 mt-3">
                                        <div class="label">Price</div>
                                        <input class="input" type="number" step="0.0001" min="0" value=${price}
                                               onchange=${(e) => {
                                                   setPrice(e.target.value)
                                               }} placeholder="0.0"/>
                                    </div>
                                    <div class="me-2 mt-3">
                                        <div class="label">Amount</div>
                                        <input class="input" type="number" step="1" min="1" value=${amount}
                                               onchange=${(e) => {
                                                   setAmount(e.target.value)
                                               }} placeholder="0"/>
                                    </div>
                                    
                                    <div class="d-flex mt-3">

                                        <div class="dropdown me-2">

                                            <div class="label">Task Mode</div>
                                            <button class="button-dropdown dropdown-toggle" type="button"
                                                    id="modes-dropdown" data-bs-toggle="dropdown"
                                                    aria-expanded="false"
                                                    onclick=${() => {
                                                        Dropdown.getOrCreateInstance(globalRef.current.querySelector('#modes-dropdown')).show()
                                                    }}>
                                                ${mode}
                                            </button>
                                            <ul class="dropdown-menu" aria-labelledby="dropdown">
                                                <li class="dropdown-item" onclick=${() => {
                                                    setMode('MANUAL')
                                                }}>Manual
                                                </li>
                                                <li class="dropdown-item" onclick=${() => {
                                                    setMode('AUTOMATIC')
                                                }}>Automatic
                                                </li>
                                            </ul>
                                        </div>
                                        
                                    </div>
                                </div>

                                ${
                                    mode === 'AUTOMATIC' ?
                                            html`
                                    <div className="mt-3 d-flex flex-wrap">
                                        <div className="dropdown me-2">
                                            <div className="label">Read Function</div>
                                            <button className="button-dropdown dropdown-toggle" type="button"
                                                    id="read-dropdown"
                                                    data-bs-toggle="dropdown" aria-expanded="false"
                                                    onClick=${() => {
                                                        Dropdown.getOrCreateInstance(globalRef.current.querySelector('#read-dropdown')).show()
                                                    }}
                                            >
                                                ${readMethod === null ? 'Select a Read Function' : readMethod.name}
                                            </button>
                                            <ul className="dropdown-menu" aria-labelledby="dropdown">
                                                ${
                                                readMethods.length === 0 ? '' :
                                                        readMethods.map((read) => (
                                                                html`
                                                                    <li class="dropdown-item" onclick=${() => {
                                                                        setReadMethod(read)
                                                                    }}>${read.name}
                                                                    </li>
                                                                `
                                                        ))
                                                }
                                            </ul>
                                        </div>

                                        <div class="dropdown me-2">

                                            <div class="label">Trigger</div>
                                            <button class="button-dropdown dropdown-toggle" type="button"
                                                    id="trigger-dropdown" data-bs-toggle="dropdown"
                                                    aria-expanded="false"
                                                    onclick=${() => {
                                                Dropdown.getOrCreateInstance(globalRef.current.querySelector('#trigger-dropdown')).show()
                                            }}>
                                                ${getTriggerName()}
                                            </button>
                                            <ul class="dropdown-menu" aria-labelledby="dropdown">
                                                <li class="dropdown-item" onclick=${() => {
                                                setTrigger('=')
                                            }}>Equals To
                                                </li>
                                                <li class="dropdown-item" onclick=${() => {
                                                setTrigger('!=')
                                            }}>Not equals to
                                                </li>
                                                <li class="dropdown-item" onclick=${() => {
                                                setTrigger('>')
                                            }}>Greater than
                                                </li>
                                                <li class="dropdown-item" onclick=${() => {
                                                setTrigger('<')
                                            }}>Less than
                                                </li>
                                            </ul>
                                        </div>
                                        
                                        <div>
                                            <div className="label">Read Value</div>
                                            <input class="input flex-grow-1" value=${readValue} onchange=${(e) => {
                                                setReadValue(e.target.value)
                                            }} placeholder="Read value"/>
                                        </div>
                                        
                                    </div>
                                    `
                                    : ''
                                }
                                
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
                            <button class="button-outline-cancel me-2" onclick=${() => {Modal.getOrCreateInstance(globalRef.current.querySelector('#create-task-modal')).hide()}}>Cancel</button>
                            <button class="button-primary" onclick=${handleCreateTasks}>Create Task</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="create-group-modal" class="modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title title">Create Group</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="d-flex align-items-center">
                                <div class="me-2">
                                    <div class="label">Group Name</div>
                                    <input class="input me-1 flex-grow-1" placeholder="Group name" value=${group}
                                           onchange=${(e) => {
                                               setGroup(e.target.value)
                                           }}/>
                                </div>
                                <div>
                                    <div class="label">Group Color</div>
                                    <input type="color" value=${selectedColor} onchange=${(e) => setSelectedColor(e.target.value)} />
                                </div>
                            </div>

                        </div>
                        <div class="modal-footer">
                            <button class="button-secondary ms-1" onclick=${handleCreateGroup}>Create Group</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `
}

export default EthMinter;