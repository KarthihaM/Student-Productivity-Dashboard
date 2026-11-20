// ==========================================
// CAMPUSMATE - SMART STUDENT PLANNER
// ==========================================

// STORAGE
const CLASS_KEY = "cm_classes";
const ASSIGNMENT_KEY = "cm_assignments";
const TASK_KEY = "cm_tasks";
const THEME_KEY = "cm_dark";

// DATA
let classes = loadData(CLASS_KEY);
let assignments = loadData(ASSIGNMENT_KEY);
let tasks = loadData(TASK_KEY);

let timerSeconds = 25 * 60;
let remainingSeconds = timerSeconds;
let timerInterval = null;


// ==========================================
// STORAGE FUNCTIONS
// ==========================================

function loadData(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
}

function saveData() {
    localStorage.setItem(CLASS_KEY, JSON.stringify(classes));
    localStorage.setItem(ASSIGNMENT_KEY, JSON.stringify(assignments));
    localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
}


// ==========================================
// HELPER FUNCTIONS
// ==========================================

function createId() {
    return Date.now().toString() +
           Math.random().toString(36).substring(2, 8);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function(char) {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return characters[char];
    });
}

function todayString() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    if (!dateString) return "No date";

    const parts = dateString.split("-");

    if (parts.length !== 3) return dateString;

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function showToast(message) {
    const toast = document.getElementById("toast");
        if(!toast)return;
    toast.textContent = message;
    toast.style.display = "block";
     if(!toast)return;
    setTimeout(function() {
        toast.style.display = "none";
    }, 2500);
}

function emptyMessage(message) {
    return `<li>${escapeHTML(message)}</li>`;
}


// ==========================================
// NAVIGATION
// ==========================================

function showSection(sectionId) {

    document.querySelectorAll(".section").forEach(function(section) {
        section.classList.add("hidden");
    });

    const selectedSection = document.getElementById(sectionId);

    if (selectedSection) {
        selectedSection.classList.remove("hidden");
    }

    document.querySelectorAll(".nav-btn").forEach(function(button) {
        button.classList.remove("active");
    });

    const activeButton = document.querySelector(
        `.nav-btn[data-section="${sectionId}"]`
    );

    if (activeButton) {
        activeButton.classList.add("active");
    }

    if (sectionId === "calendar") {
        renderCalendar();
    }
}


// ==========================================
// TIMETABLE
// ==========================================

document.getElementById("classForm").addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const subject = document.getElementById("subject").value.trim();
        const day = document.getElementById("classDay").value;
        const time = document.getElementById("classTime").value;

        if (!subject || !day || !time) {
            showToast("Please fill all class details.");
            return;
        }

        classes.push({
            id: createId(),
            subject: subject,
            day: day,
            time: time
        });

        saveData();
        renderAll();

        this.reset();

        showToast("Class added successfully!");
    }
);

function renderClasses() {

    const list = document.getElementById("classList");

    const dayOrder = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ];

    const sortedClasses = [...classes].sort(function(a, b) {

        const dayDifference =
            dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);

        if (dayDifference !== 0) {
            return dayDifference;
        }

        return a.time.localeCompare(b.time);
    });

    if (sortedClasses.length === 0) {
        list.innerHTML = emptyMessage("No classes added yet.");
        return;
    }

    list.innerHTML = sortedClasses.map(function(item) {

        return `
            <li>
                <div class="item-title">
                    📚 ${escapeHTML(item.subject)}
                </div>

                <div class="item-info">
                    ${escapeHTML(item.day)} |
                    ${escapeHTML(item.time)}
                </div>

                <div class="item-actions">
                    <button class="edit-btn"
                        data-action="edit-class"
                        data-id="${escapeHTML(item.id)}">
                        ✏️ Edit
                    </button>

                    <button class="delete-btn"
                        data-action="delete-class"
                        data-id="${escapeHTML(item.id)}">
                        🗑️ Delete
                    </button>
                </div>
            </li>
        `;
    }).join("");
}


// ==========================================
// ASSIGNMENTS
// ==========================================

