const mongoose = require("mongoose");
const Community = require("../models/community.model");

// Define the applicant schema
const applicantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "approved", "rejected"],
  },
});

// Define the event schema
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  schedule: { type: Object, required: true },
  location: { type: String, required: true },
  applicants: [applicantSchema],
  targetedSkills: [{ type: String }],
  img: { type: String, required: true },
  duration: { type: Number },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
  },
});

// Middleware to automatically update the community when a new event is added
eventSchema.pre("save", function (next) {
  // Check if the document is new (created) or being updated
  if (this.isNew) {
    const eventId = this._id;
    const communityId = this.community;
    console.log("hello", eventId, communityId);

    // Update the community with the new event
    Community.findByIdAndUpdate(
      communityId,
      { $push: { events: eventId } },
      { new: true }
    )
      .then(() => next())
      .catch(next);
  } else {
    // If it's an update or delete, just proceed to the next middleware
    next();
  }
});

// Post-remove hook to update the community's events array after an event is removed
eventSchema.pre(
  "deleteOne",
  { document: false, query: true },
  async function (next) {
    try {
      const event = await this.model.findOne(this.getFilter());

      // Check if the event exists
      if (!event) {
        console.log("Event not found");
        return next();
      }

      // Save the community ID before removing the event
      const communityId = event.community;

      await Community.findByIdAndUpdate(
        communityId,
        { $pull: { events: event._id } },
        { new: true }
      );
      // Proceed with the event deletion
      next();
    } catch (error) {
      console.error("Error deleting event:", error);
      next(error);
    }
  }
);

eventSchema.statics.findEventsByApplicant = function (userId) {
  return this.find({ "applicants.user": userId }).select("-applicants.user");
};
const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
