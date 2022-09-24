import {html} from 'htm/preact';
import {useEffect, useState} from "preact/compat";
import SidebarNav from "../SidebarNav";
import io from "socket.io-client";
import {Toast} from "bootstrap";
import {getInternalTransactions, getNormalTransactions, getOpenSeaEventData} from "../../utils/utils";
import _ from "lodash-es";

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
    
    const test = async (address) => {

        const output = [];

        const apiKey = localStorage.getItem('etherscan-api');

        const successData = await (await getOpenSeaEventData(address, 'successful')).json();

        const sales = new Map();

        for(const data of successData.asset_events) {

            if(data.asset === null) {
                console.log("asset was null, skipping");
                continue;
            }

            const asset = data.asset;

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
                    salePrice: data.total_price,
                    event_type: data.seller.address.toLowerCase() === address.toLowerCase() ? 'sold' : 'bought'
                })

            } else {
                obj.count = obj.count + 1;

                obj.assets.push({
                    tokenId: asset.token_id,
                    permalink: asset.permalink,
                    salePrice: data.total_price,
                    event_type: data.seller.address.toLowerCase() === address.toLowerCase() ? 'sold' : 'bought'
                })

            }

            sales.set(asset.asset_contract.address, obj);
        }

        const transferData = await (await getOpenSeaEventData(address, 'transfer')).json();

        const mints = new Map();

        //const internalTx = await (await getInternalTransactions(address, apiKey)).json();
        const normalTx = await (await getNormalTransactions(address, apiKey)).json();

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
                } else {

                    if(typeof obj.assets.find(o => o.tokenId === transfer.asset.token_id) !== 'undefined') continue;

                    obj.totalMintCost += Number.parseFloat(value);
                    obj.totalGasFee += Number.parseFloat(totalGasPriceEth);

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

        for(const key of mints.keys()) {

            const minted = mints.get(key);
            const sale = sales.get(key);
            const exists = typeof sale !== 'undefined';

            let mintedTokens = [];
            let boughtTokens = [];

            if(exists) {
                console.log(`%cMint: ${key} | Total Spent: ${minted.totalMintCost} | Total Gas Spent: ${minted.totalGasFee} | %cTotal Sales: ${sale.count}`, 'color: orange;', 'color: green;');

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
                    mintedTokens: mintedTokens,
                    boughtTokens: boughtTokens
                })

            }
            else {
                console.log(`%cMint: ${key} | Total Spent: ${minted.totalMintCost} | Total Gas Spent: ${minted.totalGasFee}`, 'color: orange;');

                mintedTokens = [...minted.assets];

                output.push({
                    contractAddress: key,
                    totalMintCost: minted.totalMintCost,
                    totalGasFee: minted.totalGasFee,
                    mintedTokens: mintedTokens,
                    boughtTokens: boughtTokens
                })

            }

            for(const asset of mintedTokens) {

                const assetSold = exists ? sale.assets.find(s => s.tokenId === asset.tokenId) : undefined;

                if(assetSold) {
                    asset.sold = state.globalWeb3.utils.fromWei(assetSold.salePrice, 'ether');

                    console.log(sale);

                    const _fee = (Number.parseInt(sale.sellerFee.seller_fees[Object.keys(sale.sellerFee.seller_fees)[0]])
                        + Number.parseInt(sale.sellerFee.opensea_fees[Object.keys(sale.sellerFee.opensea_fees)[0]])) / 1000;
                    const _initPrice = Number.parseFloat(asset.sold);
                    const _finalPrice = _initPrice - (_initPrice * _fee);
                    globalMarketFees += _initPrice * _fee;

                    console.log(`Sold for ${_initPrice} with ${_fee}% fee -> ${_finalPrice}`);

                    globalSaleValue += _finalPrice;
                    globalSold += 1;
                } else {
                    minted.holding += 1;
                    globalHolding += 1;
                }

                globalMintCost += Number.parseFloat(asset.value);
                globalGasCost += Number.parseFloat(asset.gasFee);

                console.log(`${asset.tokenId}: Value: ${asset.value}ETH | Gas: ${asset.gasFee}ETH (${asset.gasUsed}/${asset.gas}) | ${asset.transactionHash} ${typeof assetSold !== 'undefined' ? `| Sold: ${state.globalWeb3.utils.fromWei(assetSold.salePrice, 'ether')}ETH` : ''}`);

            }

            for(const asset of boughtTokens) {

                const assetSold = exists ? sale.assets.find(s => s.tokenId === asset.tokenId) : undefined;

                if(assetSold) {
                    console.log(`${asset.tokenId}: Value: ${state.globalWeb3.utils.fromWei(asset.salePrice, 'ether')}ETH | Gas: Unknown | %c${asset.event_type}`, `color: ${asset.event_type === 'sold' ? 'green;' : 'red;'}`);

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

            console.log("-----------------------------------------------------------------")
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
    }

    useEffect(() => {
        test('0x2ef2780b849f11231558bf9423c141178ec6f34e');
    }, [])
    
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
                
                <div class="${data.data.length === 0 ? 'd-none' : ''} pnl-global d-flex justify-content-between align-items-center">
                    
                    <div class="d-flex align-items-center">
                        <div class="global-info me-2 text-center">
                            <div class="value">${Number.parseFloat(data.globalSpending).toFixed(5)} <i class="fa-brands fa-ethereum ms-1"></i></div>
                            <div class="name">Total Spending</div>
                        </div>

                        <div class="global-info text-center d-flex align-items-center">
                            <div>
                                <div class="value ${data.globalSaleValue > 0 ? 'green' : 'red'}">${Number.parseFloat(data.globalSaleValue).toFixed(5)} <i class="fa-brands fa-ethereum ms-1"></i></div>
                                <div class="name">Total Profit</div>
                            </div>
                            <i class="up-arrow fa-solid fa-arrow-up ms-1 fa-2x ${data.globalSaleValue > 0 ? '' : 'd-none'}"></i>
                            <i class="down-arrow fa-solid fa-arrow-down ms-1 fa-2x ${data.globalSaleValue < 0 ? '' : 'd-none'}"></i>
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
                
                <hr />
                
                ${data.data.map(t => (
                    html`
                        
                    <div class="pnl-section mb-2">
                        <div class="pnl-header d-flex justify-content-between">
                            <div class="contract">${t.contractAddress} <i class="fa-solid fa-arrow-up-right-from-square icon-color"></i></div>
                            <div class="d-flex">
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
                                        <div class="nav-info token-id me-3">${m.tokenId}</div>
                                        <div class="price me-4">Price: <span>${m.value}</span><i class="fa-brands fa-ethereum ms-1"></i></div>
                                        <div class="gas me-4">Gas: <span>${m.gasFee}</span><i class="fa-brands fa-ethereum ms-1"></i> - (<span>${m.gasUsed}</span> / <span>${m.gas}</span>)<i class="fa-solid fa-gas-pump ms-1"></i></div>
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
                                            <div class="nav-info token-id me-3">${m.tokenId}</div>
                                            <div class="gas me-4">Gas: <span>Unknown</span></div>
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
        </div>
    
    `
}

export default ProfitAndLoss;