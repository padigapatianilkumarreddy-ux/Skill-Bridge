const initialTutors = [
  {id:"maya",name:"Maya Patel",initials:"MP",year:"3rd year · CSE",subject:"Programming",skill:"Python & Data Structures",tags:["Python","Problem solving"],rating:"4.9",reviews:28,mode:"Online",availability:"Free this week",price:"Skill exchange",bio:"I make coding concepts less scary, one problem at a time.",cover:"cover-mint",emoji:"💻",avatar:"#dcebd2"},
  {id:"arjun",name:"Arjun Mehta",initials:"AM",year:"2nd year · Design",subject:"Design",skill:"UI/UX & Figma",tags:["Figma","UI design"],rating:"4.8",reviews:19,mode:"In person",availability:"Weekends",price:"Free session",bio:"Let's turn your rough ideas into clean, usable interfaces.",cover:"cover-peach",emoji:"🎨",avatar:"#f3dfd1"},
  {id:"sana",name:"Sana Rahman",initials:"SR",year:"3rd year · Mathematics",subject:"Mathematics",skill:"Calculus & Algebra",tags:["Calculus","Linear algebra"],rating:"5.0",reviews:34,mode:"Online",availability:"Available today",price:"Skill exchange",bio:"Patient math tutor who loves finding the simple explanation.",cover:"cover-blue",emoji:"📐",avatar:"#dce8f2"},
  {id:"rohan",name:"Rohan Singh",initials:"RS",year:"2nd year · Languages",subject:"Languages",skill:"English speaking",tags:["Conversation","Writing"],rating:"4.7",reviews:15,mode:"Skill exchange",availability:"Evenings",price:"Skill exchange",bio:"Practice English in a relaxed, friendly, no-pressure space.",cover:"cover-lilac",emoji:"💬",avatar:"#e8def2"},
  {id:"isha",name:"Isha Verma",initials:"IV",year:"4th year · Electronics",subject:"Science",skill:"Physics & Electronics",tags:["Circuits","Physics"],rating:"4.9",reviews:22,mode:"In person",availability:"Tue & Thu",price:"Free session",bio:"From circuit diagrams to concepts, let's learn by doing.",cover:"cover-yellow",emoji:"⚡",avatar:"#f1e9c9"},
  {id:"kabir",name:"Kabir Das",initials:"KD",year:"3rd year · Business",subject:"Business",skill:"Presentation & Excel",tags:["Excel","Public speaking"],rating:"4.8",reviews:17,mode:"Online",availability:"Flexible",price:"Skill exchange",bio:"Build confidence in presentations and get comfortable with Excel.",cover:"cover-pink",emoji:"📊",avatar:"#f0dce3"}
];
const STORAGE_KEYS = {
  requests: "skillbridge_requests_v1",
  profile: "skillbridge_profile_v1",
  customTutors: "skillbridge_custom_tutors_v1",
  currentUser: "skillbridge_current_user_v1",
  users: "skillbridge_users_v1"
};
let tutors = [...initialTutors, ...readStore(STORAGE_KEYS.customTutors, [])];
let activePeer = null;
let toastTimer;

