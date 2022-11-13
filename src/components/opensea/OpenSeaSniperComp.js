import {html} from 'htm/preact';
import {useEffect, useState, useRef} from "preact/compat";
import {Toast, Dropdown, Modal} from 'bootstrap';
import {getOpenSeaCollection, kFormatter, getTimePassed} from "../../utils/utils.js";
import logo from "../../images/mintaio-logo.png";

function OpenSeaSniperComp({state}) {

    const [toastInfo, setToastInfo] = useState(null)

    const [loadingCollection, setLoadingCollection] = useState(false);
    const [slug, setSlug] = useState("");

    const [collectionData, setCollectionData] = useState(null);
    const [selectedTraits, setSelectedTraits] = useState([]);

    const [tasks, setTasks] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [selectedWallet, setSelectedWallet] = useState(null);

    const [floorProtection, setFloorProtection] = useState(true);
    const [updatePrice, setUpdatePrice] = useState(false);
    const [percentUpdate, setPercentUpdate] = useState(0);

    const [contractAddress, setContractAddress] = useState("");
    const [price, setPrice] = useState(0);
    const [maxGas, setMaxGas] = useState("");
    const [priorityFee, setPriorityFee] = useState("");

    const [liveData, setLiveData] = useState([]);
    const [liveCollection, setLiveCollection] = useState("");

    const nameRef = useRef();

    const getCollection = () => {

        if(slug.length === 0) {
            setToastInfo({
                message: "OpenSea slug can't be left empty.",
                class: 'toast-error'
            });
            return;
        }

        setLoadingCollection(true);

        setToastInfo({
            message: 'Getting collection info...',
            class: 'toast-warning'
        });

        getOpenSeaCollection(slug).then(response => {
            setLoadingCollection(false);

            if(response.status !== 200) {
                setToastInfo({
                    message: 'Error occurred while getting collection info from OpenSea.',
                    class: 'toast-error'
                });
                return;
            }

            setToastInfo({
                message: 'Successfully got collection info from OpenSea.',
                class: 'toast-success'
            });

            response.json().then(result => {

                console.log(result);

                const totalSupply = result.collection.stats.total_supply;

                const traits_obj = result.collection.traits;
                const traits = [];

                if(Object.keys(traits_obj).length > 0) {

                    for(const t of Object.keys(traits_obj)) {

                        for(const v of Object.keys(traits_obj[t])) {
                            traits.push({
                                trait_type: t,
                                value: v,
                                percentile: Number.parseFloat(`${Number.parseInt(traits_obj[t][v]) / totalSupply}`).toFixed(6) * 100
                            })
                        }

                    }

                }

                setCollectionData({
                    name: result.collection.name,
                    totalSupply,
                    floorPrice: result.collection.stats.floor_price,
                    totalVolume: result.collection.stats.total_volume,
                    image: result.collection.image_url,
                    traits: result.collection.traits
                })

                if(result.collection.primary_asset_contracts.length > 0) {
                    setContractAddress(result.collection.primary_asset_contracts[0].address);
                }

            })


        }).catch(e => {
            setLoadingCollection(false);

            setToastInfo({
                message: 'Error occurred while getting collection info from OpenSea.',
                class: 'toast-error'
            });
        })
    }

    const addTrait = (trait) => {
        const clone = [...selectedTraits];
        if(clone.includes(trait)) return;

        clone.push(trait);
        setSelectedTraits(clone);
    }

    const removeTrait = (trait) => {
        let clone = [...selectedTraits];
        if(!clone.includes(trait)) return;

        clone = clone.filter(t => t !== trait);
        setSelectedTraits(clone);
    }

    const handleCreateTask = () => {

        if(slug.length === 0) {
            setToastInfo({
                message: "OpenSea slug can't be left empty.",
                class: 'toast-error'
            });
            return;
        }

        if(contractAddress.length === 0) {
            setToastInfo({
                message: "Please enter in the contract address of the collection.",
                class: 'toast-error'
            });
            return;
        }

        if(price.length === 0) {
            setToastInfo({
                message: "Set a price point you wish to snipe at.",
                class: 'toast-error'
            });
            return;
        }

        if(selectedWallet === null) {
            setToastInfo({
                message: "Please select a wallet.",
                class: 'toast-error'
            });
            return;
        }

        if(maxGas.length === 0 || priorityFee.length === 0) {
            setToastInfo({
                message: "Gas fields must be filled out.",
                class: 'toast-error'
            });
            return;
        }

        if(state.openseaSnipers.length > 3) {
            setToastInfo({
                message: "While we are testing, the sniper is limited to 3.",
                class: 'toast-error'
            });
            return;
        }

        state.createOpenSeaSniper({
            state: state,
            slug: slug,
            contractAddress: contractAddress,
            wallet: selectedWallet,
            price: price,
            traits: selectedTraits,
            maxGas: maxGas,
            priorityFee: priorityFee,
            floorPriceProtection: floorProtection,
            floorAutoPrice: updatePrice,
            floorAutoPricePercent: percentUpdate,
            imageUrl: collectionData.image,
            name: collectionData.name
        });

        Modal.getOrCreateInstance(document.querySelector('#sniper-modal')).hide();
    }

    const handleBrokenImage = (event) => {
        event.target.src = logo;
    }

    const handleDisableLiveView = () => {



    }

    useEffect(() => {
        if(toastInfo === null) return;

        Toast.getOrCreateInstance(document.querySelector('#toast-message')).show();
    }, [toastInfo]);

    useEffect(() => {

        if(!floorProtection) {
            setUpdatePrice(false);
            setPercentUpdate(0);
        }

    }, [floorProtection]);

    useEffect(() => {


        if(state.mintaioSocket === null) {
            return;
        }

        nameRef.current = liveCollection;

        state.openseaListingFilter = liveCollection;
        state.openseaListingData = [];
        state.openseaLiveListingStream.next([]);

    }, [liveCollection]);

    useEffect(() => {

        if (state === null) {
            return;
        }

        const sniperStream = state.openseaSniperStream.subscribe((data) => {
            const clone = [...data];
            setTasks(clone);
        })

        const walletsStream = state.walletsStream.subscribe((data) => {
            setWallets(data);
        })

        const listingStream = state.openseaLiveListingStream.subscribe((data) => {
            setLiveData([...data]);
        })

        return () => {
            walletsStream.unsubscribe();
            sniperStream.unsubscribe();
            listingStream.unsubscribe();
        }

    }, []);

    return html`
        <div class="p-3 w-100 sniper view-container">

            <div class="sniper-banner d-flex align-items-center justify-content-start p-4">
                <img src="https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.svg" />
                <div class="ms-4">Sniping Module</div>
            </div>
            
            <div class="main-content d-flex mt-3">
                <div class="left-content p-4 me-1 flex-grow-1">

                    <div class="sniper-header d-flex align-items-center justify-content-between">
                        <div style="color: white; font-weight: bold; font-size: 1.5rem;">Sniping Tasks</div>
                        <div class="material-symbols-outlined icon-green" onclick=${() => {Modal.getOrCreateInstance(document.querySelector('#sniper-modal')).show()}}>add_circle</div>
                    </div>
                    
                    <hr class="mb-0" />
                    
                    <div class="sniper-list" style="height: 100vh; overflow-y: auto;">

                        ${
                                tasks.map(t => (
                                        html`
                                            <div class="sniper-task d-flex align-items-center p-3 mt-3">

                                                <img class="me-3" src=${t.imageUrl} />

                                                <div class="flex-grow-1">
                                                    <div class="sniper-top d-flex align-items-center justify-content-between">
                                                        <div class="sniper-info">
                                                            <div class="collection-name d-flex align-items-center">${t.name} <span class="material-symbols-outlined icon-light-gray-white ms-2" onclick=${() => setLiveCollection(t.slug)}>visibility</span></div>
                                                            <div class="wallet-name d-flex align-items-center">
                                                                <span class="material-symbols-outlined me-1">wallet</span>
                                                                <span>${t.wallet.name}</span>
                                                            </div>
                                                        </div>

                                                        <div class="sniper-actions">
                                                            <span class="material-symbols-outlined icon-white-green" onclick=${() => {state.startOpenSeaSniper(t.id);}}>play_circle</span>
                                                            <span class="material-symbols-outlined icon-white-yellow" onclick=${() => {state.stopOpenSeaSniper(t.id);}}>stop_circle</span>
                                                            <span class="material-symbols-outlined icon-white-red" onclick=${() => {state.deleteOpenSeaSniperTask(t.id)}}>delete</span>
                                                        </div>

                                                    </div>

                                                    <div class="sniper-bottom d-flex align-items-center justify-content-between">
                                                        <div class="status bought" style="color: ${t.status.color}">${t.status.message}</div>
                                                        <div class="pills">
                                                            <span class="pill p-1 ms-1">${Number.parseFloat(t.price.toString()).toFixed(4)}ETH</span>
                                                            <span class="pill p-1 ms-1 ${t.floorPriceProtection ? '' : 'd-none'}">Floor Protection</span>
                                                            <span class="pill p-1 ms-1 ${t.floorAutoPrice ? '' : 'd-none'}">Auto Price</span>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                     `
                                ))
                        }
                        
                    </div>
                </div>

                <div class="right-content p-4 ms-1 flex-grow-1">
                    
                    <div class="sniper-header">
                        <div class="d-flex align-items-center" style="color: white; font-weight: bold; font-size: 1.5rem;">Live: ${liveCollection.length > 0 ? 
                                html`<span class="ms-2" style="color: #49a58b; font-weight: normal;">${liveCollection}</span>` : html`<span class="ms-2" style="color: #a1a1a1; font-weight: normal;">N/A</span>`}
                            <span class="material-symbols-outlined ms-auto icon-light-gray-red" onclick=${() => setLiveCollection("")}>visibility_off</span></div>
                    </div>

                    <hr/>

                    <div class="sniper-listings">
                        <div class="live-listing">
                            ${
                                    liveData.map(mint => (
                                            html`
                                    <div class="sniper-task d-flex align-items-center p-3 mb-3">

                                        <img class="me-3" src=${mint.payload.item.metadata.image_url} onerror=${handleBrokenImage} />

                                        <div class="flex-grow-1">
                                            <div class="sniper-top d-flex align-items-center justify-content-between">
                                                <div class="sniper-info">
                                                    <div class="collection-name d-flex align-items-center">${mint.payload.item.metadata.name}</div>
                                                    <div class="wallet-name">${getTimePassed(mint.sent_at)}</div>
                                                </div>
                                                <a class="me-1"
                                                   href=${mint.payload.item.permalink}
                                                   target="_blank">
                                                    <img style="height: 1.85rem; width: 1.85rem;" src="https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.svg"/>
                                                </a>
                                            </div>

                                            <div class="sniper-bottom d-flex align-items-center justify-content-end mt-2">
                                                <div class="pills">
                                                    <span class="pill p-1">${Number.parseFloat(state.globalWeb3.utils.fromWei(mint.payload.base_price, 'ether')).toFixed(4)}ETH</span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                            
                                `
                                    ))
                            }
                        </div>
                        
                    </div>

                </div>
            </div>
            
        </div>

        <div id="sniper-modal" class="modal" tabindex="-1">
            
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title title">Sniper Task</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body px-4">

                        <div>
                            <div class="d-flex align-items-center">
                                <input class="input flex-grow-1 me-2" placeholder="OpenSea slug"
                                       onchange=${(e) => setSlug(e.target.value)} value=${slug}/>
                                <button class="button-secondary mt-auto" onclick=${getCollection}>Get Collection</button>
                            </div>
                        </div>

                        <div class="${collectionData === null ? 'd-none' : ''}">

                            <div class="d-flex collection-data p-4 mt-3">
                                <img style="border-radius: 180px; height: 7rem; width: 7rem;" src=${collectionData === null ? '' : collectionData.image} />
                                
                                <div class="flex-grow-1 ms-3">

                                    <div class="title mt-1" style="font-size: 1.5rem;">${collectionData === null ? '' : collectionData.name}</div>
                                    
                                    <hr />

                                    <div class="d-flex align-items-center justify-content-between">
                                        
                                        <div class="text-center">
                                            <div style="color: #a1a1a1;">Total Supply</div>
                                            <div style="color: white; font-size: 1.2rem; font-weight: bold;">${collectionData === null ? '' : kFormatter(collectionData.totalSupply)}</div>
                                        </div>

                                        <div class="text-center">
                                            <div style="color: #a1a1a1;">Total Volume</div>
                                            <div class="d-flex align-items-center" style="color: white; font-size: 1.2rem; font-weight: bold;">
                                                <i class="fa-brands fa-ethereum icon-color me-1"></i>
                                                <span>${collectionData === null ? '' : kFormatter(collectionData.totalVolume)}</span>
                                            </div>
                                        </div>

                                        <div class="text-center">
                                            <div style="color: #a1a1a1;">Floor Price</div>
                                            <div class="d-flex align-items-center" style="color: white; font-size: 1.2rem; font-weight: bold;">
                                                <i class="fa-brands fa-ethereum icon-color me-1"></i>
                                                <span>${collectionData === null ? '' : Number.parseFloat(`${collectionData.floorPrice}`).toFixed(3)}</span>
                                            </div>
                                        </div>
                                        
                                    </div>
                                </div>
                                
                            </div>
                            
                            <hr/>

                            <div class="title d-flex align-items-center">Sniper Information 
                                <span class="material-symbols-outlined ms-1">notes</span>
                            </div>

                            <div class="dropdown mt-2">

                                <div class="label">Wallets</div>
                                <button class="button-dropdown dropdown-toggle" type="button"
                                        id="wallets-dropdown" data-bs-toggle="dropdown" aria-expanded="false"
                                        onclick=${() => {
                                            Dropdown.getOrCreateInstance(document.querySelector('#wallets-dropdown')).show();
                                        }}>
                                    ${selectedWallet === null ? 'Select a Wallet' : selectedWallet.name}
                                </button>
                                <ul class="dropdown-menu" aria-labelledby="dropdown">
                                    ${
                                            wallets.length === 0 ? '' :
                                                    wallets.map((w) => (
                                                            html`
                                                                <li class="dropdown-item" onclick=${() => {
                                                                    setSelectedWallet(w)
                                                                }}>${w.name}
                                                                </li>
                                                            `
                                                    ))
                                    }
                                </ul>
                            </div>

                            <div class="my-2 d-flex align-items-center">
                                <input class="me-2" type="checkbox" checked=${floorProtection ? true : false} onchange=${() => setFloorProtection(!floorProtection)} />
                                <span style="color: #a1a1a1;">Floor Price Protection</span>
                                <span class="material-symbols-outlined ms-2" style="color: #a1a1a1;" data-bs-toggle="tooltip" data-bs-placement="top" title="Enabling this option would prevent buying if the floor price goes lower than the search price.">info</span>
                            </div>

                            <div class="my-2 ${floorProtection ? 'd-flex align-items-center' : 'd-none d-flex align-items-center'}">
                                <input class="me-2" type="checkbox" checked=${updatePrice ? true : false} onchange=${() => setUpdatePrice(!updatePrice)} />
                                <span style="color: #a1a1a1;">Auto Price</span>
                                <span class="material-symbols-outlined ms-2" style="color: #a1a1a1;" data-bs-toggle="tooltip" data-bs-placement="top" title="Enabling this option would lower your search price to the floor price minus the percent value below and continue searching.">info</span>
                            </div>
                            
                            <div class="my-2 ${updatePrice ? 'd-flex align-items-center' : 'd-none d-flex align-items-center'}">
                                <input class="input" type="number" placeholder="Percent Number" onchange=${(e) => setPercentUpdate(e.target.value)} value=${percentUpdate} />
                                <span class="material-symbols-outlined ms-2" style="color: #a1a1a1;" data-bs-toggle="tooltip" data-bs-placement="top" title="The percent value you wish to lower the floor price by to set as your new price point.">info</span>
                            </div>
                            
                            <div class="d-flex">

                                <div class="flex-grow-1 me-2">
                                    <div class="label mt-2">Contract Address</div>
                                    <div>
                                        <input class="input flex-grow-1 w-100" value=${contractAddress}
                                               onchange=${(e) => {
                                                   setContractAddress(e.target.value)
                                               }} placeholder="0x123abc..."/>
                                    </div>
                                </div>

                                <div class="d-flex flex-wrap flex-grow-1 mt-2">
                                    <div class="me-2">
                                        <div class="label">Price</div>
                                        <input class="input" type="number" step="0.0001" min="0" value=${price}
                                               onchange=${(e) => {
                                                   setPrice(e.target.value)
                                               }} placeholder="0.0"/>
                                    </div>
                                </div>

                            </div>

                            <div class="d-flex">

                                <div class="me-2">
                                    <div class="label mt-2">Max Gas</div>
                                    <div>
                                        <input class="input" value=${maxGas}
                                               onchange=${(e) => {
                                                   setMaxGas(e.target.value)
                                               }} placeholder="Max Gas"/>
                                    </div>
                                </div>

                                <div class="d-flex flex-wrap mt-2">
                                    <div class="me-2">
                                        <div class="label">Priority Fee</div>
                                        <input class="input" type="text" value=${priorityFee}
                                               onchange=${(e) => {
                                                   setPriorityFee(e.target.value)
                                               }} placeholder="Priority Fee"/>
                                    </div>
                                </div>

                            </div>
                            
                            ${collectionData !== null && Object.keys(collectionData.traits).length > 0 ? html`
                                <hr />
                                <div class="title d-flex align-items-center mt-2">Traits 
                                    <span class="material-symbols-outlined ms-1">face</span>
                                </div>` : ''}

                            <div class="d-flex flex-wrap mt-3">

                                ${collectionData !== null && Object.keys(collectionData.traits).length > 0 ?
                                        Object.keys(collectionData.traits).map((trait, index) => (
                                                html`
                                                    <div class="dropdown me-2 mb-2" style="min-width: 5rem;">

                                                        <button class="button-dropdown dropdown-toggle w-100"
                                                                id="trait-${index}-dropdown" type="button"
                                                                data-bs-toggle="dropdown" aria-expanded="false"
                                                                onclick=${() => Dropdown.getOrCreateInstance(document.querySelector(`#trait-${index}-dropdown`)).show()}>
                                                            ${trait}
                                                        </button>
                                                        <ul class="dropdown-menu" aria-labelledby="dropdown">
                                                            ${Object.keys(collectionData.traits[trait]).map(t => (
                                                                    html`
                                                                        <li class="dropdown-item" onclick=${() => {
                                                                            addTrait(`${trait.toLowerCase()}|m|${t.toLowerCase()}`)
                                                                        }}>${t}
                                                                            <span class="ms-2">(${Number.parseFloat(((collectionData.traits[trait][t] / collectionData.totalSupply) * 100) + "").toFixed(2)}
                                                                                %)
                                                                            </span>
                                                                        </li>
                                                                    `
                                                            ))}

                                                        </ul>
                                                    </div>
                                                `
                                        ))
                                        : ''
                                }

                            </div>

                            <div class="d-flex flex-wrap">
                                ${selectedTraits.map(trait => (
                                        html`
                                            <div class="selected-wallet me-1 mb-1"
                                                 onclick=${() => removeTrait(trait)}>
                                                ${trait.split('|m|')[0]} - ${trait.split('|m|')[1]}
                                                <i class="fa-solid fa-xmark icon-color ms-2 delete-icon"></i>
                                            </div>
                                        `
                                ))}

                            </div>

                        </div>
                        
                        <div class="modal-footer px-0">
                            <button class="button-outline-cancel" data-bs-dismiss="modal">Cancel</button>
                            <button class="button-primary" onclick=${handleCreateTask}>Create Sniper</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="toast-message"
                 class="toast align-items-center ${toastInfo === null ? '' : toastInfo.class} end-0 top-0 m-3"
                 style="position: absolute" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex align-items-center justify-content-between py-3 mx-2">
                    <div class="toast-body">
                        ${toastInfo === null ? '' : toastInfo.message}
                    </div>
                    <i class="fa-regular fa-circle-xmark" data-bs-dismiss="toast"></i>
                </div>
            </div>
        </div>
     
    `
}

export default OpenSeaSniperComp;