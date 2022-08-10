import {BehaviorSubject} from "rxjs";
import Web3 from 'web3';

class Main {

    constructor() {
        this.globalWeb3 = null;
        this.walletsStream = new BehaviorSubject([]);
        this.ethTasksStream = new BehaviorSubject([]);

        this.abi = [];
        this.wallets = [];
        this.ethTasks = [];

        this.walletsStreamSub = this.walletsStream.subscribe((data) => {
            this.wallets = data;
        })

        this.walletsStreamSub = this.ethTasksStream.subscribe((data) => {
            this.ethTasks = data;
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

        } else {
            localStorage.setItem("globalRpc", "");
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

        if(typeof output === 'undefined') {
            let abi = await this.fetchContractAbi(contract, network);

            if(abi === null) {
                return null;
            }

            this.abi.push({
                contractAddress: contract,
                abi: abi
            })

            // prevent setting of invalid abi.
            localStorage.setItem('abi-list', JSON.stringify(this.abi));

            return abi;
        }

        return output.abi;
    }

    async fetchContractAbi(contract, network) {
        let data = await fetch(`https://api${network === 'mainnet' ? '' : `-${network}`}.etherscan.io/api?module=contract&action=getabi&address=${contract}&apikey=${localStorage.getItem('etherscan-api')}`);
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

    unlockWallet(address, password) {
        const _wallet = this.wallets.find(w => w.account.address === address);

        // if wallet doesn't exist, just remove it.
        if(typeof _wallet === 'undefined') {
            const _wallets = this.wallets.filter(w => w.account.address !== address)
            this.walletsStream.next(_wallets);
            return false;
        }

        const unlocked = _wallet.unlock(this.globalWeb3, password);

        if(unlocked) {
            for(const t of this.ethTasks) {
                if(t.wallet === _wallet.account.address) {
                    t.privateKey = _wallet.account.privateKey;
                }
            }
        }

        this.walletsStream.next(this.wallets);
        this.ethTasksStream.next(this.ethTasks);

        return unlocked;
    }

    postTaskUpdate() {
        // we have to create a clone because rxjs doesn't detect a change when we just assign this.ethTasks as the next value.
        const clone = [...this.ethTasks];
        this.ethTasksStream.next(clone);
    }
}

export default Main;