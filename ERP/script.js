const pageInfo = {
  dashboard: { title: "Welcome back, Suhan 👋", subtitle: "Here’s what’s happening with your academics today.", heading: "Dashboard", symbol: "▦" },
  attendance: { title: "Attendance Overview", subtitle: "Review your attendance record by subject.", heading: "Attendance Details", symbol: "◷", rows: [
    ["Data Structures", "22 / 25 classes", "88%", "Good"], ["Database Management", "20 / 24 classes", "83.3%", "Good"], ["Computer Networks", "19 / 23 classes", "82.6%", "Good"], ["Web Technologies", "24 / 26 classes", "92.3%", "Good"], ["Engineering Mathematics", "18 / 24 classes", "75%", "Monitor"]
  ]},
  timetable: { title: "Class Timetable", subtitle: "Your weekly schedule at a glance.", heading: "Weekly Timetable", symbol: "▤", rows: [
    ["Monday", "Data Structures · 9:00 AM", "DBMS Lab · 10:15 AM", "Web Technologies · 1:30 PM"], ["Tuesday", "Engineering Mathematics · 9:00 AM", "Computer Networks · 11:30 AM", "Library · 2:30 PM"], ["Wednesday", "DBMS · 9:00 AM", "Data Structures Lab · 11:00 AM", "Web Technologies · 1:30 PM"], ["Thursday", "Computer Networks · 10:00 AM", "Engineering Mathematics · 12:00 PM", "Project Hour · 2:00 PM"], ["Friday", "Data Structures · 9:00 AM", "DBMS · 11:00 AM", "Mentor Hour · 2:00 PM"]
  ]},
  results: { title: "Results & Grades", subtitle: "Track your academic performance.", heading: "Semester Results", symbol: "▥", rows: [
    ["Data Structures", "Internal: 24 / 30", "A", "Published"], ["Database Management", "Internal: 26 / 30", "A+", "Published"], ["Computer Networks", "Internal: 21 / 30", "B+", "Published"], ["Engineering Mathematics", "Internal: 22 / 30", "B+", "Published"], ["Web Technologies", "Internal: Awaiting", "—", "Pending"]
  ]},
  fees: { title: "Fee Details", subtitle: "View your fee summary and payment status.", heading: "Fee Summary", symbol: "₹", rows: [
    ["Academic Year", "2026–27", "", "Active"], ["Tuition Fee", "₹ 1,21,000", "", "Sample"], ["College Fee", "₹ 25,000", "", "Sample"], ["Total Fee", "₹ 1,46,000", "", "Sample"], ["Outstanding Balance", "₹ 0", "", "No dues"]
  ]},
  assignments: { title: "Assignments", subtitle: "Stay on top of deadlines and coursework.", heading: "Assignment Tracker", symbol: "☷", rows: [
    ["Web Technologies", "Responsive landing page · Due 05 Nov", "", "In progress"], ["Data Structures", "Linked list exercises · Due 07 Nov", "", "Pending"], ["DBMS", "SQL query practice · Due 10 Nov", "", "Not started"], ["Computer Networks", "OSI model notes · Due 12 Nov", "", "Assigned"]
  ]},
  announcements: { title: "Announcements", subtitle: "Important updates from your college.", heading: "Recent Announcements", symbol: "♢", rows: [
    ["Internal assessment schedule", "Check the updated IA timetable for Semester 3.", "", "Today"], ["Workshop registration open", "Register for upcoming technical workshops.", "", "Yesterday"], ["Library reminder", "Please return books before the due date.", "", "2 days ago"], ["Project review", "Project guide allocation details will be shared soon.", "", "3 days ago"]
  ]}
};

const navButtons = [...document.querySelectorAll(".nav-item[data-page]")];
const dashboardPage = document.getElementById("dashboardPage");
const otherPage = document.getElementById("otherPage");
const toast = document.getElementById("toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function safeText(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function openPage(page) {
  const info = pageInfo[page] || pageInfo.dashboard;
  navButtons.forEach(button => button.classList.toggle("active", button.dataset.page === page));
  document.getElementById("crumb").textContent = info.heading;
  document.getElementById("pageTitle").textContent = info.title;
  document.getElementById("pageSubtitle").textContent = info.subtitle;
  dashboardPage.classList.toggle("hidden", page !== "dashboard");
  otherPage.classList.toggle("hidden", page === "dashboard");

  if (page !== "dashboard") {
    document.getElementById("detailHeading").textContent = info.heading;
    document.getElementById("detailDescription").textContent = info.subtitle;
    document.getElementById("detailSymbol").textContent = info.symbol;
    const content = document.getElementById("detailContent");
    content.innerHTML = `<div class="detail-list">${info.rows.map(row => `
      <div class="detail-row">
        <div><strong>${safeText(row[0])}</strong><div style="margin-top:5px;color:#9aa2b1;font-size:11px">${safeText(row[1])}</div></div>
        <div style="display:flex;align-items:center;gap:14px"><strong>${safeText(row[2] || "")}</strong><span class="pill ${/pending|monitor|progress|not started/i.test(row[3]) ? "pending" : ""}">${safeText(row[3])}</span></div>
      </div>`).join("")}</div>`;
  }
  document.getElementById("sidebar").classList.remove("open");
}

navButtons.forEach(button => button.addEventListener("click", () => openPage(button.dataset.page)));
document.querySelectorAll("[data-goto]").forEach(button => button.addEventListener("click", () => openPage(button.dataset.goto)));
document.getElementById("menuToggle").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("open"));
document.getElementById("notificationBtn").addEventListener("click", () => showToast("You’re all caught up!"));
document.getElementById("logoutBtn").addEventListener("click", () => showToast("Demo only: sign-out is not connected to an account."));

const today = new Date();
document.getElementById("todayLabel").textContent = today.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
