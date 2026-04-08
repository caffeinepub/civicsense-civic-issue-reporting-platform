import Time "mo:core/Time";
import Set "mo:core/Set";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";

import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Storage "mo:caffeineai-object-storage/Storage";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import AccessControl "mo:caffeineai-authorization/access-control";

actor {
  // --- Types ---
  type GeoCoordinates = {
    latitude : Float;
    longitude : Float;
  };

  type Address = {
    street : Text;
    city : Text;
    zipCode : Text;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    phone : ?Text;
    isMunicipalStaff : Bool;
  };

  type LoginResult = {
    #success : LoginSuccess;
    #error : LoginError;
  };

  type LoginSuccess = {
    isAuthenticated : Bool;
    isMunicipalOperator : Bool;
    redirectView : Text;
  };

  type LoginError = {
    message : Text;
    code : LoginErrorCode;
  };

  type LoginErrorCode = {
    #unauthorized;
    #invalidCredentials;
    #internalError;
  };

  module Submission {
    public type Priority = {
      #low;
      #medium;
      #high;
    };

    public type Category = {
      #potholes;
      #streetlights;
      #waste;
      #other;
    };

    public type Status = {
      #open;
      #inProgress;
      #resolved;
      #reopened;
      #closed;
    };

    public type Submission = {
      id : Text;
      title : Text;
      description : Text;
      category : Category;
      priority : Priority;
      location : ?GeoCoordinates;
      address : ?Address;
      status : Status;
      createdBy : Principal;
      assignedStaff : ?Principal;
      createdAt : Time.Time;
      updatedAt : Time.Time;
      attachments : [Storage.ExternalBlob];
    };

    public func compare(submission1 : Submission, submission2 : Submission) : Order.Order {
      switch (Text.compare(submission1.title, submission2.title)) {
        case (#equal) { Text.compare(submission1.id, submission2.id) };
        case (order) { order };
      };
    };

    func compareStatus(status1 : Status, status2 : Status) : Order.Order {
      switch (status1, status2) {
        case (#open, #open) { #equal };
        case (#inProgress, #inProgress) { #equal };
        case (#resolved, #resolved) { #equal };
        case (#reopened, #reopened) { #equal };
        case (#closed, #closed) { #equal };
        case (#open, _) { #less };
        case (#inProgress, #open) { #greater };
        case (#inProgress, _) { #less };
        case (#resolved, #closed) { #greater };
        case (#resolved, _) { #less };
        case (#reopened, #closed) { #greater };
        case (#reopened, _) { #less };
        case (#closed, _) { #greater };
      };
    };
  };

  type Comment = {
    id : Text;
    submissionId : Text;
    userId : Principal;
    content : Text;
    timestamp : Time.Time;
  };

  type Vote = {
    submissionId : Text;
    userId : Principal;
    voteType : { #upvote; #downvote };
  };

  type StatusUpdate = {
    submissionId : Text;
    previousStatus : Submission.Status;
    newStatus : Submission.Status;
    updatedBy : Principal;
    timestamp : Time.Time;
    notes : Text;
  };

  // --- State ---
  include MixinObjectStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let submissions = Map.empty<Text, Submission.Submission>();
  let submissionVersions = Map.empty<Text, Set.Set<Text>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let comments = Map.empty<Text, Comment>();
  let votes = Map.empty<Text, Vote>();
  let statusUpdates = Map.empty<Text, [StatusUpdate]>();
  let upvoteCounts = Map.empty<Text, Nat>();

  // Passwords (hardcoded for demo)
  // Public users: "public@2024", Municipal staff: "civic@2024"
  let PUBLIC_USER_PASSWORD : Text = "public@2024";
  let MUNICIPAL_PASSWORD : Text = "civic@2024";

  // --- Helper Functions ---
  func isMunicipalStaff(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) { profile.isMunicipalStaff };
    };
  };

  func canManageSubmission(caller : Principal, submission : Submission.Submission) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    if (isMunicipalStaff(caller)) {
      return true;
    };
    submission.createdBy == caller;
  };

  // Auto-grant #user role so the caller can use all user-gated functions.
  // Safe to call multiple times — AccessControl.assignRole is idempotent.
  func ensureUserRegistered(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      AccessControl.assignRole(accessControlState, caller, caller, #user);
    };
  };

  // --- Login ---
  // Public users: password "public@2024"  →  granted #user role
  // Municipal staff: password "civic@2024" →  granted #user + #admin roles + isMunicipalStaff profile flag
  public shared ({ caller }) func login(isOperator : Bool, password : Text) : async LoginResult {
    if (isOperator) {
      // Municipal staff login — validate password
      if (password != MUNICIPAL_PASSWORD) {
        return #error({
          message = "Invalid password for municipal portal. Use civic@2024";
          code = #invalidCredentials;
        });
      };

      // Grant #user then #admin so AccessControl checks pass
      if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
        AccessControl.assignRole(accessControlState, caller, caller, #user);
      };
      if (not AccessControl.isAdmin(accessControlState, caller)) {
        AccessControl.assignRole(accessControlState, caller, caller, #admin);
      };

      // Upsert profile with municipal staff flag
      switch (userProfiles.get(caller)) {
        case (null) {
          userProfiles.add(
            caller,
            {
              name = "Municipal Operator";
              email = "";
              phone = null;
              isMunicipalStaff = true;
            },
          );
        };
        case (?profile) {
          userProfiles.add(caller, { profile with isMunicipalStaff = true });
        };
      };

      #success({
        isAuthenticated = true;
        isMunicipalOperator = true;
        redirectView = "municipal-dashboard";
      });
    } else {
      // Public user login — validate password
      if (password != PUBLIC_USER_PASSWORD) {
        return #error({
          message = "Invalid password for public portal. Use public@2024";
          code = #invalidCredentials;
        });
      };

      // Grant #user role so all user-gated functions work
      ensureUserRegistered(caller);

      #success({
        isAuthenticated = true;
        isMunicipalOperator = false;
        redirectView = "citizen-interface";
      });
    };
  };

  // loginWithName — extended login that also stores the user's display name
  public shared ({ caller }) func loginWithName(name : Text, isOperator : Bool, password : Text) : async LoginResult {
    let result = await login(isOperator, password);
    switch (result) {
      case (#success(_)) {
        switch (userProfiles.get(caller)) {
          case (null) {
            userProfiles.add(
              caller,
              {
                name = name;
                email = "";
                phone = null;
                isMunicipalStaff = isOperator;
              },
            );
          };
          case (?profile) {
            userProfiles.add(caller, { profile with name = name });
          };
        };
      };
      case (#error(_)) {};
    };
    result;
  };

  // --- User Profile Functions ---
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    let finalProfile = switch (userProfiles.get(caller)) {
      case (null) {
        { profile with isMunicipalStaff = false };
      };
      case (?existing) {
        if (AccessControl.isAdmin(accessControlState, caller)) {
          profile;
        } else {
          { profile with isMunicipalStaff = existing.isMunicipalStaff };
        };
      };
    };
    userProfiles.add(caller, finalProfile);
  };

  public shared ({ caller }) func setMunicipalStaffStatus(user : Principal, isStaff : Bool) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set municipal staff status");
    };

    switch (userProfiles.get(user)) {
      case (null) {
        Runtime.trap("User profile not found");
      };
      case (?profile) {
        userProfiles.add(user, { profile with isMunicipalStaff = isStaff });
      };
    };
  };

  // --- Core Submission Functions ---
  // Any caller can create a submission — ensureUserRegistered auto-grants #user role.
  // This means even the anonymous principal can submit after calling login().
  public shared ({ caller }) func createSubmission(payload : Submission.Submission) : async Text {
    // Auto-grant #user so this works even if login() was not called first
    ensureUserRegistered(caller);

    switch (payload.location) {
      case (null) {};
      case (?location) {
        if (location.latitude < -90.0 or location.latitude > 90.0) {
          Runtime.trap("Invalid latitude: must be between -90.0 and 90.0");
        };
        if (location.longitude < -180.0 or location.longitude > 180.0) {
          Runtime.trap("Invalid longitude: must be between -180.0 and 180.0");
        };
      };
    };

    let submission = {
      payload with
      createdBy = caller;
      createdAt = Time.now();
      updatedAt = Time.now();
      status = #open;
      attachments = payload.attachments;
    };

    submissions.add(payload.id, submission);
    payload.id;
  };

  public shared ({ caller }) func updateSubmission(id : Text, newPayload : Submission.Submission) : async () {
    switch (submissions.get(id)) {
      case (null) {
        Runtime.trap("Submission not found");
      };
      case (?existingSubmission) {
        if (not canManageSubmission(caller, existingSubmission)) {
          Runtime.trap("Unauthorized: You are not the owner of this submission");
        };

        switch (newPayload.location) {
          case (null) {};
          case (?location) {
            if (location.latitude < -90.0 or location.latitude > 90.0) {
              Runtime.trap("Invalid latitude: must be between -90.0 and 90.0");
            };
            if (location.longitude < -180.0 or location.longitude > 180.0) {
              Runtime.trap("Invalid longitude: must be between -180.0 and 180.0");
            };
          };
        };

        let updatedSubmission = {
          newPayload with
          createdBy = existingSubmission.createdBy;
          createdAt = existingSubmission.createdAt;
          updatedAt = Time.now();
          status = existingSubmission.status;
          assignedStaff = existingSubmission.assignedStaff;
        };

        submissions.add(id, updatedSubmission);

        let currentVersionSet = switch (submissionVersions.get(id)) {
          case (null) { Set.empty<Text>() };
          case (?versions) { versions };
        };
        currentVersionSet.add(id);
        submissionVersions.add(id, currentVersionSet);
      };
    };
  };

  public shared ({ caller }) func updateSubmissionStatus(
    id : Text,
    newStatus : Submission.Status,
    notes : Text,
  ) : async () {
    if (not isMunicipalStaff(caller)) {
      Runtime.trap("Unauthorized: Only municipal staff can update submission status");
    };

    switch (submissions.get(id)) {
      case (null) {
        Runtime.trap("Submission not found");
      };
      case (?existingSubmission) {
        let previousStatus = existingSubmission.status;
        let updatedSubmission = {
          existingSubmission with
          status = newStatus;
          updatedAt = Time.now();
        };

        submissions.add(id, updatedSubmission);

        let statusUpdate : StatusUpdate = {
          submissionId = id;
          previousStatus = previousStatus;
          newStatus = newStatus;
          updatedBy = caller;
          timestamp = Time.now();
          notes = notes;
        };

        let history = switch (statusUpdates.get(id)) {
          case (null) { [] };
          case (?updates) { updates };
        };
        statusUpdates.add(id, history.concat([statusUpdate]));
      };
    };
  };

  public shared ({ caller }) func assignSubmissionToStaff(
    id : Text,
    staffPrincipal : ?Principal,
  ) : async () {
    if (not isMunicipalStaff(caller)) {
      Runtime.trap("Unauthorized: Only municipal staff can assign submissions");
    };

    switch (submissions.get(id)) {
      case (null) {
        Runtime.trap("Submission not found");
      };
      case (?existingSubmission) {
        let updatedSubmission = {
          existingSubmission with
          assignedStaff = staffPrincipal;
          updatedAt = Time.now();
        };

        submissions.add(id, updatedSubmission);
      };
    };
  };

  public shared ({ caller }) func deleteSubmission(id : Text) : async () {
    if (not isMunicipalStaff(caller)) {
      Runtime.trap("Unauthorized: Only municipal staff can delete submissions");
    };

    switch (submissions.get(id)) {
      case (null) {
        Runtime.trap("Submission not found");
      };
      case (?submission) {
        submissions.remove(id);
        submissionVersions.remove(id);
        statusUpdates.remove(id);
      };
    };
  };

  // uploadAttachment — caller must be the submission creator or municipal staff.
  // ensureUserRegistered auto-grants #user so anonymous demo users can upload right after createSubmission.
  public shared ({ caller }) func uploadAttachment(submissionId : Text, blobs : [Storage.ExternalBlob]) : async () {
    ensureUserRegistered(caller);

    switch (submissions.get(submissionId)) {
      case (null) {
        Runtime.trap("Submission not found");
      };
      case (?submission) {
        if (
          submission.createdBy != caller and
          not isMunicipalStaff(caller)
        ) {
          Runtime.trap("Unauthorized: Only the creator or municipal staff can upload attachments");
        };

        let updatedSubmission = { submission with attachments = submission.attachments.concat(blobs) };
        submissions.add(submissionId, updatedSubmission);
      };
    };
  };

  // --- Comment Functions ---
  public shared ({ caller }) func addComment(submissionId : Text, content : Text, commentId : Text) : async () {
    ensureUserRegistered(caller);

    switch (submissions.get(submissionId)) {
      case (null) {
        Runtime.trap("Submission not found");
      };
      case (?_) {
        let comment : Comment = {
          id = commentId;
          submissionId;
          userId = caller;
          content;
          timestamp = Time.now();
        };

        comments.add(commentId, comment);
      };
    };
  };

  public shared ({ caller }) func deleteComment(commentId : Text) : async () {
    switch (comments.get(commentId)) {
      case (null) {
        Runtime.trap("Comment not found");
      };
      case (?comment) {
        if (comment.userId != caller and not isMunicipalStaff(caller)) {
          Runtime.trap("Unauthorized: Only the comment author or municipal staff can delete comments");
        };

        comments.remove(commentId);
      };
    };
  };

  // --- Vote Functions ---
  public shared ({ caller }) func addVote(submissionId : Text, voteType : { #upvote; #downvote }) : async () {
    ensureUserRegistered(caller);

    switch (submissions.get(submissionId)) {
      case (null) {
        Runtime.trap("Submission not found");
      };
      case (?_) {
        let voteKey = submissionId # caller.toText();
        let vote = {
          submissionId;
          userId = caller;
          voteType;
        };
        votes.add(voteKey, vote);

        switch (upvoteCounts.get(submissionId)) {
          case (null) {
            upvoteCounts.add(submissionId, if (voteType == #upvote) { 1 } else { 0 });
          };
          case (?currentCount) {
            let newCount = if (voteType == #upvote) {
              currentCount + 1;
            } else if (currentCount > 0) {
              currentCount - 1;
            } else {
              0;
            };
            upvoteCounts.add(submissionId, newCount);
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeVote(submissionId : Text) : async () {
    let voteKey = submissionId # caller.toText();
    switch (votes.get(voteKey)) {
      case (null) {};
      case (?vote) {
        votes.remove(voteKey);
        if (vote.voteType == #upvote) {
          switch (upvoteCounts.get(submissionId)) {
            case (null) {};
            case (?currentCount) {
              upvoteCounts.add(submissionId, if (currentCount > 0) { currentCount - 1 } else { 0 });
            };
          };
        };
      };
    };
  };

  // --- Query Functions ---
  public query ({ caller }) func getSubmission(id : Text) : async Submission.Submission {
    switch (submissions.get(id)) {
      case (null) { Runtime.trap("Submission not found") };
      case (?submission) { submission };
    };
  };

  public query ({ caller }) func getAllSubmissions() : async [Submission.Submission] {
    submissions.values().toArray().sort();
  };

  public query ({ caller }) func getSubmissionsByStatus(status : Submission.Status) : async [Submission.Submission] {
    submissions.values().toArray().filter(func(s) { s.status == status });
  };

  public query ({ caller }) func getSubmissionVersions(id : Text) : async [Text] {
    if (not isMunicipalStaff(caller)) {
      Runtime.trap("Unauthorized: Only municipal staff can view version history");
    };

    switch (submissionVersions.get(id)) {
      case (null) { Runtime.trap("No versions found for this submission") };
      case (?versions) { versions.values().toArray() };
    };
  };

  public query ({ caller }) func getSubmissionByCategory(category : Submission.Category) : async [Submission.Submission] {
    submissions.values().toArray().filter<Submission.Submission>(func(s) { s.category == category });
  };

  // Any caller can view their own submissions (no auth check — returns empty for anonymous)
  public query ({ caller }) func getMySubmissions() : async [Submission.Submission] {
    submissions.values().toArray().filter<Submission.Submission>(func(s) { s.createdBy == caller });
  };

  public query ({ caller }) func getAssignedSubmissions() : async [Submission.Submission] {
    if (not isMunicipalStaff(caller)) {
      Runtime.trap("Unauthorized: Only municipal staff can view assigned submissions");
    };

    submissions.values().toArray().filter<Submission.Submission>(
      func(s) {
        switch (s.assignedStaff) {
          case (null) { false };
          case (?staff) { staff == caller };
        };
      }
    );
  };

  public query ({ caller }) func getStatusHistory(submissionId : Text) : async [StatusUpdate] {
    switch (statusUpdates.get(submissionId)) {
      case (null) { [] };
      case (?updates) { updates };
    };
  };

  public query ({ caller }) func getComments(submissionId : Text) : async [Comment] {
    comments.values().toArray().filter<Comment>(func(c) { c.submissionId == submissionId });
  };

  public query ({ caller }) func getVoteCount(submissionId : Text) : async { upvotes : Nat; downvotes : Nat } {
    var upvotes = 0;
    var downvotes = 0;

    for (vote in votes.values()) {
      if (vote.submissionId == submissionId) {
        switch (vote.voteType) {
          case (#upvote) { upvotes += 1 };
          case (#downvote) { downvotes += 1 };
        };
      };
    };

    { upvotes; downvotes };
  };

  // Analytics — public query, no auth required.
  // Demo baseline ensures pie chart always renders with non-zero values.
  public query ({ caller }) func getAnalytics() : async {
    totalSubmissions : Nat;
    openSubmissions : Nat;
    inProgressSubmissions : Nat;
    resolvedSubmissions : Nat;
    closedSubmissions : Nat;
  } {
    let demoOpen : Nat = 12;
    let demoInProgress : Nat = 8;
    let demoResolved : Nat = 18;
    let demoClosed : Nat = 5;

    var openCount = demoOpen;
    var inProgressCount = demoInProgress;
    var resolvedCount = demoResolved;
    var closedCount = demoClosed;

    for (submission in submissions.values()) {
      switch (submission.status) {
        case (#open) { openCount += 1 };
        case (#inProgress) { inProgressCount += 1 };
        case (#resolved) { resolvedCount += 1 };
        case (#reopened) { openCount += 1 };
        case (#closed) { closedCount += 1 };
      };
    };

    {
      totalSubmissions = openCount + inProgressCount + resolvedCount + closedCount;
      openSubmissions = openCount;
      inProgressSubmissions = inProgressCount;
      resolvedSubmissions = resolvedCount;
      closedSubmissions = closedCount;
    };
  };

  public query ({ caller }) func getSubmissionsSortedByUpvotes() : async [Submission.Submission] {
    let sortedIds = upvoteCounts.toArray().sort(
      func(a, b) {
        let (_, upvotesA) = a;
        let (_, upvotesB) = b;
        Nat.compare(upvotesB, upvotesA);
      }
    );

    sortedIds.map(
      func((id, _)) {
        switch (submissions.get(id)) {
          case (null) { Runtime.trap("Submission not found") };
          case (?submission) { submission };
        };
      }
    );
  };
};
