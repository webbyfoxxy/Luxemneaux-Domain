// DATABASE
let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser"));
let transactionsDB = JSON.parse(localStorage.getItem("transactionsDB")) || [];
let kingdoms = JSON.parse(localStorage.getItem("kingdoms")) || ["No Kingdom"];

// LOAD KINGDOMS
function loadKingdoms() {
  let select = document.getElementById("kingdomSelect");
  if(select){
    select.innerHTML = "";
    kingdoms.forEach(k=>{
      let opt = document.createElement("option");
      opt.value=k; opt.textContent=k;
      select.appendChild(opt);
    });
  }
  let del = document.getElementById("deleteKingdom");
  if(del){
    del.innerHTML="";
    kingdoms.forEach(k=>{
      let opt = document.createElement("option");
      opt.value=k; opt.textContent=k;
      del.appendChild(opt);
    });
  }
}
loadKingdoms();

// REGISTER
function register(){
  let fullName = document.getElementById("fullName").value.trim();
  let username = document.getElementById("regUser").value.trim();
  let password = document.getElementById("regPass").value.trim();
  let role = document.getElementById("regRole").value;
  let roleName = document.getElementById("roleName").value.trim();
  let kingdom = document.getElementById("kingdomSelect").value;

  if(!fullName || !username || !password || !roleName) return alert("Fill all fields!");
  if(users.find(u=>u.username===username)) return alert("Username exists!");
  if(role==="Creator" && users.find(u=>u.role==="Creator")) return alert("Only one Creator allowed!");

  let newUser = { fullName, username, password, role, roleName, kingdom,
    bront:0,sylem:0,virel:0,aurel:0,lumen:0,
    suspended:false, approved: role==="Noble"?false:true
  };
  users.push(newUser);
  saveAll(); alert("Account created!");
}

// LOGIN
function login(){
  let u = document.getElementById("loginUser").value;
  let p = document.getElementById("loginPass").value;
  let user = users.find(x=>x.username===u && x.password===p);
  if(!user) return alert("Invalid login");
  if(user.suspended) return alert("Account suspended!");
  if(user.role==="Noble" && !user.approved) return alert("Pending Royal approval!");
  currentUser = user; saveAll();
  window.location.href="index.html";
}

// DASHBOARD INIT
if(window.location.pathname.includes("index.html")){
  if(!currentUser) window.location.href="login.html";
  else{
    display();
    if(currentUser.role==="Royal"||currentUser.role==="Creator") document.getElementById("royalControl").style.display="block";
    if(currentUser.role==="Royal") document.getElementById("royalApproval").style.display="block";
    if(currentUser.role==="Creator"){
      document.getElementById("creatorPanel").style.display="block";
      document.getElementById("userManagement").style.display="block";
      document.getElementById("creatorDashboard").style.display="block";
      displayAllUsers(); displayAllTransactions();
    }
  }
}

// DISPLAY USER DASHBOARD
function display(){
  document.getElementById("fullNameDisplay").innerText = currentUser.fullName;
  document.getElementById("roleDisplay").innerText = currentUser.roleName + " ("+currentUser.role+")";
  document.getElementById("kingdomDisplay").innerText = "Kingdom: "+currentUser.kingdom;
  document.getElementById("balance").innerText =
`Bront: ${currentUser.bront}
Sylem: ${currentUser.sylem}
Virel: ${currentUser.virel}
Aurel: ${currentUser.aurel}
Lumen: ${currentUser.lumen}`;
  displayTransactions();
}

// CREATOR: USERS & TRANSACTIONS
function displayAllUsers(){
  let table = document.querySelector("#userTable tbody");
  if(!table) return; table.innerHTML="";
  users.forEach(u=>{
    table.innerHTML+=`<tr>
      <td>${u.username}</td><td>${u.role}</td><td>${u.kingdom}</td>
      <td>${u.bront}</td><td>${u.sylem}</td><td>${u.virel}</td>
      <td>${u.aurel}</td><td>${u.lumen}</td>
    </tr>`;
  });
}
function displayAllTransactions(){
  let box=document.getElementById("allTransactions");
  if(!box) return; box.innerHTML="<h2>📜 Global Transactions</h2>";
  transactionsDB.slice().reverse().forEach(t=>{
    box.innerHTML+=`<p>${t.date}<br><b>${t.type}</b> ${t.amount} ${t.coin}<br>${t.from} → ${t.to}</p><hr>`;
  });
}

// CREATE KINGDOM
function createKingdom(){
  let name=document.getElementById("newKingdom").value.trim();
  if(!name) return alert("Enter name");
  if(kingdoms.includes(name)) return alert("Exists");
  kingdoms.push(name);
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  loadKingdoms(); alert("Kingdom created!");
}

