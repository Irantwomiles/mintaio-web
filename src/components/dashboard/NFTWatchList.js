import {html} from 'htm/preact';
import {useEffect, useState} from "preact/compat";
import SidebarNav from "../SidebarNav";
import io from "socket.io-client";
import {Toast} from "bootstrap";

function NFTWatchList({state}) {

    const [projects, setProjects] = useState([]);
    const [toastInfo, setToastInfo] = useState(null);
    const [live, setLive] = useState("OFFLINE");

    const startWatch = () => {
        if(state.mintWatchActive()) {
            setToastInfo({
                message: 'NFT Watch is already active.',
                class: 'toast-error'
            });
            return;
        }

        setLive(state.connectMintWatch());

        setToastInfo({
            message: 'Started NFT Watch.',
            class: 'toast-success'
        });
    }

    const stopWatch = () => {
        if(!state.mintWatchActive()) {
            setToastInfo({
                message: 'NFT Watch is not active.',
                class: 'toast-error'
            });
            return;
        }

        state.disconnectMintWatch();

        setLive('OFFLINE');

        setToastInfo({
            message: 'Disabled NFT Watch.',
            class: 'toast-success'
        });
    }

    useEffect(() => {

        const nftWatchListStream = state.nftWatchListStream.subscribe((data) => {
            setProjects(data);
        })

        if(state.mintWatchActive()) {
            setLive('LIVE');
        }

        return () => {
            nftWatchListStream.unsubscribe();
        }
    }, []);

    useEffect(() => {
        if(toastInfo === null) return;

        Toast.getOrCreateInstance(document.querySelector('#toast-message')).show();
    }, [toastInfo]);

    return html`
        <div class="d-flex" style="position: relative;">
            <${SidebarNav} page="nft-watchlist" />
            
            <div class="p-3 w-100">
                
                <div class="d-flex">
                    <button class="button-primary fw-bold me-2" onclick=${startWatch}><i class="fa-solid fa-circle-play me-1"></i>Start Watch</button>
                    <button class="button-danger fw-bold" onclick=${stopWatch}><i class="fa-solid fa-circle-stop me-1"></i>Stop Watch</button>
                    
                    <div class="ms-auto nft-watchlist-status d-flex align-items-center">
                        <div class="me-2">Status:</div>
                        <div class="${live.toLowerCase()}"></div>
                    </div>
                </div>
                
                <hr />
            
                <div>
                    ${projects.map(p => (
                        html`
                            <div className="task d-flex justify-content-between align-items-center mt-2">
                                <div className="col-4">
                                    <div className="title">
                                        ${p.contractAddress}
                                    </div>
                                    <div className="label">
                                        <span className="me-4">${p.name}</span>
                                    </div>
                                </div>

                                <div className="label col-1 text-center">
                                    <i className="fa-brands fa-ethereum icon-color mx-1"></i>
                                    ${p.value}
                                </div>

                                <div className="label col-3 text-center">
                                    ${p.totalSupply}
                                </div>

                                <div className="actions p-2 col-1 text-center">
                                    <a class="icon-color start-icon" href="https://etherscan.io/address/${p.contractAddress}" target="_blank">
                                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                                    </a>
                                </div>

                            </div>
                            `
                    ))}
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
    `
}

export default NFTWatchList;