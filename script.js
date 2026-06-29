alert("THIS IS THE NEW SCRIPT");

console.log("window.supabase =", window.supabase);

try {
    console.log("supabase =", supabase);
} catch (e) {
    console.log("supabase variable doesn't exist yet");
}

// =========================
// DATABASE
// =========================
let users = [];
let kingdoms = [];
let transactionsDB = [];
let currentUser = null;

// =========================
// LOAD ALL DATA
// =========================
async function loadData() {

    console.log("STEP 1");

    const { data: kingdomData, error } = await supabase
        .from("kingdoms")
        .select("*");

    console.log("STEP 2");
    console.log(kingdomData);
    console.log(error);

    kingdoms = kingdomData ? kingdomData.map(k => k.name) : [];

    console.log("STEP 3");
    console.log(kingdoms);

    loadKingdoms();

    console.log("STEP 4");
}
// =========================
// LOAD KINGDOMS
// =========================
function loadKingdoms() {

    console.log("loadKingdoms()");

    const select = document.getElementById("kingdomSelect");

    console.log(select);

    if (!select) {
        console.log("SELECT NOT FOUND");
        return;
    }

    select.innerHTML = "";

    console.log("Kingdom count:", kingdoms.length);

    kingdoms.forEach(name => {

        console.log("Adding:", name);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;

        select.appendChild(option);

    });

    console.log("Finished");
}
// =========================
// REGISTER
// =========================
async function register() {

    let fullName = document.getElementById("fullName").value.trim();
    let username = document.getElementById("regUser").value.trim();
    let password = document.getElementById("regPass").value.trim();
    let role = document.getElementById("regRole").value;
    let roleName = document.getElementById("roleName").value.trim();
    let kingdom = document.getElementById("kingdomSelect").value;

    if (!fullName || !username || !password || !roleName) {
        alert("Fill all fields!");
        return;
    }

    // Refresh latest users
    await loadData();

    if (users.find(u => u.username === username)) {
        alert("Username already exists!");
        return;
    }

    if (role === "Creator" && users.find(u => u.role === "Creator")) {
        alert("Only one Creator is allowed!");
        return;
    }

    const { error } = await supabase
        .from("users")
        .insert([
            {
                full_name: fullName,
                username: username,
                password: password,
                role: role,
                role_name: roleName,
                kingdom: kingdom,
                bront: 0,
                sylem: 0,
                virel: 0,
                aurel: 0,
                lumen: 0,
                suspended: false,
                approved: role === "Noble" ? false : true
            }
        ]);

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    alert("Account created successfully!");

    document.getElementById("fullName").value = "";
    document.getElementById("regUser").value = "";
    document.getElementById("regPass").value = "";
    document.getElementById("roleName").value = "";

    await loadData();
}

// =========================
// LOGIN
// =========================
async function login() {

    let u = document.getElementById("loginUser").value.trim();
    let p = document.getElementById("loginPass").value.trim();

    if (!u || !p) {
        alert("Enter username and password.");
        return;
    }

    const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", u)
        .eq("password", p)
        .single();

    if (error || !user) {
        alert("Invalid username or password.");
        return;
    }

    if (user.suspended) {
        alert("Account suspended!");
        return;
    }

    if (user.role === "Noble" && !user.approved) {
        alert("Pending Royal approval!");
        return;
    }

    currentUser = user;

    // Save logged-in user temporarily
    sessionStorage.setItem("currentUser", user.username);

    window.location.href = "index.html";
}

