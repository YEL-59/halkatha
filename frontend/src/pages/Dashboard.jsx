import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LogOut,
  Plus,
  Activity,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  LayoutDashboard,
  Users,
  UserCircle,
  Edit2,
  Trash2,
  Search,
  Filter,
  BookOpen,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import ProjectModal from "../components/ProjectModal";
import UserGuideModal from "../components/UserGuideModal";
import { differenceInDays, format } from "date-fns";
import toast from "react-hot-toast";

export default function Dashboard({ user, setUser }) {
  const [activeTab, setActiveTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalDelivered: 0,
    totalInProgress: 0,
    totalValue: 0,
    currentMonthValue: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [editProject, setEditProject] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    member: "",
    status: "",
    urgent: false,
    sort: "",
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    totalProjects: 0,
  });

  // CRUD state
  const [newName, setNewName] = useState("");
  const [editingItem, setEditingItem] = useState(null);

  const fetchExtra = async () => {
    const token = localStorage.getItem("halkhata-token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [sRes, mRes, profRes] = await Promise.all([
        axios.get(
          "http://halkatha-logic-lab-backend.vercel.app/api/dashboard/stats",
          { headers },
        ),
        axios.get(
          "http://halkatha-logic-lab-backend.vercel.app/api/dashboard/members",
          { headers },
        ),
        axios.get(
          "http://halkatha-logic-lab-backend.vercel.app/api/dashboard/profiles",
          { headers },
        ),
      ]);
      setStats(sRes.data);
      setMembers(mRes.data);
      setProfiles(profRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    const token = localStorage.getItem("halkhata-token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const query = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
      });
      if (filters.search) query.append("search", filters.search);
      if (filters.member) query.append("member", filters.member);
      if (filters.status) query.append("status", filters.status);
      if (filters.sort) query.append("sort", filters.sort);
      if (filters.urgent) query.append("urgent", "true");
      if (activeTab === "plan") query.append("isPlanned", "true");

      const res = await axios.get(
        `http://halkatha-logic-lab-backend.vercel.app/api/projects?${query.toString()}`,
        { headers },
      );
      setProjects(res.data.projects);
      setPagination({
        totalPages: res.data.totalPages,
        currentPage: res.data.currentPage,
        totalProjects: res.data.totalProjects,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExtra();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [filters, activeTab]);

  const refreshAll = () => {
    fetchExtra();
    fetchProjects();
  };

  const handleLogout = () => {
    localStorage.removeItem("halkhata-user");
    localStorage.removeItem("halkhata-token");
    setUser(null);
  };

  const getRowClass = (project) => {
    if (project.status === "Delivered") return "";
    const diffMs =
      new Date(project.deliveryDate).getTime() - new Date().getTime();
    if (diffMs <= 4 * 24 * 60 * 60 * 1000)
      return "bg-red-50 hover:bg-red-100 border-l-2 border-red-500";
    return "";
  };

  const calculateDaysLeft = (deliveryDate, status) => {
    if (!deliveryDate) return null;
    if (status === "Delivered")
      return (
        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] mt-1 block">
          Delivered
        </span>
      );

    const target = new Date(deliveryDate);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();

    if (diffMs < 0)
      return (
        <span className="text-red-600 font-bold text-xs mt-1 block">
          Missed
        </span>
      );

    const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${d}d ${h}h ${m}m`;
  };

  const handleSaveItem = async (e, type) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const token = localStorage.getItem("halkhata-token");
    const headers = { Authorization: `Bearer ${token}` };
    const endpoint = type === "members" ? "members" : "profiles";

    try {
      if (editingItem) {
        await axios.put(
          `http://halkatha-logic-lab-backend.vercel.app/api/dashboard/${endpoint}/${editingItem._id}`,
          { name: newName },
          { headers },
        );
        toast.success(`${type === "members" ? "Member" : "Profile"} updated`);
      } else {
        await axios.post(
          `http://halkatha-logic-lab-backend.vercel.app/api/dashboard/${endpoint}`,
          { name: newName },
          { headers },
        );
        toast.success(`${type === "members" ? "Member" : "Profile"} added`);
      }
      setNewName("");
      setEditingItem(null);
      fetchExtra();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving");
    }
  };

  const handleDeleteItem = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    const token = localStorage.getItem("halkhata-token");
    const headers = { Authorization: `Bearer ${token}` };
    const endpoint = type === "members" ? "members" : "profiles";
    try {
      await axios.delete(
        `http://halkatha-logic-lab-backend.vercel.app/api/dashboard/${endpoint}/${id}`,
        { headers },
      );
      toast.success("Deleted successfully");
      fetchExtra();
    } catch (err) {
      toast.error("Error deleting");
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;
    const token = localStorage.getItem("halkhata-token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      await axios.delete(
        `http://halkatha-logic-lab-backend.vercel.app/api/projects/${id}`,
        {
          headers,
        },
      );
      toast.success("Project deleted");
      refreshAll();
    } catch (err) {
      toast.error("Error deleting project");
    }
  };

  const handleTogglePlan = async (id, isPlanned) => {
    const token = localStorage.getItem("halkhata-token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      await axios.patch(
        `http://halkatha-logic-lab-backend.vercel.app/api/projects/${id}/plan`,
        { isPlanned },
        { headers },
      );
      toast.success(isPlanned ? "Added to Plan" : "Removed from Plan");
      fetchProjects();
    } catch (err) {
      toast.error("Error updating plan");
    }
  };

  const handleExportExcel = async () => {
    const token = localStorage.getItem("halkhata-token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const query = new URLSearchParams({
        page: 1,
        limit: 10000,
      });
      if (filters.search) query.append("search", filters.search);
      if (filters.member) query.append("member", filters.member);
      if (filters.status) query.append("status", filters.status);
      if (filters.sort) query.append("sort", filters.sort);
      if (filters.urgent) query.append("urgent", "true");
      if (activeTab === "plan") query.append("isPlanned", "true");

      toast.loading("Fetching data for export...");
      const res = await axios.get(
        `http://halkatha-logic-lab-backend.vercel.app/api/projects?${query.toString()}`,
        { headers },
      );
      toast.dismiss();

      const projectsToExport = res.data.projects;
      if (!projectsToExport || projectsToExport.length === 0) {
        toast.error("No projects to export.");
        return;
      }

      const xlsxData = projectsToExport.map((p, index) => ({
        "#": index + 1,
        "Project Name": p.projectName,
        "Client Name": p.clientName,
        "Order ID": p.orderId || "---",
        Profile: p.profileName,
        Phase: Array.isArray(p.currentPhase)
          ? p.currentPhase.join(", ")
          : p.currentPhase,
        "Assigned To": p.assignedTo?.name || "---",
        "Team Members": (p.otherMembers || []).map((m) => m.name).join(", "),
        Status: p.status,
        "Delivery Date": p.deliveryDate
          ? format(new Date(p.deliveryDate), "MMM dd, yyyy")
          : "N/A",
        "First Delivery Date": p.firstDeliveryDate
          ? format(new Date(p.firstDeliveryDate), "MMM dd, yyyy")
          : "N/A",
        "Value ($)": p.projectValue,
        "In Plan": p.isPlanned ? "Yes" : "No",
        "Last Note": p.lastUpdateNote || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(xlsxData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");
      XLSX.writeFile(
        workbook,
        `Halkhata_Projects_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
      );
      toast.success("Excel file exported!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export.");
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setNewName("");
    setEditingItem(null);
  };

  const renderCrudBlock = (type) => {
    const isMembers = type === "members";
    const dataList = isMembers ? members : profiles;
    const title = isMembers ? "Team Members" : "Platform Profiles";
    const subtitle = isMembers
      ? "Manage internal team members (e.g. Setu, Sefat)"
      : "Manage Fiver/Upwork profile names";

    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-3xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.05)] mb-8">
          <form
            onSubmit={(e) => handleSaveItem(e, type)}
            className="flex gap-4"
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`Enter ${isMembers ? "member" : "profile"} name`}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-gray-900 transition-colors text-sm"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
            >
              {editingItem ? "Update" : "Add"}
            </button>
            {editingItem && (
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setNewName("");
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.05)] overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dataList.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setNewName(item.name);
                        }}
                        className="text-gray-400 hover:text-gray-900"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item._id, type)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {dataList.length === 0 && (
                <tr>
                  <td
                    colSpan="2"
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50/50 font-sans selection:bg-blue-100 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col justify-between">
        <div>
          <div className="px-8 py-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Halkhata.
            </h1>
          </div>
          <nav className="px-4 space-y-1">
            <button
              onClick={() => switchTab("projects")}
              className={`w-full flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === "projects" ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"}`}
            >
              <LayoutDashboard className="w-4 h-4 mr-3" />
              Projects
            </button>
            <button
              onClick={() => switchTab("plan")}
              className={`w-full flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === "plan" ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"}`}
            >
              <CheckCircle className="w-4 h-4 mr-3" />
              Monthly Plan
            </button>
            <button
              onClick={() => switchTab("profiles")}
              className={`w-full flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === "profiles" ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"}`}
            >
              <UserCircle className="w-4 h-4 mr-3" />
              Profiles
            </button>
            <button
              onClick={() => switchTab("members")}
              className={`w-full flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${activeTab === "members" ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"}`}
            >
              <Users className="w-4 h-4 mr-3" />
              Team Members
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 space-y-3">
          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center justify-center px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-indigo-100 transition-colors w-full shadow-sm"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            User Guide (English)
          </button>
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-xl">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">
                {user?.username}
              </span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full mx-auto px-6 py-8">
          {(activeTab === "projects" || activeTab === "plan") && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Dashboard
                  </h2>
                  <p className="text-sm text-gray-500">
                    Track and manage your active projects
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditProject(null);
                    setIsModalOpen(true);
                  }}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center shadow-md shadow-indigo-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  {
                    label: "Active Projects",
                    value: stats.totalProjects,
                    icon: Activity,
                  },
                  {
                    label: "In Progress",
                    value: stats.totalInProgress,
                    icon: Activity,
                    color: "text-blue-500",
                  },
                  {
                    label: "Delivered",
                    value: stats.totalDelivered,
                    icon: CheckCircle,
                    color: "text-green-500",
                  },
                  {
                    label: "Total Value",
                    value: `$${stats.totalValue || 0}`,
                    icon: DollarSign,
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center transition-all hover:shadow-md hover:border-indigo-100 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                        <stat.icon
                          className={`w-5 h-5 ${stat.color ? stat.color : "text-indigo-600"}`}
                        />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-black text-gray-900 leading-none tracking-tight">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters Box */}
              <div className="bg-white p-3.5 border-t border-gray-100 rounded-t-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[160px] relative">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search Client, Project..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        search: e.target.value,
                        page: 1,
                      })
                    }
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-medium text-gray-900 shadow-sm"
                  />
                </div>
                <select
                  value={filters.member}
                  onChange={(e) =>
                    setFilters({ ...filters, member: e.target.value, page: 1 })
                  }
                  className="bg-gray-50/50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors text-gray-700 font-medium shadow-sm"
                >
                  <option value="">All Members</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value, page: 1 })
                  }
                  className="bg-gray-50/50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors text-gray-700 font-medium shadow-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Revision">Revision</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <select
                  value={filters.sort}
                  onChange={(e) =>
                    setFilters({ ...filters, sort: e.target.value, page: 1 })
                  }
                  className="bg-gray-50/50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors text-gray-700 font-medium shadow-sm"
                >
                  <option value="">Recent to Old</option>
                  <option value="val_high">Value: High to Low</option>
                  <option value="val_low">Value: Low to High</option>
                </select>

                <div className="flex items-center pl-3 border-l border-gray-100">
                  <label className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-600 cursor-pointer bg-orange-50 hover:bg-orange-100 px-3 py-2.5 rounded-lg transition-colors border border-orange-100/50 shadow-sm">
                    <input
                      type="checkbox"
                      checked={filters.urgent}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          urgent: e.target.checked,
                          page: 1,
                        })
                      }
                      className="rounded text-orange-500 focus:ring-orange-500 bg-white border-gray-300 w-4 h-4 m-0"
                    />
                    <span className="text-orange-600">≤ 4 Days</span>
                  </label>
                </div>

                <div className="flex items-center ml-auto">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-green-600 cursor-pointer bg-green-50 hover:bg-green-100 px-4 py-2.5 rounded-lg transition-colors border border-green-100/50 shadow-sm"
                    title="Export to Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>

              {/* Minimal Table */}
              <div className="bg-white border-x border-b border-gray-100 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-semibold w-16">#</th>
                        <th className="px-6 py-4 font-semibold">Project</th>
                        <th className="px-6 py-4 font-semibold text-gray-400">
                          Order ID
                        </th>
                        <th className="px-6 py-4 font-semibold">
                          Phase / Profile
                        </th>
                        <th className="px-6 py-4 font-semibold">Assignee</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-center">
                          Delivery Date
                        </th>
                        <th className="px-6 py-4 font-semibold text-center">
                          Days Left
                        </th>
                        <th className="px-6 py-4 font-semibold text-center">
                          Value
                        </th>
                        {user?.role === "Admin" && (
                          <th className="px-6 py-4 font-semibold text-center">
                            Plan
                          </th>
                        )}
                        <th className="px-6 py-4 font-semibold text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {projects.map((p, index) => (
                        <tr
                          key={p._id}
                          className={`group hover:bg-gray-50/50 transition-colors ${getRowClass(p)}`}
                        >
                          <td className="px-6 py-5">
                            <span className="text-gray-400 font-semibold">
                              {(filters.page - 1) * filters.limit + index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-semibold text-gray-900 flex items-center space-x-2">
                              <span>{p.projectName}</span>
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              {p.clientName}
                            </div>
                            {p.lastUpdateNote && (
                              <div
                                className="text-gray-400 text-xs mt-1 italic truncate max-w-[200px]"
                                title={p.lastUpdateNote}
                              >
                                "{p.lastUpdateNote}"
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-mono text-[11px] font-semibold text-gray-400 bg-gray-50 px-2 py-1 inline-block rounded border border-gray-100 uppercase tracking-widest">
                              {p.orderId || "---"}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-gray-900 font-medium whitespace-normal max-w-[150px]">
                              {Array.isArray(p.currentPhase)
                                ? p.currentPhase.join(", ")
                                : p.currentPhase}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              {p.profileName}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-gray-900 font-semibold">
                              {p.assignedTo?.name || "---"}
                            </div>
                            {p.otherMembers && p.otherMembers.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5 max-w-[150px]">
                                {p.otherMembers.map((om) => (
                                  <span
                                    key={om._id}
                                    className="bg-gray-100/80 text-gray-500 px-1.5 py-0.5 rounded text-[10px] border border-gray-200 font-medium tracking-wide uppercase"
                                  >
                                    {om.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <span
                              className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md ${
                                p.status === "Delivered"
                                  ? "bg-gray-100 text-gray-700"
                                  : p.status === "In Progress"
                                    ? "bg-blue-50 text-blue-600"
                                    : p.status === "Revision"
                                      ? "bg-orange-50 text-orange-600"
                                      : "bg-red-50 text-red-600"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="font-bold text-gray-900 text-xs tracking-wide">
                              {p.deliveryDate
                                ? format(
                                    new Date(p.deliveryDate),
                                    "MMM dd, yyyy",
                                  )
                                : "N/A"}
                            </div>
                            {p.firstDeliveryDate && (
                              <div className="mt-1.5 pt-1.5 border-t border-gray-100/50">
                                <div className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">
                                  1st Delivery
                                </div>
                                <div className="font-semibold text-gray-600 text-[10px]">
                                  {format(
                                    new Date(p.firstDeliveryDate),
                                    "MMM dd, yyyy",
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="text-[11px] font-bold text-blue-600">
                              {calculateDaysLeft(p.deliveryDate, p.status)}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center font-semibold text-gray-900">
                            ${p.projectValue}
                          </td>
                          {user?.role === "Admin" && (
                            <td className="px-6 py-5 text-center">
                              <input
                                type="checkbox"
                                checked={p.isPlanned}
                                onChange={(e) =>
                                  handleTogglePlan(p._id, e.target.checked)
                                }
                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600 cursor-pointer transition"
                              />
                            </td>
                          )}
                          <td className="px-6 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => {
                                  setEditProject(p);
                                  setIsModalOpen(true);
                                }}
                                className="text-gray-400 hover:text-gray-900"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProject(p._id)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {projects.length === 0 && (
                        <tr>
                          <td
                            colSpan="7"
                            className="px-6 py-20 text-center text-gray-400 font-medium"
                          >
                            No projects found tracking this filter...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center bg-gray-50/50 px-6 py-4 border-t border-gray-100 rounded-b-2xl">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Showing {projects.length} of {pagination.totalProjects}{" "}
                      Match
                    </span>
                    <div className="flex space-x-2">
                      <button
                        disabled={filters.page === 1}
                        onClick={() =>
                          setFilters({ ...filters, page: filters.page - 1 })
                        }
                        className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 transition-all shadow-sm"
                      >
                        Prev
                      </button>
                      <button
                        disabled={
                          filters.page === pagination.totalPages ||
                          pagination.totalPages === 0
                        }
                        onClick={() =>
                          setFilters({ ...filters, page: filters.page + 1 })
                        }
                        className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 transition-all shadow-sm"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "members" && renderCrudBlock("members")}
          {activeTab === "profiles" && renderCrudBlock("profiles")}
        </div>
      </main>

      {isModalOpen && (
        <ProjectModal
          onClose={() => {
            setIsModalOpen(false);
            setEditProject(null);
          }}
          refresh={refreshAll}
          members={members}
          profiles={profiles}
          editData={editProject}
        />
      )}

      {isGuideOpen && <UserGuideModal onClose={() => setIsGuideOpen(false)} />}
    </div>
  );
}
