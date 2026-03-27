import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Check } from "lucide-react";
import { format } from "date-fns";

export default function ProjectModal({
  onClose,
  refresh,
  members,
  profiles,
  editData,
}) {
  const [formData, setFormData] = useState({
    clientName: "",
    projectName: "",
    orderId: "",
    currentPhase: ["Backend"],
    profileName: "",
    assignedTo: "",
    otherMembers: [],
    resourceLink: "",
    firstDeliveryDate: "",
    deliveryDate: "",
    assignedDate: "",
    clientMood: "Neutral",
    status: "In Progress",
    projectValue: 0,
    lastUpdateNote: "",
    projectNotes: "",
    phases: [],
    isOldProject: false,
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        isOldProject: editData.isOldProject || false,
        currentPhase: editData.currentPhase
          ? Array.isArray(editData.currentPhase)
            ? editData.currentPhase
            : [editData.currentPhase]
          : [],
        assignedTo: editData.assignedTo?._id || "",
        otherMembers: editData.otherMembers?.map((m) => m._id) || [],
        firstDeliveryDate: editData.firstDeliveryDate
          ? format(new Date(editData.firstDeliveryDate), "yyyy-MM-dd'T'HH:mm")
          : "",
        deliveryDate: editData.deliveryDate
          ? format(new Date(editData.deliveryDate), "yyyy-MM-dd'T'HH:mm")
          : "",
        assignedDate: editData.assignedDate
          ? format(new Date(editData.assignedDate), "yyyy-MM-dd")
          : "",
        lastUpdateNote: editData.lastUpdateNote || "",
        projectNotes: editData.projectNotes || "",
        orderId: editData.orderId || "",
        phases: editData.phases || [],
      });
    } else if (members.length > 0) {
      setFormData((prev) => ({ ...prev, assignedTo: members[0]._id }));
    }
  }, [editData, members]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhaseToggle = (phase) => {
    setFormData((prev) => {
      const exists = prev.phases.find((p) => p.name === phase);
      let newPhases;
      if (exists) {
        newPhases = prev.phases.filter((p) => p.name !== phase);
      } else {
        newPhases = [...prev.phases, { name: phase, value: null }];
      }

      const newVal = newPhases.reduce(
        (sum, p) => sum + Number(p.value || 0),
        0,
      );
      return {
        ...prev,
        phases: newPhases,
        projectValue: newPhases.length > 0 ? newVal : prev.projectValue,
      };
    });
  };

  const handlePhaseValChange = (phase, val) => {
    setFormData((prev) => {
      const newPhases = prev.phases.map((p) =>
        p.name === phase ? { ...p, value: val === "" ? "" : Number(val) } : p,
      );
      const newVal = newPhases.reduce(
        (sum, p) => sum + Number(p.value || 0),
        0,
      );
      return { ...prev, phases: newPhases, projectValue: newVal };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("halkhata-token");
    const headers = { Authorization: `Bearer ${token}` };

    const payload = {
      ...formData,
      phases: formData.phases.map((p) => ({
        ...p,
        value: Number(p.value) || 0,
      })),
    };

    try {
      if (editData) {
        await axios.put(
          `https://halkatha-logic-lab-backend.vercel.app/api/projects/${editData._id}`,
          payload,
          { headers },
        );
        toast.success("Project updated");
      } else {
        await axios.post(
          "https://halkatha-logic-lab-backend.vercel.app/api/projects",
          payload,
          { headers },
        );
        toast.success("Project added");
      }
      refresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving project");
    }
  };

  const inputClass =
    "w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block px-4 py-3 transition-all outline-none font-medium placeholder-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 scale-in-center">
        <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
            {editData ? "Edit Project" : "New Project"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          <form
            id="project-form"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6"
          >
            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Project Name</label>
              <input
                required
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter project name..."
              />
            </div>

            <div>
              <label className={labelClass}>Client Name</label>
              <input
                required
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter client name..."
              />
            </div>

            <div>
              <label className={labelClass}>Order ID / #</label>
              <input
                name="orderId"
                value={formData.orderId}
                onChange={handleChange}
                className={inputClass}
                placeholder="#ORD-1234"
              />
            </div>

            <div className="col-span-1 md:col-span-2 flex items-center gap-3 bg-yellow-50/50 p-4 rounded-xl border border-yellow-200 mt-2">
              <input
                type="checkbox"
                name="isOldProject"
                checked={formData.isOldProject}
                onChange={(e) =>
                  setFormData({ ...formData, isOldProject: e.target.checked })
                }
                className="w-5 h-5 text-yellow-500 rounded border-yellow-300 focus:ring-yellow-500 transition cursor-pointer"
                id="isOldProjectToggle"
              />
              <label
                htmlFor="isOldProjectToggle"
                className="text-sm font-bold text-yellow-800 cursor-pointer"
              >
                Mark as Old Project (Bypasses initial dates)
              </label>
            </div>

            <div>
              <label className={labelClass}>Fiverr Profile Name</label>
              <select
                required
                name="profileName"
                value={formData.profileName}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Profile</option>
                {profiles?.map((p) => (
                  <option key={p._id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Current Phase(s)</label>
              <div className="flex flex-wrap gap-2.5">
                {["Backend", "Frontend", "UI/UX", "FullStack"].map((phase) => {
                  const isSelected =
                    Array.isArray(formData.currentPhase) &&
                    formData.currentPhase.includes(phase);
                  return (
                    <label
                      key={phase}
                      className={`flex items-center px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold cursor-pointer transition-all border ${isSelected ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"}`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isSelected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData((prev) => {
                            const current = Array.isArray(prev.currentPhase)
                              ? prev.currentPhase
                              : [];
                            return {
                              ...prev,
                              currentPhase: checked
                                ? [...current, phase]
                                : current.filter((p) => p !== phase),
                            };
                          });
                        }}
                      />
                      <span className="flex items-center gap-1.5">
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {phase}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option>In Progress</option>
                <option>Delivered</option>
                <option>Revision</option>
                <option>Cancelled</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Client Mood</label>
              <select
                name="clientMood"
                value={formData.clientMood}
                onChange={handleChange}
                className={inputClass}
              >
                <option>Happy</option>
                <option>Neutral</option>
                <option>Angry</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Assigned To</label>
              <select
                required
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Member</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Assigned Date{" "}
                {formData.isOldProject && (
                  <span className="text-xs font-normal text-gray-400 capitalize ml-1">
                    (Optional)
                  </span>
                )}
              </label>
              <input
                required={!formData.isOldProject}
                type="date"
                name="assignedDate"
                value={formData.assignedDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Other Involved Members</label>
              <div className="flex flex-wrap gap-2.5">
                {members.map((m) => {
                  const isSelected = formData.otherMembers.includes(m._id);
                  return (
                    <label
                      key={m._id}
                      className={`flex items-center px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold cursor-pointer transition-all border ${isSelected ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"}`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isSelected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData((prev) => ({
                            ...prev,
                            otherMembers: checked
                              ? [...prev.otherMembers, m._id]
                              : prev.otherMembers.filter((id) => id !== m._id),
                          }));
                        }}
                      />
                      <span className="flex items-center gap-1.5">
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {m.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>
                First Delivery Date{" "}
                {formData.isOldProject ? (
                  <span className="text-xs font-normal text-gray-400 capitalize ml-1">
                    (Optional)
                  </span>
                ) : (
                  <span className="text-xs font-normal text-red-500 capitalize ml-1">
                    (Mandatory)
                  </span>
                )}
              </label>
              <input
                required={!formData.isOldProject}
                type="datetime-local"
                name="firstDeliveryDate"
                value={formData.firstDeliveryDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Updated Delivery Date (Current)
              </label>
              <input
                required
                type="datetime-local"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleChange}
                className={inputClass}
              />
              {!formData.isOldProject && (
                <p className="text-[11px] text-indigo-600/80 font-medium tracking-wide mt-2 leading-tight bg-indigo-50 p-2 rounded-lg">
                  Note: Must set exactly identical to First Delivery if no
                  extensions.
                </p>
              )}
            </div>

            <div className="col-span-1 md:col-span-2 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
              <label className={labelClass + " mb-4"}>
                Project Value Breakdown (By Phase)
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                {[
                  "UI/UX",
                  "Frontend",
                  "Backend",
                  "Development",
                  "FullStack",
                  "Other",
                ].map((phase) => {
                  const activePhase = formData.phases.find(
                    (p) => p.name === phase,
                  );
                  const isActive = !!activePhase;
                  return (
                    <div
                      key={phase}
                      className={`flex items-center p-3 rounded-xl border transition-all ${isActive ? "bg-white border-indigo-200 shadow-sm" : "bg-white border-gray-200 hover:border-indigo-100"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => handlePhaseToggle(phase)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600 cursor-pointer transition-colors"
                      />
                      <span
                        className={`text-sm font-semibold w-[72px] ml-3 truncate transition-colors ${isActive ? "text-indigo-900" : "text-gray-500"}`}
                      >
                        {phase}
                      </span>
                      {isActive && (
                        <div className="relative w-[100px] ml-auto">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">
                            $
                          </span>
                          <input
                            type="number"
                            value={
                              activePhase.value === null
                                ? ""
                                : activePhase.value
                            }
                            onChange={(e) =>
                              handlePhaseValChange(phase, e.target.value)
                            }
                            className="w-full border border-gray-200 bg-gray-50 rounded-lg pl-7 pr-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-bold text-gray-900 placeholder-gray-400"
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="pt-4 border-t border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <label className="text-sm font-bold uppercase tracking-wider text-gray-700">
                  Total Project Value ($)
                </label>
                <div className="relative max-w-[200px] w-full">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    $
                  </span>
                  <input
                    required
                    type="number"
                    name="projectValue"
                    value={formData.projectValue}
                    onChange={handleChange}
                    className={`w-full border rounded-xl pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-lg ${formData.phases.length > 0 ? "bg-gray-100 text-gray-400 border-gray-200 border-dashed cursor-not-allowed" : "bg-white text-indigo-700 border-gray-200 shadow-sm"}`}
                    readOnly={formData.phases.length > 0}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Resource Link</label>
              <input
                name="resourceLink"
                value={formData.resourceLink}
                onChange={handleChange}
                className={inputClass}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className={labelClass}>Last Update Note</label>
              <input
                name="lastUpdateNote"
                value={formData.lastUpdateNote}
                onChange={handleChange}
                className={inputClass}
                placeholder="E.g., Client requested revision..."
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Project Notes / Credentials</label>
              <textarea
                name="projectNotes"
                value={formData.projectNotes}
                onChange={handleChange}
                rows="3"
                className={inputClass}
                placeholder="Add live links, server credentials, or overall project notes here..."
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="project-form"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Save Project
          </button>
        </div>
      </div>
    </div>
  );
}