// DELETE KINGDOM
function deleteKingdom(){
  if(currentUser.role!=="Creator") return alert("Only Creator can delete kingdoms!");
  let kingdom=document.getElementById("deleteKingdom").value;
  if(!kingdom||kingdom==="No Kingdom") return alert("Cannot delete this kingdom");
  if(!confirm(`Delete kingdom "${kingdom}" and ALL its users?`)) return;
  let removedUsers = users.filter(u=>u.kingdom===kingdom).map(u=>u.username);
  users = users.filter(u=>u.kingdom!==kingdom);
  kingdoms = kingdoms.filter(k=>k!==kingdom);
  transactionsDB = transactionsDB.filter(t=>!removedUsers.includes(t.from)&&!removedUsers.includes(t.to));
  localStorage.setItem("kingdoms", JSON.stringify(kingdoms));
  saveAll(); alert("Kingdom and its users deleted!"); location.reload();
}

// USER MANAGEMENT
function deleteUser(){let username=document.getElementById("manageUser").value.trim();
if(!username) return alert("Enter username"); if(username===currentUser.username) return alert("Cannot delete yourself");
users=users.filter(u=>u.username!==username);
transactionsDB=transactionsDB.filter(t=>t.from!==username&&t.to!==username);
saveAll(); alert("User deleted!"); if(currentUser.role==="Creator"){displayAllUsers();displayAllTransactions();}}

function toggleSuspend(){let username=document.getElementById("manageUser").value.trim();
let user=users.find(u=>u.username===username); if(!user) return alert("User not found");
if(user.username===currentUser.username) return alert("Cannot suspend yourself");
user.suspended=!user.suspended; updateUser(user);}

// COINS
function addCoins(){if(currentUser.role!=="Royal"&&currentUser.role!=="Creator") return alert("Only Royal or Creator can add coins!");
let type=document.getElementById("coinType").value; let amount=Number(document.getElementById("coinAmount").value);
if(amount<=0) return alert("Invalid amount");
currentUser[type]+=amount;
transactionsDB.push({from:"SYSTEM",to:currentUser.username,type:"ADD",coin:type,amount,date:new Date().toLocaleString()});
updateUser(currentUser);
}

// APPROVE NOBLE
function approveNoble(){let username=document.getElementById("approveUser").value.trim();
let user=users.find(u=>u.username===username); if(!user) return alert("User not found");
if(user.role!=="Noble") return alert("Not a Noble"); user.approved=true; updateUser(user);}

// TRANSFER
function transferCoins(){let name=document.getElementById("transferUser").value;
let coin=document.getElementById("transferCoin").value; let amount=Number(document.getElementById("transferAmount").value);
let rec=users.find(u=>u.username===name); if(!rec) return alert("User not found");
if(currentUser[coin]<amount) return alert("Not enough coins");
currentUser[coin]-=amount; rec[coin]+=amount;
transactionsDB.push({from:currentUser.username,to:rec.username,type:"TRANSFER",coin,amount,date:new Date().toLocaleString()});
updateUser(currentUser); updateUser(rec);
}

// TRANSACTIONS DISPLAY
function displayTransactions(){let box=document.getElementById("transactionHistory"); if(!box) return;
let list=currentUser.role==="Creator"?transactionsDB:transactionsDB.filter(t=>t.from===currentUser.username||t.to===currentUser.username);
box.innerHTML="<h3>Transactions</h3>";
list.slice().reverse().forEach(t=>{box.innerHTML+=`<p>${t.date}|${t.type} ${t.amount} ${t.coin} (${t.from}→${t.to})</p>`;});}

// DELETE ACCOUNT
function deleteAccount(){if(!confirm("Delete account?")) return;
users=users.filter(u=>u.username!==currentUser.username); saveAll(); logout();}

// RESET SYSTEM
function resetSystem(){if(currentUser.role!=="Creator") return alert("Only Creator can reset!");
if(!confirm("DELETE EVERYTHING?")) return; localStorage.clear(); window.location.href="login.html";}

// HELPERS
function updateUser(user){users=users.map(u=>u.username===user.username?user:u); saveAll(); display();
if(currentUser.role==="Creator"){displayAllUsers(); displayAllTransactions();}}

function saveAll(){localStorage.setItem("users",JSON.stringify(users));
localStorage.setItem("currentUser",JSON.stringify(currentUser));
localStorage.setItem("transactionsDB",JSON.stringify(transactionsDB));}

function logout(){localStorage.removeItem("currentUser"); window.location.href="login.html";}