document.getElementById("assignmentForm").addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const title = document.getElementById("assignmentTitle")
            .value.trim();

        const subject = document.getElementById("assignmentSubject")
            .value.trim();

        const date = document.getElementById("assignmentDate").value;

        const priority = document.getElementById("assignmentPriority").value;

        if (!title || !subject || !date) {
            showToast("Please enter all assignment details.");
            return;
        }

        assignments.push({
            id: createId(),
            title: title,
            subject: subject,
            date: date,
            priority: priority,
            completed: false,
            completedAt: null
        });

        saveData();
        renderAll();

        this.reset();

        showToast("Assignment added successfully!");
    }
);


function getDeadlineStatus(date) {

    if (!date) return "";

    const today = todayString();

    if (date < today) {
        return `<span class="status overdue">Overdue</span>`;
    }

    if (date === today) {
        return `<span class="status today">Due Today</span>`;
    }

    return `<span class="status upcoming">Upcoming</span>`;
}


function renderAssignments() {

    const list = document.getElementById("assignmentList");

    const search = document.getElementById("assignmentSearch")
        .value.trim().toLowerCase();

    const filtered = assignments.filter(function(item) {

        return (
            item.title.toLowerCase().includes(search) ||
            item.subject.toLowerCase().includes(search)
        );
    });

    if (filtered.length === 0) {
        list.innerHTML = emptyMessage("No assignments found.");
        return;
    }

    list.innerHTML = filtered.map(function(item) {

        return `
            <li class="${item.completed ? "completed" : ""}">

                <div class="item-title">
                    ${item.completed ? "✅" : "📝"}
                    ${escapeHTML(item.title)}
                </div>

                <div class="item-info">
                    Subject: ${escapeHTML(item.subject)}
                </div>

                <div class="item-info">
                    Deadline: ${formatDate(item.date)}
                    ${getDeadlineStatus(item.completed ? "" : item.date)}
                </div>

                <span class="priority ${escapeHTML(item.priority)}">
                    ${escapeHTML(item.priority)} Priority
                </span>

                <div class="item-actions">

                    <button class="complete-btn"
                        data-action="toggle-assignment"
                        data-id="${escapeHTML(item.id)}">
                        ${item.completed ? "↩️ Undo" : "✔️ Complete"}
                    </button>

                    <button class="edit-btn"
                        data-action="edit-assignment"
                        data-id="${escapeHTML(item.id)}">
                        ✏️ Edit
                    </button>

                    <button class="delete-btn"
                        data-action="delete-assignment"
                        data-id="${escapeHTML(item.id)}">
                        🗑️ Delete
                    </button>

                </div>
            </li>
        `;
    }).join("");
}


// ==========================================
// DAILY TASKS
// ==========================================

document.getElementById("taskForm").addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const title = document.getElementById("taskTitle")
            .value.trim();

        const date = document.getElementById("taskDate").value;

        const priority = document.getElementById("taskPriority").value;

        if (!title) {
            showToast("Please enter a task.");
            return;
        }

        tasks.push({
            id: createId(),
            title: title,
            date: date,
            priority: priority,
            completed: false,
            completedAt: null
        });

        saveData();
        renderAll();

        this.reset();

        showToast("Task added successfully!");
    }
);


function renderTasks() {

    const taskList = document.getElementById("taskList");
         if(!taskList)return;
        taskList.innerHTML = "";

    if (tasks.length === 0) {
        tasklist.innerHTML = emptyMessage("No tasks added yet.");
        return;
    }
     
       tasks.forEach(function(task){
         const li = document.createElement("li");
         li.innerHTML = `
         <div class = "item-content">
         <h3>${escapeHTML(task.title)}</h3>
         <p>Date:${formatDate(task.date)}
         </p>
         <span class = "priority ${task.priority}">
         ${escapeHTML(task.priority)}
         </span>
         </div>
         <div class = "item-actions">
         <button type = "button" onclick = "editTask(${task.id})">
         Edit
         </button>
         <button type = "button" onclick = "deleteTask(${task.id})">
         Delete
         </button>
         </div>
         `;
         taskList.appendChild(li);
       });
    }


// ==========================================
// EDIT AND DELETE FUNCTIONS
// ==========================================

