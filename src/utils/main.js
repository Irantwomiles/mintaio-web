import {BehaviorSubject} from "rxjs";
import Web3 from 'web3';

class Main {
    constructor() {
        this.globalWeb3 = null;
        this.walletsStream = new BehaviorSubject([]);
        this.ethTasksStream = new BehaviorSubject([]);

        this.abi = [];
        this.wallets = [];

        this.walletsStreamSub = this.walletsStream.subscribe((data) => {
            this.wallets = data;
        })

        if(localStorage.getItem("abi-list") !== null) {
            this.abi = JSON.parse(localStorage.getItem("abi-list"));
        } else {
            localStorage.setItem("abi-list", JSON.stringify(this.abi));
        }

        if(localStorage.getItem("globalRpc") !== null) {
            const rpc = localStorage.getItem("globalRpc");

            try {
                this.globalWeb3 = new Web3(rpc);
            } catch(e) {
                console.log(e);
            }

        }

        if(localStorage.getItem("etherscan-api") === null) {
            localStorage.setItem("etherscan-api", "");
        }

        console.log("Main state initiated.");
    }

    updateWalletsBalance() {



    }

    async getContractAbi(contract, network) {
        let output = this.abi.find(a => a.contractAddress === contract);

        console.log("output", output);

        if(typeof output === 'undefined') {
            let abi = await this.fetchContractAbi(contract, network);

            if(abi === null) {
                return null;
            }

            this.abi.push({
                contractAddress: contract,
                abi: abi
            })

            localStorage.setItem('abi-list', JSON.stringify(this.abi));

            return abi;
        }

        return output.abi;
    }

    async fetchContractAbi(contract, network) {
        let data = await fetch(`http://api${network === 'mainnet' ? '' : `-${network}`}.etherscan.io/api?module=contract&action=getabi&address=${contract}&apikey=${localStorage.getItem('etherscan-api')}`);
        if(data.status === 200) {
            let abi = await data.json();
            return abi.result;
        }

        return null;
    }

    getContractMethods(abi) {

        let methods = null;
        const valid_json = this.validJson(abi);

        console.log(abi);

        if(methods === null && !valid_json) {
            console.log("no methods found and the abi was invalid");
            return null;
        } else if(methods === null && valid_json) {
            methods = JSON.parse(abi);
        }

        let payable_methods = [];
        let view_methods = [];

        for(const m of methods) {
            if((m.stateMutability === 'payable' && m.type === 'function') || (m.stateMutability === 'nonpayable' && m.type === 'function')) {
                payable_methods.push(m);
            } else if(m.stateMutability === 'view') {
                view_methods.push(m);
            }
        }

        return {mintMethods: payable_methods, readMethods: view_methods};
    }

    validJson(json) {
        try {
            JSON.parse(json);
        } catch {
            return false;
        }

        return true;
    }
}

export default Main;