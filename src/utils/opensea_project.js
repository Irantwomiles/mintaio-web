class OpenSeaProject {

    constructor() {

        this.interval = null;
        this.throttled = false;
        this.throttleTimer = 0;

        this.assets = [];
        this.assetMapping = {
            slug: null,
            max: 1,
            found: 0,
            cursor: null
        };

        this.cursor = '';
        this.status = {
            max: 1,
            found: 0,
            mode: {
                message: 'Inactive',
                color: '#fff'
            },
            slug: null
        }
    }

    async startFetchingAssets(state, slug) {

        const localData = localStorage.getItem('project');

        if(localData !== null) {

            const jsonData = JSON.parse(localData);

            console.log("JsonData", jsonData);

            if(jsonData.slug === slug) {
                this.assetMapping = jsonData;

                this.cursor = this.assetMapping.cursor;

                this.status.max = this.assetMapping.max;
                this.status.found = this.assetMapping.found;
                this.status.slug = this.assetMapping.slug;

                console.log("assetMapping", this.assetMapping);
            }

        }

        let keyIndex = 0;
        let stillFetching = false;

        const keys = ["2f603e64a3ea42f9b0cb39466ca036df", "a97239276ae0463297a18436a424c676", "d81bee3e75c64ae79541373f4c32295b", "b0fb08d7c8f049009ef4b32440d2c4cc"];
        const activeKey = keys[keyIndex];

        const startTime = new Date().getTime();

        if(this.assetMapping.slug === null) {
            this.assetMapping.slug = slug;
        }

        this.status.mode = {
            message: 'Running',
            color: '#3674e0'
        };

        this.status.slug = slug;

        state.openseaProjectStatus.next(this.status);

        this.interval = setInterval(async () => {

            if(stillFetching) {
                return;
            }

            try {

                stillFetching = true;

                const response = await fetch(`https://api.opensea.io/api/v1/assets?collection_slug=${slug}&order_direction=desc&limit=200&cursor=${this.cursor}`, {
                    headers: {
                        'x-api-key': activeKey
                    }
                });

                if(!this.isRunning()) {
                    return;
                }

                const data = await response.json();

                for(const asset of data.assets) {

                    if(this.status.max < Number.parseInt(asset.token_id)) {
                        this.status.max = Number.parseInt(asset.token_id);
                    }

                    for(const trait of asset.traits) {

                        if(!this.assetMapping.hasOwnProperty(trait.trait_type)) {
                            this.assetMapping[trait.trait_type] = {};
                            this.assetMapping[trait.trait_type][trait.value] = [];
                        } else {
                            if(!this.assetMapping[trait.trait_type].hasOwnProperty(trait.value)) {
                                this.assetMapping[trait.trait_type][trait.value] = [];
                            }
                        }

                        this.assetMapping[trait.trait_type][trait.value].push(asset.token_id);
                    }
                }

                localStorage.setItem('project', JSON.stringify(this.assetMapping));

                if(data.next === null) {
                    clearInterval(this.interval);

                    const endTime = new Date().getTime();

                    this.status.mode = {
                        message: 'Finished',
                        color: '#49a58b'
                    };

                    if(this.status.found > this.status.max) {
                        this.status.found = this.status.max;
                        this.assetMapping.found = this.status.max;
                    }
                    state.openseaProjectStatus.next(this.status);
                    console.log(`Finished in ${(startTime - endTime) / 1000} seconds (${this.assets.length} assets)`);
                    return;
                }

                this.status.found += data.assets.length;
                this.status.mode = {
                    message: 'Running',
                    color: '#3674e0'
                };
                this.status.slug = slug;

                state.openseaProjectStatus.next(this.status);

                this.cursor = data.next;
                this.assetMapping.cursor = data.next;

                this.assetMapping.max = this.status.max;
                this.assetMapping.found = this.status.found;

                stillFetching = false;

                keyIndex++;
                if(keyIndex > (keys.length - 1)) keyIndex = 0;

            } catch(e) {
                keyIndex++;
                if(keyIndex > (keys.length - 1)) keyIndex = 0;

                this.status.mode = {
                    message: 'Waiting...',
                    color: '#d7ba5a'
                };

                state.openseaProjectStatus.next(this.status);

                console.log("error:", e.message)
            }

        }, 1000 * 1);

    }

    stopFetchingAssets(state) {

        if(!this.isRunning()) {
            return;
        }

        clearInterval(this.interval);
        this.interval = null;

        this.throttled = false;
        this.throttleTimer = 0;

        this.status.mode = {
            message: 'Stopped',
            color: '#f58686'
        };

        state.openseaProjectStatus.next(this.status);
    }

    isRunning() {
        return this.interval !== null;
    }
}

export default OpenSeaProject;