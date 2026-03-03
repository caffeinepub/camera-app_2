import MixinStorage "blob-storage/Mixin";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";

import AccessControl "authorization/access-control";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type PhotoId = Text;
  type VideoId = Text;

  type Photo = {
    id : PhotoId;
    timestamp : Int;
    blob : Storage.ExternalBlob;
  };

  type Video = {
    id : VideoId;
    timestamp : Int;
    durationSeconds : Nat;
    dataUrl : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  let storePhotos = Map.empty<PhotoId, Photo>();
  let storeVideos = Map.empty<VideoId, Video>();

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Save photo metadata and uploaded blob reference
  public shared ({ caller }) func savePhoto(id : PhotoId, timestamp : Int, blob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save photos");
    };
    let photo : Photo = {
      id;
      timestamp;
      blob;
    };
    storePhotos.add(id, photo);
  };

  // Save video metadata and data URL reference
  public shared ({ caller }) func saveVideo(id : VideoId, timestamp : Int, durationSeconds : Nat, dataUrl : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save videos");
    };
    let video : Video = {
      id;
      timestamp;
      durationSeconds;
      dataUrl;
    };
    storeVideos.add(id, video);
  };

  // Get all saved photos metadata
  public query ({ caller }) func getAllPhotos() : async [Photo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can retrieve photos");
    };
    storePhotos.values().toArray();
  };

  // Get all saved video clips metadata
  public query ({ caller }) func getAllVideos() : async [Video] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can retrieve videos");
    };
    storeVideos.values().toArray();
  };

  // Delete photo record by id
  public shared ({ caller }) func deletePhoto(id : PhotoId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete photos");
    };
    if (not storePhotos.containsKey(id)) {
      Runtime.trap("Photo with id " # id # " does not exist.");
    };
    storePhotos.remove(id);
  };

  // Delete video record by id
  public shared ({ caller }) func deleteVideo(id : VideoId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete videos");
    };
    if (not storeVideos.containsKey(id)) {
      Runtime.trap("Video with id " # id # " does not exist.");
    };
    storeVideos.remove(id);
  };
};
