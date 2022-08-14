import Web3 from 'web3';

class Task {

    static ID = 0;
    static GREEN = '#49a58b';
    static YELLOW = '#d7ba5a';
    static RED = '#f58686';
    static WHITE = '#FFF';
    static BLUE = '#3674e0';

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
        this.wallet = wallet;
        this.privateKey = '';
        this.price = price ;
        this.amount = amount;
        this.maxGas = maxGas;
        this.gasPriority = gasPriority;
        this.gasLimit = gasLimit;
        this.functionName = functionName;
        this.args = args;
        this.abi = abi;
        this.network = 'mainnet';

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

        try {
            const account = this.web3.eth.accounts.privateKeyToAccount(this.wallet.account.privateKey);
            const contract = new this.web3.eth.Contract(JSON.parse(this.abi), this.contractAddress);
            const nonce = await this.web3.eth.getTransactionCount(account.address, 'latest');

            if(this.gasLimit === 'AUTO') {
                const _gasLimit = await contract.methods[this.functionName.name](...this.args).estimateGas(
                    {
                        from: account.address,
                        value: `${this.web3.utils.toWei(`${finalCost}`, 'ether')}`
                    });
                finalGasLimit = _gasLimit;
            } else {
                finalGasLimit = this.gasLimit;
            }

            const data = contract.methods[this.functionName.name](...this.args).encodeABI();
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

            this.web3.eth.sendSignedTransaction(sign.rawTransaction).then((output) => {

                this.status = {
                    message: `Success: Block #${output.blockNumber}`,
                    color: Task.GREEN
                };

                state.postTaskUpdate();
            }).catch(e => {
                this.status = {
                    message: 'Unsuccessful',
                    color: Task.RED
                };

                console.log(e);

                state.postTaskUpdate();
            });

        } catch(e) {

            this.status = {
                message: 'Error occurred',
                color: Task.RED
            };

            state.postTaskUpdate();

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
                console.log("Start mode DEFAULT case");
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

            contract.methods[this.contractReadMethod.name]().call({defaultBlock: 'pending'}).then((result) => {

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
            trigger: this.trigger
        });

        localStorage.setItem('eth-tasks', JSON.stringify(_tasks));
    }
}

export default Task;