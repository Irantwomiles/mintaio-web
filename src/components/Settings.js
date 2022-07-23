import {html} from 'htm/preact';
import SidebarNav from "./SidebarNav";
import {useState, useEffect} from "preact/compat";
import Web3 from "web3";

function Settings() {

    const [rpc, setRpc] = useState("");
    const [webHook, setWebHook] = useState("");

    useEffect(() => {

        if(localStorage.getItem("globalRpc") !== null) {
            setRpc(localStorage.getItem("globalRpc"));
        }

        if(localStorage.getItem("discordWebHook") !== null) {
            setWebHook(localStorage.getItem("discordWebHook"));
        }

    }, []);

    const updateGlobalRPC = () => {
        localStorage.setItem("globalRpc", rpc);

        // After the RPC has changed, try and update the Web3 instance.
        if(typeof window.mainState !== 'undefined') {
            try {
                window.mainState.globalWeb3 = new Web3(rpc);
            } catch(e) {
                console.log(e);
            }

        }

    }

    const updateDiscordWebHook = () => {
        localStorage.setItem("discordWebHook", webHook);
    }

    return html`
        <div class="d-flex">
            <${SidebarNav} page="settings" />
            
            <div class="p-3 w-50">
                <div>
                    <div class="label">Global RPC</div>
                    <input class="input w-75" placeholder="RPC Endpoint" value=${rpc} onchange=${(e) => {setRpc(e.target.value)}} />
                    <button class="button-primary ms-3" onclick=${updateGlobalRPC}>Update</button>
                </div>
                <div class="mt-3">
                    <div class="label">Discord Webhook</div>
                    <input class="input w-75" placeholder="Discord Webhook URL" value=${webHook} onchange=${(e) => {setWebHook(e.target.value)}} />
                    <button class="button-primary ms-3" onclick=${updateDiscordWebHook}>Update</button>
                </div>
            </div>
        </div>
    `
}

export default Settings;