const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/", protect, async (req, res) => {
  try {
    const {
      member,
      status,
      sort,
      search,
      isPlanned,
      urgent,
      page = 1,
      limit = 20,
    } = req.query;
    let matchStage = {};
    let andClauses = [];

    if (search) {
      andClauses.push({
        $or: [
          { clientName: { $regex: search, $options: "i" } },
          { projectName: { $regex: search, $options: "i" } },
          { profileName: { $regex: search, $options: "i" } },
        ],
      });
    }

    if (member) {
      andClauses.push({
        $or: [{ assignedTo: member }, { otherMembers: member }],
      });
    }

    if (status) {
      matchStage.status = status;
    }

    if (isPlanned === "true") {
      matchStage.isPlanned = true;
    }

    if (urgent === "true") {
      const now = new Date();
      const fourDaysLater = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
      if (matchStage.status) {
        andClauses.push({ status: matchStage.status });
        delete matchStage.status;
      }
      andClauses.push({ status: { $ne: "Delivered" } });
      matchStage.deliveryDate = { $lte: fourDaysLater };
    }

    if (andClauses.length > 0) {
      matchStage.$and = andClauses;
    }

    let projects = await Project.find(matchStage)
      .populate("assignedTo", "name")
      .populate("otherMembers", "name")
      .populate("valueDistribution.member", "name")
      .sort(
        sort === "val_high"
          ? "-projectValue"
          : sort === "val_low"
            ? "projectValue"
            : "-createdAt",
      );

    const totalProjects = projects.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedProjects = projects.slice(skip, skip + parseInt(limit));

    res.json({
      projects: paginatedProjects,
      totalPages: Math.ceil(totalProjects / parseInt(limit)),
      currentPage: parseInt(page),
      totalProjects,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
    console.log("Project created:", project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Project removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/distribute", protect, admin, async (req, res) => {
  try {
    const { distribution } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { valueDistribution: distribution },
      { new: true },
    );
    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch("/:id/plan", protect, admin, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isPlanned: req.body.isPlanned },
      { new: true },
    );
    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
