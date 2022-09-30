import {html} from 'htm/preact';
import {useEffect, useState} from "preact/compat";
import SidebarNav from "../SidebarNav";
import {Toast} from "bootstrap";
import {getNormalTransactions, getOpenSeaEventData, shortedText} from "../../utils/utils";
import _ from "lodash-es";

import logo from '../../images/mintaio-logo.png';

function ProfitAndLoss({state}) {

    const [data, setData] = useState({
        globalMintCost: 0, //
        globalGasCost: 0, //
        globalSaleValue: 0, //
        globalHolding: 0,
        globalSold: 0, //
        globalBought: 0, //
        globalBoughtValue: 0,
        globalMarketFees: 0,
        globalSpending: 0, //
        data: []
    });

    const [address, setAddress] = useState("");
    const [toastInfo, setToastInfo] = useState(null);

    const [loading, setLoading] = useState(false);

    const checkProfitAndLoss = async () => {

        if(address.length === 0) {
            setToastInfo({
                message: 'Please input an address you want to check.',
                class: 'toast-error'
            })
            return;
        }

        try {

            setLoading(true);

            const output = [];

            const apiKey = localStorage.getItem('etherscan-api');

            const successData = await (await getOpenSeaEventData(address, 'successful')).json();

            const sales = new Map();

            //console.log(successData.asset_events);

            for(const data of successData.asset_events) {

                if(data.asset === null) {
                    console.log("asset was null, skipping");
                    continue;
                }

                const asset = data.asset;

                //console.log(data);

                let obj = sales.get(asset.asset_contract.address);

                if(typeof obj === 'undefined') {
                    obj = {
                        contractAddress: asset.asset_contract.address,
                        slug: data.collection_slug,
                        name: asset.collection.name,
                        sellerFee: asset.collection.fees,
                        assets: [],
                        count: 1
                    }

                    obj.assets.push({
                        tokenId: asset.token_id,
                        permalink: asset.permalink,
                        image: asset.image_url,
                        salePrice: data.total_price,
                        event_type: data.seller.address.toLowerCase() === address.toLowerCase() ? 'sold' : 'bought'
                    })

                } else {
                    obj.count = obj.count + 1;

                    obj.assets.push({
                        tokenId: asset.token_id,
                        permalink: asset.permalink,
                        salePrice: data.total_price,
                        image: asset.image_url,
                        event_type: data.seller.address.toLowerCase() === address.toLowerCase() ? 'sold' : 'bought'
                    })

                }

                sales.set(asset.asset_contract.address, obj);
            }

            const transferData = await (await getOpenSeaEventData(address, 'transfer')).json();

            const mints = new Map();

            //const internalTx = await (await getInternalTransactions(address, apiKey)).json();
            const normalTx = await (await getNormalTransactions(address, apiKey)).json();
            let visitedTxs = [];


            for(const transfer of transferData.asset_events) {

                if(transfer.asset === null) {
                    console.log("Asset was null in transfer, skipping");
                    continue;
                }

                if(transfer.from_account.address === '0x0000000000000000000000000000000000000000') {

                    let obj = mints.get(transfer.asset.asset_contract.address);
                    const txHash = transfer.transaction.transaction_hash;

                    const transaction = normalTx.result.find(n => n.hash.toString().toLowerCase() === txHash.toString().toLowerCase());
                    const txExists = typeof transaction !== 'undefined';

                    if(!txExists) {
                        console.log(`Could not find tx ${txHash}`);
                        continue;
                    }

                    const gas = transaction.gas;
                    const gasUsed = Number.parseInt(transaction.gasUsed);
                    const gasPrice = state.globalWeb3.utils.fromWei(transaction.gasPrice, 'gwei');
                    const gasPriceFloat = Number.parseFloat(gasPrice);

                    const totalGasPriceGwei = gasUsed * gasPriceFloat;
                    const totalGasPriceWei = state.globalWeb3.utils.toWei(`${totalGasPriceGwei.toFixed(3)}`, 'gwei');
                    const totalGasPriceEth = state.globalWeb3.utils.fromWei(`${totalGasPriceWei}`, 'ether');

                    const value = state.globalWeb3.utils.fromWei(transaction.value, 'ether');

                    if(typeof obj === 'undefined') {

                        obj = {
                            contractAddress: transfer.asset.asset_contract.address,
                            date: transfer.event_timestamp,
                            totalMintCost: Number.parseFloat(value),
                            totalGasFee: Number.parseFloat(totalGasPriceEth),
                            collection_image: transfer.asset.collection.image_url,
                            assets: []
                        }

                        obj.assets.push({
                            tokenId: transfer.asset.token_id,
                            image: transfer.asset.image_url,
                            url: transfer.asset.permalink,
                            gasFee: totalGasPriceEth,
                            gasUsed: gasUsed,
                            gas: gas,
                            value: value,
                            holding: 0,
                            transactionHash: txHash
                        })

                        visitedTxs.push(txHash);
                    } else {

                        if(typeof obj.assets.find(o => o.tokenId === transfer.asset.token_id) !== 'undefined') continue;

                        const hasVisited = visitedTxs.includes(txHash);

                        obj.totalMintCost += hasVisited ? 0 : Number.parseFloat(value);
                        obj.totalGasFee += hasVisited ? 0 : Number.parseFloat(totalGasPriceEth);

                        obj.assets.push({
                            tokenId: transfer.asset.token_id,
                            image: transfer.asset.image_url,
                            url: transfer.asset.permalink,
                            gasFee: totalGasPriceEth,
                            gasUsed: gasUsed,
                            gas: gas,
                            value: value,
                            holding: 0,
                            transactionHash: txHash
                        })

                        if(!hasVisited) {
                            visitedTxs.push(txHash);
                        }
                    }

                    mints.set(transfer.asset.asset_contract.address, obj);
                }

            }

            let globalMintCost = 0;
            let globalGasCost = 0;
            let globalSaleValue = 0;
            let globalHolding = 0;
            let globalSold = 0;
            let globalBought = 0;
            let globalBoughtValue = 0;
            let globalMarketFees = 0;

            visitedTxs = [];

            for(const key of mints.keys()) {

                const minted = mints.get(key);
                const sale = sales.get(key);
                const exists = typeof sale !== 'undefined';

                let mintedTokens = [];
                let boughtTokens = [];

                if(exists) {

                    boughtTokens = [...boughtTokens, ..._.xorBy(minted.assets, sale.assets, 'tokenId')]
                    mintedTokens = [...mintedTokens, ..._.intersectionBy(minted.assets, sale.assets, 'tokenId')]

                    // We do this because xorBy only returns Unique values, meaning when a user has bought token 123 and sells token 123 this will only show up once. We need to then filter
                    // the original sale.assets array to get all of the tokens with that tokenId.
                    let allBoughTokens = [];

                    for(const token of boughtTokens) {
                        allBoughTokens = [...allBoughTokens, ...sale.assets.filter(s => s.tokenId === token.tokenId)];
                    }

                    boughtTokens = allBoughTokens;

                    output.push({
                        contractAddress: key,
                        totalMintCost: minted.totalMintCost,
                        totalGasFee: minted.totalGasFee,
                        totalSales: sale.count,
                        collection_image: minted.collection_image,
                        mintedTokens: mintedTokens,
                        boughtTokens: boughtTokens
                    })

                }
                else {

                    mintedTokens = [...minted.assets];

                    output.push({
                        contractAddress: key,
                        totalMintCost: minted.totalMintCost,
                        totalGasFee: minted.totalGasFee,
                        collection_image: minted.collection_image,
                        mintedTokens: mintedTokens,
                        boughtTokens: boughtTokens
                    })

                }

                for(const asset of mintedTokens) {

                    const assetSold = exists ? sale.assets.find(s => s.tokenId === asset.tokenId) : undefined;

                    if(assetSold) {
                        asset.sold = state.globalWeb3.utils.fromWei(assetSold.salePrice, 'ether');

                        const seller_fee = Number.parseInt(sale.sellerFee.seller_fees[Object.keys(sale.sellerFee.seller_fees)[0]]);
                        const os_fee = Number.parseInt(sale.sellerFee.opensea_fees[Object.keys(sale.sellerFee.opensea_fees)[0]]);
                        const _fee = (isNaN(seller_fee) ? os_fee : seller_fee + os_fee) / 100;
                        const _initPrice = Number.parseFloat(asset.sold);
                        const _finalPrice = _initPrice - (_initPrice / _fee);
                        globalMarketFees += _initPrice / _fee;

                        asset.image = assetSold.image;

                        globalSaleValue += _finalPrice;
                        globalSold += 1;
                    } else {
                        minted.holding += 1;
                        globalHolding += 1;
                    }

                    if(!visitedTxs.includes(asset.transactionHash)) {
                        globalMintCost += Number.parseFloat(asset.value);
                        globalGasCost += Number.parseFloat(asset.gasFee);

                        visitedTxs.push(asset.transactionHash);
                    }

                }

                for(const asset of boughtTokens) {

                    const assetSold = exists ? sale.assets.find(s => s.tokenId === asset.tokenId) : undefined;

                    if(assetSold) {

                        const _salePrice = Number.parseFloat(state.globalWeb3.utils.fromWei(asset.salePrice, 'ether'));

                        if(asset.event_type === 'sold') {
                            globalSaleValue += _salePrice;
                            globalSold += 1;
                        } else {
                            globalBought += 1;
                            globalBoughtValue += _salePrice;
                        }

                    }
                }

                sales.delete(key);
            }

            for(const key of sales.keys()) {
                const sale = sales.get(key);

                const obj = {
                    contractAddress: key,
                    totalMintCost: 0,
                    totalGasFee: 0,
                    mintedTokens: [],
                    boughtTokens: []
                };

                for(const asset of sale.assets) {

                    const _salePrice = Number.parseFloat(state.globalWeb3.utils.fromWei(asset.salePrice, 'ether'));

                    if(asset.event_type === 'sold') {
                        globalSaleValue += _salePrice;
                        globalSold += 1;
                    } else {
                        globalBought += 1;
                        globalBoughtValue += _salePrice;
                    }

                    obj.boughtTokens.push({
                        tokenId: asset.tokenId,
                        salePrice: asset.salePrice,
                        image: asset.image,
                        url: asset.permalink,
                        event_type: asset.event_type
                    })
                }

                output.push(obj)
            }

            if(output.length === 0) {
                setToastInfo({
                    message: 'Could not find any purchase history for this wallet.',
                    class: 'toast-warning'
                })

                setLoading(false);
                return;
            }

            let globalSpending = globalMintCost + globalBoughtValue + globalGasCost;

            setData({
                globalMintCost,
                globalGasCost,
                globalSaleValue,
                globalHolding,
                globalSold,
                globalBought,
                globalBoughtValue,
                globalMarketFees,
                globalSpending,
                data: output
            });

            setToastInfo({
                message: 'Loaded purchase history.',
                class: 'toast-success'
            })

            console.log(output);

            setLoading(false);

        } catch(e) {
            console.log('error:', e);
            setLoading(false);

            setToastInfo({
                message: 'Error while loading history, check console for more info.',
                class: 'toast-error'
            })
        }

        //console.log("spending:", globalSpending, "mintCost:", globalMintCost, "gasCost:", globalGasCost, "globalSale:", globalSaleValue);
    }

    useEffect(() => {
        //checkProfitAndLoss('0x2ef2780b849f11231558bf9423c141178ec6f34e');
    }, [])

    useEffect(() => {
        if(toastInfo === null) return;

        Toast.getOrCreateInstance(document.querySelector('#toast-message')).show();
    }, [toastInfo]);

    return html`
        <div class="d-flex" style="position: relative;">
            <${SidebarNav} page="profit-tracker" />

            <div class="p-3 w-100">
                
                <!--<div class="pnl-section">
                    <div class="pnl-header d-flex justify-content-between">
                        <div class="contract">0x2eF2780b849F11231558bf9423c141178eC6f34E <i class="fa-solid fa-arrow-up-right-from-square icon-color"></i></div>
                        <div class="d-flex">
                            <div class="nav-info mint-cost me-2">Spent <span>0.3</span><i class="fa-brands fa-ethereum ms-1"></i> Minting</div>
                            <div class="nav-info gas-cost me-2">Spent <span>0.0126489431</span><i class="fa-brands fa-ethereum ms-1"></i> on Gas </div>
                            <div class="nav-info total-sales">Total of <span>3</span> Sales/Purchases</div>
                        </div>
                    </div>
                    
                    <hr />
                    
                    <div>
                        <div class="pnl-token d-flex justify-content-between align-items-center mb-2">
                            <div class="d-flex align-items-center">
                                <div class="nav-info token-id me-3">7589</div>
                                <div class="price me-4">Price: <span>0.05</span><i class="fa-brands fa-ethereum ms-1"></i></div>
                                <div class="gas me-4">Gas: <span>0.004589</span><i class="fa-brands fa-ethereum ms-1"></i> - (<span>82000</span> / <span>125000</span>)<i class="fa-solid fa-gas-pump ms-1"></i></div>
                            </div>

                            <div class="sold nav-info ms-4">Sold: <span>0.12</span><i class="fa-brands fa-ethereum ms-1"></i></div>
                        </div>
                    </div>

                    <div>
                        <div class="pnl-token d-flex justify-content-between align-items-center mb-2">
                            <div class="d-flex align-items-center">
                                <div class="nav-info token-id me-3">1458</div>
                                <div class="price me-4">Price: <span>0.05</span><i class="fa-brands fa-ethereum ms-1"></i></div>
                                <div class="gas me-4">Gas: <span>Unknown</span></div>
                            </div>

                            <div class="sold nav-info ms-4">Sold: <span>0.12</span><i class="fa-brands fa-ethereum ms-1"></i></div>
                        </div>

                        <div class="pnl-token d-flex justify-content-between align-items-center mb-2">
                            <div class="d-flex align-items-center">
                                <div class="nav-info token-id me-3">1458</div>
                                <div class="price me-4">Price: <span>0.05</span><i class="fa-brands fa-ethereum ms-1"></i></div>
                                <div class="gas me-4">Gas: <span>Unknown</span></div>
                            </div>

                            <div class="bought nav-info ms-4">Bought: <span>0.12</span><i class="fa-brands fa-ethereum ms-1"></i></div>
                        </div>
                    </div>
                    
                </div>-->
                
                <div>
                    <input class="input" placeholder="0x123..." type="text" value=${address} onchange=${(e) => {setAddress(e.target.value)}} />
                    <button class="button-primary fw-bold ms-2 me-2" onclick=${checkProfitAndLoss}>Check</button>
                    <i class="${loading ? '' : 'd-none'} fa-solid fa-spinner loading-icon fa-1x" style="color: white;"></i>
                </div>
                
                <hr />
                
                <div class="${data.data.length === 0 ? 'd-none' : ''} pnl-global d-flex justify-content-between align-items-center mb-3">
                    
                    <div class="d-flex align-items-center">
                        <div class="global-info me-2 text-center">
                            <div class="value">${Number.parseFloat(data.globalSpending).toFixed(5)} <i class="fa-brands fa-ethereum ms-1"></i></div>
                            <div class="name">Total Spending</div>
                        </div>

                        <div class="global-info text-center d-flex align-items-center">
                            <div>
                                <div class="value ${data.globalSaleValue - data.globalSpending > 0 ? 'green' : 'red'}">${Number.parseFloat(`${data.globalSaleValue - data.globalSpending}`).toFixed(5)} <i class="fa-brands fa-ethereum ms-1"></i></div>
                                <div class="name">Net Profit</div>
                            </div>
                            <i class="up-arrow fa-solid fa-arrow-up ms-1 fa-2x ${data.globalSaleValue - data.globalSpending > 0 ? '' : 'd-none'}"></i>
                            <i class="down-arrow fa-solid fa-arrow-down ms-1 fa-2x ${data.globalSaleValue - data.globalSpending < 0 ? '' : 'd-none'}"></i>
                        </div>
                    </div>
                    
                    <div class="d-flex align-items-center">
                        <div class="global-info text-center">
                            <div class="value">${Number.parseFloat(data.globalMintCost).toFixed(5)} <i class="fa-brands fa-ethereum ms-1"></i></div>
                            <div class="name">Total Mint Cost</div>
                        </div>
                        
                        <div class="global-info ms-2 text-center">
                            <div class="value">${Number.parseFloat(data.globalGasCost).toFixed(5)} <i class="fa-brands fa-ethereum ms-1"></i></div>
                            <div class="name">Total Gas Spent</div>
                        </div>

                        <div class="global-info ms-2 text-center">
                            <div class="value">${Number.parseFloat(data.globalSaleValue).toFixed(5)} <i class="fa-brands fa-ethereum ms-1"></i></div>
                            <div class="name">Gross Profit</div>
                        </div>
                        
                        <div class="global-info ms-2 text-center">
                            <div class="value">${Number.parseFloat(data.globalMarketFees).toFixed(5)} <i class="fa-brands fa-ethereum ms-1"></i></div>
                            <div class="name">Total Market Fee</div>
                        </div>
                        
                        <div class="global-info ms-2 text-center">
                            <div class="value">${data.globalHolding}</div>
                            <div class="name">Total Holding</div>
                        </div>
                        
                        <div class="global-info ms-2 text-center">
                            <div class="value green">${data.globalSold}</div>
                            <div class="name">Total Sold</div>
                        </div>

                        <div class="global-info ms-2 text-center">
                            <div class="value red">${data.globalBought}</div>
                            <div class="name">Total Bought</div>
                        </div>
                    </div>
                </div>
                
                
                ${data.data.map(t => (
                    html`
                        
                    <div class="pnl-section mb-2">
                        
                        <div class="pnl-header d-flex justify-content-between">
                            <div class="contract align-items-center">
                                <img class="me-2" style="height: 3rem; width: 3rem;" src="${t.collection_image ? t.collection_image : logo}" />
                                ${t.contractAddress} 
                                <a href="https://etherscan.io/address/${t.contractAddress}" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square ms-2 icon-color"></i></a></div>
                            <div class="d-flex align-items-center">
                                <div class="nav-info mint-cost me-2">Spent <span>${t.totalMintCost}</span><i class="fa-brands fa-ethereum ms-1"></i> Minting</div>
                                <div class="nav-info gas-cost me-2">Spent <span>${t.totalGasFee}</span><i class="fa-brands fa-ethereum ms-1"></i> on Gas </div>
                                <div class="nav-info total-sales ${t.hasOwnProperty('totalSales') ? '' : 'd-none'}">Total of <span>${t.hasOwnProperty('totalSales') ? t.totalSales : ''}</span> Sales/Purchases</div>
                            </div>
                        </div>

                        <hr />
                        
                        <div>
                            ${t.mintedTokens.map(m => (
                                html`
                                <div class="pnl-token d-flex justify-content-between align-items-center mb-2">
                                    <div class="d-flex align-items-center">
                                        <div class="nav-info token-id me-3">${shortedText(m.tokenId)}</div>
                                        <div class="d-flex align-items-center me-3"><img style="height: 1.5rem; width: 1.5rem;" src=${m.hasOwnProperty('image') ? m.image : '../../images/mintaio-logo.png'} /></div>
                                        <div class="price me-4">Price: <span>${m.value}</span><i class="fa-brands fa-ethereum ms-1"></i></div>
                                        <div class="gas me-4">Gas: <span>${m.gasFee}</span><i class="fa-brands fa-ethereum ms-1"></i></div>
                                        <a class="me-1" href="${m.url}" target="_blank"><img style="height: 1.3rem; width: 1.3rem;" src="https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.svg" /></a>
                                        <a href="https://etherscan.io/tx/${m.transactionHash}" target="_blank"><img style="height: 1.3rem; width: 1.3rem;" src="https://etherscan.io/images/brandassets/etherscan-logo-circle.png" /></a>
                                    </div>

                                    <div class="sold nav-info ms-4 ${m.hasOwnProperty('sold') ? '' : 'd-none'}">Sold: <span>${m.hasOwnProperty('sold') ? m.sold : ''}</span><i class="fa-brands fa-ethereum ms-1"></i></div>
                                </div>
                                    
                                `
                            ))}
                        </div>

                        <div>
                            ${t.boughtTokens.map(m => (
                                    html`
                                    <div class="pnl-token d-flex justify-content-between align-items-center mb-2">
                                        <div class="d-flex align-items-center">
                                            <div class="nav-info token-id me-3">${shortedText(m.tokenId)}</div>
                                            <div class="d-flex align-items-center me-3"><img style="height: 1.5rem; width: 1.5rem;" src=${m.hasOwnProperty('image') ? m.image : '../../images/mintaio-logo.png'} /></div>
                                            <div class="gas me-4">Gas: <span>Unknown</span></div>
                                            <a href="${m.url}" target="_blank"><img style="height: 1.3rem; width: 1.3rem;" src="https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.svg" /></a>
                                        </div>

                                        <div class="sold nav-info ms-4 ${m.event_type}">${m.event_type === 'sold' ? 'Sold' : 'Bought'}: <span>${state.globalWeb3.utils.fromWei(m.salePrice, 'ether')}</span><i class="fa-brands fa-ethereum ms-1"></i></div>
                                    </div>
                                `
                            ))}
                        </div>
                        
                    </div>
                    `
                ))}
                
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

export default ProfitAndLoss;