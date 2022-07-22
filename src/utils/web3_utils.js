import Web3 from 'web3';

export default class Web3Utils {
    constructor(provider) {
        this.web3 = new Web3(provider);
    }

    update(provider) {
        this.web3 = new Web3(provider);
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

    validJson(json) {
        try {
            JSON.parse(json);
        } catch {
            return false;
        }

        return true;
    }

}