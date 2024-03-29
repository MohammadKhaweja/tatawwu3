const User = require("../models/user.model");
const Community = require("../models/community.model");
const Event = require("../models/event.model");
const fs = require("fs");
const { semanticEvents } = require("../helpers/semanticEvents.helper");

/**
 * Follows or unfollows a community.
 * @async
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the status and the following data.
 */
async function followCommunity(req, res) {
  //not being used in app
  const { userId, communityId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user || user.role !== "volunteer") {
      return res
        .status(404)
        .json({ error: "Invalid user or user is not a volunteer" });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const isFollowing = user.following.includes(communityId);

    if (isFollowing) {
      user.following = user.following.filter(
        (id) => id.toString() !== communityId
      );
    } else {
      user.following.push(communityId);
    }

    await user.save();
    return res.status(200).json({ following: user.following });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

/**
 * Updates a user's profile.
 * @async
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the status and the user data.
 */
async function updateProfile(req, res) {
  const { userId, updates } = req.body;
  try {
    if (!userId || !updates) {
      res.status(404).json({ error: "User Id and Updates required" });
    }
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

/**
 * Applies for an event.
 * @async
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the status and the success message.
 */
const applyForEvent = async (req, res) => {
  const userId = req.user.id;
  const { eventId } = req.body;

  try {
    if (!eventId) {
      res.status(404).json({ error: "event Id required" });
    }
    // Check if the user with the specified status is already an applicant for the event
    const isUserApplied = await Community.exists({
      "events._id": eventId,
      "events.applicants": { $elemMatch: { user: userId, status: "applied" } },
    });

    if (isUserApplied) {
      return res
        .status(400)
        .json({ error: "User already applied for this event" });
    }

    // If the user is not already an applicant, add them to the applicants array
    const updatedEvent = await Community.findOneAndUpdate(
      { "events._id": eventId },
      {
        $addToSet: {
          "events.$.applicants": { user: userId, status: "applied" },
        },
      },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(200).json({ success: "applied successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Checks the application status of a user for an event.
 * @async
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the status and the application status.
 */
const applicationStatus = async (req, res) => {
  const userId = req.user.id;
  const { eventId } = req.body;

  try {
    if (!eventId) {
      res.status(404).json({ error: "event Id required" });
    }
    // Check if the user with the specified status is already an applicant for the event
    const isUserApplied = await Community.exists({
      "events._id": eventId,
      "events.applicants": { $elemMatch: { user: userId } },
    });

    if (isUserApplied) {
      return res.status(200).json({ status: isUserApplied });
    }

    // If the user is not already an applicant, add them to the applicants array
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Updates a user's image.
 * @async
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the status and the user data.
 */
async function updateUserImage(req, res) {
  const userId = req.body.userId;
  const image = req.files.image[0]; // Access the uploaded file information

  try {
    if (!image) {
      return res.status(400).send("Please upload a valid image file.");
    }

    const updatedUserData = {
      userImage: image.path, // Save the file path in the user's data
    };

    const user = await User.findByIdAndUpdate(userId, updatedUserData);
    fs.unlink(user.userImage, (err) => {
      if (err) {
        console.error("Error deleting the previous image:", err);
      } else {
        console.log("Previous image deleted successfully!");
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Finds events by applicant.
 * @async
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the status and the transformed events data.
 */
const findEventsByApplicant = async (req, res) => {
  const userId = req.user.id;

  try {
    const events = await Event.findEventsByApplicant(userId);

    // Map the result to transform the structure
    const transformedEvents = events.map((event) => ({
      title: event.title,
      description: event.description,
      schedule: event.schedule,
      location: event.location,
      targetedSkills: event.targetedSkills,
      img: event.img,
      duration: event.duration,
      community: event.community,
      _id: event._id,
      status: event.applicants.length > 0 ? event.applicants[0].status : null,
    }));

    res.status(200).send(transformedEvents);
  } catch (error) {
    console.error("Error finding events by applicant:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Gets all volunteers.
 * @async
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the status and the all users data.
 */
async function getAllVolunteers(req, res) {
  try {
    const allUsers = await User.find({ role: "volunteer" }).select(
      "firstName lastName skills academicBackground bio userImage"
    );

    return res.status(200).json(allUsers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Sorts Events by query.
 * @async
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the status and the filtered users data.
 */
async function sortByQuery(req, res) {
  const user = req.user;
  const { query } = req.body;

  try {
    if (!query) {
      res.status(404).json({ error: "search query required" });
    }
    // Retrieve all events from the Event model
    const allUsers = await User.find({ role: "volunteer" }).select(
      "firstName lastName skills academicBackground bio userImage"
    );

    // Use semanticEvents or any other logic to calculate similarities
    const similarities = await semanticEvents(query, allUsers, 0.7);

    function getSimilarEvents(allEvents, similarities) {
      const similarEventIds = similarities.map((similarity) => similarity.id);
      return allEvents.filter((event) => similarEventIds.includes(event.id));
    }

    // Get the filtered events
    const filteredUsers = getSimilarEvents(allUsers, similarities);

    return res.status(200).send(filteredUsers);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  followCommunity,
  updateProfile,
  applyForEvent,
  updateUserImage,
  applicationStatus,
  findEventsByApplicant,
  getAllVolunteers,
  sortByQuery,
};
