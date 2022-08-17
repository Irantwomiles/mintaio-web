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

        this.disperseABI = [{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"recipients","type":"address[]"},{"name":"values","type":"uint256[]"}],"name":"disperseTokenSimple","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"},{"name":"recipients","type":"address[]"},{"name":"values","type":"uint256[]"}],"name":"disperseToken","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"recipients","type":"address[]"},{"name":"values","type":"uint256[]"}],"name":"disperseEther","outputs":[],"payable":true,"stateMutability":"payable","type":"function"}];

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

    deleteEthTask(id) {
        const _task = this.ethTasks.find(t => t.id === id);

        if(typeof _task === 'undefined') {
            console.log(`Could not find task with id ${id}`);
            return;
        }

        _task.delete();

        const _tasks = this.ethTasks.filter(t => t.id !== id);
        this.ethTasksStream.next(_tasks);
    }

    postTaskUpdate() {
        // we have to create a clone because rxjs doesn't detect a change when we just assign this.ethTasks as the next value.
        const clone = [...this.ethTasks];
        this.ethTasksStream.next(clone);
    }

    refreshAllBalance() {
        for(const w of this.wallets) {
            w.getBalance(this);
        }
    }

    async disperseFunds(mainWallet, totalValue, recipients, values) {

        const account = this.globalWeb3.eth.accounts.privateKeyToAccount(mainWallet.account.privateKey);
        const contract = new this.globalWeb3.eth.Contract(this.disperseABI, '0xD152f549545093347A162Dce210e7293f1452150');
        const nonce = await this.globalWeb3.eth.getTransactionCount(account.address, 'latest');
        const value = `${this.globalWeb3.utils.toWei(`${totalValue}`, 'ether')}`;

        const gasLimit = await contract.methods['disperseEther'](recipients, values).estimateGas(
            {
                from: account.address,
                value: value
            });

        const data = contract.methods['disperseEther'](recipients, values).encodeABI();

        const tx = {
            from: account.address,
            to: '0xD152f549545093347A162Dce210e7293f1452150',
            value: value,
            nonce: nonce,
            maxFeePerGas: `${this.globalWeb3.utils.toWei('100', 'gwei')}`,
            maxPriorityFeePerGas: `${this.globalWeb3.utils.toWei(`1.5`,  'gwei')}`,
            gasLimit: Number.parseInt(gasLimit),
            data: data
        };

        const sign = await this.globalWeb3.eth.accounts.signTransaction(tx, account.privateKey);

        return this.globalWeb3.eth.sendSignedTransaction(sign.rawTransaction);
    }
}

export default Main;