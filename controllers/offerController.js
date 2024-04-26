import Offer from "../models/offerModel.js";
import Rooms from "../models/roomModel.js";

export const addOffer = async (req, res) => {
  try {
    const { rooms, percentage, startDate, expiryDate, offerName } = req.body;

    const newOffer = new Offer({
      rooms,
      offerName,
      percentage,
      startDate,
      expiryDate,
      status: "active",
    });

    const savedOffer = await newOffer.save();
    res.status(201).json(savedOffer);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const offerList = async (req, res) => {
  try {
    const offers = await Offer.find();
    if (offers) {
      return res.status(200).json({ offers });
    } else {
      return res
        .status(200)
        .json({ message: "Somthing happened with finding offer data " });
    }
  } catch (error) {
    console.log(error.message);
  }
};

export const editOfferDetails = async (req, res) => {
  try {
    const { offerId } = req.params;
    const offer = await Offer.findById(offerId);
    if (offerId) {
      return res.status(200).json({ offer });
    }
    return res.status(404).json({ message: "Offer Not Found" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const editOffers = async (req, res) => {
  try {
    const { offerId, rooms, percentage, startDate, expiryDate, offerName } =
      req.body;

    await Offer.findByIdAndUpdate(
      { _id: offerId },
      {
        $set: {
          rooms,
          offerName,
          percentage,
          startDate,
          expiryDate,
          status: "active",
        },
      }
    );
    res.status(200).json({ message: "Offer Updated" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};

export const deleteOffers = async (req, res) => {
  try {
    const { offerId } = req.params;
    await Offer.findByIdAndDelete(offerId);
    res.status(200).json({ message: "offer deleted" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: "Internal Server Error" });
  }
};
