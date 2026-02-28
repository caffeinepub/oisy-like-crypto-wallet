import AccessControl "authorization/access-control";
import Map "mo:core/Map";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Nat "mo:core/Nat";
import Nat64 "mo:core/Nat64";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

actor {
  include MixinStorage();

  public type UserProfile = {
    userName : Text;
    description : Text;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    switch (AccessControl.getUserRole(accessControlState, caller)) {
      case (#guest) { Runtime.trap("You need to be signed up to save your user profile.") };
      case (_) { userProfiles.add(caller, profile) };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    switch (AccessControl.getUserRole(accessControlState, caller)) {
      case (#guest) { Runtime.trap("You need to be signed up to view your user profile.") };
      case (#user) { userProfiles.get(caller) };
      case (#admin) { userProfiles.get(caller) };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    switch (AccessControl.getUserRole(accessControlState, caller)) {
      case (#guest) { Runtime.trap("You need to be signed up to view a user profile.") };
      case (#user) {
        if (user != caller) {
          Runtime.trap("You can only access your own profile unless you are an admin.");
        };
        userProfiles.get(user);
      };
      case (#admin) { userProfiles.get(user) };
    };
  };

  public type SubscriptionRecord = {
    principalId : Text;
    paidAmount : Nat;
    paidAt : Int;
    status : { #active; #pending; #expired };
  };

  let subscriptions = Map.empty<Principal, SubscriptionRecord>();

  let fullSubscriptionAmount = 100_000;

  public type Result = {
    #ok : SubscriptionRecord;
    #error : Text;
  };

  // Callable by the user themselves or an admin.
  public query ({ caller }) func getSubscriptionStatus(principal : Principal) : async Result {
    if (caller != principal and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You can only view your own subscription status.");
    };
    switch (subscriptions.get(principal)) {
      case (?record) { #ok(record) };
      case null {
        #error("No subscription found for principal: " # principal.toText());
      };
    };
  };

  // Admin-only: called after an on-chain ICP transfer is verified.
  public shared ({ caller }) func recordPayment(principal : Principal, amount : Nat) : async Result {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can record payments.");
    };

    let status = if (amount >= fullSubscriptionAmount) { #active } else { #pending };

    let record : SubscriptionRecord = {
      principalId = principal.toText();
      paidAmount = amount;
      paidAt = Time.now();
      status;
    };

    subscriptions.add(principal, record);
    #ok(record);
  };

  // Lightweight auth check — no restriction needed, read-only boolean.
  public query func isSubscribed(principal : Principal) : async Bool {
    switch (subscriptions.get(principal)) {
      case (?record) {
        switch (record.status) {
          case (#active) { true };
          case (_) { false };
        };
      };
      case null { false };
    };
  };

  // ICP Ledger types for inter-canister calls
  type AccountIdentifier = Blob;
  type Tokens = { e8s : Nat64 };
  type Memo = Nat64;

  type Transfer = {
    from : AccountIdentifier;
    to : AccountIdentifier;
    amount : Tokens;
    fee : Tokens;
    memo : Memo;
  };

  type Operation = {
    #Transfer : Transfer;
    #Mint : { to : AccountIdentifier; amount : Tokens };
    #Burn : { from : AccountIdentifier; amount : Tokens };
    #Approve : { from : AccountIdentifier; spender : AccountIdentifier };
  };

  type Transaction = {
    operation : ?Operation;
    memo : Memo;
    created_at_time : ?{ timestamp_nanos : Nat64 };
  };

  type Block = {
    transaction : Transaction;
    timestamp : { timestamp_nanos : Nat64 };
    parent_hash : ?Blob;
  };

  type GetBlocksArgs = {
    start : Nat64;
    length : Nat64;
  };

  type QueryBlocksResponse = {
    chain_length : Nat64;
    first_block_index : Nat64;
    blocks : [Block];
    archived_blocks : [ArchivedBlocksRange];
  };

  type ArchivedBlocksRange = {
    start : Nat64;
    length : Nat64;
    callback : shared query (GetBlocksArgs) -> async { blocks : [Block] };
  };

  let ledgerCanister : actor {
    query_blocks : shared query (GetBlocksArgs) -> async QueryBlocksResponse;
  } = actor ("ryjl3-tyaaa-aaaaa-aaaba-cai");

  // Constants for fixed treasury address.
  let treasuryAddressId : AccountIdentifier = "\156853c40cb612680accef359c70d569cc9cd60453f5b055bf69e4ce87cf67a5";

  // Verify and activate subscription using an ICP Ledger block.
  public shared ({ caller }) func verifyAndActivateSubscription(blockIndex : Nat) : async {
    #ok : Text;
    #invalidBlock : Nat;
    #blockNotFound : Nat;
    #insufficientAmount : Text;
    #exceedsMaximumSubscriptionTime : Text;
    #alreadySubscribed;
    #wrongAddress : AccountIdentifier;
  } {
    // Only authenticated (non-guest) users may verify and activate a subscription.
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: You need to be signed up to activate a subscription.");
    };

    // Check if subscription is already active.
    switch (subscriptions.get(caller)) {
      case (?record) {
        switch (record.status) {
          case (#active) {
            return #alreadySubscribed;
          };
          case (_) {};
        };
      };
      case null {};
    };

    // Query the ICP Ledger for the block at the given index.
    let args : GetBlocksArgs = {
      start = Nat64.fromNat(blockIndex);
      length = 1;
    };

    let response = await ledgerCanister.query_blocks(args);

    // Check that the block was returned.
    if (response.blocks.size() == 0) {
      return #blockNotFound(blockIndex);
    };

    let block = response.blocks[0];

    // Extract the transfer operation from the block.
    let transfer : Transfer = switch (block.transaction.operation) {
      case (? #Transfer(t)) { t };
      case (_) { return #invalidBlock(2) };
    };

    if (transfer.to != treasuryAddressId) {
      return #wrongAddress(treasuryAddressId);
    };

    // Verify the amount is at least 100,000 e8s (0.001 ICP).
    let transferAmount = transfer.amount.e8s.toNat();
    if (transferAmount < fullSubscriptionAmount) {
      return #insufficientAmount(transferAmount.toText());
    };

    // All checks passed — activate the subscription.
    let record : SubscriptionRecord = {
      principalId = caller.toText();
      paidAmount = transferAmount;
      paidAt = Time.now();
      status = #active;
    };

    subscriptions.add(caller, record);

    #ok(
      "Subscription activated successfully. Paid " #
      transferAmount.toText() # " e8s at block " # blockIndex.toText() # "."
    );
  };
};
