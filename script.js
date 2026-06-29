const SUPABASE_URL = "https://modvxlnceswqeqwcjegt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_6sqdMCnv5tbtLUWQ7m7fWA_n0cu_np3";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

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

    // Load users
    const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*");

    if (usersError) {
        console.error(usersError);
    } else {
        users = usersData || [];
    }

    // Load kingdoms
    const { data: kingdomData, error: kingdomError } = await supabase
        .from("kingdoms")
        .select("*");

    if (kingdomError) {
        console.error(kingdomError);
    } else {
        kingdoms = kingdomData.map(k => k.name);
    }

    // Load transactions
    const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("*");

    if (transactionError) {
        console.error(transactionError);
    } else {
        transactionsDB = transactionData || [];
    }

    loadKingdoms();
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
function display() {

    document.getElementById("fullNameDisplay").innerText =
        currentUser.full_name;

    document.getElementById("roleDisplay").innerText =
        `${currentUser.role_name} (${currentUser.role})`;

    document.getElementById("kingdomDisplay").innerText =
        `Kingdom: ${currentUser.kingdom}`;

    document.getElementById("balance").innerText =
`Bront: ${currentUser.bront}
Sylem: ${currentUser.sylem}
Virel: ${currentUser.virel}
Aurel: ${currentUser.aurel}
Lumen: ${currentUser.lumen}`;

    displayTransactions();
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

    document.getElementById("newKingdom").value = "";

    alert("Kingdom created successfully!");
}

// =========================
// DELETE KINGDOM
// =========================
async function deleteKingdom() {

    if (currentUser.role !== "Creator") {
        alert("Only the Creator can delete kingdoms.");
        return;
    }

    const kingdom = document.getElementById("deleteKingdom").value;

    if (!kingdom || kingdom === "No Kingdom") {
        alert("Cannot delete this kingdom.");
        return;
    }

    if (!confirm(`Delete "${kingdom}" and all users inside it?`)) {
        return;
    }

    // Delete transactions involving users in this kingdom
    const { data: kingdomUsers } = await supabase
        .from("users")
        .select("username")
        .eq("kingdom", kingdom);

    if (kingdomUsers) {
        for (const user of kingdomUsers) {

            await supabase
                .from("transactions")
                .delete()
                .or(`from_user.eq.${user.username},to_user.eq.${user.username}`);
        }
    }

    // Delete users
    await supabase
        .from("users")
        .delete()
        .eq("kingdom", kingdom);

    // Delete kingdom
    await supabase
        .from("kingdoms")
        .delete()
        .eq("name", kingdom);

    await loadData();

    alert("Kingdom deleted.");

    location.reload();
}

// =========================
// DELETE USER
// =========================
async function deleteUser() {

    const username = document.getElementById("manageUser").value.trim();

    if (!username) {
        alert("Enter username.");
        return;
    }

    if (username === currentUser.username) {
        alert("You cannot delete yourself.");
        return;
    }

    await supabase
        .from("transactions")
        .delete()
        .or(`from_user.eq.${username},to_user.eq.${username}`);

    const { error } = await supabase
        .from("users")
        .delete()
        .eq("username", username);

    if (error) {
        alert(error.message);
        return;
    }

    await loadData();

    displayAllUsers();
    displayAllTransactions();

    alert("User deleted.");
}

// =========================
// SUSPEND / UNSUSPEND
// =========================
async function toggleSuspend() {

    const username = document.getElementById("manageUser").value.trim();

    if (!username) {
        alert("Enter username.");
        return;
    }

    if (username === currentUser.username) {
        alert("You cannot suspend yourself.");
        return;
    }

    const user = users.find(u => u.username === username);

    if (!user) {
        alert("User not found.");
        return;
    }

    const { error } = await supabase
        .from("users")
        .update({
            suspended: !user.suspended
        })
        .eq("username", username);

    if (error) {
        alert(error.message);
        return;
    }

    await loadData();

    displayAllUsers();

    alert("User status updated.");
}

