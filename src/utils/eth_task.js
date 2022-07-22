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
    constructor(contractAddress, wallet, price, amount, maxGas, gasPriority, gasLimit, functionName, args, nonce, abi) {
        this.id = Task.ID++;

        /* needed to send a transaction */
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

        this.contract_read_method = "";

        this.start_mode = 'MANUAL'; // MANUAL, AUTOMATIC, BLOCK_TIME

        this.active = false;
    }
}