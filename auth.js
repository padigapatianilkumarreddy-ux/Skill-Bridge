/* ==========================================================================
   SkillBridge — Authentication Logic (Sign In & Sign Up)
   Client-side authentication with localStorage persistence & session state
   ========================================================================== */

const STORAGE_KEYS = {
  users: "skillbridge_users_v1",
  currentUser: "skillbridge_current_user_v1",
  profile: "skillbridge_profile_v1",
  customTutors: "skillbridge_custom_tutors_v1"
};

// Seed default demo accounts if not already present
const DEFAULT_DEMO_USERS = [
  {
    id: "usr_maya",
    name: "Maya Patel",
    email: "maya@campus.edu",
    password: "password123",
    year: "3rd year · CSE",
    skill: "Python & Data Structures",
    role: "tutor",
    initials: "MP",
    avatarBg: "#dcebd2",
    createdAt: "2026-09-01T10:00:00.000Z"
  },
  {
    id: "usr_arjun",
    name: "Arjun Mehta",
    email: "arjun@campus.edu",
    password: "password123",
    year: "2nd year · Design",
    skill: "UI/UX & Figma",
    role: "tutor",
    initials: "AM",
    avatarBg: "#f3dfd1",
    createdAt: "2026-09-10T11:00:00.000Z"
  },
  {
    id: "usr_alex",
    name: "Alex Chen",
    email: "student@campus.edu",
    password: "password123",
    year: "1st year · Engineering",
    skill: "Mathematics & Calculus",
    role: "student",
    initials: "AC",
    avatarBg: "#dce8f2",
    createdAt: "2026-10-01T09:30:00.000Z"
  }
];

// Helper: Read from localStorage
function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (e) {
    console.error("Error reading localStorage key", key, e);
    return fallback;
  }
}

// Helper: Save to localStorage
function saveStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Error saving localStorage key", key, e);
  }
}

