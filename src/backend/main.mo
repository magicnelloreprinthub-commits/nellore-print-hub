import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";



actor {
  include MixinStorage();

  type ServiceType = {
    #digitalPrinting;
    #flexBanner;
    #stickerPrinting;
    #tShirtPrinting;
  };

  type QuoteStatus = {
    #new_;
    #replied;
    #accepted;
    #rejected;
  };

  type Quote = {
    id : Nat;
    name : Text;
    mobile : Text;
    service : ServiceType;
    details : Text;
    timestamp : Int;
    status : QuoteStatus;
    attachmentUrl : ?Text;
    statusReason : ?Text;
  };

  type SiteSettings = {
    phone : Text;
    email : Text;
    address : Text;
    whatsapp : Text;
    siteName : Text;
    tagline : Text;
    logoUrl : Text;
  };

  type Photo = {
    id : Nat;
    blob : Storage.ExternalBlob;
    title : Text;
    order : Nat;
    timestamp : Int;
    fileType : Text;
  };

  type Review = {
    id : Nat;
    name : Text;
    rating : Nat;
    message : Text;
    timestamp : Int;
  };

  type Customer = {
    id : Nat;
    name : Text;
    mobile : Text;
    firstVisit : Int;
    lastVisit : Int;
    visitCount : Nat;
  };

  type PromoSettings = {
    offerTitle : Text;
    offerDescription : Text;
    discountCode : Text;
    discountPercent : Text;
    isActive : Bool;
  };

  type AdminMessage = {
    id : Nat;
    toMobile : Text;
    toName : Text;
    subject : Text;
    body : Text;
    timestamp : Int;
    isRead : Bool;
  };

  var nextQuoteId = 1;
  var nextPhotoId = 1;
  var nextReviewId = 1;
  var nextCustomerId = 1;
  var nextMessageId = 1;

  let quotes = Map.empty<Nat, Quote>();
  let photos = Map.empty<Nat, Photo>();
  let reviews = Map.empty<Nat, Review>();
  let customers = Map.empty<Nat, Customer>();
  let messages = Map.empty<Nat, AdminMessage>();
  let customerByMobile = Map.empty<Text, Nat>();

  var siteSettings : SiteSettings = {
    phone = "+91-93905-35070";
    email = "magic.nelloreprinthub@gmail.com";
    address = "Dargamitta, Nellore";
    whatsapp = "919390535070";
    siteName = "Nellore Print Hub";
    tagline = "Your Vision Printed to Perfection";
    logoUrl = "";
  };

  var promoSettings : PromoSettings = {
    offerTitle = "Special Offer For You";
    offerDescription = "Get 10% OFF on your first order! Premium business cards, banners, t-shirts, packaging & more — all under one roof. Nellore's most trusted printing studio since 2012.";
    discountCode = "WELCOME10";
    discountPercent = "10";
    isActive = true;
  };

  // ************************ Quote Management ************************
  public shared ({ caller }) func submitQuote(
    name : Text,
    mobile : Text,
    service : ServiceType,
    details : Text,
    attachmentUrl : ?Text,
  ) : async Nat {
    let id = nextQuoteId;
    nextQuoteId += 1;

    let quote : Quote = {
      id;
      name;
      mobile;
      service;
      details;
      timestamp = Time.now();
      status = #new_;
      attachmentUrl;
      statusReason = null;
    };

    quotes.add(id, quote);
    id;
  };

  module Quote {
    public func compareById(q1 : Quote, q2 : Quote) : Order.Order {
      Nat.compare(q1.id, q2.id);
    };
    public func compareByTimestampDesc(q1 : Quote, q2 : Quote) : Order.Order {
      Int.compare(q2.timestamp, q1.timestamp);
    };
  };

  public query ({ caller }) func getQuotes() : async [Quote] {
    quotes.values().toArray().sort(Quote.compareByTimestampDesc);
  };

  public query ({ caller }) func getQuoteById(id : Nat) : async Quote {
    switch (quotes.get(id)) {
      case (null) { Runtime.trap("Quote not found") };
      case (?quote) { quote };
    };
  };

  public query ({ caller }) func getQuotesByService(service : ServiceType) : async [Quote] {
    let filtered = quotes.values().toArray().filter(
      func(q) { q.service == service }
    );
    filtered.sort(Quote.compareByTimestampDesc);
  };

  public query ({ caller }) func getQuotesByMobile(mobile : Text) : async [Quote] {
    let filtered = quotes.values().toArray().filter(
      func(q) { Text.equal(q.mobile, mobile) }
    );
    filtered.sort(Quote.compareByTimestampDesc);
  };

  public shared ({ caller }) func updateQuoteStatus(id : Nat, status : QuoteStatus) : async Bool {
    switch (quotes.get(id)) {
      case (null) { Runtime.trap("Quote not found") };
      case (?quote) {
        let updatedQuote = { quote with status };
        quotes.add(id, updatedQuote);
        true;
      };
    };
  };

  public shared ({ caller }) func updateQuoteStatusWithReason(id : Nat, status : QuoteStatus, reason : Text) : async Bool {
    switch (quotes.get(id)) {
      case (null) { Runtime.trap("Quote not found") };
      case (?quote) {
        let updatedQuote = { quote with status; statusReason = ?reason };
        quotes.add(id, updatedQuote);
        true;
      };
    };
  };

  // ************************ Site Settings Management ************************
  public query ({ caller }) func getSiteSettings() : async SiteSettings {
    siteSettings;
  };

  public shared ({ caller }) func updateSiteSettings(settings : SiteSettings) : async Bool {
    siteSettings := settings;
    true;
  };

  // ************************ Gallery/File Management ************************
  public shared ({ caller }) func addPhoto(blob : Storage.ExternalBlob, title : Text, order : Nat, fileType : Text) : async Nat {
    let id = nextPhotoId;
    nextPhotoId += 1;

    let photo : Photo = {
      id;
      blob;
      title;
      order;
      timestamp = Time.now();
      fileType;
    };

    photos.add(id, photo);
    id;
  };

  public query ({ caller }) func getPhotos() : async [Photo] {
    let filtered = photos.values().toArray().filter(
      func(p) { Text.equal(p.fileType, "gallery") }
    );
    filtered.sort(
      func(a, b) {
        switch (Nat.compare(a.order, b.order)) {
          case (#equal) { Nat.compare(a.id, b.id) };
          case (other) { other };
        };
      }
    );
  };

  public query ({ caller }) func getAllFiles() : async [Photo] {
    photos.values().toArray().sort(
      func(a, b) {
        switch (Int.compare(b.timestamp, a.timestamp)) {
          case (#equal) { Nat.compare(a.id, b.id) };
          case (other) { other };
        };
      }
    );
  };

  public shared ({ caller }) func deletePhoto(id : Nat) : async Bool {
    switch (photos.get(id)) {
      case (null) { Runtime.trap("Photo not found") };
      case (?_) {
        photos.remove(id);
        true;
      };
    };
  };

  public shared ({ caller }) func updatePhotoTitle(id : Nat, newTitle : Text) : async Bool {
    switch (photos.get(id)) {
      case (null) { Runtime.trap("Photo not found") };
      case (?photo) {
        let updatedPhoto = { photo with title = newTitle };
        photos.add(id, updatedPhoto);
        true;
      };
    };
  };

  // ************************ Review Management ************************
  public shared ({ caller }) func submitReview(name : Text, rating : Nat, message : Text) : async Nat {
    if (rating < 1 or rating > 5) {
      Runtime.trap("Rating must be between 1 and 5");
    };

    let id = nextReviewId;
    nextReviewId += 1;

    let review : Review = {
      id;
      name;
      rating;
      message;
      timestamp = Time.now();
    };

    reviews.add(id, review);
    id;
  };

  public query ({ caller }) func getReviews() : async [Review] {
    reviews.values().toArray();
  };

  public shared ({ caller }) func deleteReview(id : Nat) : async Bool {
    switch (reviews.get(id)) {
      case (null) { Runtime.trap("Review not found") };
      case (?_) {
        reviews.remove(id);
        true;
      };
    };
  };

  // ************************ Customer Management ************************
  public shared ({ caller }) func registerOrLoginCustomer(name : Text, mobile : Text) : async Customer {
    let now = Time.now();

    switch (customerByMobile.get(mobile)) {
      case (null) {
        let id = nextCustomerId;
        nextCustomerId += 1;

        let newCustomer : Customer = {
          id;
          name;
          mobile;
          firstVisit = now;
          lastVisit = now;
          visitCount = 1;
        };

        customers.add(id, newCustomer);
        customerByMobile.add(mobile, id);
        newCustomer;
      };
      case (?id) {
        switch (customers.get(id)) {
          case (null) { Runtime.trap("Customer data inconsistency") };
          case (?existing) {
            let updatedCustomer = {
              id;
              name;
              mobile;
              firstVisit = existing.firstVisit;
              lastVisit = now;
              visitCount = existing.visitCount + 1;
            };
            customers.add(id, updatedCustomer);
            updatedCustomer;
          };
        };
      };
    };
  };

  module Customer {
    public func compareByLastVisitDesc(c1 : Customer, c2 : Customer) : Order.Order {
      Int.compare(c2.lastVisit, c1.lastVisit);
    };
  };

  public query ({ caller }) func getCustomers() : async [Customer] {
    customers.values().toArray().sort(Customer.compareByLastVisitDesc);
  };

  public query ({ caller }) func getCustomerByMobile(mobile : Text) : async Customer {
    switch (customerByMobile.get(mobile)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?id) {
        switch (customers.get(id)) {
          case (null) { Runtime.trap("Customer not found") };
          case (?customer) { customer };
        };
      };
    };
  };

  // ************************ Promo Settings Management ************************
  public query ({ caller }) func getPromoSettings() : async PromoSettings {
    promoSettings;
  };

  public shared ({ caller }) func updatePromoSettings(settings : PromoSettings) : async Bool {
    promoSettings := settings;
    true;
  };

  // ************************ Admin Messaging ************************
  public shared ({ caller }) func sendMessageToCustomer(
    toMobile : Text,
    toName : Text,
    subject : Text,
    body : Text,
  ) : async Nat {
    let id = nextMessageId;
    nextMessageId += 1;

    let message : AdminMessage = {
      id;
      toMobile;
      toName;
      subject;
      body;
      timestamp = Time.now();
      isRead = false;
    };

    messages.add(id, message);
    id;
  };

  module AdminMessage {
    public func compareByTimestampDesc(m1 : AdminMessage, m2 : AdminMessage) : Order.Order {
      Int.compare(m2.timestamp, m1.timestamp);
    };
  };

  public query ({ caller }) func getMessagesForCustomer(mobile : Text) : async [AdminMessage] {
    messages.values().toArray().filter(
      func(m) { Text.equal(m.toMobile, mobile) }
    ).sort(AdminMessage.compareByTimestampDesc);
  };

  public shared ({ caller }) func markMessageRead(id : Nat) : async Bool {
    switch (messages.get(id)) {
      case (null) { Runtime.trap("Message not found") };
      case (?message) {
        let updatedMessage = { message with isRead = true };
        messages.add(id, updatedMessage);
        true;
      };
    };
  };

  public query ({ caller }) func getAllAdminMessages() : async [AdminMessage] {
    messages.values().toArray().sort(AdminMessage.compareByTimestampDesc);
  };

  public shared ({ caller }) func deleteAdminMessage(id : Nat) : async Bool {
    switch (messages.get(id)) {
      case (null) { Runtime.trap("Message not found") };
      case (?_) {
        messages.remove(id);
        true;
      };
    };
  };
};
