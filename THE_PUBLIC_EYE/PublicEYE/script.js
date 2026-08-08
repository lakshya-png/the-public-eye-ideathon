// ===============================
// GLOBAL OTP
// ===============================
let generatedOTP = "";


// ===============================
// FORM SUBMIT (STEP 1)
// ===============================
document.addEventListener("DOMContentLoaded", function () {

    loadActive();
    document.getElementById("activeBtn").classList.add("active");

    let form = document.getElementById("reportForm");

    if (form) {
        form.addEventListener("submit", function (e) {

            let lat = document.getElementById("latitude").value;
            let lon = document.getElementById("longitude").value;

            if (!lat || !lon) {
                alert("Please click 'Use My Current Location' first");
                e.preventDefault();
                return;
            }

            if (!this.checkValidity()) {
                return;
            }

            e.preventDefault();
            openPopup();
        });
    }

});


// ===============================
// POPUP CONTROL
// ===============================
function openPopup() {
    document.getElementById("otpPopup").style.display = "flex";
}

function closePopup(id) {
    document.getElementById(id).style.display = "none";
}


// ===============================
// OTP SYSTEM (FRONTEND)
// ===============================
function sendOTP() {
    let phone = document.getElementById("popupPhone").value.trim();

    if (!/^[0-9]{10}$/.test(phone)) {
        alert("Enter valid phone number");
        return;
    }

    generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();

    document.getElementById("otpSection").style.display = "block";

    alert("Your OTP is: " + generatedOTP);
}


// ===============================
// VERIFY OTP → SAVE TO BACKEND
// ===============================
function verifyOTP() {
    let userOTP = document.getElementById("otp").value;

    if (userOTP === generatedOTP) {
        submitToBackend();
    } else {
        alert("Invalid OTP ❌");
    }
}


// ===============================
// SAVE COMPLAINT (BACKEND)
// ===============================
function submitToBackend() {
    let form = document.getElementById("reportForm");
    let formData = new FormData(form);

    fetch("http://127.0.0.1:5000/save_complaint", {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {

                document.getElementById("complaintID").innerText = data.complaint_id;
                document.getElementById("successBox").style.display = "block";

                closePopup("otpPopup");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Server error");
        });
}


// ===============================
// TRACK COMPLAINT (TRACK PAGE)
// ===============================
function trackComplaint() {
    let complaintID = document.getElementById("trackID").value;

    let formData = new FormData();
    formData.append("complaint_id", complaintID);

    fetch("http://127.0.0.1:5000/track", {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert("Complaint not found ❌");
            } else {
                document.getElementById("cid").innerText = data.complaint_id;
                document.getElementById("title").innerText = data.category;
                document.getElementById("description").innerText = data.description;
                document.getElementById("statusBadge").innerText = data.status;

                document.getElementById("resultCard").style.display = "block";
            }
        });
}

// ===============================
// ADMIN PANEL - LOAD DATA
// ===============================
// ===============================
// ADMIN PANEL - LOAD ACTIVE
// ===============================
function loadActive() {
    fetch("http://127.0.0.1:5000/admin/complaints")
        .then(res => res.json())
        .then(data => {
            renderTable(data);

            // 🔥 UI highlight
            document.getElementById("activeBtn").classList.add("active");
            document.getElementById("resolvedBtn").classList.remove("active");
        });
}


// ===============================
// ADMIN PANEL - LOAD RESOLVED
// ===============================
function loadResolved() {
    fetch("http://127.0.0.1:5000/admin/resolved")
        .then(res => res.json())
        .then(data => {
            renderTable(data);

            // 🔥 UI highlight
            document.getElementById("resolvedBtn").classList.add("active");
            document.getElementById("activeBtn").classList.remove("active");
        });
}


// ===============================
// TABLE RENDER (COMMON)
// ===============================
function renderTable(data) {
    let tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";

    data.forEach(c => {

        let actionButtons = "";

        if (c.status === "Resolved") {
            actionButtons = `<button class="btn-closed">Closed</button>`;
        } else {
            actionButtons = `
                <button class="btn-progress" onclick="updateStatus('${c.complaint_id}', 'In Progress')">In Progress</button>
                <button class="btn-resolve" onclick="updateStatus('${c.complaint_id}', 'Resolved')">Resolve</button>
            `;
        }

        let row = `
        <tr>
            <td>${c.complaint_id}</td>
            <td>${c.address}</td>
            <td>${c.category}</td>
            <td>${c.status}</td>
            <td>${actionButtons}</td>
        </tr>
        `;

        tableBody.innerHTML += row;
    });
}

// ===============================
// ADMIN UPDATE STATUS
// ===============================
function updateStatus(id, status) {
    let formData = new FormData();
    formData.append("complaint_id", id);
    formData.append("status", status);

    fetch("http://127.0.0.1:5000/admin/update", {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("Updated ✅");
                location.reload();
            }
        });
}


// ===============================
// ADMIN LOGIN
// ===============================
function openAdminPopup() {
    document.getElementById("adminPopup").style.display = "flex";
}

function loginAdmin() {
    let user = document.getElementById("adminUser").value;
    let pass = document.getElementById("adminPass").value;

    if (user === "Admin" && pass === "admin0987") {
        window.location.href = "admin.html";
    } else {
        alert("Invalid username or password");
    }
}


// ===============================
// LOCATION
// ===============================
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        alert("Geolocation not supported");
    }
}

function showPosition(position) {
    let lat = position.coords.latitude;
    let lon = position.coords.longitude;

    document.getElementById("location").innerText =
        "Latitude: " + lat + " , Longitude: " + lon;

    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lon;
}

function showError() {
    alert("Allow location access to use this feature");
}


// ===============================
// PUBLIC FEED
// ===============================

function loadFeed() {
    fetch("http://127.0.0.1:5000/feed")
        .then(res => res.json())
        .then(data => {

            let container = document.getElementById("feedContainer");
            container.innerHTML = "";

            // Handle no data case
            if (data.length === 0) {
                container.innerHTML = "<p>No complaints available.</p>";
                return;
            }

            data.forEach(c => {

                // 🔥 Status styling (small upgrade)
                let statusClass = "";
                if (c.status === "Pending") statusClass = "status-pending";
                else if (c.status === "In Progress") statusClass = "status-progress";
                else if (c.status === "Resolved") statusClass = "status-resolved";

                let card = `
                <div class="issue-card">

                    <h3>${c.category}</h3>

                    <p><strong>Address:</strong> ${c.address}</p>

                    <p>
                        <strong>Status:</strong> 
                        <span class="${statusClass}">${c.status}</span>
                    </p>

                    <p><strong>Reported by:</strong> ${c.username}</p>

                </div>
                `;

                container.innerHTML += card;
            });

        })
        .catch(err => {
            console.error("Feed error:", err);
            document.getElementById("feedContainer").innerHTML =
                "<p>Failed to load complaints.</p>";
        });
}