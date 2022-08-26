import {BehaviorSubject} from "rxjs";
import Web3 from 'web3';
import NFTManager from './nft_manager';
import OpenSeaBid from "./opensea_bid";
import OpenSeaSniper from "./opensea_sniper";

class Main {

    constructor() {
        this.globalWeb3 = null;
        this.nftManager = new NFTManager();

        this.walletsStream = new BehaviorSubject([]);
        this.ethTasksStream = new BehaviorSubject([]);
        this.openseaBidderStream = new BehaviorSubject([]);

        this.webhook = localStorage.getItem('discordWebHook') === null ? '' : localStorage.getItem('discordWebHook');

        this.abi = [];
        this.wallets = [];
        this.ethTasks = [];
        this.openseaBidders = [];

        this.walletsStream.subscribe((data) => {
            this.wallets = data;
        });

        this.ethTasksStream.subscribe((data) => {
            this.ethTasks = data;
        });

        this.openseaBidderStream.subscribe((data) => {
            this.openseaBidders = data;
        });

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

        const sniper = new OpenSeaSniper(this, 'azuki', '10');

        sniper.fetchAssetListings();

        console.log("Main state initiated, MintAIO - v0.1-beta");
    }

    async getContractAbi(contract, network) {
        let output = this.abi.find(a => a.contractAddress === contract);

        if(typeof output !== 'undefined' && output.abi === 'Contract source code not verified') {
            this.abi = this.abi.filter(a => a.contractAddress !== contract);
            output = undefined;
        }

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

    mintSuccessMessage(contract_address, tx_hash, price, max_gas, priority_fee, webhook) {

        if(webhook.length === 0) {
            console.log("Webhook not set");
            return;
        }

        try {
            const message = {
                "embeds": [
                    {
                        "title": "Successfully Minted!",
                        "description": `Project: [View on etherscan](https://etherscan.io/address/${contract_address})  Transaction: [View on etherscan](https://etherscan.io/tx/${tx_hash})\n\n**Price**: ${price} ETH\n**Max Gas:** ${max_gas} | **Priority Fee:** ${priority_fee}`,
                        "color": 3135616,
                        "author": {
                            "name": "MintAIO",
                            "url": "https://twitter.com/MintAIO_"
                        }
                    }
                ]
            }

            fetch(webhook, {
                method: 'POST',
                body: JSON.stringify(message),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        } catch {

        }
    }

    mintErrorMessage(contract_address, sender, price, amount, max_gas, priority_fee, status, error, webhook) {

        if(webhook.length === 0) {
            console.log("Webhook not set");
            return;
        }

        try {
            const message = {
                "embeds": [
                    {
                        "title": "MintAIO",
                        "description": `**Status:** ${status} | **Mode:** Automatic\n**Project**: [View on etherscan](https://etherscan.io/address/${contract_address}) | **Sender:** [View on etherscan](https://etherscan.io/address/${sender})\n\n**Price:** ${price} ETH | **Quantity:** ${amount} | **Max Gas:** ${max_gas} | **Priority Fee:** ${priority_fee}\n\n**Error:** ${error}`,
                        "color": 13963794
                    }
                ]
            }

            fetch(webhook, {
                method: 'POST',
                body: JSON.stringify(message),
                headers: {
                    'Content-Type': 'application/json'
                }
            })

        } catch {

        }
    }

    testWebHook() {
        fetch(this.webhook, {
            method: 'POST',
            body: JSON.stringify({
                "content": "This is a test from MintAIO! Your Discord webhook is working :)",
                "embeds": null,
                "attachments": []
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

}

export default Main;