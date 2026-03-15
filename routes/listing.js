const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js"); 
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js"); 
const multer  = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

//INDEX ROUTE
router.get("/", wrapAsync(async (req, res) => {
   const allListings = await Listing.find({})
    res.render("listings/index.ejs", {allListings});
}));

//NEW ROUTE
router.get("/new", isLoggedIn, (req,res) => {
    res.render("listings/new.ejs");
});

//SHOW ROUTE
router.get("/:id", wrapAsync(async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate({
        path: "reviews",
        populate: {
            path: "author",
        },
    })
    .populate("owner");
    if(!listing){
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs", {listing});
}));

//CREATE ROUTE
router.post("/",
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(async (req, res, next) => {
        let url = req.file.path;
        let filename = req.file.filename;
        console.log(url, "..", filename);
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename};
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
}));

//EDIT ROUTE
router.get("/:id/edit",
    isLoggedIn,
    isOwner,
     wrapAsync(async (req, res) =>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
     if(!listing){
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
}));

//UPDATE ROUTE
// router.put("/:id",
//     isLoggedIn,
//     isOwner,
//      upload.single("listing[image]"),
//   validateListing,
//   wrapAsync(async (req, res) => {
//     let { id } = req.params;

//     const listing = await Listing.findById(id);

//     listing.title = req.body.listing.title;
//     listing.description = req.body.listing.description;
//     listing.price = req.body.listing.price;
//     listing.location = req.body.listing.location;
//     listing.country = req.body.listing.country;

//     // image sirf tab update hogi jab url diya ho
//     if (req.body.listing.image?.url) {
//       listing.image.url = req.body.listing.image.url;
//     }
//     req.flash("success", "Listing Updated!");

//     await listing.save();
//     res.redirect(`/listings/${id}`);
//   })
// );

router.put("/:id",
    isLoggedIn,
    isOwner,
     upload.single("listing[image]"),
  validateListing,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing});

    if(typeof req.file != "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url, filename};
        await listing.save();
    }
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
  }));




//DELETE ROUTE
router.delete("/:id",
    isLoggedIn,
    isOwner,
     wrapAsync(async (req, res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing deleted!");
    res.redirect("/listings");
}));

module.exports = router;