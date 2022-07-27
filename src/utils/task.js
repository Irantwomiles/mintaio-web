import Web3 from 'web3';

class Task {

    static ID = 0;

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

        this.contractReadMethod = "";

        this.taskGroup = "";

        this.startMode = 'MANUAL'; // MANUAL, AUTOMATIC, BLOCK_TIME

        this.active = false;
        this.status = {
            message: 'Inactive',
            color: '#FFF'
        };
    }

    async sendTransaction(state) {

        let finalGasLimit = 0;
        let finalCost = Number.parseFloat(`${this.price * this.amount}`).toFixed(3);

        if(this.wallet === null) {
            return;
        }

        if(!this.wallet.account.hasOwnProperty('privateKey')) {
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

            this.status = {
                message: 'Sending Transaction',
                color: '#D7BA5AFF'
            };

            state.postTaskUpdate();

            const sign = await this.web3.eth.accounts.signTransaction(tx, this.wallet.account.privateKey);

            return this.web3.eth.sendSignedTransaction(sign.rawTransaction);

        } catch(e) {
            console.log("error:", e);
        }
    }

    async start(state) {
        this.sendTransaction(state).then(() => {
            this.status = {
                message: 'Success',
                color: '#49a58b'
            };

            state.postTaskUpdate();
        }).catch(e => {
            this.status = {
                message: 'Unsuccessful',
                color: '#f58686'
            };

            console.log(e);

            state.postTaskUpdate();
        });
    }

    fetchAbi(contract) {
        fetch(`http://api.etherscan.io/api?module=contract&action=getabi&address=${contract}`).then((data) => {
            console.log("ABI:", data);
        })
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
            taskGroup: this.taskGroup,
            startMode: this.startMode,
            network: this.network
        });

        localStorage.setItem('eth-tasks', JSON.stringify(_tasks));
    }
}

export default Task;