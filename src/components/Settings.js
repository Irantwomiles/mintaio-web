import {html} from 'htm/preact';
import SidebarNav from "./SidebarNav.js";
import {useState, useEffect} from "preact/compat";
import Web3 from "web3";
import {Modal, Toast} from "bootstrap";
import {downloadLocalData, isJson} from "../utils/utils";

function Settings({state}) {

    const [etherscan, setEtherscan] = useState("");
    const [rpc, setRpc] = useState("");
    const [webHook, setWebHook] = useState("");
    const [toastInfo, setToastInfo] = useState(null)
    const [data, setData] = useState("");

    useEffect(() => {
        if(toastInfo === null) return;

        Toast.getOrCreateInstance(document.querySelector('#toast-message')).show();
    }, [toastInfo]);

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
        setToastInfo({
            message: "Updated Etherscan API key.",
            class: 'toast-success'
        });
    }

    const updateGlobalRPC = () => {

        if(rpc.length === 0) {
            setToastInfo({
                message: "You can't set an empty value as your Global RPC.",
                class: 'toast-error'
            });
            return;
        }

        if(localStorage.getItem("globalRpc") === rpc) {
            setToastInfo({
                message: "Your current RPC matches the input you are trying to set.",
                class: 'toast-error'
            });
            return;
        }

        localStorage.setItem("globalRpc", rpc);
        state.globalWeb3 = new Web3(rpc);

        setToastInfo({
            message: "Updated Global RPC.",
            class: 'toast-success'
        });
    }

    const updateDiscordWebHook = () => {
        localStorage.setItem("discordWebHook", webHook);
        state.webhook = webHook;

        setToastInfo({
            message: 'Discord Webhook updated.',
            class: 'toast-success'
        });
    }

    const getStorageSize = () => {
        return (new Blob(Object.keys(localStorage)).size) / 1000;
    }

    const testDiscordWebHook = () => {
        if(state.webhook.length === 0) {
            setToastInfo({
                message: "Please set a Discord Webhook first.",
                class: 'toast-error'
            });
            return;
        }

        state.testWebHook();
        setToastInfo({
            message: "Check your Discord channel.",
            class: 'toast-success'
        });
    }

    const loadData = () => {

        if(data.length === 0) {
            setToastInfo({
                message: "Please paste in the contents of the data you want to import.",
                class: 'toast-error'
            });
            return;
        }

        if(!isJson(data)) {
            setToastInfo({
                message: "Imported data was not in the correct format.",
                class: 'toast-error'
            });
            return;
        }

        const jsonData = JSON.parse(data);

        Object.keys(jsonData).forEach(key => {

            if(key === 'discordWebHook' || key === 'globalRpc' || key === 'etherscan-api') {
                localStorage.setItem(key, jsonData[key]);
            } else {
                localStorage.setItem(key, JSON.stringify(jsonData[key]));
            }

        })

        setToastInfo({
            message: "Imported data successfully, please refresh your page.",
            class: 'toast-success'
        });
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

                <div class="mt-3">
                    <button class="button-pink me-2" onclick=${downloadLocalData}>Download Data</button>
                    <button class="button-secondary" onclick=${() => Modal.getOrCreateInstance(document.querySelector('#load-data-modal')).show()}>Import Data</button>
                </div>
                
            </div>

            <div id="load-data-modal" class="modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title title">Load Data</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            
                            <div class="warning-banner mb-3">
                                This will override all the data you have set. MintAIO is not responsible for any data loss, so make sure to have a backup of all <span style="color: #f58686;">Private Keys</span>!
                            </div>
                            
                            <div>
                                <textarea class="input w-100" style="height: 10rem;" placeholder="Paste the data you downloaded here" onchange=${(e) => setData(e.target.value)} value=${data} />
                            </div>

                        </div>
                        <div class="modal-footer">
                            <button class="button-secondary ms-1" onclick=${loadData}>Load Data</button>
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
        </div>
    `
}

export default Settings;