function editClass(id) {

    const item = classes.find(function(c) {
        return c.id === id;
    });

    if (!item) return;

    const subject = prompt("Enter subject name:", item.subject);

    if (subject === null) return;

    const day = prompt(
        "Enter day (Monday to Sunday):",
        item.day
    );

    if (day === null) return;

    const time = prompt("Enter time (HH:MM):", item.time);

    if (time === null) return;

    if (!subject.trim() || !day.trim() || !time.trim()) {
        showToast("Details cannot be empty.");
        return;
    }

    const validDays = [
        "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday", "Sunday"
    ];

    const correctDay = validDays.find(function(d) {
        return d.toLowerCase() === day.trim().toLowerCase();
    });

    if (!correctDay) {
        showToast("Please enter a valid day.");
        return;
    }

    item.subject = subject.trim();
    item.day = correctDay;
    item.time = time.trim();

    saveData();
    renderAll();

    showToast("Class updated!");
}


function editAssignment(id) {

    const item = assignments.find(function(a) {
        return a.id === id;
    });

    if (!item) return;

    const title = prompt("Assignment name:", item.title);

    if (title === null) return;

    const subject = prompt("Subject:", item.subject);

    if (subject === null) return;

    const date = prompt(
        "Deadline (YYYY-MM-DD):",
        item.date
    );

    if (date === null) return;

    const priority = prompt(
        "Priority (High, Medium, Low):",
        item.priority
    );

    if (priority === null) return;

    if (!title.trim() || !subject.trim() || !date.trim()) {
        showToast("Details cannot be empty.");
        return;
    }

    item.title = title.trim();
    item.subject = subject.trim();
    item.date = date.trim();
    item.priority = validatePriority(priority);

    saveData();
    renderAll();

    showToast("Assignment updated!");
}


function editTask(id) {

    const item = tasks.find(function(t) {
        return t.id === id;
    });

    if (!item) return;

    const title = prompt("Task name:", item.title);

    if (title === null) return;

    const date = prompt(
        "Date (YYYY-MM-DD or leave empty):",
        item.date || ""
    );

    if (date === null) return;

    const priority = prompt(
        "Priority (High, Medium, Low):",
        item.priority
    );

    if (priority === null) return;

    if (!title.trim()) {
        showToast("Task name cannot be empty.");
        return;
    }

    item.title = title.trim();
    item.date = date.trim();
    item.priority = validatePriority(priority);

    saveData();
    renderAll();

    showToast("Task updated!");
}


function validatePriority(priority) {

    const values = ["High", "Medium", "Low"];

    const result = values.find(function(value) {
        return value.toLowerCase() === priority.trim().toLowerCase();
    });

    return result || "Medium";
}


function deleteItem(array, id, name) {

    const item = array.find(function(x) {
        return x.id === id;
    });

    if (!item) return;

    if (confirm(`Delete ${name}?`)) {

        const index = array.findIndex(function(x) {
            return x.id === id;
        });

        array.splice(index, 1);

        saveData();
        renderAll();
        showToast(name + " deleted.");
    }
}


// ==========================================
// BUTTON EVENTS
// ==========================================

document.addEventListener("click", function(event) {

    const button = event.target.closest("button");

    if (!button) return;

    // NAVIGATION
    if (button.dataset.section) {
        showSection(button.dataset.section);
        return;
    }

    // CLASS BUTTONS
    if (button.dataset.action === "edit-class") {
        editClass(button.dataset.id);
    }

    if (button.dataset.action === "delete-class") {
        deleteItem(classes, button.dataset.id, "class");
    }

    // ASSIGNMENT BUTTONS
    if (button.dataset.action === "edit-assignment") {
        editAssignment(button.dataset.id);
    }

    if (button.dataset.action === "delete-assignment") {
        deleteItem(assignments, button.dataset.id, "assignment");
    }

    if (button.dataset.action === "toggle-assignment") {

        const item = assignments.find(function(a) {
            return a.id === button.dataset.id;
        });

        if (item) {
            item.completed = !item.completed;

            item.completedAt = item.completed
                ? new Date().toISOString()
                : null;

            saveData();
            renderAll();
        }
    }

    // TASK BUTTONS
    if (button.dataset.action === "edit-task") {
        editTask(button.dataset.id);
    }

    if (button.dataset.action === "delete-task") {
        deleteItem(tasks, button.dataset.id, "task");
    }

    if (button.dataset.action === "toggle-task") {

        const item = tasks.find(function(t) {
            return t.id === button.dataset.id;
        });

        if (item) {
            item.completed = !item.completed;

            item.completedAt = item.completed
                ? new Date().toISOString()
                : null;

            saveData();
            renderAll();
        }
    }

    // TIMER PRESETS
    if (button.dataset.minutes) {

        stopTimer();

        timerSeconds = Number(button.dataset.minutes) * 60;
        remainingSeconds = timerSeconds;

        updateTimerDisplay();

        document.getElementById("timerMessage").textContent =
            "Timer ready!";
    }
});


