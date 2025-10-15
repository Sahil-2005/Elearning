// import { useState } from "react";
// import "./App.css";

// function App() {

//   return (
//     <>
//       <h1 class="text-3xl font-bold underline text-red-500">Hello world!</h1>
//     </>
//   );
// }

// export default App;


import React, { useEffect, useMemo, useState } from "react";

/**
 * Plain React JSX version of the E-Learning Portal component.
 * - Removed TypeScript annotations
 * - Removed "use client"
 * - Kept Tailwind-driven layout; adjusted some token syntax to Tailwind arbitrary values.
 *
 * Drop into any React app (CRA / Vite). Ensure Tailwind and any CSS variables (e.g., --color-brand) exist.
 */

export default function ELearningPortal() {
  // View state
  const [view, setView] = useState("auth"); // "auth" | "dashboard" | "course"
  const [activeTab, setActiveTab] = useState("login"); // "login" | "register"

  // Auth state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("Student"); // "Student" | "Teacher"

  const [currentUser, setCurrentUser] = useState(null); // { name, email, role } | null

  // API base
  const API_URL = (import.meta?.env?.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

  // Demo courses
  const [courses, setCourses] = useState([]);

  // Modal state (Teacher only)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const [newCourseDuration, setNewCourseDuration] = useState("6 Weeks");
  const [newCourseDifficulty, setNewCourseDifficulty] = useState("Beginner");
  const [newCourseCategories, setNewCourseCategories] = useState("React, UI");
  const [newCourseThumbnail, setNewCourseThumbnail] = useState("/new-course-thumbnail.jpg");
  const [newCourseThumbnailFile, setNewCourseThumbnailFile] = useState(null);
  const [newCourseVideoUrl, setNewCourseVideoUrl] = useState("");
  const [newCourseVideoFile, setNewCourseVideoFile] = useState(null);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editCourse, setEditCourse] = useState(null);

  const isTeacher = currentUser?.role === "Teacher";

  const greeting = useMemo(() => {
    if (!currentUser) return "Welcome";
    return currentUser.role === "Teacher"
      ? `Welcome, ${currentUser.name} (Teacher)`
      : `Welcome, ${currentUser.name}`;
  }, [currentUser]);

  async function handleLogin(e) {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");
      localStorage.setItem("token", data.token);
      setCurrentUser(data.user);
      setView("dashboard");
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, role: regRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Registration failed");
      localStorage.setItem("token", data.token);
      setCurrentUser(data.user);
      setView("dashboard");
    } catch (err) {
      alert(err.message);
    }
  }

  function handleLogout() {
    setCurrentUser(null);
    setView("auth");
    setActiveTab("login");
    setSelectedCourse(null);
    localStorage.removeItem("token");
  }

  async function fetchMe() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setCurrentUser(data.user);
      setView("dashboard");
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchMe();
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/courses`);
        const data = await res.json();
        if (!res.ok) return;
        const mapped = (data.courses || []).map((c) => ({
          id: c._id,
          title: c.title,
          instructorId: c.instructorId,
          instructor: c.instructorName,
          description: c.description,
          duration: c.duration,
          difficulty: c.difficulty,
          categories: c.categories || [],
          thumbnail: c.thumbnailUrl,
          videoUrl: c.videoUrl,
        }));
        setCourses(mapped);
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateCourse(e) {
    e.preventDefault();
    if (!newCourseTitle || !newCourseDescription) return;
    const token = localStorage.getItem("token");
    const form = new FormData();
    form.append("title", newCourseTitle);
    form.append("description", newCourseDescription);
    form.append("duration", newCourseDuration);
    form.append("difficulty", newCourseDifficulty);
    form.append("categories", newCourseCategories);
    if (newCourseThumbnailFile) {
      form.append("thumbnail", newCourseThumbnailFile);
    } else if (newCourseThumbnail) {
      form.append("thumbnailUrl", newCourseThumbnail);
    }
    if (newCourseVideoFile) {
      form.append("video", newCourseVideoFile);
    } else if (newCourseVideoUrl) {
      form.append("videoUrl", newCourseVideoUrl);
    }
    try {
      const res = await fetch(`${API_URL}/api/courses`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to create course");
      // prepend new course
      setCourses((prev) => [
        {
          id: data.course._id,
          instructorId: data.course.instructorId,
          title: data.course.title,
          instructor: data.course.instructorName,
          description: data.course.description,
          duration: data.course.duration,
          difficulty: data.course.difficulty,
          categories: data.course.categories,
          thumbnail: data.course.thumbnailUrl,
          videoUrl: data.course.videoUrl,
        },
        ...prev,
      ]);
      // reset form
      setNewCourseTitle("");
      setNewCourseDescription("");
      setNewCourseDuration("6 Weeks");
      setNewCourseDifficulty("Beginner");
      setNewCourseCategories("React, UI");
      setNewCourseThumbnail("/new-course-thumbnail.jpg");
      setNewCourseThumbnailFile(null);
      setNewCourseVideoUrl("");
      setNewCourseVideoFile(null);
      setIsCreateOpen(false);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-pretty text-2xl font-semibold tracking-tight md:text-3xl">E-Learning Portal</h1>
          {view !== "auth" ? (
            <div className="flex items-center gap-3">
              {view === "course" && (
                <button
                  onClick={() => {
                    setView("dashboard");
                    setSelectedCourse(null);
                  }}
                  className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                  aria-label="Back to dashboard"
                >
                  Back
                </button>
              )}
              <span className="hidden text-sm text-muted-foreground md:inline">{currentUser?.email}</span>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-[var(--color-brand-foreground)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                aria-label="Log out"
              >
                Log out
              </button>
            </div>
          ) : null}
        </header>

        {view === "auth" ? (
          <section aria-label="Authentication" className="mx-auto flex max-w-xl flex-col gap-6">
            {/* Tabs */}
            <div className="flex items-center rounded-xl border border-border bg-card p-1">
              <button
                className={[
                  "flex-1 rounded-lg px-4 py-3 text-center text-sm font-medium transition",
                  activeTab === "login"
                    ? "bg-[var(--color-brand)] text-[var(--color-brand-foreground)] shadow"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
                onClick={() => setActiveTab("login")}
                aria-selected={activeTab === "login"}
                role="tab"
              >
                Login
              </button>
              <button
                className={[
                  "flex-1 rounded-lg px-4 py-3 text-center text-sm font-medium transition",
                  activeTab === "register"
                    ? "bg-[var(--color-brand)] text-[var(--color-brand-foreground)] shadow"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
                onClick={() => setActiveTab("register")}
                aria-selected={activeTab === "register"}
                role="tab"
              >
                Register
              </button>
            </div>

            {/* Auth Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition">
              {activeTab === "login" ? (
                <form onSubmit={handleLogin} className="flex flex-col gap-4" aria-label="Login form">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="login-email" className="text-sm">
                      Email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.currentTarget.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="login-password" className="text-sm">
                      Password
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.currentTarget.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-[var(--color-brand-foreground)] shadow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                  >
                    Sign In
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={handleRegister}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2"
                  aria-label="Registration form"
                >
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label htmlFor="reg-name" className="text-sm">
                      Full Name
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.currentTarget.value)}
                      placeholder="Jane Doe"
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="reg-email" className="text-sm">
                      Email
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.currentTarget.value)}
                      placeholder="jane@example.com"
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="reg-password" className="text-sm">
                      Password
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.currentTarget.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label htmlFor="reg-role" className="text-sm">
                      Role
                    </label>
                    <select
                      id="reg-role"
                      required
                      value={regRole}
                      onChange={(e) => setRegRole(e.currentTarget.value)}
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                    >
                      <option>Student</option>
                      <option>Teacher</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="md:col-span-2 mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-[var(--color-brand-foreground)] shadow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                  >
                    Create Account
                  </button>
                </form>
              )}
            </div>
          </section>
        ) : view === "dashboard" ? (
          <section aria-label="Course dashboard" className="space-y-6">
            <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-pretty text-xl font-semibold">{greeting}</h2>
                <p className="text-sm text-muted-foreground">
                  Explore the latest courses tailored to your learning journey.
                </p>
              </div>
              {isTeacher && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-[var(--color-brand-foreground)] shadow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Create New Course
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <article
                  key={course.id}
                  onClick={() => {
                    setSelectedCourse(course);
                    setView("course");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedCourse(course);
                      setView("course");
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${course.title}`}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <img
                      src={
                        course.thumbnail ||
                        "/placeholder.svg?height=160&width=320&query=course%20thumbnail" ||
                        "/placeholder.svg"
                      }
                      alt={`Thumbnail for ${course.title}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-col gap-3 p-4">
                    <header className="flex flex-col gap-1">
                      <h3 className="text-balance text-lg font-semibold leading-tight">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">Instructor: {course.instructor}</p>
                    </header>
                    <p
                      className="text-sm text-muted-foreground"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {course.description}
                    </p>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        {course.duration}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 3l9 7-9 7-9-7 9-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                          <path d="M12 10v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        {course.difficulty}
                      </span>
                    </div>
                  </div>
                  <footer className="flex flex-wrap gap-2 border-t border-border p-4">
                    {course.categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border border-[var(--color-brand)] bg-transparent px-2.5 py-1 text-xs font-medium text-[var(--color-brand)] transition group-hover:bg-[var(--color-brand)]/10"
                      >
                        {cat}
                      </span>
                    ))}
                  </footer>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section aria-label="Course details" className="space-y-6">
            {selectedCourse && (
              <>
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-pretty text-2xl font-semibold leading-tight md:text-3xl">
                      {selectedCourse.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">Instructor: {selectedCourse.instructor}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedCourse(null);
                        setView("dashboard");
                      }}
                      className="rounded-lg border border-border bg-transparent px-4 py-2 text-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                    >
                      Back to Dashboard
                    </button>
                    {isTeacher && currentUser?.id === selectedCourse?.instructorId && (
                      <button
                        onClick={() => {
                          setEditCourse({ ...selectedCourse });
                          setIsEditOpen(true);
                        }}
                        className="rounded-lg border border-border bg-transparent px-4 py-2 text-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                      >
                        Edit
                      </button>
                    )}
                    <button className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-foreground)] shadow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]">
                      Enroll Now
                    </button>
                  </div>
                </div>

                {/* Media: Prefer video if available */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  {selectedCourse.videoUrl ? (
                    selectedCourse.videoUrl.includes('youtube.com') || selectedCourse.videoUrl.includes('youtu.be') ? (
                      <iframe
                        className="aspect-video w-full"
                        src={
                          selectedCourse.videoUrl.includes('watch?v=')
                            ? selectedCourse.videoUrl.replace('watch?v=', 'embed/')
                            : selectedCourse.videoUrl.replace('youtu.be/', 'www.youtube.com/embed/')
                        }
                        title="Course video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <video controls className="aspect-video w-full" src={selectedCourse.videoUrl} />
                    )
                  ) : (
                    <img
                      src={
                        selectedCourse.thumbnail ||
                        "/placeholder.svg?height=320&width=640&query=course%20thumbnail" ||
                        "/placeholder.svg"
                      }
                      alt={`Thumbnail for ${selectedCourse.title}`}
                      className="aspect-video w-full object-cover"
                    />
                  )}
                </div>

                {/* Key info */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Overview</h3>
                    <p className="text-sm text-muted-foreground">{selectedCourse.description}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Details</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        {selectedCourse.duration}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 3l9 7-9 7-9-7 9-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                          <path d="M12 10v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        {selectedCourse.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCourse.categories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="rounded-full border border-[var(--color-brand)] bg-transparent px-2.5 py-1 text-xs font-medium text-[var(--color-brand)]"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </div>

      {/* Modal: Create Course (Teacher) */}
      {isTeacher && isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-course-title"
        >
          <div
            className="absolute inset-0 bg-foreground/10 backdrop-blur-sm transition"
            onClick={() => setIsCreateOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 id="create-course-title" className="text-lg font-semibold leading-tight">
                  Create New Course
                </h3>
                <p className="text-sm text-muted-foreground">Add details for your new course.</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg px-2 py-1 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="course-title" className="text-sm">
                  Course Title
                </label>
                <input
                  id="course-title"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.currentTarget.value)}
                  placeholder="e.g., Advanced TypeScript"
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="course-desc" className="text-sm">
                  Description
                </label>
                <textarea
                  id="course-desc"
                  value={newCourseDescription}
                  onChange={(e) => setNewCourseDescription(e.currentTarget.value)}
                  placeholder="What will students learn?"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <label htmlFor="course-duration" className="text-sm">
                    Duration
                  </label>
                  <input
                    id="course-duration"
                    value={newCourseDuration}
                    onChange={(e) => setNewCourseDuration(e.currentTarget.value)}
                    placeholder="6 Weeks"
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="course-difficulty" className="text-sm">
                    Difficulty
                  </label>
                  <select
                    id="course-difficulty"
                    value={newCourseDifficulty}
                    onChange={(e) => setNewCourseDifficulty(e.currentTarget.value)}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                <label htmlFor="course-thumbnail" className="text-sm">
                  Thumbnail URL (or upload below)
                </label>
                <input
                  id="course-thumbnail"
                  value={newCourseThumbnail}
                  onChange={(e) => setNewCourseThumbnail(e.currentTarget.value)}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                />
                  <input
                  id="course-thumbnail-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0] || null;
                    setNewCourseThumbnailFile(file);
                    // If a file is selected, clear URL to avoid sending both
                    if (file) setNewCourseThumbnail("");
                  }}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground outline-none transition file:me-3 file:rounded-md file:border-0 file:bg-[var(--color-brand)] file:px-3 file:py-1.5 file:text-[var(--color-brand-foreground)] file:text-sm hover:file:brightness-110"
                />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="course-video-url" className="text-sm">
                  Course Video URL (optional)
                </label>
                <input
                  id="course-video-url"
                  value={newCourseVideoUrl}
                  onChange={(e) => setNewCourseVideoUrl(e.currentTarget.value)}
                  placeholder="https://example.com/intro.mp4"
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                />
                <span className="text-xs text-muted-foreground">
                  You can paste a direct .mp4 URL or upload a local video file below.
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="course-video-file" className="text-sm">
                  Upload Video (optional) or paste URL above
                </label>
                <input
                  id="course-video-file"
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0] || null;
                    setNewCourseVideoFile(file);
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setNewCourseVideoUrl(url);
                      // Clear URL input to ensure server gets only file
                      // setNewCourseVideoUrl(""); // keep preview
                    } else {
                      setNewCourseVideoUrl("");
                    }
                  }}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground outline-none transition file:me-3 file:rounded-md file:border-0 file:bg-[var(--color-brand)] file:px-3 file:py-1.5 file:text-[var(--color-brand-foreground)] file:text-sm hover:file:brightness-110"
                />
                {newCourseVideoUrl ? (
                  <video src={newCourseVideoUrl} className="mt-2 aspect-video w-full rounded-lg border border-border" controls />
                ) : null}
              </div>

              <div className="mt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-border bg-transparent px-4 py-2 text-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-foreground)] shadow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                >
                  Add Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Course (Teacher) */}
      {isTeacher && isEditOpen && editCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-course-title"
        >
          <div
            className="absolute inset-0 bg-foreground/10 backdrop-blur-sm transition"
            onClick={() => setIsEditOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 id="edit-course-title" className="text-lg font-semibold leading-tight">
                  Edit Course
                </h3>
                <p className="text-sm text-muted-foreground">Update details for your course.</p>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg px-2 py-1 text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <EditCourseForm
              course={editCourse}
              onClose={() => setIsEditOpen(false)}
              onSaved={(updated) => {
                setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                setSelectedCourse((prev) => (prev && prev.id === updated.id ? updated : prev));
                setIsEditOpen(false);
              }}
              API_URL={API_URL}
            />
          </div>
        </div>
      )}
    </main>
  );
}

function EditCourseForm({ course, onClose, onSaved, API_URL }) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [duration, setDuration] = useState(course.duration);
  const [difficulty, setDifficulty] = useState(course.difficulty);
  const [categories, setCategories] = useState(course.categories.join(', '));
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnail || '');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(course.videoUrl || '');
  const [videoFile, setVideoFile] = useState(null);

  async function handleSave(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    form.append('duration', duration);
    form.append('difficulty', difficulty);
    form.append('categories', categories);
    if (thumbnailFile) form.append('thumbnail', thumbnailFile); else form.append('thumbnailUrl', thumbnailUrl);
    if (videoFile) form.append('video', videoFile); else form.append('videoUrl', videoUrl);

    const res = await fetch(`${API_URL}/api/courses/${course.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.message || 'Failed to update course');
      return;
    }
    const updated = {
      id: data.course._id,
      title: data.course.title,
      instructor: data.course.instructorName,
      description: data.course.description,
      duration: data.course.duration,
      difficulty: data.course.difficulty,
      categories: data.course.categories,
      thumbnail: data.course.thumbnailUrl,
      videoUrl: data.course.videoUrl,
    };
    onSaved(updated);
  }

  return (
    <form onSubmit={handleSave} className="grid grid-cols-1 gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm">Title</label>
        <input className="w-full rounded-lg border border-border bg-secondary px-3 py-2" value={title} onChange={(e) => setTitle(e.currentTarget.value)} required />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm">Description</label>
        <textarea className="w-full rounded-lg border border-border bg-secondary px-3 py-2" rows={3} value={description} onChange={(e) => setDescription(e.currentTarget.value)} required />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm">Duration</label>
          <input className="w-full rounded-lg border border-border bg-secondary px-3 py-2" value={duration} onChange={(e) => setDuration(e.currentTarget.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm">Difficulty</label>
          <select className="w-full rounded-lg border border-border bg-secondary px-3 py-2" value={difficulty} onChange={(e) => setDifficulty(e.currentTarget.value)}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm">Categories</label>
          <input className="w-full rounded-lg border border-border bg-secondary px-3 py-2" value={categories} onChange={(e) => setCategories(e.currentTarget.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm">Thumbnail URL (or upload)</label>
        <input className="w-full rounded-lg border border-border bg-secondary px-3 py-2" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.currentTarget.value)} />
        <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.currentTarget.files?.[0] || null)} className="w-full rounded-lg border border-border bg-secondary px-3 py-2" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm">Video URL (or upload)</label>
        <input className="w-full rounded-lg border border-border bg-secondary px-3 py-2" value={videoUrl} onChange={(e) => setVideoUrl(e.currentTarget.value)} />
        <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.currentTarget.files?.[0] || null)} className="w-full rounded-lg border border-border bg-secondary px-3 py-2" />
      </div>
      <div className="mt-2 flex items-center justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-lg border border-border bg-transparent px-4 py-2 text-sm">Cancel</button>
        <button type="submit" className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-foreground)]">Save</button>
      </div>
    </form>
  );
}
