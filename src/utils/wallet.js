class Wallet {
    constructor(name, account) {
        this.name = name;
        this.account = account;
        this.balance = -1;
    }

    /**
     * Update the balance of a Wallet
     * @param state
     */
    getBalance(state) {

        if(state.globalWeb3 === null) return;

        state.globalWeb3.eth.getBalance(this.account.address).then((balance) => {
            this.balance = Number.parseFloat(state.globalWeb3.utils.fromWei(balance, 'ether')).toFixed(2);

            console.log('Updated balance', this.name, this.balance);

            // We have to do it this way, because the Components state will not update unless we re-push a new value
            // to our global rxjs state.
            let _wallets = state.wallets.filter(w => w.account.address !== this.account.address);
            _wallets.push(this);

            state.walletsStream.next(_wallets);
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
            console.log("error", e);
        }

        return false;
    }
}

export default Wallet;