// ==========================================
// SEARCH
// ==========================================

document.getElementById("assignmentSearch").addEventListener(
    "input",
    renderAssignments
);

document.getElementById("taskSearch").addEventListener(
    "input",
    renderTasks
);


// ==========================================
// DASHBOARD
// ==========================================

function renderDashboard() {

    document.getElementById("classCount").textContent =
        classes.length;

    document.getElementById("assignmentCount").textContent =
        assignments.filter(function(a) {
            return !a.completed;
        }).length;

    document.getElementById("taskCount").textContent =
        tasks.filter(function(t) {
            return !t.completed;
        }).length;

    const completedCount =
        assignments.filter(function(a) {
            return a.completed;
        }).length +
        tasks.filter(function(t) {
            return t.completed;
        }).length;

    document.getElementById("completedCount").textContent =
        completedCount;

    const total =
        assignments.length + tasks.length;

    const percentage = total === 0
        ? 0
        : Math.round((completedCount / total) * 100);

    document.getElementById("progressBar").style.width =
        percentage + "%";

    document.getElementById("progressText").textContent =
        percentage + "% completed";

    renderUpcoming();

    document.getElementById("todayDate").textContent =
        new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
}


function renderUpcoming() {

    const list = document.getElementById("upcomingList");

    const today = todayString();

    const upcoming = assignments.filter(function(item) {
        return !item.completed;
    }).sort(function(a, b) {
        return a.date.localeCompare(b.date);
    });

    if (upcoming.length === 0) {
        list.innerHTML = emptyMessage("No pending assignments.");
        return;
    }

    list.innerHTML = upcoming.slice(0, 5).map(function(item) {

        return `
            <li>
                <strong>${escapeHTML(item.title)}</strong>
                <br>
                ${escapeHTML(item.subject)}
                <br>
                Deadline: ${formatDate(item.date)}
                ${getDeadlineStatus(item.date)}
            </li>
        `;
    }).join("");
}


// ==========================================
// WEEKLY CALENDAR
// ==========================================

function renderCalendar() {

    const grid = document.getElementById("calendarGrid");

    const dayNames = [
        "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday", "Sunday"
    ];

    const currentDate = new Date();

    const monday = new Date(currentDate);

    const day = currentDate.getDay();

    const difference = day === 0 ? -6 : 1 - day;

    monday.setDate(currentDate.getDate() + difference);

    let html = "";

    dayNames.forEach(function(dayName, index) {

        const thisDate = new Date(monday);

        thisDate.setDate(monday.getDate() + index);

        const dateString =
            thisDate.getFullYear() + "-" +
            String(thisDate.getMonth() + 1).padStart(2, "0") + "-" +
            String(thisDate.getDate()).padStart(2, "0");

        let events = "";

        // CLASSES
        classes.filter(function(item) {
            return item.day === dayName;
        }).forEach(function(item) {

            events += `
                <div class="calendar-event class-event">
                    📚 ${escapeHTML(item.subject)}
                    <br>
                    ${escapeHTML(item.time)}
                </div>
            `;
        });

        // ASSIGNMENTS
        assignments.filter(function(item) {
            return item.date === dateString && !item.completed;
        }).forEach(function(item) {

            events += `
                <div class="calendar-event assignment-event">
                    📝 ${escapeHTML(item.title)}
                </div>
            `;
        });

        // TASKS
        tasks.filter(function(item) {
            return item.date === dateString && !item.completed;
        }).forEach(function(item) {

            events += `
                <div class="calendar-event task-event">
                    ✅ ${escapeHTML(item.title)}
                </div>
            `;
        });

        html += `
            <div class="calendar-day">

                <h3>
                    ${dayName}
                    <br>
                    ${thisDate.getDate()}/${thisDate.getMonth() + 1}
                </h3>

                ${events || "<p>No activities</p>"}

            </div>
        `;
    });

    grid.innerHTML = html;
}


