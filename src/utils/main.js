import {BehaviorSubject} from "rxjs";
import Web3 from 'web3';

class Main {
    constructor() {
        this.globalWeb3 = null;
        this.walletsStream = new BehaviorSubject([]);
        this.ethTasksStream = new BehaviorSubject([]);

        if(localStorage.getItem("globalRpc") !== null) {
            const rpc = localStorage.getItem("globalRpc");

            try {
                this.globalWeb3 = new Web3(rpc);
                console.log("Setup globalWeb3 instance");
            } catch(e) {
                console.log(e);
            }

        }
    }
}

if(typeof window.mainState === 'undefined') {
    window.mainState = new Main();
}