// =========================
// DASHBOARD INITIALIZATION
// =========================
async function initDashboard() {

    const username = sessionStorage.getItem("currentUser");

    if (!username) {
        window.location.href = "login.html";
        return;
    }

    const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

    if (error || !user) {
        sessionStorage.removeItem("currentUser");
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    await loadData();

    display();

    if (currentUser.role === "Royal" || currentUser.role === "Creator") {
        document.getElementById("royalControl").style.display = "block";
    }

    if (currentUser.role === "Royal") {
        document.getElementById("royalApproval").style.display = "block";
    }

    if (currentUser.role === "Creator") {
        document.getElementById("creatorPanel").style.display = "block";
        document.getElementById("userManagement").style.display = "block";
        document.getElementById("creatorDashboard").style.display = "block";

        displayAllUsers();
        displayAllTransactions();
    }
}

// Run only on index.html
if (window.location.pathname.includes("index.html")) {
    initDashboard();
}

// =========================
// DISPLAY USER
// =========================
function display(){

  document.getElementById("fullNameDisplay").innerText =
      currentUser.full_name;

  document.getElementById("roleDisplay").innerText =
      currentUser.role_name + " (" + currentUser.role + ")";

  document.getElementById("kingdomDisplay").innerText =
      "Kingdom: " + currentUser.kingdom;

  document.getElementById("balance").innerText =
`Bront: ${currentUser.bront}
Sylem: ${currentUser.sylem}
Virel: ${currentUser.virel}
Aurel: ${currentUser.aurel}
Lumen: ${currentUser.lumen}`;

  displayTransactions();
}
// =========================
// REFRESH CURRENT USER
// =========================
async function refreshCurrentUser() {

    if (!currentUser) return;

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", currentUser.username)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    currentUser = data;

    sessionStorage.setItem(
    "currentUser",
    currentUser.username
    );
}
// =========================
// CREATOR - USER TABLE
// =========================
function displayAllUsers() {

    let table = document.querySelector("#userTable tbody");

    if (!table) return;

    table.innerHTML = "";

    users.forEach(user => {

        table.innerHTML += `
        <tr>
            <td>${user.username}</td>
            <td>${user.role}</td>
            <td>${user.kingdom}</td>
            <td>${user.bront}</td>
            <td>${user.sylem}</td>
            <td>${user.virel}</td>
            <td>${user.aurel}</td>
            <td>${user.lumen}</td>
        </tr>`;
    });

}

// =========================
// GLOBAL TRANSACTIONS
// =========================
function displayAllTransactions() {

    let box = document.getElementById("allTransactions");

    if (!box) return;

    box.innerHTML = "<h2>📜 Global Transactions</h2>";

    transactionsDB
        .slice()
        .reverse()
        .forEach(t => {

            box.innerHTML += `
            <p>
                ${t.date}<br>
                <b>${t.type}</b> ${t.amount} ${t.coin}<br>
                ${t.from_user} → ${t.to_user}
            </p>
            <hr>`;

        });

}
// =========================
// CREATE KINGDOM
// =========================
async function createKingdom() {
    
    const { data } = await supabase
        .from("users")
        .select("role")
        .eq("username", currentUser.username)
        .single();

    if (!data || data.role !== "Creator") {
        alert("Access denied.");
        return;
    }

    let name = document.getElementById("newKingdom").value.trim();

    if (!name) {
        alert("Enter a kingdom name.");
        return;
    }

    await loadData();

    if (kingdoms.includes(name)) {
        alert("Kingdom already exists.");
        return;
    }

    const { error } = await supabase
        .from("kingdoms")
        .insert([{ name: name }]);

    if (error) {
        alert(error.message);
        return;
    }

    await loadData();
    await refreshCurrentUser();

    document.getElementById("newKingdom").value = "";

    alert("Kingdom created successfully!");
}

// =========================
// DELETE KINGDOM
// =========================
async function deleteKingdom() {
    const { data } = await supabase
        .from("users")
        .select("role")
        .eq("username", currentUser.username)
        .single();

    if (!data || data.role !== "Creator") {
        alert("Access denied.");
        return;
    }

    const kingdom = document.getElementById("deleteKingdom").value;

    if (!kingdom || kingdom === "No Kingdom") {
        alert("Cannot delete this kingdom.");
        return;
    }

    if (!confirm(`Delete "${kingdom}" and ALL users inside it?`)) {
        return;
    }

    // Delete all transactions involving users in this kingdom
    const kingdomUsers = users.filter(u => u.kingdom === kingdom);

    for (const user of kingdomUsers) {

        await supabase
            .from("transactions")
            .delete()
            .or(`from_user.eq.${user.username},to_user.eq.${user.username}`);
    }

    // Delete all users in the kingdom
    const { error: userError } = await supabase
        .from("users")
        .delete()
        .eq("kingdom", kingdom);

    if (userError) {
        alert(userError.message);
        return;
    }

    // Delete the kingdom itself
    const { error: kingdomError } = await supabase
        .from("kingdoms")
        .delete()
        .eq("name", kingdom);

    if (kingdomError) {
        alert(kingdomError.message);
        return;
    }

    // Reload latest data
    await loadData();
    await refreshCurrentUser();

    // Refresh Creator dashboard
    displayAllUsers();
    displayAllTransactions();

    alert("Kingdom deleted successfully.");

    location.reload();
}

// =========================
// DELETE USER
// =========================
async function deleteUser() {

    const { data } = await supabase
        .from("users")
        .select("role")
        .eq("username", currentUser.username)
        .single();

    if (!data || data.role !== "Creator") {
        alert("Access denied.");
        return;
    }

    const username = document.getElementById("manageUser").value.trim();

    if (!username) {
        alert("Enter a username.");
        return;
    }

    if (username === currentUser.username) {
        alert("You cannot delete yourself.");
        return;
    }

    // Check if user exists
    const { data: user, error: findError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

    if (findError || !user) {
        alert("User not found.");
        return;
    }

    // Confirm deletion
    if (!confirm(`Delete user "${username}"?`)) {
        return;
    }

    // Delete all transactions involving the user
    const { error: transactionError } = await supabase
        .from("transactions")
        .delete()
        .or(`from_user.eq.${username},to_user.eq.${username}`);

    if (transactionError) {
        alert(transactionError.message);
        return;
    }

    // Delete the user
    const { error: userError } = await supabase
        .from("users")
        .delete()
        .eq("username", username);

    if (userError) {
        alert(userError.message);
        return;
    }

    // Reload latest data
    await loadData();
    await refreshCurrentUser();

    // Refresh dashboard
    displayAllUsers();
    displayAllTransactions();

    // Clear input
    document.getElementById("manageUser").value = "";

    alert("User deleted successfully!");
}

// =========================
// SUSPEND / UNSUSPEND USER
// =========================
async function toggleSuspend() {

    const { data } = await supabase
        .from("users")
        .select("role")
        .eq("username", currentUser.username)
        .single();

    if (!data || data.role !== "Creator") {
        alert("Access denied.");
        return;
    }


    const username = document.getElementById("manageUser").value.trim();

    if (!username) {
        alert("Enter a username.");
        return;
    }

    if (username === currentUser.username) {
        alert("You cannot suspend yourself.");
        return;
    }

    // Find user
    const { data: user, error: findError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

    if (findError || !user) {
        alert("User not found.");
        return;
    }

    // Toggle suspension
    const newStatus = !user.suspended;

    // Update database
    const { error: updateError } = await supabase
        .from("users")
        .update({
            suspended: newStatus
        })
        .eq("username", username);

    if (updateError) {
        alert(updateError.message);
        return;
    }

    // Reload latest data
    await loadData();
    await refreshCurrentUser();

    // Refresh dashboard
    displayAllUsers();
    displayAllTransactions();

    // Clear input
    document.getElementById("manageUser").value = "";

    alert(
        newStatus
            ? "User has been suspended."
            : "User has been unsuspended."
    );
}

// =========================
// ADD COINS
// =========================
async function addCoins() {

    // Only Royal and Creator can add coins
    if (currentUser.role !== "Royal" && currentUser.role !== "Creator") {
        alert("Only Royal or Creator can add coins.");
        return;
    }

    const coin = document.getElementById("coinType").value;
    const amount = Number(document.getElementById("coinAmount").value);

    if (amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    // Add coins locally
    currentUser[coin] += amount;

    // Update database
    const { error } = await supabase
        .from("users")
        .update({
            bront: currentUser.bront,
            sylem: currentUser.sylem,
            virel: currentUser.virel,
            aurel: currentUser.aurel,
            lumen: currentUser.lumen
        })
        .eq("username", currentUser.username);

    if (error) {
        alert(error.message);
        return;
    }

    // Save transaction
    const { error: transactionError } = await supabase
        .from("transactions")
        .insert([{
            from_user: "SYSTEM",
            to_user: currentUser.username,
            type: "ADD",
            coin: coin,
            amount: amount,
            date: new Date().toISOString()
        }]);

    if (transactionError) {
        alert(transactionError.message);
        return;
    }

    // Reload everything from Supabase
    await loadData();
await refreshCurrentUser();

display();

    // Refresh Creator dashboard if open
    if (currentUser.role === "Creator") {
        displayAllUsers();
        displayAllTransactions();
    }

    alert("Coins added successfully!");
}
// =========================
// TRANSFER COINS
// =========================
async function transferCoins() {

    const username = document.getElementById("transferUser").value.trim();
    const coin = document.getElementById("transferCoin").value;
    const amount = Number(document.getElementById("transferAmount").value);

    if (!username) {
        alert("Enter a recipient username.");
        return;
    }

    if (amount <= 0) {
        alert("Enter a valid amount.");
        return;
    }

    if (username === currentUser.username) {
        alert("You cannot transfer coins to yourself.");
        return;
    }

    // Reload latest database
    await loadData();

    // Refresh current user
    currentUser = users.find(u => u.username === currentUser.username);

    // Find receiver
    const receiver = users.find(u => u.username === username);

    if (!receiver) {
        alert("Recipient not found.");
        return;
    }

    // Check balance
    if (currentUser[coin] < amount) {
        alert("Not enough coins.");
        return;
    }

    // Transfer
    currentUser[coin] -= amount;
    receiver[coin] += amount;

    // Update sender
    const { error: senderError } = await supabase
        .from("users")
        .update({
            bront: currentUser.bront,
            sylem: currentUser.sylem,
            virel: currentUser.virel,
            aurel: currentUser.aurel,
            lumen: currentUser.lumen
        })
        .eq("username", currentUser.username);

    if (senderError) {
        alert(senderError.message);
        return;
    }

    // Update receiver
    const { error: receiverError } = await supabase
        .from("users")
        .update({
            bront: receiver.bront,
            sylem: receiver.sylem,
            virel: receiver.virel,
            aurel: receiver.aurel,
            lumen: receiver.lumen
        })
        .eq("username", receiver.username);

    if (receiverError) {
        alert(receiverError.message);
        return;
    }

    // Save transaction
    const { error: transactionError } = await supabase
        .from("transactions")
        .insert([{
            from_user: currentUser.username,
            to_user: receiver.username,
            type: "TRANSFER",
            coin: coin,
            amount: amount,
            date: new Date().toISOString()
        }]);

    if (transactionError) {
        alert(transactionError.message);
        return;
    }

    // Reload latest data
await loadData();
await refreshCurrentUser();

display();

    if (currentUser.role === "Creator") {
        displayAllUsers();
        displayAllTransactions();
    }

    // Clear fields
    document.getElementById("transferUser").value = "";
    document.getElementById("transferAmount").value = "";

    alert("Transfer successful!");
}
// =========================
// APPROVE NOBLE
// =========================
async function approveNoble() {

    if (currentUser.role !== "Royal" && currentUser.role !== "Creator") {
        alert("Only Royal or Creator can approve Nobles.");
        return;
    }

    const username = document.getElementById("approveUser").value.trim();

    if (!username) {
        alert("Enter a username.");
        return;
    }

    // Find the user
    const { data: user, error: findError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

    if (findError || !user) {
        alert("User not found.");
        return;
    }

    if (user.role !== "Noble") {
        alert("This user is not a Noble.");
        return;
    }

    if (user.approved) {
        alert("This Noble is already approved.");
        return;
    }

    // Approve Noble
    const { error: updateError } = await supabase
        .from("users")
        .update({
            approved: true
        })
        .eq("username", username);

    if (updateError) {
        alert(updateError.message);
        return;
    }

    // Reload latest data
    await loadData();

    await refreshCurrentUser();

    // Refresh dashboard
    displayAllUsers();
    displayAllTransactions();

    // Clear input
    document.getElementById("approveUser").value = "";

    alert(`${username} has been approved as a Noble.`);
}

// =========================
// TRANSACTION HISTORY
// =========================
function displayTransactions() {

    const box = document.getElementById("transactionHistory");

    if (!box) return;

    let list;

    if (currentUser.role === "Creator") {
        list = transactionsDB;
    } else {
        list = transactionsDB.filter(t =>
            t.from_user === currentUser.username ||
            t.to_user === currentUser.username
        );
    }

    box.innerHTML = "<h3>Transaction History</h3>";

    list.slice().reverse().forEach(t => {

        box.innerHTML += `
            <p>
                ${new Date(t.date).toLocaleString()}<br>
                <strong>${t.type}</strong><br>
                ${t.amount} ${t.coin}<br>
                ${t.from_user} ➜ ${t.to_user}
            </p>
            <hr>
        `;
    });

}

// =========================
// DELETE ACCOUNT
// =========================
async function deleteAccount() {

    if (!confirm("Delete your account?")) {
        return;
    }

    await supabase
        .from("transactions")
        .delete()
        .or(`from_user.eq.${currentUser.username},to_user.eq.${currentUser.username}`);

    const { error } = await supabase
        .from("users")
        .delete()
        .eq("username", currentUser.username);

    if (error) {
        alert(error.message);
        return;
    }

    sessionStorage.removeItem("currentUser");

    window.location.href = "login.html";
}


// =========================
// RESET SYSTEM
// =========================
async function resetSystem() {

    const { data } = await supabase
        .from("users")
        .select("role")
        .eq("username", currentUser.username)
        .single();

    if (!data || data.role !== "Creator") {
        alert("Access denied.");
        return;
    }

    if (currentUser.role !== "Creator") {
        alert("Only the Creator can reset the system.");
        return;
    }

    if (!confirm("⚠ WARNING!\n\nThis will permanently delete ALL users, kingdoms, and transactions.\n\nContinue?")) {
        return;
    }

    // Delete all transactions
    const { error: transactionError } = await supabase
        .from("transactions")
        .delete()
        .neq("id", 0);

    if (transactionError) {
        alert(transactionError.message);
        return;
    }

    // Delete all users
    const { error: userError } = await supabase
        .from("users")
        .delete()
        .neq("id", 0);

    if (userError) {
        alert(userError.message);
        return;
    }

    // Delete all kingdoms
    const { error: kingdomError } = await supabase
        .from("kingdoms")
        .delete()
        .neq("id", 0);

    if (kingdomError) {
        alert(kingdomError.message);
        return;
    }

    // Reload data
    await loadData();

    // Log out
    currentUser = null;

    sessionStorage.removeItem("currentUser");

    alert("System has been reset successfully!");

    window.location.href = "login.html";
}

// =========================
// LOGOUT
// =========================

function logout() {
    sessionStorage.removeItem("currentUser");
    currentUser = null;
    window.location.href = "login.html";
}

// =========================
// PAGE LOAD
// =========================
window.onload = async () => {

    await loadData();

};
