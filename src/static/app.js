document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="activity-spots">${spotsLeft} spots left</span></p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "activity-participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";

        const participantsList = document.createElement("ul");
        if (details.participants.length === 0) {
          const emptyItem = document.createElement("li");
          emptyItem.className = "participant-empty";
          emptyItem.textContent = "No participants yet";
          participantsList.appendChild(emptyItem);
        } else {
          details.participants.forEach((email) => {
            const participantItem = document.createElement("li");
            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = email;

            const removeButton = document.createElement("button");
            removeButton.className = "participant-remove";
            removeButton.type = "button";
            removeButton.title = "Remove participant";
            removeButton.setAttribute("aria-label", `Remove ${email} from ${name}`);

            const removeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            removeIcon.setAttribute("viewBox", "0 0 16 16");
            removeIcon.setAttribute("aria-hidden", "true");
            const removeIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            removeIconPath.setAttribute("d", "M3 5h10M5 5V3h6v2m-7 0 1 9h6l1-9M7 7v5m2-5v5");
            removeIconPath.setAttribute("fill", "none");
            removeIconPath.setAttribute("stroke", "currentColor");
            removeIconPath.setAttribute("stroke-linecap", "round");
            removeIconPath.setAttribute("stroke-linejoin", "round");
            removeIconPath.setAttribute("stroke-width", "1.4");
            removeIcon.appendChild(removeIconPath);
            removeButton.appendChild(removeIcon);

            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Failed to remove participant");
                }

                const participantIndex = details.participants.indexOf(email);
                if (participantIndex !== -1) {
                  details.participants.splice(participantIndex, 1);
                }
                participantItem.remove();

                if (details.participants.length === 0) {
                  const emptyItem = document.createElement("li");
                  emptyItem.className = "participant-empty";
                  emptyItem.textContent = "No participants yet";
                  participantsList.appendChild(emptyItem);
                }

                const spotsLeft = details.max_participants - details.participants.length;
                activityCard.querySelector(".activity-spots").textContent = `${spotsLeft} spots left`;
              } catch (error) {
                messageDiv.textContent = error.message || "Failed to remove participant";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 5000);
                removeButton.disabled = false;
              }
            });

            participantItem.append(participantEmail, removeButton);
            participantsList.appendChild(participantItem);
          });
        }

        participantsSection.append(participantsHeading, participantsList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
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
