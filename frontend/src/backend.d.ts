import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Result = {
    __kind__: "ok";
    ok: SubscriptionRecord;
} | {
    __kind__: "error";
    error: string;
};
export type AccountIdentifier = Uint8Array;
export interface SubscriptionRecord {
    status: Variant_active_expired_pending;
    paidAmount: bigint;
    paidAt: bigint;
    principalId: string;
}
export interface UserProfile {
    userName: string;
    description: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_active_expired_pending {
    active = "active",
    expired = "expired",
    pending = "pending"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSubscriptionStatus(principal: Principal): Promise<Result>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isSubscribed(principal: Principal): Promise<boolean>;
    recordPayment(principal: Principal, amount: bigint): Promise<Result>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    verifyAndActivateSubscription(blockIndex: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "insufficientAmount";
        insufficientAmount: string;
    } | {
        __kind__: "blockNotFound";
        blockNotFound: bigint;
    } | {
        __kind__: "invalidBlock";
        invalidBlock: bigint;
    } | {
        __kind__: "wrongAddress";
        wrongAddress: AccountIdentifier;
    } | {
        __kind__: "alreadySubscribed";
        alreadySubscribed: null;
    } | {
        __kind__: "exceedsMaximumSubscriptionTime";
        exceedsMaximumSubscriptionTime: string;
    }>;
}