// ==========================================
// COMPLETED HISTORY
// ==========================================

function renderHistory() {

    const list = document.getElementById("historyList");

    const completedAssignments = assignments.filter(function(a) {
        return a.completed;
    });

    const completedTasks = tasks.filter(function(t) {
        return t.completed;
    });

    const history = [];

    completedAssignments.forEach(function(item) {
        history.push({
            title: item.title,
            type: "Assignment",
            date: item.completedAt
        });
    });

    completedTasks.forEach(function(item) {
        history.push({
            title: item.title,
            type: "Task",
            date: item.completedAt
        });
    });

    if (history.length === 0) {
        list.innerHTML = emptyMessage("No completed activities yet.");
        return;
    }

    history.sort(function(a, b) {
        return (b.date || "").localeCompare(a.date || "");
    });

    list.innerHTML = history.map(function(item) {

        let completedDate = "Completed";

        if (item.date) {
            completedDate = new Date(item.date).toLocaleDateString("en-IN");
        }

        return `
            <li>
                <div class="item-title">
                    🏆 ${escapeHTML(item.title)}
                </div>

                <div class="item-info">
                    ${escapeHTML(item.type)} |
                    ${escapeHTML(completedDate)}
                </div>
            </li>
        `;
    }).join("");
}


// ==========================================
// DARK MODE
// ==========================================

function setTheme(dark) {

    document.body.classList.toggle("dark", dark);

    document.getElementById("themeBtn").textContent =
        dark ? "☀️ Light Mode" : "🌙 Dark Mode";

    localStorage.setItem(THEME_KEY, dark ? "true" : "false");
}

document.getElementById("themeBtn").addEventListener(
    "click",
    function() {

        const dark = !document.body.classList.contains("dark");

        setTheme(dark);
    }
);


// ==========================================
// FOCUS TIMER
// ==========================================

function updateTimerDisplay() {

    const minutes = Math.floor(remainingSeconds / 60);

    const seconds = remainingSeconds % 60;

    document.getElementById("timerDisplay").textContent =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0");
}


function startTimer() {

    if (timerInterval !== null) return;

    if (remainingSeconds <= 0) {
        showToast("Choose a timer first.");
        return;
    }

    document.getElementById("timerMessage").textContent =
        "Stay focused! 💪";

    timerInterval = setInterval(function() {

        remainingSeconds--;

        updateTimerDisplay();

        if (remainingSeconds <= 0) {

            stopTimer();

            document.getElementById("timerMessage").textContent =
                "Time is up! Take a break. 🎉";

            showToast("Timer completed!");
        }

    }, 1000);
}


function stopTimer() {

    clearInterval(timerInterval);

    timerInterval = null;
}


function resetTimer() {

    stopTimer();

    remainingSeconds = timerSeconds;

    updateTimerDisplay();

    document.getElementById("timerMessage").textContent =
        "Timer reset!";
}


document.getElementById("startTimer").addEventListener(
    "click",
    startTimer
);

document.getElementById("pauseTimer").addEventListener(
    "click",
    function() {

        stopTimer();

        document.getElementById("timerMessage").textContent =
            "Timer paused.";
    }
);

document.getElementById("resetTimer").addEventListener(
    "click",
    resetTimer
);


// ==========================================
// CLEAR DATA
// ==========================================

document.getElementById("clearDataBtn").addEventListener(
    "click",
    function() {

        if (confirm("Are you sure you want to delete all CampusMate data?")) {

            classes = [];
            assignments = [];
            tasks = [];
            saveData();
            renderAll();

            showToast("All data cleared.");
        }
    }
);


// ==========================================
// RENDER EVERYTHING
// ==========================================

function renderAll() {

    renderClasses();
    renderAssignments();
    renderTasks();
    renderDashboard();
    renderCalendar();
    renderHistory();
}


// ==========================================
// START APPLICATION
// ==========================================

setTheme(localStorage.getItem(THEME_KEY) === "true");

updateTimerDisplay();

renderAll();

showSection("home");
alert("JavaScript Connected");