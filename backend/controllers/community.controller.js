const { handleBase64Image } = require("../helpers/base64.helper");
const { semanticEvents } = require("../helpers/semanticEvents.helper");
const Community = require("../models/community.model");
const Event = require("../models/event.model");
const User = require("../models/user.model");
const fs = require("fs");
const path = require("path");

/**
 * Retrieves all communities and their owners' details.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The list of all communities and their details.
 */
const getAllCommunities = async (req, res) => {
  try {
    const communities = await Community.find().populate({
      path: "owner",
      select: "-_id firstName lastName bio skills academicBackground userImage",
    });

    res.status(200).json(communities);
  } catch (error) {
    console.error("Error getting communities:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Retrieves a specific community and its owner's details.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The details of the requested community.
 */
const getCommunity = async (req, res) => {
  const { community } = req.body;
  try {
    if (!community) {
      return res.status(404).json({ error: "No community Id found" });
    }
    const communities = await Community.findById(community).populate({
      path: "owner",
      select: "-_id firstName lastName bio skills academicBackground userImage",
    });

    res.status(200).json(communities);
  } catch (error) {
    console.error("Error getting communities:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Creates a new community and assigns the current user as its owner.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The newly created community's details.
 */
async function createCommunity(req, res) {
  const user = req.user;
  const { name, description, img } = req.body;

  if (!name || !description || !img) {
    return res.status(404).json({ error: "All Fields Required" });
  }

  const imagePath = img ? await handleBase64Image(img) : null;
  console.log(imagePath);

  try {
    const newCommunity = new Community({
      name,
      description,
      img: imagePath,
    });
    newCommunity.owner = user.id;

    await newCommunity.save();
    user.isCommunityOwner = true;
    await user.save();

    return res.status(200).send({ community: newCommunity });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
}

/**
 * Retrieves a specific event's details.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The details of the requested event.
 */
async function getEvent(req, res) {
  const { eventId } = req.body;
  try {
    if (!eventId) {
      return res.status(404).json({ error: "No event Id found" });
    }
    const allEvents = await Event.findById(eventId).select("-applicants");

    return res.status(200).json(allEvents);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Retrieves all events with pagination.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The list of all events and their details.
 */
async function getAllEvents(req, res) {
  const page = parseInt(req.body.page) || 1; // Extract the page from query parameters or default to page 1
  const pageSize = 2; // Set the number of events per page as needed

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set the time to the beginning of the day

    const allEvents = await Event.find({
      "schedule.date": { $gte: today.toISOString().split("T")[0] }, // Filter events where date is greater than or equal to today
    })
      .populate({ path: "community", select: "img" })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return res.status(200).json(allEvents);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Retrieves all events of a specific community and their applicants' details.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The list of all events of the community and their details.
 */
async function getCommunityEventsUser(req, res) {
  const { communityId } = req.body;

  try {
    if (!communityId) {
      return res.status(404).json({ error: "No community Id found" });
    }
    const community = await Community.findById(communityId).populate({
      path: "events",
      populate: {
        path: "applicants.user",
        select:
          "-_id firstName lastName bio skills academicBackground userImage",
      },
    });
    console.log(community);

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    return res.status(200).send(community.events);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

/**
 * Retrieves all events of the community owned by the current user and their applicants' details.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The list of all events of the community and their details.
 */
async function getCommunityEvents(req, res) {
  const user = req.user;

  try {
    if (!user) {
      return res.status(404).json({ error: "No user found" });
    }
    const community = await Community.findOne({
      owner: user._id,
    }).populate({
      path: "events",
      populate: {
        path: "applicants.user",
        select:
          "-_id firstName lastName bio skills academicBackground userImage",
      },
    });
    console.log(community);

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    return res.status(200).send({ events: community.events });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

/**
 * Retrieves all applicants of a specific event and their details.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The list of all applicants of the event and their details.
 */
async function getCommunityEventApplicants(req, res) {
  const { eventId } = req.body;

  try {
    if (!eventId) {
      return res.status(404).json({ error: "No event Id found" });
    }
    const event = await Event.findById(eventId).populate({
      path: "applicants.user",
      select: "-_id firstName lastName bio skills academicBackground userImage",
    });
    console.log(event);

    if (!event) {
      return res.status(404).json({ error: "Community not found" });
    }

    return res.status(200).send({ events: event.applicants });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

/**
 * Adds a new event to the community owned by the current user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The details of the newly added event.
 */
async function addEvent(req, res) {
  const user = req.user;
  const { title, description, schedule, location, img, targetedSkills } =
    req.body;

  try {
    if (
      !title ||
      !description ||
      !schedule ||
      !location ||
      !img ||
      !targetedSkills
    ) {
      return res.status(404).json({ error: "All Fields Required" });
    }
    // Find the community based on the user
    const community = await Community.findOne({ owner: user.id });

    // Check if the community exists
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    // Handle the image if provided
    const imagePath = img ? await handleBase64Image(img) : "null";

    // Create a new Event document with the associated community and save it
    const newEvent = new Event({
      title,
      description,
      schedule,
      location,
      img: imagePath,
      targetedSkills,
      community: community._id, // Specify the community association
    });
    await newEvent.save();

    // Respond with the new event
    return res.status(200).send({ event: newEvent });
  } catch (error) {
    // Handle errors and respond with an error message
    console.log(error.message);
    return res.status(400).json({ error: error.message });
  }
}

/**
 * Edits an existing event.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The updated event's details.
 */
async function editEvent(req, res) {
  const user = req.user;
  const {
    title,
    description,
    schedule,
    location,
    duration,
    targetedSkills,
    img,
    _id,
  } = req.body;

  try {
    if (
      !title ||
      !description ||
      !schedule ||
      !location ||
      !img ||
      !targetedSkills ||
      !_id
    ) {
      return res.status(404).json({ error: "All Fields Required" });
    }
    // Handle the image if provided
    const imagePath = img ? await handleBase64Image(img) : null;
    console.log(
      title,
      description,
      schedule,
      location,
      duration,
      targetedSkills,
      img,
      _id
    );

    // Create an updatedEventData object
    const updatedEventData = {
      title,
      description,
      schedule,
      location,
      duration,
      targetedSkills,
      img: imagePath,
    };

    // Directly update the event by its ID
    const updatedEvent = await Event.findByIdAndUpdate(
      _id,
      {
        $set: {
          title: updatedEventData.title,
          description: updatedEventData.description,
          schedule: updatedEventData.schedule,
          location: updatedEventData.location,
          duration: updatedEventData.duration,
          targetedSkills: updatedEventData.targetedSkills,
          img: updatedEventData.img,
        },
      },
      { new: true }
    );

    // Check if the event was found and updated
    if (!updatedEvent) {
      return res.status(404).json({ error: "Event not found or not updated" });
    }

    // Respond with the updated event
    return res.status(200).send({ updatedEvent });
  } catch (error) {
    // Handle errors and respond with an error message
    console.log(error.message);
    return res.status(400).json({ error: error.message });
  }
}

/**
 * Deletes an existing event.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The deleted event's details.
 */
async function deleteEvent(req, res) {
  const { eventId } = req.body;
  const user = req.user;
  try {
    if (!eventId) {
      return res.status(404).json({ error: "No event Id found" });
    }
    const community = await Community.findOne({ owner: user._id });
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }
    // Find the event by its ID and remove it
    const removedEvent = await Event.findById(eventId);
    console.log(community._id, removedEvent.community);

    if (!removedEvent) {
      return res.status(404).json({ error: "Event not found or not removed" });
    }
    if (removedEvent.community.equals(community._id)) {
      await removedEvent.deleteOne();
      return res.status(200).send({ removedEvent });
    }

    // The 'remove' hook in eventSchema.post("remove") should have updated the community's events array

    // Respond with the removed event
    return res.status(400).send({ error: error.message });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

/**
 * Invites a user to an event or cancels an existing invitation.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The event's details after the invitation is sent or cancelled.
 */
async function inviteOrCancelInvite(req, res) {
  //not using this in app currently
  const { communityId, eventId, userId, cancel } = req.body;
  try {
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const event = community.events.id(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const existingInviteIndex = event.applicants.findIndex(
      (applicant) =>
        applicant.user.toString() === userId && applicant.status === "invited"
    );

    if (cancel) {
      // Cancel the invitation if it exists
      if (existingInviteIndex !== -1) {
        event.applicants.splice(existingInviteIndex, 1);
        await community.save();
        return res.status(200).send({ event });
      }
      return res
        .status(404)
        .json({ error: "User is not invited to this event" });
    }

    // Invite the user if not already invited
    if (existingInviteIndex === -1) {
      event.applicants.push({ user: userId, status: "invited" });
      await community.save();
      return res.status(200).send({ event });
    }
    return res.status(400).json({ error: "User already invited" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

/**
 * Applies a user to an event.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} A success message or an error message.
 */
async function applyForEvent(req, res) {
  const { eventId } = req.body;
  const userId = req.user.id;
  try {
    if (!eventId) {
      return res.status(404).json({ error: "No event Id found" });
    }
    const event = await Event.findById(eventId);

    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "Event not found" });
    }

    // Check if the user has already applied
    const existingApplicant =
      event.applicants &&
      event.applicants.some(
        (applicant) =>
          applicant.user && applicant.user.toString() === userId.toString()
      );

    if (existingApplicant) {
      return res
        .status(400)
        .json({ success: false, message: "User has already applied" });
    }

    // Add new application
    event.applicants.push({
      user: userId,
      status: "pending",
    });

    await event.save();

    return res
      .status(200)
      .send({ success: true, message: "Application successful" });
  } catch (error) {
    console.error("Error applying for event:", error);
    return res
      .status(400)
      .json({ success: false, message: "Internal server error" });
  }
}

/**
 * Cancels a user's application to an event.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} A success message or an error message.
 */
async function cancelApplication(req, res) {
  const { eventId } = req.body;
  const userId = req.user.id;

  try {
    if (!eventId) {
      return res.status(404).json({ error: "No event Id found" });
    }
    const event = await Event.findById(eventId);

    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "Event not found" });
    }

    // Check if the user has already applied
    const existingApplicant =
      event.applicants &&
      event.applicants.findIndex(
        (applicant) =>
          applicant.user && applicant.user.toString() === userId.toString()
      );

    if (existingApplicant !== -1) {
      event.applicants.splice(existingApplicant, 1);

      await event.save();

      return res
        .status(200)
        .json({ success: true, message: "Application canceled" });
    }

    return res.status(400).send({ success: true, message: "error" });
  } catch (error) {
    console.error("Error applying for event:", error);
    return res
      .status(400)
      .json({ success: false, message: "Internal server error" });
  }
}

/**
 * Accepts a user's application to an event.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} A success message or an error message.
 */
async function acceptApplication(req, res) {
  const { eventId, applicantId } = req.body;
  console.log(applicantId, eventId);
  try {
    if (!eventId || !applicantId) {
      return res.status(404).json({ error: "All Fields Required" });
    }
    const event = await Event.findById(eventId);

    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "Event not found" });
    }

    // Find the applicant in the event
    const applicant = event.applicants.find(
      (app) => app._id.toString() === applicantId
    );

    if (!applicant) {
      return res
        .status(400)
        .json({ success: false, message: "Applicant not found" });
    }

    // Update applicant status to 'approved'
    applicant.status = "approved";

    await event.save();

    return res
      .status(200)
      .json({ success: true, message: "Application accepted" });
  } catch (error) {
    console.error("Error accepting application:", error);
    return res
      .status(400)
      .json({ success: false, message: "Internal server error" });
  }
}

/**
 * Rejects an applicant's application to an event.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} A success message or an error message.
 */
async function rejectApplication(req, res) {
  const { eventId, applicantId } = req.body;
  console.log(applicantId, eventId);
  try {
    if (!eventId || !applicantId) {
      return res.status(404).json({ error: "All Fields Required" });
    }
    const event = await Event.findById(eventId);

    if (!event) {
      return res
        .status(400)
        .json({ success: false, message: "Event not found" });
    }

    // Find the applicant in the event
    const applicantIndex = event.applicants.findIndex(
      (app) => app.id && app.id === applicantId
    );

    if (applicantIndex === -1) {
      return res
        .status(400)
        .json({ success: false, message: "Applicant not found" });
    }

    // Remove the applicant from the list
    event.applicants[applicantIndex].status = "rejected";

    await event.save();

    return res
      .status(200)
      .json({ success: true, message: "Application rejected" });
  } catch (error) {
    console.error("Error rejecting application:", error);
    return res
      .status(400)
      .json({ success: false, message: "Internal server error" });
  }
}

/**
 * Retrieves all events sorted by their relevance to the user's skills.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The list of all events sorted by their relevance to the user's skills.
 */
async function sortBySkills(req, res) {
  const user = req.user;

  try {
    // Retrieve all events from the Event model
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set the time to the beginning of the day

    const allEvents = await Event.find({
      "schedule.date": { $gte: today.toISOString().split("T")[0] }, // Filter events where date is greater than or equal to today
    }).populate({
      path: "community",
      select: "img",
    });

    // Use semanticEvents or any other logic to calculate similarities
    const similarities = await semanticEvents(user.skills, allEvents);

    function getSimilarEvents(allEvents, similarities) {
      const similarEventIds = similarities.map((similarity) => similarity.id);
      return allEvents.filter((event) => similarEventIds.includes(event.id));
    }

    // Get the filtered events
    const filteredEvents = getSimilarEvents(allEvents, similarities);

    return res.status(200).send(filteredEvents);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

/**
 * Retrieves all events sorted by their relevance to a query.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The list of all events sorted by their relevance to the query.
 */
async function sortByQuery(req, res) {
  const user = req.user;
  const { query } = req.body;

  try {
    if (!query) {
      return res.status(404).json({ error: "Search Query Required" });
    }
    // Retrieve all events from the Event model
    const allEvents = await Event.find().populate({
      path: "community",
      select: "img",
    });

    // Use semanticEvents or any other logic to calculate similarities
    const similarities = await semanticEvents(query, allEvents, 0.7);

    function getSimilarEvents(allEvents, similarities) {
      const similarEventIds = similarities.map((similarity) => similarity.id);
      return allEvents.filter((event) => similarEventIds.includes(event.id));
    }

    // Get the filtered events
    const filteredEvents = getSimilarEvents(allEvents, similarities);

    return res.status(200).send(filteredEvents);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  createCommunity,
  addEvent,
  editEvent,
  deleteEvent,
  inviteOrCancelInvite,
  applyForEvent,
  getCommunityEvents,
  getAllEvents,
  sortBySkills,
  sortByQuery,
  cancelApplication,
  acceptApplication,
  rejectApplication,
  getAllCommunities,
  getCommunityEventApplicants,
  getCommunity,
  getEvent,
  getCommunityEventsUser,
};
