class Wallet {
    constructor(name, account) {
        this.name = name;
        this.account = account;
        this.balance = -1;
    }

    getBalance(web3) {

        if(web3 === null) return;

        web3.eth.getBalance(this.account.address).then((balance) => {
            this.balance = Number.parseFloat(web3.utils.fromWei(balance, 'ether')).toFixed(2);
        })
    }

    isLocked() {
        return !this.account.hasOwnProperty('privateKey');
    }

    unlock(web3, password) {
        try {
            const _account = web3.eth.accounts.decrypt(this.account, password);
            this.account = _account;
            return true;
        } catch(e) {
        }

        return false;
    }
}

export default Wallet;