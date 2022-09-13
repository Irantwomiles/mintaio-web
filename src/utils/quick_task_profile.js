import {fixAddress} from "./utils";

class QuickTaskProfile {

    static loadProfiles(state) {

        let profiles = localStorage.getItem('qt-profiles');

        if(profiles === null) {
            localStorage.setItem('qt-profiles', JSON.stringify([]));
        }

        profiles = JSON.parse(localStorage.getItem('qt-profiles'));

        const _profiles = [];
        for(const p of profiles) {
            _profiles.push(new QuickTaskProfile(p.name, p.wallets));
        }

        state.quickTaskProfileStream.next(_profiles);
    }

    constructor(name, wallets) {
        this.name = name;
        this.wallets = wallets;
    }

    save() {
        if(localStorage.getItem('qt-profiles') === null) {
            localStorage.setItem('qt-profiles', JSON.stringify([]));
        }

        let profiles = JSON.parse(localStorage.getItem('qt-profiles'));

        profiles = profiles.filter(p => p.name !== this.name);
        profiles.push({
            name: this.name,
            wallets: this.wallets
        })

        console.log(profiles);

        localStorage.setItem('qt-profiles', JSON.stringify(profiles));
    }

}

export default QuickTaskProfile;