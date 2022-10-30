import {html} from 'htm/preact';
import {useEffect, useState, useRef} from "preact/compat";
import {Dropdown, Modal, Toast} from "bootstrap";
import SidebarNav from '../SidebarNav.js';
import Task from '../../utils/task.js';
import QuickTaskProfile from "../../utils/quick_task_profile";
import {fixAddress} from "../../utils/utils";

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
    https://eth-mainnet.g.alchemy.com/v2/Q2Ntju4GCSIEphdaYNmBjweqQsfew2ws
    contract: 0x4a8C9D751EEAbc5521A68FB080DD7E72E46462aF
     */

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
    const [customHexData, setCustomHexData] = useState("");

    const [editTask, setEditTask] = useState(null);

    const [mintMethods, setMintMethods] = useState([]);
    const [readMethods, setReadMethods] = useState([]);

    const [loadingAbi, setLoadingAbi] = useState(false);
    const [groups, setGroups] = useState([]);
    const [group, setGroup] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("");
    const [selectedColor, setSelectedColor] = useState('#49a58b');

    const [groupedTasks, setGroupedTasks] = useState(null);
    const [toastInfo, setToastInfo] = useState(null);

    const [selectedTasks, setSelectedTasks] = useState([]);
    const [updateMaxGas, setUpdateMaxGas] = useState("");
    const [updatePriorityGas, setUpdatePriorityGas] = useState("");

    const [profiles, setProfiles] = useState([]);
    const [profileName, setProfileName] = useState("");

    const handleGetContractInfo = async () => {

        setLoadingAbi(true);

        let _abi;

        if(abi.length === 0) {
            _abi = await state.getContractAbi(contractAddress, network);

            setTimeout(() => {
                setLoadingAbi(false);
            }, 500);

            if (_abi === null) {
                setToastInfo({
                    message: 'Error while getting ABI.',
                    class: 'toast-error'
                });

                console.log("ABI was null.");
                return;
            }

            setAbi(_abi);
        } else {
            _abi = abi;
            setLoadingAbi(false);
        }

        const contractInfo = state.getContractMethods(_abi);

        if (contractInfo === null) {
            setToastInfo({
                message: 'Could not get the information required.',
                class: 'toast-error'
            });

            console.log("Contract info is null");
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
            setToastInfo({
                message: `You must select at least one wallet`,
                class: 'toast-error'
            });
            return;
        }

        if (provider.length === 0) {
            setToastInfo({
                message: `You must set a RPC endpoint.`,
                class: 'toast-error'
            });
            return;
        }

        if (contractAddress.length === 0) {
            setToastInfo({
                message: `You must input a Contract Address.`,
                class: 'toast-error'
            });
            return;
        }

        if(mintMethod === null) {
            setToastInfo({
                message: `You must select a Mint Function.`,
                class: 'toast-error'
            });
            return;
        }

        if(mode === 'AUTOMATIC') {

            if(readMethod === null) {
                setToastInfo({
                    message: `You must select a Read Function for Automatic tasks.`,
                    class: 'toast-error'
                });
                return;
            }

            if(readValue.length === 0) {
                setToastInfo({
                    message: `You must input a Read Value for Automatic tasks.`,
                    class: 'toast-error'
                });
                return;
            }
        }

        let _tasks = [...tasks];
        let i = 0;
        for (const w of selectedWallets) {

            const task = new Task(provider, contractAddress, w, price, amount, maxGas, gasPriority, gasLimit, mintMethod, args, abi);

            task.taskGroup = selectedGroup;
            task.network = network;
            task.trigger = trigger;
            task.startMode = mode;
            task.readMethodCurrent = readValue;
            task.contractReadMethod = readMethod;

            i++;

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
        Modal.getOrCreateInstance(document.querySelector('#create-task-modal')).hide();

        setToastInfo({
            message: `Created ${i} tasks.`,
            class: 'toast-success'
        });
    }

    const handleUpdateTasks = () => {
        if(editTask === null) {
            setToastInfo({
                message: 'Error while trying to update task.',
                class: 'toast-error'
            });

            console.log("Task was null.");
            return;
        }

        if(selectedWallets.length > 1 || selectedWallets.length === 0) {
            setToastInfo({
                message: 'You must select a wallet for this task.',
                class: 'toast-error'
            });

            console.log("Task was undefined, could not edit.");
            return;
        }

        const _task = state.ethTasks.find(t => t.id === editTask.id);

        if(typeof _task === 'undefined') {
            setToastInfo({
                message: 'Error while trying to update task.',
                class: 'toast-error'
            });

            console.log("Task was undefined, could not edit.");
            return;
        }

        _task.wallet = selectedWallets[0];
        _task.provider = provider;
        _task.network = network;
        _task.contractAddress = contractAddress;
        _task.taskGroup = selectedGroup;
        _task.contractAddress = contractAddress;
        _task.functionName = mintMethod;
        _task.args = args;
        _task.amount = amount;
        _task.price = price;
        _task.contractReadMethod = readMethod;
        _task.readMethodCurrent = readValue;
        _task.trigger = trigger;
        _task.maxGas = maxGas;
        _task.gasPriority = gasPriority;
        _task.gasLimit = gasLimit;
        _task.startMode = mode;

        _task.save();

        setToastInfo({
            message: 'Task updated successfully.',
            class: 'toast-success'
        });

        Modal.getOrCreateInstance(document.querySelector('#create-task-modal')).hide();

        state.postTaskUpdate();
    }

    const handleCreateGroup = () => {

        if (group.length === 0) {
            setToastInfo({
                message: `You must specify a name for your group.`,
                class: 'toast-error'
            });
            return;
        }

        if(group.length > 12) {
            setToastInfo({
                message: `Group names can't be longer than 12 characters.`,
                class: 'toast-error'
            });
            return;
        }

        if (groups.find(g => g.name === group)) {
            setToastInfo({
                message: `Group with that name already exists.`,
                class: 'toast-error'
            });
            return;
        }

        setGroups([...groups, {
            name: group,
            color: selectedColor
        }]);

        setToastInfo({
            message: `Created group ${group}`,
            class: 'toast-success'
        });

        setGroup("");
        setSelectedColor('#49a58b')
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
        setToastInfo({
            message: `Deleted group ${g.name}`,
            class: 'toast-success'
        });
    }

    const startGroupTasks = (g) => {
        const _tasks = tasks.filter(t => t.taskGroup === g.name);

        if(_tasks.length === 0) {
            return;
        }

        for(const t of _tasks) {
            t.start(state);
        }

        setToastInfo({
            message: `Started ${_tasks.length} tasks in group ${g.name}`,
            class: 'toast-success'
        });
    }

    const stopGroupTasks = (g) => {
        const _tasks = tasks.filter(t => t.taskGroup === g.name);

        if(_tasks.length === 0) {
            return;
        }

        for(const t of _tasks) {
            t.stop(state);
        }

        setToastInfo({
            message: `Stopped ${_tasks.length} tasks in group ${g.name}`,
            class: 'toast-success'
        });
    }

    const deleteGroupTasks = (g) => {
        const _tasks = tasks.filter(t => t.taskGroup === g.name);

        if(_tasks.length === 0) {
            setToastInfo({
                message: `There are no tasks in group ${g.name}`,
                class: 'toast-error'
            });
            return;
        }

        for(const t of _tasks) {
            state.deleteEthTask(t.id);
        }

        setToastInfo({
            message: `Deleted ${_tasks.length} tasks in group ${g.name}`,
            class: 'toast-success'
        });
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

        setToastInfo({
            message: `Started ${tasks.length} tasks`,
            class: 'toast-success'
        });
    }

    const removeSelectedWallet = (w) => {
        let clone = [...selectedWallets];

        clone = clone.filter(c => fixAddress(c.account.address) !== fixAddress(w.account.address));
        setSelectedWallets(clone);
    }

    const handleShowCreateTaskModal = () => {
        setEditTask(null);
        Modal.getOrCreateInstance(document.querySelector('#create-task-modal')).show();
    }

    const handleSelectedTask = (t) => {
        const _task = selectedTasks.find(task => task.id === t.id);

        if(typeof _task === 'undefined') {
            setSelectedTasks([...selectedTasks, t]);
        } else {
            let clone = [...selectedTasks];
            clone = clone.filter(task => task.id !== t.id);

            setSelectedTasks(clone);
        }
    }

    const handleSelectGroupTasks = (g) => {

        let _clone = [...tasks];
        _clone = _clone.filter(t => t.taskGroup === g.name);

        if(_clone.length === 0) return;

        let _selectedClone = [...selectedTasks];

        for(const t of _clone) {
            const _task = _selectedClone.find(_t => _t.id === t.id);

            if(typeof _task === 'undefined') {
                _selectedClone.push(t);
            } else {
                _selectedClone = _selectedClone.filter(_t => _t.id !== t.id);
            }
        }

        setSelectedTasks(_selectedClone);
    }

    const isSelected = (t) => {
        const _task = selectedTasks.find(task => task.id === t.id);

        return (typeof _task !== 'undefined');
    }

    const updateGas = () => {

        if(selectedTasks.length === 0) {
            setToastInfo({
                message: 'Please select at least one pending transaction to update.',
                class: 'toast-error'
            });
            return;
        }

        if(updateMaxGas <= 0) {
            setToastInfo({
                message: 'Max Gas must be greater than 0.',
                class: 'toast-error'
            });
            return;
        }

        if(updatePriorityGas <= 0) {
            setToastInfo({
                message: 'Priority Fee must be greater than 0.',
                class: 'toast-error'
            });
            return;
        }

        if(updatePriorityGas > updateMaxGas) {
            setToastInfo({
                message: "Priority Fee can't be greater than Max Gas.",
                class: 'toast-error'
            });
            return;
        }

        let counter = 0;

        for(const task of selectedTasks) {

            if(!task.pending) continue;

            task.updateGas(state, updateMaxGas, updatePriorityGas);
            counter++;
        }

        if(counter === 0) {
            setToastInfo({
                message: "No pending transactions found.",
                class: 'toast-error'
            });
            return;
        }

        setToastInfo({
            message: `Updated gas settings for ${counter} pending task(s).`,
            class: 'toast-success'
        });
    }

    const handleCreateQuickTaskProfile = () => {

        if(profileName.length === 0) {
            setToastInfo({
                message: 'Set a name for your Profile.',
                class: 'toast-error'
            });
            return;
        }

        if(selectedWallets.length === 0) {
            setToastInfo({
                message: 'Select one or more wallets for this profile.',
                class: 'toast-error'
            });
            return;
        }

        const existingProfiles = state.quickTaskProfiles;

        if(typeof existingProfiles.find(p => p.name === profileName) !== 'undefined') {
            setToastInfo({
                message: 'A profile with that name already exists.',
                class: 'toast-error'
            });
            return;
        }

        const _wallets = [];

        for(const w of selectedWallets) {
            _wallets.push(fixAddress(w.account.address));
        }

        const profile = new QuickTaskProfile(profileName, _wallets);
        profile.save();

        existingProfiles.push(profile);
        state.quickTaskProfileStream.next(existingProfiles);

    }

    const deleteQuickTaskProfile = (p) => {
        let _profiles = localStorage.getItem('qt-profiles');

        if(_profiles === null) {
            setToastInfo({
                message: "Couldn't find that profile.",
                class: 'toast-error'
            });
            return;
        }

        _profiles = JSON.parse(localStorage.getItem('qt-profiles'));

        _profiles = _profiles.filter(_p => _p.name !== p.name);
        state.quickTaskProfileStream.next(_profiles);

        localStorage.setItem('qt-profiles', JSON.stringify(_profiles));
        setToastInfo({
            message: "Deleted profile.",
            class: 'toast-success'
        });
        return;
    }

    useEffect(() => {

        const _provider = localStorage.getItem('globalRpc');
        const _ethGroups = localStorage.getItem('eth-groups');

        setProvider(_provider === null ? '' : _provider);
        setGroups(_ethGroups === null ? [] : JSON.parse(_ethGroups));

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

        const profilesStream = state.quickTaskProfileStream.subscribe((data) => {
            setProfiles(data);
        })

        return () => {
            walletsStream.unsubscribe();
            tasksStream.unsubscribe();
            profilesStream.unsubscribe();
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

    useEffect(() => {

        if(provider.length === 0) return;

        if(provider.toLowerCase().includes('rinkeby')) {
            setNetwork('rinkeby');

        } else if(provider.toLowerCase().includes('ropsten')) {
            setNetwork('ropsten');

        } else if(provider.toLowerCase().includes('goerli')) {
            setNetwork('goerli');
        } else {
            setNetwork('mainnet');
        }


    }, [provider]);

    useEffect(() => {

        if(editTask === null) return;

        setArgs([]);

        const _wallet = wallets.find(w => fixAddress(w.account.address) === fixAddress(editTask.wallet.account.address))

        setSelectedWallets([_wallet]);
        setProvider(editTask.provider);
        setNetwork(editTask.network);

        let _group = groups.find(g => g.name === editTask.taskGroup);

        if(typeof _group === 'undefined') {
            _group = "";
        } else {
            _group = _group.name;
        }

        // values not specific to quick task
        setMaxGas(editTask.maxGas);
        setGasPriority(editTask.gasPriority);
        setGasLimit(editTask.gasLimit);
        setPrice(editTask.price);
        setAmount(editTask.amount);
        setMode(editTask.startMode);
        setContractAddress(editTask.contractAddress);

        if(editTask.customHexData.length === 0) {
            setSelectedGroup(editTask.taskGroup.length > 0 ? _group : "");
            setAbi(editTask.abi);

            const contractInfo = state.getContractMethods(editTask.abi);

            if (contractInfo === null) {
                console.log("Could not get contract info.");
            } else {
                setMintMethods(contractInfo.mintMethods);
                setReadMethods(contractInfo.readMethods);
            }

            if(editTask.functionName !== null && typeof editTask.functionName !== 'undefined') {
                setMintMethod(editTask.functionName);
            }

            if(editTask.startMode === "AUTOMATIC") {
                setReadMethod(editTask.contractReadMethod);
            }

            setTrigger(editTask.trigger);
            setReadValue(editTask.readMethodCurrent);

        } else {
            setCustomHexData(editTask.customHexData);
        }

        Modal.getOrCreateInstance(document.querySelector('#create-task-modal')).show();

    }, [editTask]);

    useEffect(() => {

        // because the args value is overridden when the setMintMethod is called, we need to set the args value again here.
        // We set the args to an empty array in the [editTask] useEffect show that it will reset it everytime.
        if(editTask === null) return;

        if(args.length === 0) {
            setArgs(editTask.args);
        }

    }, [args]);

    useEffect(() => {
        if(toastInfo === null) return;

        Toast.getOrCreateInstance(document.querySelector('#toast-message')).show();
    }, [toastInfo]);

    return html`
            <div class="p-3 w-100 mint-bot view-container">

                <div class="mint-banner d-flex align-items-center justify-content-start p-4">
                    <div class="ms-4 fw-bold">Ethereum Minting Module</div>
                </div>
                
                <div class="task-bar d-flex flex-wrap p-3 mt-3">
                    <button class="button-primary fw-bold" onclick=${() => {
                        handleShowCreateTaskModal()
                    }}><i class="fa-solid fa-plus"></i> New Task
                    </button>
                    <button class="button-secondary fw-bold ms-2" onclick=${startAllTasks}><i class="fa-solid fa-arrow-up"></i> Start All</button>
                    <button class="button-orange fw-bold ms-2" onclick=${() => Modal.getOrCreateInstance(document.querySelector('#create-qt-profile-modal')).show()}><i class="fa-solid fa-wind"></i> Quick Tasks</button>
                    
                    <div class="ms-auto">
                        <button class="button-pink fw-bold" onclick=${updateGas}><i class="fa-solid fa-gas-pump"></i> Update Gas</button>
                        <input class="input ms-2" style="width: 10rem;" type="number" min="1" step="1" placeholder="Max Gas" value=${updateMaxGas} onchange=${(e) => setUpdateMaxGas(Number.parseInt(e.target.value))} />
                        <input class="input ms-2" style="width: 10rem;" type="number" min="1" step="1" placeholder="Priority Fee" value=${updatePriorityGas} onchange=${(e) => setUpdatePriorityGas(Number.parseInt(e.target.value))} />
                    </div>

                    
                </div>

                <hr/>
                
                <div class="main-content d-flex ">
                    
                    <div class="left-content p-4 me-1">
                        <div style="color: white; font-weight: bold; font-size: 1.5rem;">Minting Tasks</div>
                        <hr />
                        <div class="tasks">

                            ${
                                    tasks.map((t) => (
                                            html`
                                                <div class="task mb-3 ${isSelected(t) ? 'task-selected' : ''}">
                                                    <div class="top d-flex align-items-center justify-content-between">
                                                        <div class="wallet-name">
                                                            <div class="title">
                                                                ${t.contractAddress}
                                                            </div>
                                                            <div class="d-flex align-items-center">
                                                                <div class="material-symbols-outlined me-1">wallet</div>
                                                                <div class="me-2">${t.wallet.name}</div>
                                                                ${t.wallet.account.hasOwnProperty('privateKey') ?
                                                                        html`<span class="material-symbols-outlined icon-green" style="font-size: 1rem;">lock_open</span>` :
                                                                        html`<span class="material-symbols-outlined icon-red" style="font-size: 1rem;">lock</span>`
                                                                }
                                                            </div>
                                                        </div>

                                                        <div class="d-flex align-items-center p-1">
                                                            
                                                            <i class="fa-solid fa-circle-play me-2 icon-color start-icon"
                                                               onclick=${() => {
                                                                   t.start(state)
                                                               }}></i>
                                                            <i class="fa-solid fa-circle-stop me-2 icon-color stop-icon"
                                                               onclick=${() => {
                                                                   t.stop(state)
                                                               }}></i>

                                                            <i class="fa-solid fa-pen-to-square me-2 icon-color edit-icon"
                                                               onclick=${() => {
                                                                   setEditTask(Object.assign({}, t));
                                                               }}
                                                            ></i>

                                                            <i class="fa-solid fa-gas-pump icon-color pink-icon me-2"
                                                               onclick=${() => handleSelectedTask(t)}></i>

                                                            <i class="fa-solid fa-trash icon-color delete-icon"
                                                               onclick=${() => {
                                                                   state.deleteEthTask(t.id)
                                                               }}></i>

                                                        </div>
                          
                                                    </div>

                                                    <div class="bottom d-flex align-items-center justify-content-between">
                                                        <div style="color: ${t.status.color}">
                                                            ${t.status.message}
                                                        </div>
                                                        
                                                        <div class="d-flex align-items-center">

                                                            <div class="pill p-1 ms-1">
                                                                ${Number.parseFloat(`${t.price * t.amount}`).toFixed(3)}ETH
                                                                    (${t.amount}x)
                                                            </div>
                                                            <div class="pill p-1 ms-1"><i
                                                                    class="fa-solid fa-gas-pump me-1"></i>
                                                                ${t.maxGas} + ${t.gasPriority}
                                                            </div>
                                                            <div class="pill p-1 ms-1">${t.network}</div>
                                                            <div class="pill p-1 ms-1">${t.startMode}</div>

                                                        </div>
       
                                                    </div>
                                                </div>
                                            `
                                    ))
                            }
                            
                        </div>
                    </div>

                    <div class="right-content p-4 ms-1">
                        <div style="color: white; font-weight: bold; font-size: 1.5rem;">Live Mints:</div>
                        <hr />
                        
                        <div class="label text-center">Coming soon</div>
                        
                    </div>
                    
                </div>

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
                                                    Dropdown.getOrCreateInstance(document.querySelector('#wallets-dropdown')).show()
                                                }}>
                                            Select one or more Wallets
                                        </button>
                                        <ul class="dropdown-menu" aria-labelledby="dropdown">
                                            ${
                                                    wallets.length === 0 ? '' :
                                                            wallets.map((w) => (
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
                                                    Dropdown.getOrCreateInstance(document.querySelector('#networks-dropdown')).show()
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
                                            <li class="dropdown-item" onclick=${() => {
                                                setNetwork('goerli')
                                            }}>Dev - Goerli
                                            </li>
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

                                <div class="label mt-2">Contract ABI</div>
                                <div>
                                    <input class="input flex-grow-1" value=${abi} onchange=${(e) => {
                                        setAbi(e.target.value)
                                    }} placeholder="Paste contract ABI here..."/>
                                </div>
                                
                                <div class="mt-3 ${customHexData.length === 0 ? '' : 'd-none'}">
                                    <div class="dropdown">
                                        <div class="label">Mint Function</div>
                                        <button class="button-dropdown dropdown-toggle" type="button" id="mint-dropdown"
                                                data-bs-toggle="dropdown" aria-expanded="false" onclick=${() => {
                                            Dropdown.getOrCreateInstance(document.querySelector('#mint-dropdown')).show()
                                        }}>
                                            ${mintMethod === null ? 'Select a Mint Function' : mintMethod.name}
                                        </button>
                                        <ul class="dropdown-menu" aria-labelledby="dropdown">
                                            ${
                                                    mintMethods === null || mintMethods.length === 0 ? '' :
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
                                                                        }} placeholder=${arg.name} value=${arg.value} />
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
                                                        Dropdown.getOrCreateInstance(document.querySelector('#modes-dropdown')).show()
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
                                                        Dropdown.getOrCreateInstance(document.querySelector('#read-dropdown')).show()
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
                                                Dropdown.getOrCreateInstance(document.querySelector('#trigger-dropdown')).show()
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
                            
                            <div class="title">QUICK TASKS <i class="fa-solid fa-wind ms-1"></i></div>
                            <div class="mt-3">
                                <div class="label">Custom Hex Data</div>
                                <input class="input w-100" type="text" value=${customHexData}
                                       onchange=${(e) => {
                                           setCustomHexData(e.target.value)
                                       }} placeholder="0x123abc..."/>
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
                            <button class="button-outline-cancel me-2" onclick=${() => {Modal.getOrCreateInstance(document.querySelector('#create-task-modal')).hide()}}>Cancel</button>
                            <button class="button-secondary ${editTask === null ? 'd-none' : ''}" onclick=${handleUpdateTasks}>Save Task</button>
                            <button class="button-primary ${editTask === null ? '' : 'd-none'}" onclick=${handleCreateTasks}>Create Task</button>
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

            <div id="create-qt-profile-modal" class="modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title title">Create Quick Task Profile</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-2">
                                <div class="label">Profile Name</div>
                                <input class="input me-1 flex-grow-1" placeholder="Profile name" value=${profileName}
                                       onchange=${(e) => {
                                    setProfileName(e.target.value)
                                }}/>
                            </div>

                            <div class="dropdown">
                                <div class="label">Wallets</div>
                                <button class="button-dropdown dropdown-toggle" type="button"
                                        id="qt-wallets-dropdown" data-bs-toggle="dropdown" aria-expanded="false"
                                        onclick=${() => {
                                            Dropdown.getOrCreateInstance(document.querySelector('#qt-wallets-dropdown')).show()
                                        }}>
                                    Select one or more Wallets
                                </button>
                                <ul class="dropdown-menu" aria-labelledby="dropdown">
                                    ${
                                        wallets.length === 0 ? '' :
                                                wallets.map((w) => (
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

                            <div class="d-flex flex-wrap mt-2">
                                ${
                                    selectedWallets.map(w => (
                                            html`
                                                <div class="selected-wallet me-1 mb-1" onclick=${() => removeSelectedWallet(w)}>${w.name}
                                                    <i class="fa-solid fa-xmark icon-color ms-2 delete-icon"></i>
                                                </div>
                                            `
                                    ))
                                }
                            </div>
                            
                            <hr />
                            
                            <div>
                                
                                ${profiles.map(p => (
                                    html`
                                    <div class="d-flex justify-content-between mt-2">
                                        <div style="color: white;">
                                            <span class="me-2">${p.name}</span>
                                            <span style="color: gray; font-size: 0.85rem;">${p.wallets.length} Wallet(s)</span>
                                        </div>
                                        <i class="fa-solid fa-trash icon-color delete-icon" onclick=${() => deleteQuickTaskProfile(p)}></i>
                                    </div>
                                    `
                                ))}
                                
                            </div>
                            
                        </div>
                        <div class="modal-footer">
                            <button class="button-secondary ms-1" onclick=${handleCreateQuickTaskProfile}>Create Profile</button>
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
            
    `
}

export default EthMinter;