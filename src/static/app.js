document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  let activitiesData = {};

  function renderActivities() {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(activitiesData).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;
      const participants = details.participants || [];
      const participantsMarkup = participants.length
        ? `<div class="participants-list">${participants
            .map(
              (participant) => `
                <button class="participant-chip" type="button" data-activity="${name}" data-email="${participant}">
                  <span>${participant}</span>
                  <span class="participant-delete" aria-label="Remove ${participant}">×</span>
                </button>
              `
            )
            .join("")}</div>`
        : '<p class="participants-empty">No participants yet.</p>';

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-section">
          <strong>Participants</strong>
          ${participantsMarkup}
        </div>
      `;

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });

    document.querySelectorAll(".participant-chip").forEach((chip) => {
      chip.addEventListener("click", async () => {
        const activityName = chip.dataset.activity;
        const participantEmail = chip.dataset.email;

        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(participantEmail)}`,
            {
              method: "DELETE",
            }
          );

          const result = await response.json();

          if (response.ok) {
            if (activitiesData[activityName]) {
              activitiesData[activityName].participants = activitiesData[activityName].participants.filter(
                (participant) => participant !== participantEmail
              );
            }
            renderActivities();
            messageDiv.textContent = result.message;
            messageDiv.className = "success";
          } else {
            messageDiv.textContent = result.detail || "Unable to unregister participant";
            messageDiv.className = "error";
          }

          messageDiv.classList.remove("hidden");
          setTimeout(() => {
            messageDiv.classList.add("hidden");
          }, 5000);
        } catch (error) {
          messageDiv.textContent = "Failed to unregister participant.";
          messageDiv.className = "error";
          messageDiv.classList.remove("hidden");
          console.error("Error unregistering participant:", error);
        }
      });
    });
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      activitiesData = await response.json();
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        if (activitiesData[activity]) {
          if (!activitiesData[activity].participants.includes(email)) {
            activitiesData[activity].participants.push(email);
          }
        }
        renderActivities();
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
