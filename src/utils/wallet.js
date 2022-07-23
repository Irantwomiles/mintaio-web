class Wallet {
    constructor(name, account) {
        this.name = name;
        this.account = account;
    }

    isLocked() {
        return this.account.hasOwnProperty('privateKey');
    }
}

export default Wallet;