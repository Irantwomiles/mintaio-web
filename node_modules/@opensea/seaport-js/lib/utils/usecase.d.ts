import { Contract } from "ethers";
import { CreateOrderAction, ExchangeAction, OrderUseCase, TransactionMethods, ContractMethodReturnType } from "../types";
export declare const executeAllActions: <T extends CreateOrderAction | ExchangeAction<unknown>>(actions: T extends CreateOrderAction ? import("../types").CreateOrderActions : import("../types").OrderExchangeActions<T extends ExchangeAction<infer U> ? U : never>) => Promise<import("ethers").ContractTransaction | import("../types").OrderWithCounter>;
export declare const getTransactionMethods: <T extends Contract, U extends keyof T["functions"]>(contract: T, method: U, args: Parameters<T["functions"][U]>, domain?: string) => TransactionMethods<Awaited<ReturnType<T["callStatic"][U]>>>;
export declare const getTagFromDomain: (domain: string) => string;
