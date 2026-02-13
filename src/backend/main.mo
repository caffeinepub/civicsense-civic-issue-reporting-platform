import Time "mo:core/Time";
import Set "mo:core/Set";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

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
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let submissions = Map.empty<Text, Submission.Submission>();
  let submissionVersions = Map.empty<Text, Set.Set<Text>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let comments = Map.empty<Text, Comment>();
  let votes = Map.empty<Text, Vote>();
  let statusUpdates = Map.empty<Text, [StatusUpdate]>();

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

  // --- Enhanced Login Functionality ---
  // Login is accessible to all users including guests (anonymous principals)
  public shared ({ caller }) func login(isOperator : Bool) : async LoginResult {
    if (isOperator) {
      // Municipal operators must be authenticated users
      if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
        return #error({
          message = "Municipal operators must authenticate with Internet Identity";
          code = #unauthorized;
        });
      };

      let existingProfile = userProfiles.get(caller);
      switch (existingProfile) {
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
      let isAuthenticated = AccessControl.hasPermission(accessControlState, caller, #user);
      #success({
        isAuthenticated;
        isMunicipalOperator = false;
        redirectView = "citizen-interface";
      });
    };
  };

  // --- User Profile Functions ---
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let existingProfile = userProfiles.get(caller);
    let finalProfile = switch (existingProfile) {
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
    if (not AccessControl.isAdmin(accessControlState, caller)) {
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
  public shared ({ caller }) func createSubmission(payload : Submission.Submission) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create submissions");
    };

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
      attachments = [];
    };

    submissions.add(payload.id, submission);
    payload.id;
  };

  public shared ({ caller }) func updateSubmission(id : Text, newPayload : Submission.Submission) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update submissions");
    };

    switch (submissions.get(id)) {
      case (null) {
        Runtime.trap("Submission not found");
      };
      case (?existingSubmission) {
        if (existingSubmission.createdBy != caller) {
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
    if (not isMunicipalStaff(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
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
    if (not isMunicipalStaff(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only municipal staff can assign submissions");
    };

    switch (submissions.get(id)) {
      case (null) {
        Runtime.trap("Submission not found");
      };
      case (?existingSubmission) {
        switch (staffPrincipal) {
          case (null) {};
          case (?staff) {
            if (not isMunicipalStaff(staff) and not AccessControl.isAdmin(accessControlState, staff)) {
              Runtime.trap("Cannot assign to non-staff member");
            };
          };
        };

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
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete submissions");
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

  public shared ({ caller }) func uploadAttachment(submissionId : Text, blobs : [Storage.ExternalBlob]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can upload attachments");
    };

    switch (submissions.get(submissionId)) {
      case (null) {
        Runtime.trap("Submission not found");
      };
      case (?submission) {
        if (
          submission.createdBy != caller and
          not isMunicipalStaff(caller) and
          not AccessControl.isAdmin(accessControlState, caller)
        ) {
          Runtime.trap("Unauthorized: Only the creator or municipal staff can upload attachments");
        };

        let updatedAttachments = submission.attachments.concat(blobs);
        let updatedSubmission = { submission with attachments = updatedAttachments };
        submissions.add(submissionId, updatedSubmission);
      };
    };
  };

  // --- Comment Functions ---
  public shared ({ caller }) func addComment(submissionId : Text, content : Text, commentId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add comments");
    };

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
        if (comment.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the comment author or admin can delete comments");
        };

        comments.remove(commentId);
      };
    };
  };

  // --- Vote Functions ---
  public shared ({ caller }) func addVote(submissionId : Text, voteType : { #upvote; #downvote }) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can vote");
    };

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
      };
    };
  };

  public shared ({ caller }) func removeVote(submissionId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can remove votes");
    };

    let voteKey = submissionId # caller.toText();
    votes.remove(voteKey);
  };

  // --- Query Functions ---
  // Public query - all users including guests can view individual submissions
  public query ({ caller }) func getSubmission(id : Text) : async Submission.Submission {
    switch (submissions.get(id)) {
      case (null) {
        Runtime.trap("Submission not found");
      };
      case (?submission) { submission };
    };
  };

  // Public query - all users including guests can view all submissions (for map view)
  public query ({ caller }) func getAllSubmissions() : async [Submission.Submission] {
    submissions.values().toArray().sort();
  };

  // Public query - all users including guests can filter by status
  public query ({ caller }) func getSubmissionsByStatus(status : Submission.Status) : async [Submission.Submission] {
    let filtered = submissions.values().toArray().filter(
      func(submission) { submission.status == status }
    );
    filtered;
  };

  // Municipal staff only - version history is internal
  public query ({ caller }) func getSubmissionVersions(id : Text) : async [Text] {
    if (not isMunicipalStaff(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only municipal staff can view version history");
    };

    switch (submissionVersions.get(id)) {
      case (null) {
        Runtime.trap("No versions found for this submission");
      };
      case (?versions) {
        versions.values().toArray();
      };
    };
  };

  // Public query - all users including guests can filter by category
  public query ({ caller }) func getSubmissionByCategory(category : Submission.Category) : async [Submission.Submission] {
    submissions.values().toArray().filter(
      func(submission) { submission.category == category }
    );
  };

  // Authenticated users only - view their own submissions
  public query ({ caller }) func getMySubmissions() : async [Submission.Submission] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their submissions");
    };

    submissions.values().toArray().filter(
      func(submission) { submission.createdBy == caller }
    );
  };

  // Municipal staff only - view assigned submissions
  public query ({ caller }) func getAssignedSubmissions() : async [Submission.Submission] {
    if (not isMunicipalStaff(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only municipal staff can view assigned submissions");
    };

    submissions.values().toArray().filter(
      func(submission) {
        switch (submission.assignedStaff) {
          case (null) { false };
          case (?staff) { staff == caller };
        };
      }
    );
  };

  // Public query - all users including guests can view status history for transparency
  public query ({ caller }) func getStatusHistory(submissionId : Text) : async [StatusUpdate] {
    switch (statusUpdates.get(submissionId)) {
      case (null) { [] };
      case (?updates) { updates };
    };
  };

  // Public query - all users including guests can view comments
  public query ({ caller }) func getComments(submissionId : Text) : async [Comment] {
    comments.values().toArray().filter(
      func(comment) { comment.submissionId == submissionId }
    );
  };

  // Public query - all users including guests can view vote counts
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

  // Municipal staff only - analytics for dashboard
  public query ({ caller }) func getAnalytics() : async {
    totalSubmissions : Nat;
    openSubmissions : Nat;
    inProgressSubmissions : Nat;
    resolvedSubmissions : Nat;
    closedSubmissions : Nat;
  } {
    if (not isMunicipalStaff(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only municipal staff can view analytics");
    };

    var openCount = 0;
    var inProgressCount = 0;
    var resolvedCount = 0;
    var closedCount = 0;

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
      totalSubmissions = submissions.size();
      openSubmissions = openCount;
      inProgressSubmissions = inProgressCount;
      resolvedSubmissions = resolvedCount;
      closedSubmissions = closedCount;
    };
  };
};
