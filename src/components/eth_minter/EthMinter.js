import {html} from 'htm/preact';
import {useEffect, useState, useRef} from "preact/compat";
import Web3Utils from "../../utils/web3_utils.js";
import {Dropdown} from "bootstrap";
import SidebarNav from '../SidebarNav.js';

function EthMinter() {

    /*
    wss://eth-mainnet.g.alchemy.com/v2/Q2Ntju4GCSIEphdaYNmBjweqQsfew2ws
    contract: 0x4a8C9D751EEAbc5521A68FB080DD7E72E46462aF

     */

    const globalRef = useRef();

    const [provider, setProvider] = useState("");
    const [contractAddress, setContractAddress] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [price, setPrice] = useState("");
    const [amount, setAmount] = useState("");
    const [maxGas, setMaxGas] = useState("");
    const [gasPriority, setGasPriority] = useState("");
    const [gasLimit, setGasLimit] = useState("");
    const [mintMethod, setMintMethod] = useState(null);
    const [args, setArgs] = useState([]);
    const [nonce, setNonce] = useState("");
    const [abi, setAbi] = useState("");

    const [mintMethods, setMintMethods] = useState([]);
    const [readMethods, setReadMethods] = useState([]);

    const [mintDropdown, setMintDropdown] = useState(null);
    const [readDropdown, setReadDropdown] = useState(null);

    const handleSetProvider = () => {
        if(provider.length === 0) {
            return;
        }

        if(typeof window.web3_utils === 'undefined') {
            window.web3_utils = new Web3Utils(provider)
        } else {
            window.web3_utils.update(provider);
        }

        window.web3_utils.web3.eth.getBalance('0x9Cf22279CAB9046420Ec4875aed6c2972A557043').then((balance) => console.log(balance));

    }

    const handleGetContractInfo = () => {
        /*if(typeof window.web3_utils === 'undefined') {
            console.log("Must set a web3 provider before doing anything.");
            return;
        }*/

        const contractInfo = window.web3_utils.getContractMethods(abi);

        if(contractInfo === null) {
            console.log("Could not get contract info.");
            return;
        }

        setMintMethods(contractInfo.mintMethods);
        setReadMethods(contractInfo.readMethods);

        console.log(contractInfo);
    }

    useEffect(() => {

        setMintDropdown(new Dropdown(globalRef.current.querySelector('#mint-dropdown'), {}));
        //setReadDropdown(new Dropdown(globalRef.current.querySelector('#read-dropdown'), {}));

    }, []);

    useEffect(() => {

        console.log("mintMethod", mintMethod);

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

    return html`
    <div ref=${globalRef} class="d-flex">
        
        <${SidebarNav} />
        
        <div>
                    
            <div>
                <div class="text-white">Web3 Provider</div>
                <input value=${provider} onchange=${(e) => {setProvider(e.target.value)}} />
                <button class="btn" onclick=${handleSetProvider}>Set Provider</button>
            </div>
            
            <div>
                <div>Contract Address</div>
                <input value=${contractAddress} onchange=${(e) => {setContractAddress(e.target.value)}} />
                <button onclick=${handleGetContractInfo}>Get Info</button>
            </div>
    
            <div>
                <div>ABI</div>
                <textarea value=${abi} onchange=${(e) => {setAbi(e.target.value)}} />
            </div>
            
            <div>
                <div>Private Key</div>
                <input value=${privateKey} onchange=${(e) => {setPrivateKey(e.target.value)}} />
            </div>
            <div>
                <div>Price</div>
                <input value=${price} onchange=${(e) => {setPrice(e.target.value)}} />
            </div>
            <div>
                <div>Amount</div>
                <input value=${amount} onchange=${(e) => {setAmount(e.target.value)}} />
            </div>
            <div>
                <div>Max Gas</div>
                <input value=${maxGas} onchange=${(e) => {setMaxGas(e.target.value)}} />
            </div>
            <div>
                <div>Priority Fee</div>
                <input value=${gasPriority} onchange=${(e) => {setGasPriority(e.target.value)}} />
            </div>
            <div>
                <div>Gas Limit</div>
                <input value=${gasLimit} onchange=${(e) => {setGasLimit(e.target.value)}} />
            </div>
            <div>
                <div class="dropdown">
                    <button class="btn btn-secondary dropdown-toggle" type="button" id="mint-dropdown" data-bs-toggle="dropdown" aria-expanded="false" onclick=${() => {mintDropdown.show()}}>
                        ${mintMethod === null ? 'Select a Function' : mintMethod.name}
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="dropdown">
                        ${
                            mintMethods.length === 0 ? '' :
                                    mintMethods.map((mint) => (
                                            html`
                                                <li class="dropdown-item" onclick=${() => {setMintMethod(mint)}}>${mint.name}</li>
                                            `
                                    ))
                        }
                    </ul>
                </div>
            </div>
            <div>
                <div>Args</div>
                ${
                    args.length === 0 ? '' :
                            args.map((arg) => (
                                html`
                                <div>
                                    <div>${arg.name}</div>
                                    <input placeholder=${args.name} />
                                </div>
                                `
                            ))
                }
            </div>

        </div>

    </div>
    `
}

export default EthMinter;