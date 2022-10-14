import Web3 from 'web3';
import {html} from "htm/preact";
import {fixAddress} from "./utils";

class Task {

    static ID = 0;
    static GREEN = '#49a58b';
    static YELLOW = '#d7ba5a';
    static RED = '#f58686';
    static WHITE = '#FFF';
    static BLUE = '#3674e0';

    static async loadEthTasks(state) {

        if(localStorage.getItem("eth-tasks") === null) {
            localStorage.setItem("eth-tasks", JSON.stringify([]));
        }

        const tasks = JSON.parse(localStorage.getItem("eth-tasks"));
        const _tasks = [];

        for(const t of tasks) {

            const wallet = state.wallets.find((w, index) => {
                const _address = fixAddress(w.account.address);
                const _tAddress = fixAddress(t.wallet);

                return _tAddress.toLowerCase() === _address.toLowerCase();
            });

            if(typeof wallet !== 'undefined') {

                const abi = await state.getContractAbi(t.contractAddress, t.network);

                const task = new Task(t.provider, t.contractAddress, wallet, t.price, t.amount, t.maxGas, t.gasPriority, t.gasLimit, t.functionName, t.args, abi);

                task.network = t.network;
                task.taskGroup = t.taskGroup;
                task.trigger = t.trigger;
                task.startMode = t.startMode;
                task.contractReadMethod = t.contractReadMethod;
                task.readMethodCurrent = t.readMethodCurrent;
                task.customHexData = t.customHexData;

                task.save();
                _tasks.push(task);

            } else {
                console.log("Wallet was null, not adding eth-task to list");
            }

        }

        this.abi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"rewardAmount","type":"uint256"}],"name":"MintClaimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"term","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"rank","type":"uint256"}],"name":"RankClaimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"term","type":"uint256"}],"name":"Staked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"reward","type":"uint256"}],"name":"Withdrawn","type":"event"},{"inputs":[],"name":"AUTHORS","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DAYS_IN_YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"EAA_PM_START","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"EAA_PM_STEP","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"EAA_RANK_STEP","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"GENESIS_RANK","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_PENALTY_PCT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_TERM_END","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MAX_TERM_START","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MIN_TERM","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"REWARD_AMPLIFIER_END","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"REWARD_AMPLIFIER_START","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SECONDS_IN_DAY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TERM_AMPLIFIER","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TERM_AMPLIFIER_THRESHOLD","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"WITHDRAWAL_WINDOW_DAYS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"XEN_APY_DAYS_STEP","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"XEN_APY_END","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"XEN_APY_START","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"XEN_MIN_BURN","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"XEN_MIN_STAKE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"activeMinters","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"activeStakes","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claimMintReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"other","type":"address"},{"internalType":"uint256","name":"pct","type":"uint256"}],"name":"claimMintRewardAndShare","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"pct","type":"uint256"},{"internalType":"uint256","name":"term","type":"uint256"}],"name":"claimMintRewardAndStake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"term","type":"uint256"}],"name":"claimRank","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"genesisTs","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentAMP","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentAPY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentEAAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCurrentMaxTerm","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"rankDelta","type":"uint256"},{"internalType":"uint256","name":"amplifier","type":"uint256"},{"internalType":"uint256","name":"term","type":"uint256"},{"internalType":"uint256","name":"eaa","type":"uint256"}],"name":"getGrossReward","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"getUserMint","outputs":[{"components":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"term","type":"uint256"},{"internalType":"uint256","name":"maturityTs","type":"uint256"},{"internalType":"uint256","name":"rank","type":"uint256"},{"internalType":"uint256","name":"amplifier","type":"uint256"},{"internalType":"uint256","name":"eaaRate","type":"uint256"}],"internalType":"struct XENCrypto.MintInfo","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getUserStake","outputs":[{"components":[{"internalType":"uint256","name":"term","type":"uint256"},{"internalType":"uint256","name":"maturityTs","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"apy","type":"uint256"}],"internalType":"struct XENCrypto.StakeInfo","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"globalRank","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"term","type":"uint256"}],"name":"stake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalXenStaked","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"userBurns","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"userMints","outputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"term","type":"uint256"},{"internalType":"uint256","name":"maturityTs","type":"uint256"},{"internalType":"uint256","name":"rank","type":"uint256"},{"internalType":"uint256","name":"amplifier","type":"uint256"},{"internalType":"uint256","name":"eaaRate","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"userStakes","outputs":[{"internalType":"uint256","name":"term","type":"uint256"},{"internalType":"uint256","name":"maturityTs","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"apy","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}]

        // We also set ethTasks here even though we set it in the Behavior subscription in case we need to access it right away after load.
        state.ethTasks = _tasks;
        state.ethTasksStream.next(_tasks);

    }

    /**
     *
     * @param contractAddress: public address of the smart contract for the NFT
     * @param private_key: private key of your wallet that you want to use to mint this NFT
     * @param price: price for a single NFT
     * @param amount: total NFTs you are buying
     * @param maxGas: maximum gas value
     * @param gasPriority: priority gas fee
     * @param gasLimit: gas limit (leave at AUTO if you are unsure)
     * @param functionName: name of the minting function
     * @param args: arguments for that function
     * @param abi: abi of the smart contract
     */
    constructor(provider, contractAddress, wallet, price, amount, maxGas, gasPriority, gasLimit, functionName, args, abi) {
        this.id = Task.ID++;

        /* needed to send a transaction */
        this.provider = provider;

        try {
            this.web3 = new Web3(this.provider);
        } catch(e) {
            console.log(`Error creating web3 instance for provider ${this.provider}`, e);
        }


        this.contractAddress = contractAddress;
        this.privateKey = '';
        this.wallet = wallet;
        this.price = price ;
        this.amount = amount;
        this.maxGas = maxGas;
        this.gasPriority = gasPriority;
        this.gasLimit = gasLimit;
        this.functionName = functionName;
        this.args = args;
        this.abi = abi;
        this.network = 'mainnet';

        this.customHexData = '';

        this.nonce = -1;
        this.pending = false;

        this.contractReadMethod = null;
        this.readMethodCurrent = "";

        this.taskGroup = "";

        this.startMode = 'MANUAL'; // MANUAL, AUTOMATIC, BLOCK_TIME

        this.trigger = '!=';
        this.automaticTimer = null;

        this.active = false;
        this.status = {
            message: 'Inactive',
            color: Task.WHITE
        };
    }

    async sendTransaction(state) {

        let finalGasLimit = 0;
        let finalCost = Number.parseFloat(`${this.price * this.amount}`).toFixed(3);

        if(this.wallet === null) {
            this.status = {
                message: 'No wallet set',
                color: Task.RED
            }

            state.postTaskUpdate();
            return;
        }

        if(!this.wallet.account.hasOwnProperty('privateKey')) {
            this.status = {
                message: 'Unlock wallet',
                color: Task.RED
            }

            state.postTaskUpdate();
            return;
        }

        console.log(this);

        try {

            const account = this.web3.eth.accounts.privateKeyToAccount(this.wallet.account.privateKey);
            let nonce = await this.web3.eth.getTransactionCount(account.address, 'latest');

            if(this.nonce === -1) {
                this.nonce = nonce;
            }

            let data;

            // It is not a quick task
            if(this.customHexData.length === 0) {

                const contract = new this.web3.eth.Contract(JSON.parse(this.abi), this.contractAddress);

                const _args = [];

                for (const a of this.args) {
                    _args.push(a.value);
                }

                if(this.gasLimit === 'AUTO') {
                    const _gasLimit = await contract.methods[this.functionName.name](..._args).estimateGas(
                        {
                            from: account.address,
                            value: `${this.web3.utils.toWei(`${finalCost}`, 'ether')}`
                        });
                    finalGasLimit = _gasLimit;
                } else {
                    finalGasLimit = this.gasLimit;
                }

                data = contract.methods[this.functionName.name](..._args).encodeABI();
            } else {
                data = this.customHexData;
                finalGasLimit = this.gasLimit;
            }

            if(!data) {
                this.status = {
                    message: 'No data was set!',
                    color: Task.RED
                };

                state.postTaskUpdate();
                return;
            }

            const tx = {
                from: this.wallet.account.address,
                to: this.contractAddress,
                value: `${this.web3.utils.toWei(`${finalCost}`, 'ether')}`,
                nonce: nonce,
                maxFeePerGas: `${this.web3.utils.toWei(`${this.maxGas}`, 'gwei')}`,
                maxPriorityFeePerGas: `${this.web3.utils.toWei(`${this.gasPriority}`,  'gwei')}`,
                gasLimit: Number.parseInt(finalGasLimit),
                data: data
            };

            const sign = await this.web3.eth.accounts.signTransaction(tx, this.wallet.account.privateKey);

            this.status = {
                message: 'Sending Transaction',
                color: Task.YELLOW
            };

            state.postTaskUpdate();

            this.pending = true;
            this.web3.eth.sendSignedTransaction(sign.rawTransaction).then((output) => {

                this.status = {
                    message: html`<a class="success-transaction" target="_blank" href="https://${this.network === 'mainnet' ? '' : this.network + '.'}etherscan.io/tx/${output.transactionHash}">Success: Block #${output.blockNumber}</a>`,
                    color: Task.GREEN
                };

                // https://discord.com/api/webhooks/1009917503000019004/HJG-m8J5FBL7ok6N-KzXS1cJK7eFEbffhkS_2f9uWR2U3OU1QjdKIWcDQw6i7QG1Z29U // status log
                // https://discord.com/api/webhooks/933193586013519912/XMVYDZuSbI5Rf2_Hlb3qKJEQX-cSyore1TbJttLwd79MKVlsNz9LG0EIheCdaAcNXNBw  // success

                state.mintSuccessMessage(this.contractAddress, output.transactionHash, this.price, this.maxGas, this.gasPriority, state.webhook);

                // If you're reading this, I know you can abuse this. Please don't :)
                state.mintSuccessMessage(this.contractAddress, output.transactionHash, this.price, this.maxGas, this.gasPriority, 'https://discord.com/api/webhooks/1009917503000019004/HJG-m8J5FBL7ok6N-KzXS1cJK7eFEbffhkS_2f9uWR2U3OU1QjdKIWcDQw6i7QG1Z29U');
                state.mintSuccessMessage(this.contractAddress, output.transactionHash, this.price, this.maxGas, this.gasPriority, 'https://discord.com/api/webhooks/933193586013519912/XMVYDZuSbI5Rf2_Hlb3qKJEQX-cSyore1TbJttLwd79MKVlsNz9LG0EIheCdaAcNXNBw');

                state.postTaskUpdate();
            }).catch(e => {

                this.pending = false;

                this.status = {
                    message: 'Unsuccessful',
                    color: Task.RED
                };

                state.postTaskUpdate();

                console.log(e);

                state.mintErrorMessage(this.contractAddress, account.address, this.price, this.amount, this.maxGas, this.gasPriority, 'Sent Tx', e.message, state.webhook);
                state.mintErrorMessage(this.contractAddress, account.address, this.price, this.amount, this.maxGas, this.gasPriority, 'Sent Tx', e.message, 'https://discord.com/api/webhooks/1009917503000019004/HJG-m8J5FBL7ok6N-KzXS1cJK7eFEbffhkS_2f9uWR2U3OU1QjdKIWcDQw6i7QG1Z29U');

            });

        } catch(e) {

            this.pending = false;

            this.status = {
                message: 'Error occurred',
                color: Task.RED
            };

            state.postTaskUpdate();

            state.mintErrorMessage(this.contractAddress, 'Unknown', this.price, this.amount, this.maxGas, this.gasPriority, 'Did not send Tx', e.message, state.webhook);
            state.mintErrorMessage(this.contractAddress, 'Unknown', this.price, this.amount, this.maxGas, this.gasPriority, 'Did not send Tx', e.message, 'https://discord.com/api/webhooks/1009917503000019004/HJG-m8J5FBL7ok6N-KzXS1cJK7eFEbffhkS_2f9uWR2U3OU1QjdKIWcDQw6i7QG1Z29U');

            console.log("error:", e);
        }
    }

    async start(state) {

        console.log("Starting task", this);

        switch(this.startMode) {
            case "MANUAL":
                this.sendTransaction(state);
                return;
            case "AUTOMATIC":
                this.startAutomaticMode(state);
                return;
            default:
                return;
        }
    }

    async startAutomaticMode(state) {

        if(this.contractReadMethod === null || typeof this.contractReadMethod === 'undefined') {
            this.status = {
                message: 'No read method set',
                color: Task.RED
            }

            state.postTaskUpdate();
            return;
        }

        if(this.automaticTimer !== null) {
            this.status = {
                message: 'Already running',
                color: Task.RED
            }

            state.postTaskUpdate();
            return;
        }

        if(this.wallet.isLocked()) {
            this.status = {
                message: 'Unlock wallet',
                color: Task.RED
            }

            state.postTaskUpdate();
            return;
        }



        this.status = {
            message: 'Waiting...',
            color: Task.BLUE
        }

        state.postTaskUpdate();

        const contract = new state.globalWeb3.eth.Contract(JSON.parse(this.abi), this.contractAddress);

        let found = false;

        this.automaticTimer = setInterval(() => {

            contract.methods[this.contractReadMethod.name]().call({defaultBlock: 'latest'}).then((result) => {

                if(this.operators()[this.trigger](`${result}`.toLowerCase(), `${this.readMethodCurrent}`.toLowerCase())) {

                    clearInterval(this.automaticTimer);
                    this.automaticTimer = null;

                    if(found) {
                        return;
                    }

                    this.status = {
                        message: 'Contract is live!',
                        color: Task.BLUE
                    }

                    state.postTaskUpdate();

                    found = true;
                    this.sendTransaction(state);
                }
            }).catch(error => {

                clearInterval(this.automaticTimer);
                this.automaticTimer = null;

                this.status = {
                    message: 'Error occurred',
                    color: Task.RED
                }

                state.postTaskUpdate();

                console.log("error occurred while fetching latest contract data", error);
            })

        }, 500);
    }

    updateGas(state, maxGas, priority) {
        
        this.maxGas = maxGas;
        this.gasPriority = priority;

        this.sendTransaction(state);

        state.postTaskUpdate();
    }

    stop(state) {
        if(this.automaticTimer === null) return;

        clearInterval(this.automaticTimer);
        this.automaticTimer = null;

        this.status = {
            message: 'Stopped task',
            color: Task.YELLOW
        }

        state.postTaskUpdate();
    }

    operators() {
        return {
            '=': (val1, val2) => val1 === val2,
            '!=': (val1, val2) => val1 !== val2,
            '>': (val1, val2) => Number.parseFloat(`${val1}`) > Number.parseFloat(`${val2}`),
            '<': (val1, val2) => Number.parseFloat(`${val1}`) < Number.parseFloat(`${val2}`)
        }
    }

    save() {
        if(localStorage.getItem('eth-tasks') === null) {
            localStorage.setItem('eth-tasks', JSON.stringify([]));
        }

        let _tasks = JSON.parse(localStorage.getItem('eth-tasks'));

        _tasks = _tasks.filter(t => t.id !== this.id);

        _tasks.push({
            id: this.id,
            provider: this.provider,
            contractAddress: this.contractAddress,
            wallet: this.wallet.account.address,
            price: this.price,
            amount: this.amount,
            maxGas: this.maxGas,
            gasPriority: this.gasPriority,
            gasLimit: this.gasLimit,
            functionName: this.functionName,
            args: this.args,
            contractReadMethod: this.contractReadMethod,
            readMethodCurrent: this.readMethodCurrent,
            taskGroup: this.taskGroup,
            startMode: this.startMode,
            network: this.network,
            trigger: this.trigger,
            customHexData: this.customHexData
        });

        state.addLog(`Saving eth-task ${this.id} ${this.contractAddress}`);

        localStorage.setItem('eth-tasks', JSON.stringify(_tasks));
    }

    /**
     * Delete a task and update localStorage. This does NOT update the stream. To update the stream, call deleteEthTask
     * inside the main state.
     */
    delete(state) {
        if(localStorage.getItem('eth-tasks') === null) {
            localStorage.setItem('eth-tasks', JSON.stringify([]));
        }

        let _tasks = JSON.parse(localStorage.getItem('eth-tasks'));

        this.stop(state);
        _tasks = _tasks.filter(t => t.id !== this.id);

        state.addLog(`Deleting eth-task ${this.id} ${this.contractAddress}`);

        localStorage.setItem('eth-tasks', JSON.stringify(_tasks));
    }

}

export default Task;