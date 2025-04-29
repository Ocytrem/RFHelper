// 🌗 Dark Mode Toggle Setup
const toggleTheme = document.getElementById('toggle-theme');
const body = document.body;

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  body.classList.add('light-mode');
}

toggleTheme.addEventListener('click', () => {
  body.classList.toggle('light-mode');
  const currentTheme = body.classList.contains('light-mode') ? 'light' : 'dark';
  localStorage.setItem('theme', currentTheme);
});

// 🔁 Existing logic from original script.js
const GROUP_ID = 9979; // Replace with your group's ID from Wise Old Man
const API_URL = `https://api.wiseoldman.net/v2/groups/${GROUP_ID}`;

const rankImages = {
  "owner": "images/owner.webp",
  "colonel": "images/colonel.webp",
  "law": "images/law.webp",
  "astral": "images/astral.webp",
  "major": "images/major.webp",
  "captain": "images/captain.webp",
  "minion": "images/minion.webp",
  "dogsbody": "images/dogsbody.webp",
  "spellcaster": "images/spellcaster.webp",
  "imp": "images/imp.webp",
  "skiller": "images/skiller.webp",
  "maxed": "images/maxed.webp",
  "zamorakian": "images/zamorakian.webp",
  "tzkal": "images/tzkal.webp",
  "achiever": "images/achiever.webp",
  "tztok": "images/tztok.webp",
  "zenyte": "images/zenyte.webp",
  "onyx": "images/onyx.webp",
  "dragonstone": "images/dragonstone.webp",
  "diamond": "images/diamond.webp",
  "carry": "images/carry.webp",
  "brassican": "images/brassican.webp"
};

document.getElementById('fetch').addEventListener('click', async () => {
  const selectedRank = document.getElementById('rank').value;
  const membersDiv = document.getElementById('members');
  const memberList = document.getElementById('member-list');

  membersDiv.style.display = "block"; // Ensure members section is visible
  memberList.innerHTML = "<li>Loading members...</li>"; // Show a loading message

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Error fetching group data: ${response.statusText}`);
    }

    const groupData = await response.json();
    console.log("Full Group Data Response:", groupData); // Log the entire API response

    if (!groupData.memberships || !Array.isArray(groupData.memberships)) {
      throw new Error("No membership data found in the API response.");
    }

    // Fetch the group's hiscores data (total level for each member)
    const hiscoresResponse = await fetch(`https://api.wiseoldman.net/v2/groups/${GROUP_ID}/hiscores?metric=overall&limit=500`);
    if (!hiscoresResponse.ok) {
      throw new Error("Error fetching hiscores data.");
    }

    const hiscoresData = await hiscoresResponse.json();
    console.log("Hiscores Data:", hiscoresData); // Log the hiscores data to check if it's fetched correctly

    // If the hiscores data doesn't have the expected structure, log and break
    if (!Array.isArray(hiscoresData) || hiscoresData.length === 0) {
      console.error("Invalid hiscores data structure:", hiscoresData);  // Log raw hiscores data
      throw new Error("Invalid hiscores data structure.");
    }

    // Map hiscores data by username
    const totalLevelMap = hiscoresData.reduce((map, member) => {
      const username = member.player.username;
      const totalLevel = member.data.level;  // Access the total level from the data object
      map[username] = totalLevel;
      return map;
    }, {});

    // Filter members by rank if a specific rank is selected
    const filteredMembers = selectedRank === 'all'
      ? groupData.memberships
      : groupData.memberships.filter(
          member => member.role.toLowerCase() === selectedRank.toLowerCase()
        );

    // Separate members with warnings and without warnings
    const membersWithWarnings = [];
    const membersWithoutWarnings = [];

    filteredMembers.forEach(member => {
      const rank = member.role.toLowerCase();
      const rankImage = rankImages[rank] || "images/default.webp"; // Fallback if no image is found

      // Safely check if player and display_name exist
      const displayName = member.player && member.player.displayName ? member.player.displayName : "No Display Name";

      // Get join date and last rank update date
      const joinDate = member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "N/A";
      const lastRankUpdate = member.updatedAt ? new Date(member.updatedAt).toLocaleDateString() : "N/A";

      // If rank is brassican, calculate how many days ago the rank was updated
      let daysSinceUpdate = "";
      if (rank === "brassican" && member.updatedAt) {
        const roleUpdatedDate = new Date(member.updatedAt);
        const currentDate = new Date();
        const timeDifference = currentDate - roleUpdatedDate; // Time difference in milliseconds
        const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24)); // Convert milliseconds to days
        daysSinceUpdate = `(${daysDifference} days ago)`;
      }

      // Fetch total level from the hiscores API
      let totalLevel = "Loading...";
      let warningMessage = ""; // To store the warning message
      if (member.player && member.player.username) {
        const username = member.player.username;
        totalLevel = totalLevelMap[username] || "N/A"; // Get total level from the hiscores map

        // Check for warnings based on rank and total level
        if (rank === "diamond" && totalLevel > 1750) {
          warningMessage = `<br><b style="color: red;">Warning: Exceeds 1750 total level for Diamond rank!</b>`;
        } else if (rank === "dragonstone" && totalLevel > 2000) {
          warningMessage = `<br><b style="color: red;">Warning: Exceeds 2000 total level for Dragonstone rank!</b>`;
        } else if (rank === "onyx" && totalLevel > 2200) {
          warningMessage = `<br><b style="color: red;">Warning: Exceeds 2200 total level for Onyx rank!</b>`;
        }
      }

      // Build the HTML string for this member
      const memberHTML = `
        <li>
          <b>${displayName}</b>
          <img src="${rankImage}" alt="${rank}" style="width: 20px; height: 20px; margin-left: 10px;">
          <br>
          Join Date: ${joinDate} <br>
          Last Rank Update: ${lastRankUpdate} ${daysSinceUpdate} <br>
          Total Level: ${totalLevel}
          ${warningMessage}
        </li>
      `;

      // Separate into members with and without warnings
      if (warningMessage) {
        membersWithWarnings.push(memberHTML);
      } else {
        membersWithoutWarnings.push(memberHTML);
      }
    });

    // Display the warning message at the top, followed by the rest of the members
    if (membersWithWarnings.length > 0) {
      memberList.innerHTML = "<li><b>Members with outdated ranks:</b></li>" + membersWithWarnings.join('') + "<li><b>Other Members:</b></li>" + membersWithoutWarnings.join('');
    } else {
      memberList.innerHTML = "<li>No members with outdated ranks.</li>" + membersWithoutWarnings.join('');
    }

  } catch (error) {
    memberList.innerHTML = `<li>Error: ${error.message}</li>`;
    console.error("Fetch Error:", error);
  }
});
