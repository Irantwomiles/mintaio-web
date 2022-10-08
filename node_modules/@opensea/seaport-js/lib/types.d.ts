import type { DomainRegistry as TypeChainDomainRegistryContract } from "./typechain/DomainRegistry";
import type { OrderStruct, Seaport as TypeChainSeaportContract } from "./typechain/Seaport";
import { BigNumber, BigNumberish, BytesLike, Contract, ContractTransaction, ethers, Overrides, PayableOverrides, PopulatedTransaction } from "ethers";
import { ItemType, OrderType } from "./constants";
import type { ERC721 } from "./typechain/ERC721";
import type { ERC20 } from "./typechain/ERC20";
export declare type SeaportConfig = {
    ascendingAmountFulfillmentBuffer?: number;
    balanceAndApprovalChecksOnOrderCreation?: boolean;
    conduitKeyToConduit?: Record<string, string>;
    overrides?: {
        contractAddress?: string;
        domainRegistryAddress?: string;
        defaultConduitKey?: string;
    };
};
declare type TypedDataDomain = {
    name?: string;
    version?: string;
    chainId?: BigNumberish;
    verifyingContract?: string;
    salt?: BytesLike;
};
declare type TypedDataField = {
    name: string;
    type: string;
};
export declare type Signer = ethers.Signer & {
    _signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string>;
};
export declare type OfferItem = {
    itemType: ItemType;
    token: string;
    identifierOrCriteria: string;
    startAmount: string;
    endAmount: string;
};
export declare type ConsiderationItem = {
    itemType: ItemType;
    token: string;
    identifierOrCriteria: string;
    startAmount: string;
    endAmount: string;
    recipient: string;
};
export declare type Item = OfferItem | ConsiderationItem;
export declare type OrderParameters = {
    offerer: string;
    zone: string;
    orderType: OrderType;
    startTime: BigNumberish;
    endTime: BigNumberish;
    zoneHash: string;
    salt: string;
    offer: OfferItem[];
    consideration: ConsiderationItem[];
    totalOriginalConsiderationItems: BigNumberish;
    conduitKey: string;
};
export declare type OrderComponents = OrderParameters & {
    counter: number;
};
export declare type Order = {
    parameters: OrderParameters;
    signature: string;
};
export declare type AdvancedOrder = Order & {
    numerator: BigNumber;
    denominator: BigNumber;
    extraData: string;
};
export declare type BasicErc721Item = {
    itemType: ItemType.ERC721;
    token: string;
    identifier: string;
};
export declare type Erc721ItemWithCriteria = {
    itemType: ItemType.ERC721;
    token: string;
    identifiers: string[];
    amount?: string;
    endAmount?: string;
};
declare type Erc721Item = BasicErc721Item | Erc721ItemWithCriteria;
export declare type BasicErc1155Item = {
    itemType: ItemType.ERC1155;
    token: string;
    identifier: string;
    amount: string;
    endAmount?: string;
};
export declare type Erc1155ItemWithCriteria = {
    itemType: ItemType.ERC1155;
    token: string;
    identifiers: string[];
    amount: string;
    endAmount?: string;
};
declare type Erc1155Item = BasicErc1155Item | Erc1155ItemWithCriteria;
export declare type CurrencyItem = {
    token?: string;
    amount: string;
    endAmount?: string;
};
export declare type CreateInputItem = Erc721Item | Erc1155Item | CurrencyItem;
export declare type ConsiderationInputItem = CreateInputItem & {
    recipient?: string;
};
export declare type TipInputItem = CreateInputItem & {
    recipient: string;
};
export declare type Fee = {
    recipient: string;
    basisPoints: number;
};
export declare type CreateOrderInput = {
    conduitKey?: string;
    zone?: string;
    startTime?: string;
    endTime?: string;
    offer: readonly CreateInputItem[];
    consideration: readonly ConsiderationInputItem[];
    counter?: number;
    fees?: readonly Fee[];
    allowPartialFills?: boolean;
    restrictedByZone?: boolean;
    useProxy?: boolean;
    domain?: string;
    salt?: string;
};
export declare type InputCriteria = {
    identifier: string;
    proof: string[];
};
export declare type OrderStatus = {
    isValidated: boolean;
    isCancelled: boolean;
    totalFilled: BigNumber;
    totalSize: BigNumber;
};
export declare type OrderWithCounter = {
    parameters: OrderComponents;
    signature: string;
};
export declare type ContractMethodReturnType<T extends Contract, U extends keyof T["callStatic"]> = Awaited<ReturnType<T["callStatic"][U]>>;
export declare type TransactionMethods<T = unknown> = {
    buildTransaction: (overrides?: Overrides) => Promise<PopulatedTransaction>;
    callStatic: (overrides?: Overrides) => Promise<T>;
    estimateGas: (overrides?: Overrides) => Promise<BigNumber>;
    transact: (overrides?: Overrides) => Promise<ContractTransaction>;
};
export declare type ApprovalAction = {
    type: "approval";
    token: string;
    identifierOrCriteria: string;
    itemType: ItemType;
    operator: string;
    transactionMethods: TransactionMethods<ContractMethodReturnType<ERC721, "setApprovalForAll">> | TransactionMethods<ContractMethodReturnType<ERC20, "approve">>;
};
export declare type ExchangeAction<T = unknown> = {
    type: "exchange";
    transactionMethods: TransactionMethods<T>;
};
export declare type CreateOrderAction = {
    type: "create";
    getMessageToSign: () => Promise<string>;
    createOrder: () => Promise<OrderWithCounter>;
};
export declare type TransactionAction = ApprovalAction | ExchangeAction;
export declare type CreateOrderActions = readonly [
    ...ApprovalAction[],
    CreateOrderAction
];
export declare type OrderExchangeActions<T> = readonly [
    ...ApprovalAction[],
    ExchangeAction<T>
];
export declare type OrderUseCase<T extends CreateOrderAction | ExchangeAction> = {
    actions: T extends CreateOrderAction ? CreateOrderActions : OrderExchangeActions<T extends ExchangeAction<infer U> ? U : never>;
    executeAllActions: () => Promise<T extends CreateOrderAction ? OrderWithCounter : ContractTransaction>;
};
export declare type FulfillmentComponent = {
    orderIndex: number;
    itemIndex: number;
}[];
export declare type Fulfillment = {
    offerComponents: FulfillmentComponent[];
    considerationComponents: FulfillmentComponent[];
};
declare type MatchOrdersFulfillmentComponent = {
    orderIndex: number;
    itemIndex: number;
};
export declare type MatchOrdersFulfillment = {
    offerComponents: MatchOrdersFulfillmentComponent[];
    considerationComponents: MatchOrdersFulfillmentComponent[];
};
export declare type SeaportContract = TypeChainSeaportContract & {
    encodeFunctionData(functionFragment: "matchOrders", values: [OrderStruct[], MatchOrdersFulfillment[]]): string;
    matchOrders(orders: OrderStruct[], fulfillments: MatchOrdersFulfillment[], overrides?: PayableOverrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    functions: TypeChainSeaportContract["functions"] & {
        matchOrders(orders: OrderStruct[], fulfillments: MatchOrdersFulfillment[], overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
    };
    callStatic: TypeChainSeaportContract["callStatic"] & {
        matchOrders(orders: OrderStruct[], fulfillments: MatchOrdersFulfillment[], overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
    };
    estimateGas: TypeChainSeaportContract["estimateGas"] & {
        matchOrders(orders: OrderStruct[], fulfillments: MatchOrdersFulfillment[], overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
    };
    populateTranscation: TypeChainSeaportContract["populateTransaction"] & {
        matchOrders(orders: OrderStruct[], fulfillments: MatchOrdersFulfillment[], overrides?: PayableOverrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
    };
};
export declare type DomainRegistryContract = TypeChainDomainRegistryContract;
export {};
