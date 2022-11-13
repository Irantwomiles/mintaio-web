import {fixAddress} from "./utils";

class QuickTaskProfile {

    static loadProfiles(state) {

        state.addLog('Loading QuickTask profiles.');

        let profiles = localStorage.getItem('qt-profiles');

        if(profiles === null) {
            localStorage.setItem('qt-profiles', JSON.stringify([]));
            state.addLog('No QuickTask profiles found, setting to empty array.');
        }

        profiles = JSON.parse(localStorage.getItem('qt-profiles'));

        const _profiles = [];
        for(const p of profiles) {
            _profiles.push(new QuickTaskProfile(p.name, p.wallets));

            state.addLog(`Loading QuickTask profile ${p.name}`);
        }

        state.quickTaskProfileStream.next(_profiles);
        state.addLog('Finished loading QuickTask profiles.');
    }

    constructor(name, wallets) {
        this.name = name;
        this.wallets = wallets;
    }

    save() {

        state.addLog('Saving QuickTask profile.');

        if(localStorage.getItem('qt-profiles') === null) {
            localStorage.setItem('qt-profiles', JSON.stringify([]));
        }

        let profiles = JSON.parse(localStorage.getItem('qt-profiles'));

        profiles = profiles.filter(p => p.name !== this.name);
        profiles.push({
            name: this.name,
            wallets: this.wallets
        })

        localStorage.setItem('qt-profiles', JSON.stringify(profiles));
    }

}

export default QuickTaskProfile;