import {html} from 'htm/preact';
import {useEffect, useState, useRef} from "preact/compat";
import {Toast, Dropdown, Modal} from 'bootstrap';

function OpenSeaBidder({state}) {

    const [slug, setSlug] = useState("")

    const [toastInfo, setToastInfo] = useState(null)
    const [projectStatus, setProjectStatus] = useState(null);
    const [projectData, setProjectData] = useState([]);

    const handleStartFetching = () => {

        if(slug.length === 0) {
            return;
        }

        if(state.openseaProjectFetcher.isRunning()) {
            return;
        }

        state.fetchProject(slug);
    }

    useEffect(() => {

        if (state === null) {
            return;
        }

        const projectStatusStream = state.openseaProjectStatus.subscribe((data) => {
            if(data === null) {
                setProjectStatus(null);
            } else {
                setProjectStatus(Object.assign({}, data));

                if(data.mode.message === 'Finished') {
                    const _projectData = JSON.parse(localStorage.getItem('project'));

                    setProjectData(_projectData);
                }
            }
        })

        return () => {
            projectStatusStream.unsubscribe();
        }

    }, []);

    useEffect(() => {
        console.log(projectStatus);
    }, [projectStatus]);

    return html`
        <div class="p-3 w-100 sniper view-container">

            <div class="sniper-banner d-flex align-items-center justify-content-start p-4">
                <img src="https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.svg" />
                <div class="ms-4">Bidding Module</div>
            </div>
            
            <div class="bidder-content d-flex mt-3">
                
                <div class="top-content d-flex align-items-center justify-content-between w-100 p-4">

                    <div class="d-flex align-items-center">
                        <button class="button-secondary me-2" onclick=${handleStartFetching}>Fetch Project</button>
                        <input  class="input me-4" type="text" placeholder="OpenSea slug" onchange=${(e) => setSlug(e.target.value)} />
                        
                        <button class="button-pink d-flex align-items-center me-2"><span class="material-symbols-outlined">download</span>Download Project</button>
                        <button class="button-primary d-flex align-items-center"><span class="material-symbols-outlined">file_upload</span>Import Project</button>
                    </div>

                    <div class="${projectStatus === null ? 'd-none' : ''}">
                        <div class="d-flex align-items-center ${projectStatus === null ? 'd-none' : ''}">
                            <div class="me-2" style="color: white; font-weight: bold; font-size: 1.2rem;">${projectStatus === null ? '' : projectStatus.slug}</div>
                            <div style="color: #a1a1a1; font-size: 0.95rem;">(${projectStatus === null ? '' : Number.parseFloat(`${(projectStatus.found/projectStatus.max) * 100}`).toFixed(2) }%) ${projectStatus === null ? '' : projectStatus.found}/${projectStatus === null ? '' : projectStatus.max}</div>
                        </div>
                        <div class="d-flex align-items-center justify-content-between ${projectStatus === null ? 'd-none' : ''}">
                            <div style="color: ${projectStatus === null ? '#fff' : projectStatus.mode.color}; font-size: 0.95rem;">${projectStatus === null ? '' : projectStatus.mode.message}</div>
                            <span class="material-symbols-outlined icon-light-gray-red" onclick=${() => state.stopFetchingProject()}>stop_circle</span>
                        </div>
                    </div>
                </div>
                
                <div class="bottom-content">
                    
                </div>
                
            </div>
            
        </div>
     
    `
}

export default OpenSeaBidder;