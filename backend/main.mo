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
  // Types
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
      #garbage;
      #traffic;
      #streetlight;
      #potholes;
      #noise;
    };

    public type Status = {
      #pending;
      #inProgress;
      #resolved;
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

  // State
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let submissions = Map.empty<Text, Submission.Submission>();
  let submissionVersions = Map.empty<Text, Set.Set<Text>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let comments = Map.empty<Text, Comment>();
  let votes = Map.empty<Text, Vote>();
  let statusUpdates = Map.empty<Text, [StatusUpdate]>();

  // Helper Functions
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

  // Login Functionality
  // Returns the caller's current authentication status and role.
  // Does NOT allow self-elevation of privileges; municipal staff status
  // can only be granted by an admin via setMunicipalStaffStatus.
  public shared ({ caller }) func login() : async LoginResult {
    if (caller.isAnonymous()) {
      return #error({
        message = "You must complete Internet Identity authentication before logging in. Please click the authenticate button and try again.";
        code = #unauthorized;
      });
    };

    let isOperator = isMunicipalStaff(caller);

    if (isOperator) {
      #success({
        isAuthenticated = true;
        isMunicipalOperator = true;
        redirectView = "municipal-dashboard";
      });
    } else {
      #success({
        isAuthenticated = true;
        isMunicipalOperator = false;
        redirectView = "citizen-interface";
      });
    };
  };

  // User Profile Functions
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
        // New profile: never allow self-granting of municipal staff status
        { profile with isMunicipalStaff = false };
      };
      case (?existing) {
        if (AccessControl.isAdmin(accessControlState, caller)) {
          // Admins can set any field
          profile;
        } else {
          // Non-admins cannot change their own isMunicipalStaff flag
          { profile with isMunicipalStaff = existing.isMunicipalStaff };
        };
      };
    };

    userProfiles.add(caller, finalProfile);
  };

  // Only admins can grant or revoke municipal staff status
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

  // Core Submission Functions
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
      status = #pending;
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
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update submission status");
    };

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
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can assign submissions");
    };

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
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete submissions");
    };

    switch (submissions.get(id)) {
      case (null) {
        Runtime.trap("Submission not found");
      };
      case (?_submission) {
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

  // Comment Functions
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
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete comments");
    };

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

  // Vote Functions
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

  // Query Functions
  public query ({ caller }) func getSubmission(id : Text) : async Submission.Submission {
    switch (submissions.get(id)) {
      case (null) {
        Runtime.trap("Submission not found");
      };
      case (?submission) { submission };
    };
  };

  public query ({ caller }) func getAllSubmissions() : async [Submission.Submission] {
    submissions.values().toArray().sort();
  };

  public query ({ caller }) func getSubmissionsByUser(userId : Principal) : async [Submission.Submission] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can get submissions by user");
    };

    if (caller != userId and not isMunicipalStaff(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You can only view your own submissions");
    };

    submissions.values().toArray().filter<Submission.Submission>(
      func(submission) { submission.createdBy == userId }
    );
  };

  public query ({ caller }) func getSubmissionsByStatus(status : Submission.Status) : async [Submission.Submission] {
    let filtered = submissions.values().toArray().filter(
      func(submission) { submission.status == status }
    );
    filtered;
  };

  public query ({ caller }) func getSubmissionVersions(id : Text) : async [Text] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view version history");
    };

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

  public query ({ caller }) func getSubmissionByCategory(category : Submission.Category) : async [Submission.Submission] {
    submissions.values().toArray().filter<Submission.Submission>(
      func(submission) { submission.category == category }
    );
  };

  public query ({ caller }) func getMySubmissions() : async [Submission.Submission] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their submissions");
    };

    submissions.values().toArray().filter<Submission.Submission>(
      func(submission) { submission.createdBy == caller }
    );
  };

  public query ({ caller }) func getAssignedSubmissions() : async [Submission.Submission] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view assigned submissions");
    };

    if (not isMunicipalStaff(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only municipal staff can view assigned submissions");
    };

    submissions.values().toArray().filter<Submission.Submission>(
      func(submission) {
        switch (submission.assignedStaff) {
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
    comments.values().toArray().filter<Comment>(
      func(comment) { comment.submissionId == submissionId }
    );
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

  public query ({ caller }) func getAnalytics() : async {
    totalSubmissions : Nat;
    pendingSubmissions : Nat;
    inProgressSubmissions : Nat;
    resolvedSubmissions : Nat;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view analytics");
    };

    if (not isMunicipalStaff(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only municipal staff can view analytics");
    };

    var pendingCount = 0;
    var inProgressCount = 0;
    var resolvedCount = 0;

    for (submission in submissions.values()) {
      switch (submission.status) {
        case (#pending) { pendingCount += 1 };
        case (#inProgress) { inProgressCount += 1 };
        case (#resolved) { resolvedCount += 1 };
      };
    };

    {
      totalSubmissions = submissions.size();
      pendingSubmissions = pendingCount;
      inProgressSubmissions = inProgressCount;
      resolvedSubmissions = resolvedCount;
    };
  };

  // Seed Demo Data Function
  public shared ({ caller }) func seedDemoData() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can seed demo data");
    };

    let demoIssues = [
      {
        title = "Overflowing Garbage Bin";
        description = "Garbage bin near Main Street is overflowing and needs immediate attention.";
        category = #garbage;
        priority = #high;
        location = ?{
          latitude = 40.7128;
          longitude = -74.0060;
        };
        address = ?{
          street = "123 Main St";
          city = "New York";
          zipCode = "10001";
        };
        status = #pending;
      },
      {
        title = "Broken Streetlight";
        description = "The streetlight at the corner of Elm and 5th is broken.";
        category = #streetlight;
        priority = #medium;
        location = ?{
          latitude = 40.7138;
          longitude = -74.0070;
        };
        address = ?{
          street = "Elm St & 5th Ave";
          city = "New York";
          zipCode = "10001";
        };
        status = #pending;
      },
      {
        title = "Traffic Jam";
        description = "Heavy traffic on Broadway during peak hours. Requesting better signal management.";
        category = #traffic;
        priority = #low;
        location = ?{
          latitude = 40.7148;
          longitude = -74.0080;
        };
        address = ?{
          street = "Broadway";
          city = "New York";
          zipCode = "10001";
        };
        status = #inProgress;
      },
      {
        title = "Pothole on 7th Ave";
        description = "Large pothole on 7th Ave causing traffic issues.";
        category = #potholes;
        priority = #high;
        location = ?{
          latitude = 40.7158;
          longitude = -74.0090;
        };
        address = ?{
          street = "7th Ave";
          city = "New York";
          zipCode = "10001";
        };
        status = #pending;
      },
      {
        title = "Noise Complaint";
        description = "Excessive noise from nightclub on weekends.";
        category = #noise;
        priority = #medium;
        location = ?{
          latitude = 40.7168;
          longitude = -74.0100;
        };
        address = ?{
          street = "Nightclub Alley";
          city = "New York";
          zipCode = "10001";
        };
        status = #pending;
      },
      {
        title = "Garbage Bin Almost Full";
        description = "Garbage bin near 8th Ave is almost full, needs to be emptied soon.";
        category = #garbage;
        priority = #medium;
        location = ?{
          latitude = 40.7178;
          longitude = -74.0110;
        };
        address = ?{
          street = "8th Ave";
          city = "New York";
          zipCode = "10001";
        };
        status = #pending;
      },
    ];

    for (i in demoIssues.keys()) {
      let issue = demoIssues[i];
      let submissionId = "demoIssue_" # i.toText();

      let submission = {
        id = submissionId;
        title = issue.title;
        description = issue.description;
        category = issue.category;
        priority = issue.priority;
        location = issue.location;
        address = issue.address;
        status = issue.status;
        createdBy = caller;
        assignedStaff = null;
        createdAt = Time.now();
        updatedAt = Time.now();
        attachments = [];
      };

      submissions.add(submissionId, submission);

      // Add comments for some issues
      if (i == 1 or i == 3) {
        let commentId = "comment_" # i.toText();
        let comment : Comment = {
          id = commentId;
          submissionId;
          userId = caller;
          content = "This issue needs urgent attention.";
          timestamp = Time.now();
        };
        comments.add(commentId, comment);
      };

      // Add votes for some issues
      if (i == 2 or i == 4) {
        let voteKey = submissionId # caller.toText();
        let vote = {
          submissionId;
          userId = caller;
          voteType = #upvote;
        };
        votes.add(voteKey, vote);
      };
    };
  };
};