// =========================
// ADD COINS
// =========================
async function addCoins() {

    if (currentUser.role !== "Royal" && currentUser.role !== "Creator") {
        alert("Only Royal or Creator can add coins.");
        return;
    }

    const coin = document.getElementById("coinType").value;
    const amount = Number(document.getElementById("coinAmount").value);

    if (amount <= 0) {
        alert("Invalid amount.");
        return;
    }

    currentUser[coin] += amount;

    // Update balance
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

    // Record transaction
    await supabase
        .from("transactions")
        .insert([{
            from_user: "SYSTEM",
            to_user: currentUser.username,
            type: "ADD",
            coin: coin,
            amount: amount,
            date: new Date().toISOString()
        }]);

    await loadData();

    display();

    alert("Coins added successfully.");
}

// =========================
// APPROVE NOBLE
// =========================
async function approveNoble() {

    const username = document.getElementById("approveUser").value.trim();

    if (!username) {
        alert("Enter username.");
        return;
    }

    const user = users.find(u => u.username === username);

    if (!user) {
        alert("User not found.");
        return;
    }

    if (user.role !== "Noble") {
        alert("This user is not a Noble.");
        return;
    }

    const { error } = await supabase
        .from("users")
        .update({
            approved: true
        })
        .eq("username", username);

    if (error) {
        alert(error.message);
        return;
    }

    await loadData();

    displayAllUsers();

    alert("Noble approved.");
}

// =========================
// TRANSFER COINS
// =========================
async function transferCoins() {

    const username = document.getElementById("transferUser").value.trim();
    const coin = document.getElementById("transferCoin").value;
    const amount = Number(document.getElementById("transferAmount").value);

    if (!username || amount <= 0) {
        alert("Invalid transfer.");
        return;
    }

    const receiver = users.find(u => u.username === username);

    if (!receiver) {
        alert("Recipient not found.");
        return;
    }

    if (receiver.username === currentUser.username) {
        alert("You cannot transfer to yourself.");
        return;
    }

    if (currentUser[coin] < amount) {
        alert("Not enough coins.");
        return;
    }

    // Update balances
    currentUser[coin] -= amount;
    receiver[coin] += amount;

    // Save sender
    await supabase
        .from("users")
        .update({
            bront: currentUser.bront,
            sylem: currentUser.sylem,
            virel: currentUser.virel,
            aurel: currentUser.aurel,
            lumen: currentUser.lumen
        })
        .eq("username", currentUser.username);

    // Save receiver
    await supabase
        .from("users")
        .update({
            bront: receiver.bront,
            sylem: receiver.sylem,
            virel: receiver.virel,
            aurel: receiver.aurel,
            lumen: receiver.lumen
        })
        .eq("username", receiver.username);

    // Record transaction
    await supabase
        .from("transactions")
        .insert([{
            from_user: currentUser.username,
            to_user: receiver.username,
            type: "TRANSFER",
            coin: coin,
            amount: amount,
            date: new Date().toISOString()
        }]);

    await loadData();

    display();

    alert("Transfer successful.");
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

    if (currentUser.role !== "Creator") {
        alert("Only the Creator can reset the system.");
        return;
    }

    if (!confirm("This will delete EVERYTHING. Continue?")) {
        return;
    }

    await supabase.from("transactions").delete().neq("id", "");
    await supabase.from("users").delete().neq("id", "");
    await supabase.from("kingdoms").delete().neq("id", "");

    // Restore default kingdom
    await supabase
        .from("kingdoms")
        .insert([{ name: "No Kingdom" }]);

    sessionStorage.removeItem("currentUser");

    window.location.href = "login.html";
}

// =========================
// LOGOUT
// =========================
function logout() {

    sessionStorage.removeItem("currentUser");

    window.location.href = "login.html";

}

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

    if (window.location.pathname.includes("index.html")) {
        await initDashboard();
    }

};