// Helper: HTML sanitization
function escapeHTML(str) {
  return String(str ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

// Toast notification
let toastTimer;
function showToast(message) {
  const toast = document.getElementById("authToast");
  const toastText = document.getElementById("toastText");
  if (!toast || !toastText) return;
  toastText.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

// Initialize seed users if storage is empty
function initializeUsers() {
  const existing = readStore(STORAGE_KEYS.users, null);
  if (!existing || !Array.isArray(existing) || existing.length === 0) {
    saveStore(STORAGE_KEYS.users, DEFAULT_DEMO_USERS);
  }
}

// Active tab management (signin vs signup)
function setAuthTab(tabName) {
  const isSignIn = tabName === "signin";

  const tabSignIn = document.getElementById("tabSignIn");
  const tabSignUp = document.getElementById("tabSignUp");
  const formSignIn = document.getElementById("formSignIn");
  const formSignUp = document.getElementById("formSignUp");

  if (tabSignIn && tabSignUp && formSignIn && formSignUp) {
    tabSignIn.classList.toggle("active", isSignIn);
    tabSignUp.classList.toggle("active", !isSignIn);
    tabSignIn.setAttribute("aria-selected", isSignIn ? "true" : "false");
    tabSignUp.setAttribute("aria-selected", !isSignIn ? "true" : "false");

    formSignIn.classList.toggle("hidden", !isSignIn);
    formSignUp.classList.toggle("hidden", isSignIn);

    // Clear alert boxes
    hideAlerts();

    // Focus initial input
    setTimeout(() => {
      if (isSignIn) {
        document.getElementById("signinEmail")?.focus();
      } else {
        document.getElementById("signupName")?.focus();
      }
    }, 50);

    // Update URL query parameter without refresh
    try {
      const url = new URL(window.location);
      url.searchParams.set("tab", tabName);
      window.history.replaceState({}, "", url);
    } catch (e) {}
  }
}

// Hide alert boxes
function hideAlerts() {
  const signinAlert = document.getElementById("signinAlert");
  const signupAlert = document.getElementById("signupAlert");
  if (signinAlert) signinAlert.classList.add("hidden");
  if (signupAlert) signupAlert.classList.add("hidden");
}

function showAlert(elementId, message, type = "danger") {
  const alertEl = document.getElementById(elementId);
  if (!alertEl) return;
  alertEl.textContent = message;
  alertEl.className = `alert-box ${type}`;
  alertEl.classList.remove("hidden");
}

// Password toggle helper
function setupPasswordToggles() {
  document.querySelectorAll("[data-toggle-password]").forEach(button => {
    button.addEventListener("click", () => {
      const targetInputId = button.getAttribute("data-toggle-password");
      const input = document.getElementById(targetInputId);
      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        button.textContent = "🙈";
        button.setAttribute("aria-label", "Hide password");
      } else {
        input.type = "password";
        button.textContent = "👁";
        button.setAttribute("aria-label", "Show password");
      }
    });
  });
}

// Password strength calculator
function calculatePasswordStrength(pass) {
  let score = 0;
  if (!pass) return { score: 0, text: "" };
  if (pass.length >= 6) score += 1;
  if (pass.length >= 9) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score += 1;

  if (score <= 1) return { score: 1, text: "Weak", level: "weak" };
  if (score <= 3) return { score: 2, text: "Good", level: "medium" };
  return { score: 3, text: "Strong", level: "strong" };
}

function setupStrengthMeter() {
  const passInput = document.getElementById("signupPassword");
  const bar = document.getElementById("strengthBar");
  const label = document.getElementById("strengthLabel");

  if (!passInput || !bar || !label) return;

  passInput.addEventListener("input", () => {
    const val = passInput.value;
    if (!val) {
      bar.className = "strength-bar";
      label.textContent = "Enter a password";
      return;
    }
    const result = calculatePasswordStrength(val);
    bar.className = `strength-bar ${result.level}`;
    label.textContent = `Strength: ${result.text}`;
  });
}

// Quick demo login fill & action
function setupDemoLoginButtons() {
  document.querySelectorAll("[data-demo-email]").forEach(btn => {
    btn.addEventListener("click", () => {
      const email = btn.getAttribute("data-demo-email");
      const pass = btn.getAttribute("data-demo-pass") || "password123";

      setAuthTab("signin");
      const emailInput = document.getElementById("signinEmail");
      const passInput = document.getElementById("signinPassword");

      if (emailInput && passInput) {
        emailInput.value = email;
        passInput.value = pass;
        showToast(`Auto-filled: ${email}`);

        // Automatically trigger submit for smooth testing
        setTimeout(() => {
          document.getElementById("formSignIn")?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }, 300);
      }
    });
  });
}

// User initials generator
function getInitials(name) {
  if (!name) return "SB";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Pastel avatar color picker
const AVATAR_COLORS = ["#dcebd2", "#f3dfd1", "#dce8f2", "#e8def2", "#f1e9c9", "#f0dce3", "#d6edb9"];
function getRandomAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// Handle Sign In submission
function handleSignIn(e) {
  e.preventDefault();
  hideAlerts();

  const email = document.getElementById("signinEmail").value.trim().toLowerCase();
  const password = document.getElementById("signinPassword").value;

  if (!email || !password) {
    showAlert("signinAlert", "Please enter both your student email and password.");
    return;
  }

  const users = readStore(STORAGE_KEYS.users, DEFAULT_DEMO_USERS);
  const foundUser = users.find(u => u.email.toLowerCase() === email);

  if (!foundUser) {
    showAlert("signinAlert", "No account found with this email. Please check your credentials or create an account.");
    return;
  }

  if (foundUser.password !== password) {
    showAlert("signinAlert", "Incorrect password. If you are testing, use 'password123'.");
    return;
  }

  // Set session in localStorage
  const sessionUser = {
    id: foundUser.id,
    name: foundUser.name,
    email: foundUser.email,
    year: foundUser.year || "Student",
    skill: foundUser.skill || "",
    initials: foundUser.initials || getInitials(foundUser.name),
    avatarBg: foundUser.avatarBg || "#dcebd2",
    role: foundUser.role || "student"
  };

  saveStore(STORAGE_KEYS.currentUser, sessionUser);

  // Also sync with profile store used by dashboard
  const currentProfile = readStore(STORAGE_KEYS.profile, {});
  saveStore(STORAGE_KEYS.profile, {
    ...currentProfile,
    name: sessionUser.name,
    skill: sessionUser.skill,
    year: sessionUser.year,
    email: sessionUser.email
  });

  showAlert("signinAlert", `Welcome back, ${foundUser.name}! Logging you in...`, "success");
  showToast(`Signed in as ${foundUser.name}`);

  // Redirect to dashboard after brief delay
  setTimeout(() => {
    window.location.href = "index.html#dashboard";
  }, 750);
}

// Handle Sign Up submission
function handleSignUp(e) {
  e.preventDefault();
  hideAlerts();

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim().toLowerCase();
  const year = document.getElementById("signupYear").value;
  const skill = document.getElementById("signupSkill").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("signupConfirmPassword").value;
  const listAsTutor = document.getElementById("listAsTutor")?.checked;
  const termsAgreed = document.getElementById("termsAgree")?.checked;

  if (!name || !email || !year || !password || !confirmPassword) {
    showAlert("signupAlert", "Please fill in all required fields.");
    return;
  }

  if (!termsAgreed) {
    showAlert("signupAlert", "Please agree to the campus peer community guidelines.");
    return;
  }

  // Validate email format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showAlert("signupAlert", "Please enter a valid email address (e.g., student@campus.edu).");
    return;
  }

  // Check password rules
  if (password.length < 6) {
    showAlert("signupAlert", "Password must be at least 6 characters long.");
    return;
  }

  if (password !== confirmPassword) {
    showAlert("signupAlert", "Passwords do not match. Please verify.");
    return;
  }

  // Check if user already exists
  const users = readStore(STORAGE_KEYS.users, DEFAULT_DEMO_USERS);
  const exists = users.some(u => u.email.toLowerCase() === email);
  if (exists) {
    showAlert("signupAlert", "An account with this email already exists. Please sign in instead.");
    return;
  }

  const initials = getInitials(name);
  const avatarBg = getRandomAvatarColor();

  const newUser = {
    id: `usr_${Date.now()}`,
    name,
    email,
    password,
    year,
    skill: skill || "General Student",
    role: listAsTutor ? "tutor" : "student",
    initials,
    avatarBg,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveStore(STORAGE_KEYS.users, users);

  // If user opted to list as tutor, create custom tutor record in marketplace
  if (listAsTutor && skill) {
    const customTutors = readStore(STORAGE_KEYS.customTutors, []);
    const newTutorRecord = {
      id: `tutor_${Date.now()}`,
      owner: true,
      name,
      initials,
      year,
      subject: determineSubjectCategory(skill),
      skill,
      tags: [skill.split(" ")[0] || "Tutoring", "Peer Learning"],
      rating: "5.0",
      reviews: 1,
      mode: "Online",
      availability: "Flexible schedule",
      price: "Skill exchange",
      bio: `Hi! I'm ${name} (${year}). I'm excited to share my knowledge in ${skill} and learn from peers!`,
      cover: "cover-mint",
      emoji: "🎓",
      avatar: avatarBg
    };
    customTutors.push(newTutorRecord);
    saveStore(STORAGE_KEYS.customTutors, customTutors);
  }

  // Auto sign-in new user
  const sessionUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    year: newUser.year,
    skill: newUser.skill,
    initials: newUser.initials,
    avatarBg: newUser.avatarBg,
    role: newUser.role
  };

  saveStore(STORAGE_KEYS.currentUser, sessionUser);
  saveStore(STORAGE_KEYS.profile, {
    name: sessionUser.name,
    skill: sessionUser.skill,
    year: sessionUser.year,
    email: sessionUser.email
  });

  showAlert("signupAlert", `Account created successfully! Welcome to SkillBridge, ${name}.`, "success");
  showToast("Account created! Redirecting to dashboard...");

  setTimeout(() => {
    window.location.href = "index.html#dashboard";
  }, 900);
}

// Simple heuristic to match skill to subject category
function determineSubjectCategory(skillText) {
  const text = (skillText || "").toLowerCase();
  if (text.includes("python") || text.includes("code") || text.includes("java") || text.includes("web") || text.includes("html") || text.includes("data structure")) return "Programming";
  if (text.includes("figma") || text.includes("design") || text.includes("ui") || text.includes("ux") || text.includes("graphic")) return "Design";
  if (text.includes("math") || text.includes("calculus") || text.includes("algebra") || text.includes("stats")) return "Mathematics";
  if (text.includes("physics") || text.includes("chem") || text.includes("circuits") || text.includes("bio")) return "Science";
  if (text.includes("english") || text.includes("spanish") || text.includes("french") || text.includes("german") || text.includes("language")) return "Languages";
  if (text.includes("excel") || text.includes("business") || text.includes("finance") || text.includes("marketing")) return "Business";
  if (text.includes("guitar") || text.includes("piano") || text.includes("music") || text.includes("vocal")) return "Music";
  return "Programming";
}

// Forgot Password modal setup
function setupForgotModal() {
  const forgotBtn = document.getElementById("forgotPasswordBtn");
  const modal = document.getElementById("forgotModal");
  const closeBtn = document.getElementById("forgotModalClose");
  const sendBtn = document.getElementById("sendResetBtn");
  const emailInput = document.getElementById("resetEmailInput");
  const resetFeedback = document.getElementById("resetFeedback");

  if (!forgotBtn || !modal) return;

  forgotBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
    if (emailInput) {
      emailInput.value = document.getElementById("signinEmail")?.value || "";
      setTimeout(() => emailInput.focus(), 50);
    }
  });

  const closeModal = () => {
    modal.classList.add("hidden");
    if (resetFeedback) resetFeedback.classList.add("hidden");
  };

  closeBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  sendBtn?.addEventListener("click", () => {
    const email = (emailInput?.value || "").trim().toLowerCase();
    if (!email) {
      if (resetFeedback) {
        resetFeedback.textContent = "Please enter your student email.";
        resetFeedback.className = "alert-box danger";
        resetFeedback.classList.remove("hidden");
      }
      return;
    }

    if (resetFeedback) {
      resetFeedback.innerHTML = `Demo note: A simulated reset link has been dispatched to <b>${escapeHTML(email)}</b>. You can also sign in with the default password: <code>password123</code>.`;
      resetFeedback.className = "alert-box success";
      resetFeedback.classList.remove("hidden");
    }
  });
}