function readStore(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
}
function saveStore(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}
function getFilters() {
  return {
    query: document.getElementById("searchInput").value.trim().toLowerCase(),
    subject: document.getElementById("subjectFilter").value,
    mode: document.getElementById("modeFilter").value
  };
}
function renderTutors() {
  const {query, subject, mode} = getFilters();
  const filtered = tutors.filter(t => {
    const searchable = [t.name,t.skill,t.subject,t.bio,...(t.tags||[])].join(" ").toLowerCase();
    return (!query || searchable.includes(query)) && (subject === "all" || t.subject === subject) && (mode === "all" || t.mode === mode);
  });
  document.getElementById("resultCount").textContent = `${filtered.length} ${filtered.length === 1 ? "peer" : "peers"}`;
  document.getElementById("emptyState").classList.toggle("hidden", filtered.length > 0);
  document.getElementById("tutorGrid").classList.toggle("hidden", filtered.length === 0);
  document.getElementById("tutorGrid").innerHTML = filtered.map(t => `
    <article class="tutor-card">
      <div class="tutor-cover ${escapeHTML(t.cover || "cover-mint")}"><span class="skill-badge">${escapeHTML(t.subject)}</span><span class="tutor-emoji">${escapeHTML(t.emoji || "🌱")}</span></div>
      <div class="tutor-content">
        <div class="tutor-heading"><div class="tutor-avatar" style="background:${escapeHTML(t.avatar || "#e8f4d9")}">${escapeHTML(t.initials)}</div><div><h3>${escapeHTML(t.name)}</h3><p>${escapeHTML(t.year || "Student tutor")}</p></div><div class="rating"><span>★</span> ${escapeHTML(t.rating || "New")} <span style="color:#929a91">(${escapeHTML(t.reviews ?? 0)})</span></div></div>
        <p class="tutor-bio">${escapeHTML(t.bio)}</p>
        <div class="skill-tags"><span class="skill-tag">${escapeHTML(t.skill)}</span>${(t.tags||[]).slice(0,1).map(tag=>`<span class="skill-tag">${escapeHTML(tag)}</span>`).join("")}</div>
        <div class="tutor-footer"><span class="availability">${escapeHTML(t.availability || "Flexible schedule")} · ${escapeHTML(t.mode)}</span><button class="tutor-action" data-request="${escapeHTML(t.id)}">Connect ↗</button></div>
      </div>
    </article>`).join("");
}
function syncHeaderAuth() {
  const currentUser = readStore(STORAGE_KEYS.currentUser, null);
  const guestNav = document.getElementById("authGuestNav");
  const userNav = document.getElementById("authUserNav");
  const userNameChip = document.getElementById("navUserName");
  const userAvatarChip = document.getElementById("navUserAvatar");
  const mobileSignIn = document.getElementById("mobileSignIn");
  const mobileSignUp = document.getElementById("mobileSignUp");
  const dashboardAuthLink = document.getElementById("dashboardAuthLink");

  if (currentUser && currentUser.name) {
    if (guestNav) guestNav.classList.add("hidden");
    if (userNav) userNav.classList.remove("hidden");
    if (userNameChip) userNameChip.textContent = currentUser.name.split(" ")[0];
    if (userAvatarChip) {
      userAvatarChip.textContent = currentUser.initials || "SB";
      if (currentUser.avatarBg) userAvatarChip.style.background = currentUser.avatarBg;
    }
    if (mobileSignIn) {
      mobileSignIn.textContent = `Sign out (${currentUser.name.split(" ")[0]})`;
      mobileSignIn.href = "#";
      mobileSignIn.onclick = (e) => { e.preventDefault(); handleLogout(); };
    }
    if (mobileSignUp) mobileSignUp.classList.add("hidden");
    if (dashboardAuthLink) {
      dashboardAuthLink.textContent = "Switch Account ↗";
    }
  } else {
    if (guestNav) guestNav.classList.remove("hidden");
    if (userNav) userNav.classList.add("hidden");
    if (mobileSignIn) {
      mobileSignIn.textContent = "Sign in";
      mobileSignIn.href = "login.html?tab=signin";
      mobileSignIn.onclick = null;
    }
    if (mobileSignUp) mobileSignUp.classList.remove("hidden");
    if (dashboardAuthLink) {
      dashboardAuthLink.textContent = "Sign in / Switch ↗";
    }
  }
}

function handleLogout() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  syncHeaderAuth();
  updateDashboard();
  showToast("You have been signed out.");
}

