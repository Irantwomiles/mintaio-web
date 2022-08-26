import {html} from 'htm/preact';
import {useEffect, useState} from "preact/compat";
import {Toast, Dropdown, Modal} from 'bootstrap';
import SidebarNav from "../SidebarNav";
import {getOpenSeaCollection} from "../../utils/opensea_utils";

function kFormatter(num) {
    return Math.abs(num) > 999 ? Math.sign(num)*((Math.abs(num)/1000).toFixed(1)) + 'k' : Math.sign(num)*Math.abs(num)
}

function OpenSeaSniper({state}) {

    const [toastInfo, setToastInfo] = useState(null)

    const [loadingCollection, setLoadingCollection] = useState(false);
    const [slug, setSlug] = useState("");

    const [collectionData, setCollectionData] = useState(null);

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
                    image: result.collection.image_url
                })

            })


        }).catch(e => {
            setLoadingCollection(false);

            setToastInfo({
                message: 'Error occurred while getting collection info from OpenSea.',
                class: 'toast-error'
            });
        })
    }

    useEffect(() => {
        if(toastInfo === null) return;

        Toast.getOrCreateInstance(document.querySelector('#toast-message')).show();
    }, [toastInfo]);

    return html`
        
        <di class="d-flex" style="position: relative;">
            <${SidebarNav} page="opensea" />
            
            <div class="p-3 w-100">

                <div class="d-flex">
                    <button class="button-primary fw-bold" onclick=${() => {Modal.getOrCreateInstance(document.querySelector('#sniper-modal')).show()}}><i class="fa-solid fa-plus"></i> New Sniper</button>
                </div>

                <hr />
                
                <div id="sniper-modal" class="modal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title title">Create Sniper Task</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <input class="input me-2" placeholder="OpenSea slug" onchange=${(e) => setSlug(e.target.value)} value=${slug} />
                                <button class="button-secondary" onclick=${getCollection}>Get Collection</button>
                                
                                <div class="${collectionData === null ? 'd-none' : ''}">
                                    
                                    <div class="text-center mt-3">
                                        <img style="border-radius: 180px;" src=${collectionData === null ? '' : collectionData.image} />
                                        <div class="title mt-1">${collectionData === null ? '' : collectionData.name}</div>
                                    </div>
                                    
                                    <div class="d-flex justify-content-evenly mt-2">
                                        <div class="text-center">
                                            <div style="color: white;">Total Supply</div>
                                            <div class="label">${collectionData === null ? '' : kFormatter(collectionData.totalSupply)}</div>
                                        </div>

                                        <div class="text-center">
                                            <div style="color: white;">Total Volume</div>
                                            <div class="label">${collectionData === null ? '' : kFormatter(collectionData.totalVolume)} <i class="fa-brands fa-ethereum icon-color"></i> </div>
                                        </div>

                                        <div class="text-center">
                                            <div style="color: white;">Floor Price</div>
                                            <div class="label">${collectionData === null ? '' : Number.parseFloat(`${collectionData.floorPrice}`).toFixed(3)} <i class="fa-brands fa-ethereum icon-color"></i></div>
                                        </div>
                                        
                                    </div>
                                    
                                </div>
                                
                            </div>
                            <div class="modal-footer">
                                <button class="button-outline-cancel" data-bs-dismiss="modal">Cancel</button>
                                <button class="button-primary">Create Sniper</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="toast-message" class="toast align-items-center ${toastInfo === null ? '' : toastInfo.class} end-0 top-0 m-3" style="position: absolute" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="d-flex align-items-center justify-content-between py-3 mx-2">
                        <div class="toast-body">
                            ${toastInfo === null ? '' : toastInfo.message}
                        </div>
                        <i class="fa-regular fa-circle-xmark" data-bs-dismiss="toast"></i>
                    </div>
                </div>
            </div>
            
        </div>
        
     
    `
}

export default OpenSeaSniper;