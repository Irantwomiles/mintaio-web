class Wallet {
    constructor(name, privateKey) {
        this.name = name;
        this.privateKey = privateKey;
    }
}

class WalletManager {

    /**
     * Manage the users wallets
     *
     */

    constructor() {
        this.wallets = [];
    }

    /**
     * Create a new wallet.
     * @param name
     * @param privateKey
     * @returns {{success: boolean, message: string}}
     */
    createWallet(name, privateKey) {
        const _w = this.wallets.find(w => w.privateKey === privateKey);

        if(typeof _w !== 'undefined') return {
            success: false,
            message: 'Wallet already exists'
        };

        this.wallets.push(new Wallet(name, privateKey));
    }

}

export default WalletManager;