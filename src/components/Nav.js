import {html} from 'htm/preact';
import logo from '../images/mintaio-logo.png';
import {useEffect, useState} from "preact/compat";
import {getEthPrice, getGasPrices} from "../utils/utils";

function Nav() {

    const [ethPrice, setEthPrice] = useState("");
    const [loadingEthPrice, setLoadingEthPrice] = useState(true);

    const [gasLoading, setGasLoading] = useState(true);
    const [gasValues, setGasValue] = useState({
        maxFee: '--',
        maxPriority: '--',
        pendingBlock: '--'
    })

    const updateEthPrice = () => {
        getEthPrice().then((res) => {
            res.json().then(result => {
                setLoadingEthPrice(false);
                setEthPrice(result['USD']);
            }).catch(e => {
                console.log(e);
                setLoadingEthPrice(false);
                setEthPrice('--');
            })
        }).catch(e => {
            console.log(e);
            setLoadingEthPrice(false);
            setEthPrice('--');
        })
    }

    const updateGasPrices = () => {
        getGasPrices().then((res) => {
            res.json().then(result => {
                setGasLoading(false);
                setGasValue({
                    maxFee: result['estimatedPrices'][0].maxFeePerGas,
                    maxPriority: result['estimatedPrices'][0].maxPriorityFeePerGas,
                    pendingBlock:  result['pendingBlockNumberVal']
                })
            }).catch(e => {
                console.log(e);
                setGasLoading(false);
                setGasValue({
                    maxFee: '--',
                    maxPriority: '--',
                    pendingBlock: '--'
                })
            })
        }).catch(e => {
            console.log(e);
            setGasLoading(false);
            setGasValue({
                maxFee: '--',
                maxPriority: '--',
                pendingBlock: '--'
            })
        })
    }

    useEffect(() => {

        updateEthPrice();

        updateGasPrices();

        const ethPriceInterval = setInterval(() => {
            updateEthPrice();
        }, 1000 * 60);

        const gasInterval = setInterval(() => {
            updateGasPrices();
        }, 1000 * 15);

        return () => {
            clearInterval(ethPriceInterval);
            clearInterval(gasInterval);
        }

    }, [])

    return html`
        <nav class="navbar navbar-expand-lg navbar-light p-3">
            
            <img class="nav-logo" src=${logo} />


            <div class="ms-auto d-flex">
                <div class="nav-info me-2">
                    <i class="fa-brands fa-ethereum icon-color me-1"></i>
                    <span class="nav-eth-info">${loadingEthPrice ? html`<i class="fa-solid fa-spinner loading-icon"></i>` : '$' + ethPrice}</span>
                </div>
                
                <div class="nav-info me-2">
                    <i class="fa-solid fa-gas-pump icon-color me-1"></i>
                    <span class="nav-eth-info ">
                        ${gasLoading ? html`<i class="fa-solid fa-spinner loading-icon"></i>` : `Max Fee ${gasValues.maxFee} GWEI / Max Priority ${gasValues.maxPriority} GWEI`}
                    </span>
                </div>

                <div class="nav-info">
                    <i class="fa-solid fa-cube icon-color me-1"></i>
                    <span class="nav-eth-info">
                        ${gasLoading ? html`<i class="fa-solid fa-spinner loading-icon"></i>` : `Pending Block: ${gasValues.pendingBlock}`}
                    </span>
                </div>
            </div>
            
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
        </nav>
    `
}

export default Nav;