// On DOM Ready initialization
document.addEventListener("DOMContentLoaded", () => {
  initializeUsers();
  setupPasswordToggles();
  setupStrengthMeter();
  setupDemoLoginButtons();
  setupForgotModal();

  // Handle URL tab param (?tab=signup or ?tab=signin)
  const urlParams = new URLSearchParams(window.location.search);
  const requestedTab = urlParams.get("tab");
  if (requestedTab === "signup" || requestedTab === "register") {
    setAuthTab("signup");
  } else {
    setAuthTab("signin");
  }

  // Tab switch buttons
  document.getElementById("tabSignIn")?.addEventListener("click", () => setAuthTab("signin"));
  document.getElementById("tabSignUp")?.addEventListener("click", () => setAuthTab("signup"));
  document.getElementById("switchToSignUp")?.addEventListener("click", () => setAuthTab("signup"));
  document.getElementById("switchToSignIn")?.addEventListener("click", () => setAuthTab("signin"));

  // Form submit handlers
  document.getElementById("formSignIn")?.addEventListener("submit", handleSignIn);
  document.getElementById("formSignUp")?.addEventListener("submit", handleSignUp);

  // If already logged in, show helpful banner
  const current = readStore(STORAGE_KEYS.currentUser, null);
  if (current && current.name) {
    const banner = document.getElementById("alreadyLoggedInBanner");
    const bannerName = document.getElementById("bannerUserName");
    if (banner && bannerName) {
      bannerName.textContent = current.name;
      banner.classList.remove("hidden");
    }
  }
});