function openModal(peer = null, mode = "request") {
  activePeer = peer;
  const isListing = mode === "listing";
  const currentUser = readStore(STORAGE_KEYS.currentUser, null);
  const profile = readStore(STORAGE_KEYS.profile, {});

  document.getElementById("modalKicker").textContent = isListing ? "SHARE WHAT YOU KNOW" : "LET'S CONNECT";
  document.getElementById("modalTitle").textContent = isListing ? "List your skill" : `Connect with ${peer ? peer.name.split(" ")[0] : "a peer"}`;
  document.getElementById("modalDescription").textContent = isListing ? "Add a skill and help another student learn something new." : "Tell your peer a little about what you want to learn.";
  document.getElementById("requestForm").dataset.mode = mode;
  document.getElementById("peerId").value = peer ? peer.id : "";
  document.getElementById("requesterName").value = currentUser?.name || profile.name || "";
  document.getElementById("requestTopic").value = isListing ? "" : (peer ? peer.skill : "");
  document.getElementById("requestTopic").placeholder = isListing ? "e.g. HTML & CSS basics" : "e.g. JavaScript fundamentals";
  document.getElementById("requestDate").value = "";
  document.getElementById("requestDate").min = new Date().toISOString().slice(0,10);
  document.getElementById("requestTime").value = "";
  document.getElementById("requestMode").value = peer?.mode === "Skill exchange" ? "Skill exchange" : (peer?.mode || "Online");
  document.getElementById("requestNote").value = "";
  document.getElementById("formError").classList.add("hidden");
  document.getElementById("modalBackdrop").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  setTimeout(() => document.getElementById("requesterName").focus(), 50);
}
function closeModal() {
  document.getElementById("modalBackdrop").classList.add("hidden");
  document.body.style.overflow = "";
}
function updateDashboard() {
  const requests = readStore(STORAGE_KEYS.requests, []);
  const profile = readStore(STORAGE_KEYS.profile, {});
  const currentUser = readStore(STORAGE_KEYS.currentUser, null);

  const activeName = currentUser?.name || profile.name;
  const activeSkill = currentUser?.skill || profile.skill;
  const activeYear = currentUser?.year || profile.year;
  const activeInitials = currentUser?.initials || (activeName ? activeName.split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase() : "YU");

  document.getElementById("requestMetric").textContent = requests.length;
  document.getElementById("skillsMetric").textContent = activeSkill ? 1 : tutors.filter(t=>t.owner).length;
  document.getElementById("hoursMetric").textContent = requests.filter(r=>r.status==="Accepted").length;

  const initialsEl = document.getElementById("profileInitials");
  if (initialsEl) {
    initialsEl.textContent = activeInitials;
    if (currentUser?.avatarBg) {
      initialsEl.style.backgroundColor = currentUser.avatarBg;
    }
  }

  const nameDisplay = document.getElementById("dashboardUserNameDisplay");
  if (nameDisplay) {
    nameDisplay.innerHTML = activeName ? `Hey, ${escapeHTML(activeName.split(" ")[0])} <span>✦</span>` : `Hey, learner <span>✦</span>`;
  }

  const greetingDesc = document.getElementById("dashboardGreetingDesc");
  if (greetingDesc && activeName) {
    greetingDesc.textContent = `Welcome back, ${activeName}! Registered in ${activeYear || "Campus"} · ${activeSkill ? 'Sharing ' + activeSkill : 'Ready to learn'}.`;
  }

  const list = document.getElementById("requestList");
  if (!requests.length) {
    list.innerHTML = `<div class="request-empty"><span>☷</span><div><strong>Your next chapter starts here</strong><small>Send a request to a peer and it will show up here.</small></div></div>`;
    return;
  }
  list.innerHTML = requests.slice().reverse().slice(0,4).map(r => `
    <div class="request-item"><div class="request-person">${escapeHTML((r.peerName||"Peer").split(" ").map(n=>n[0]).join("").slice(0,2))}</div><div><strong>${escapeHTML(r.peerName)} · ${escapeHTML(r.topic)}</strong><small>${escapeHTML(r.date)} at ${escapeHTML(r.time)} · ${escapeHTML(r.mode)}</small></div><span class="status-pill ${r.status==="Accepted"?"status-accepted":r.status==="Declined"?"status-declined":""}">${escapeHTML(r.status)}</span></div>`).join("");
}
function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("subjectFilter").value = "all";
  document.getElementById("modeFilter").value = "all";
  renderTutors();
}
function profileSetup() {
  const currentUser = readStore(STORAGE_KEYS.currentUser, null);
  if (!currentUser) {
    if (confirm("Would you like to sign in or create an account to save your profile across sessions?")) {
      window.location.href = "login.html?tab=signup";
      return;
    }
  }
  const existing = currentUser || readStore(STORAGE_KEYS.profile, {});
  const name = prompt("What name should we show on your student dashboard?", existing.name || "");
  if (name === null) return;
  if (!name.trim()) { showToast("Please enter a name to set up your profile."); return; }
  const skill = prompt("What's one skill you can teach? (Optional — leave blank to skip)", existing.skill || "");
  const updated = {...existing, name:name.trim(), skill:(skill || "").trim()};

  if (currentUser) {
    saveStore(STORAGE_KEYS.currentUser, updated);
  }
  saveStore(STORAGE_KEYS.profile, updated);
  syncHeaderAuth();
  updateDashboard();
  showToast("Your student profile has been updated!");
}
function showRequests() {
  const requests = readStore(STORAGE_KEYS.requests, []);
  if (!requests.length) { showToast("No session requests yet. Connect with a peer to get started."); return; }
  const summary = requests.map((r,i)=>`${i+1}. ${r.peerName} — ${r.topic} (${r.date}, ${r.time}) [${r.status}]`).join("\n");
  alert("YOUR SESSION REQUESTS\n\n" + summary + "\n\nDemo note: requests are saved in this browser.");
}
document.getElementById("tutorGrid").addEventListener("click", e => {
  const button = e.target.closest("[data-request]");
  if (!button) return;
  const peer = tutors.find(t => t.id === button.dataset.request);
  if (peer) openModal(peer);
});
document.getElementById("requestForm").addEventListener("submit", e => {
  e.preventDefault();
  const form = e.currentTarget;
  const mode = form.dataset.mode;
  const name = document.getElementById("requesterName").value.trim();
  const topic = document.getElementById("requestTopic").value.trim();
  if (!name || !topic) { document.getElementById("formError").textContent = "Please fill in your name and topic."; document.getElementById("formError").classList.remove("hidden"); return; }
  if (mode === "listing") {
    const profile = readStore(STORAGE_KEYS.profile, {});
    saveStore(STORAGE_KEYS.profile, {...profile,name,skill:topic});
    showToast("Skill saved to your profile!");
    closeModal(); updateDashboard(); return;
  }
  const peer = tutors.find(t=>t.id===document.getElementById("peerId").value);
  if (!peer) { document.getElementById("formError").textContent = "Please choose a peer from the marketplace."; document.getElementById("formError").classList.remove("hidden"); return; }
  const request = {
    id: `req-${Date.now()}`, requester:name, peerId:peer.id, peerName:peer.name, topic,
    date:document.getElementById("requestDate").value,
    time:document.getElementById("requestTime").value,
    mode:document.getElementById("requestMode").value,
    note:document.getElementById("requestNote").value.trim(), status:"Pending",
    createdAt:new Date().toISOString()
  };
  if (!request.date || !request.time) { document.getElementById("formError").textContent = "Please choose a date and time for your session."; document.getElementById("formError").classList.remove("hidden"); return; }
  const requests = readStore(STORAGE_KEYS.requests, []);
  requests.push(request); saveStore(STORAGE_KEYS.requests, requests);
  const profile = readStore(STORAGE_KEYS.profile, {});
  if (!profile.name) saveStore(STORAGE_KEYS.profile, {...profile,name});
  closeModal(); updateDashboard(); showToast(`Request sent to ${peer.name}!`);
  document.getElementById("notificationDot").style.display = "block";
});
document.getElementById("searchButton").addEventListener("click", renderTutors);
document.getElementById("searchInput").addEventListener("input", renderTutors);
document.getElementById("subjectFilter").addEventListener("change", renderTutors);
document.getElementById("modeFilter").addEventListener("change", renderTutors);
document.getElementById("clearFilters").addEventListener("click", resetFilters);
document.getElementById("emptyReset").addEventListener("click", resetFilters);
document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalBackdrop").addEventListener("click", e => { if(e.target.id==="modalBackdrop") closeModal(); });
document.addEventListener("keydown", e => { if(e.key==="Escape") closeModal(); });
document.getElementById("teachButton").addEventListener("click", ()=>openModal(null,"listing"));
document.getElementById("ctaTeach").addEventListener("click", ()=>openModal(null,"listing"));
document.getElementById("profileButton").addEventListener("click", profileSetup);
document.getElementById("headerLogoutBtn")?.addEventListener("click", handleLogout);
document.getElementById("viewRequests").addEventListener("click", showRequests);
document.getElementById("notificationsButton").addEventListener("click", () => {
  document.getElementById("notificationDot").style.display="none";
  showRequests();
});
document.getElementById("mobileMenu").addEventListener("click", () => document.getElementById("navLinks").classList.toggle("open"));
document.querySelectorAll("#navLinks a").forEach(a=>a.addEventListener("click",()=>document.getElementById("navLinks").classList.remove("open")));

renderTutors();
syncHeaderAuth();
updateDashboard();

