import {html} from 'htm/preact';
import SidebarNav from "./SidebarNav.js";
import {useState, useEffect} from "preact/compat";
import Web3 from "web3";

function Settings({state}) {

    const [etherscan, setEtherscan] = useState("");
    const [rpc, setRpc] = useState("");
    const [webHook, setWebHook] = useState("");

    useEffect(() => {

        if(localStorage.getItem("globalRpc") !== null) {
            setRpc(localStorage.getItem("globalRpc"));
        }

        if(localStorage.getItem("etherscan-api") !== null) {
            setEtherscan(localStorage.getItem("etherscan-api"));
        }

        if(localStorage.getItem("discordWebHook") !== null) {
            setWebHook(localStorage.getItem("discordWebHook"));
        }

    }, []);

    const updateEtherscanApi = () => {
        localStorage.setItem("etherscan-api", etherscan);
    }

    const updateGlobalRPC = () => {

        if(rpc.length === 0 || localStorage.getItem("globalRpc") === rpc) {
            return;
        }

        localStorage.setItem("globalRpc", rpc);
        state.globalWeb3 = new Web3(rpc);
    }

    const updateDiscordWebHook = () => {
        localStorage.setItem("discordWebHook", webHook);
        state.webhook = webHook;
    }

    const getStorageSize = () => {
        return (new Blob(Object.keys(localStorage)).size) / 1000;
    }

    const testDiscordWebHook = () => {
        if(state.webhook.length === 0) {
            return;
        }

        state.testWebHook();
    }

    return html`
        <div class="d-flex">
            <${SidebarNav} page="settings" />
            
            <div class="p-3 w-50">
                <div>
                    <div class="label">Global RPC</div>
                    <input class="input w-75" placeholder="RPC Endpoint" value=${rpc} onchange=${(e) => {setRpc(e.target.value)}} />
                    <button class="button-primary ms-2" onclick=${updateGlobalRPC}>Update</button>
                </div>
                <div class="mt-3">
                    <div class="label">Etherscan API Key</div>
                    <input class="input w-75" placeholder="API Key" value=${etherscan} onchange=${(e) => {setEtherscan(e.target.value)}} />
                    <button class="button-primary ms-2" onclick=${updateEtherscanApi}>Update</button>
                </div>
                <div class="mt-3">
                    <div class="label">Discord Webhook</div>
                    <input class="input w-75" placeholder="Discord Webhook URL" value=${webHook} onchange=${(e) => {setWebHook(e.target.value)}} />
                    <button class="button-primary ms-2" onclick=${updateDiscordWebHook}>Update</button>
                    <button class="button-secondary ms-2" onclick=${testDiscordWebHook}>Test</button>
                </div>
                
                <hr />
                
                <div class="mt-3">
                    <div class="label">You have used <span style="color: white;">${getStorageSize()} KB / 5,000 KB</span> of your storage.</div>
                </div>
            </div>
        </div>
    `
}

export default Settings;