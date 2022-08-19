import {html} from 'htm/preact';
import SidebarNav from "./SidebarNav.js";

function Information({state}) {
    return html`
    <div class="d-flex">
        <${SidebarNav} page="info"/>
        
        <div class="p-3 w-100">
            <h3 class="title">Security</h3>
            <hr />
            
            <div class="info-section">
                
                <h5 style="color: white;">Here are some common FAQ's that users have:</h5>
                <div class="q-a">
                    <p>Q: Why do we need to input our Private Key when importing a wallet?</p>
                    <p>A: Inorder for the program to send a transaction in the Ethereum network we require a valid Private Key to generate the transaction.</p>
                </div>
    
                <div class="q-a mt-3">
                    <p>Q: Why can't we use a wallet like MetaMask to import?</p>
                    <p>A: We are not able to get your Private Key through MetaMask that way.</p>
                </div>
    
                <div class="q-a mt-3">
                    <p>Q: How is my Private Key stored?</p>
                    <p>A: All things related to your wallets are encrypted and stored locally. If you wish to view how they are stored, open your browsers developer tools and head to the section related to local storage. To view this in Chrome, open Dev Tools > Application > Local Storage.</p>
                </div>
    
                <div class="q-a mt-3">
                    <p>Q: Does MintAIO store anything on a server?</p>
                    <p>A: No. Nothing is being stored on a server and all outgoing/incoming requests can be seen in the Network tab in the developer tools of your browser.</p>
                </div>

                <h5 class="mt-3" style="color: white;">Security Tips:</h5>
                <div class="q-a mt-3">
                    <ul>
                        <li>Never share your Private Key with anyone!</li>
                        <li>Never share access to the program with anyone else.</li>
                        <li>Remove unused Chrome Extensions.</li>
                    </ul>
                </div>
                
            </div>

            <h3 class="title mt-3">Setup Guide</h3>
            <hr />
            
            <div class="info-section">
                <h5 style="color: white;">Documentation</h5>
                <p class="q-a">Read the following <a href="https://mintaio.gitbook.io/mintaio-web/mint-bot" target="_blank">documentation</a> on how to properly configure this tool.</p>
            </div>
        </div>
        
    </div>
    `
}

export default Information;