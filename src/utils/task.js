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
     * @param nonce: nonce
     * @param abi: abi of the smart contract
     */
    constructor(provider, contractAddress, wallet, price, amount, maxGas, gasPriority, gasLimit, functionName, args, nonce, abi) {
        this.id = Task.ID++;

        /* needed to send a transaction */
        this.provider = provider;

        this.web3 = new Web3(this.provider);

        this.contractAddress = contractAddress;
        this.wallet = wallet;
        this.price = price ;
        this.amount = amount;
        this.maxGas = maxGas;
        this.gasPriority = gasPriority;
        this.gasLimit = gasLimit;
        this.functionName = functionName;
        this.args = args;
        this.nonce = nonce;
        this.abi = abi;

        this.contractReadMethod = "";

        this.taskGroup = "";

        this.start_mode = 'MANUAL'; // MANUAL, AUTOMATIC, BLOCK_TIME

        this.active = false;
    }

    async sendTransaction(contractAddress, privateKey, mintMethod, price, gasLimit, maxGas, gasPriority, args, abi) {

        let finalGasLimit = 0;

        try {
            const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
            const contract = new this.web3.eth.Contract(JSON.parse(abi), contractAddress);

            if(gasLimit === 'AUTO') {
                const _gasLimit = await contract.methods[mintMethod](...args).estimateGas({from: account.address, value: `${price}`});
                finalGasLimit = _gasLimit;
            } else {
                finalGasLimit = gasLimit;
            }

            const data = contract.methods[mintMethod](...args).encodeABI();
            const tx = {
                from: account.address,
                to: contractAddress,
                value: price,
                nonce: nonce,
                maxFeePerGas: maxGas,
                maxPriorityFeePerGas: gasPriority,
                gasLimit: finalGasLimit,
                data: data
            };

            const sign = await this.web3.eth.accounts.signTransaction(tx, privateKey);

            return this.web3.eth.sendSignedTransaction(sign.rawTransaction);

        } catch(e) {
            console.log("error:", e);
        }
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

}