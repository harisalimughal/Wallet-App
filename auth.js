document.addEventListener('DOMContentLoaded', function(){
    const loginForm = document.getElementById('loginForm')
    const signupForm = document.getElementById('signupForm');

    if(loginForm){
        loginForm.addEventListener('submit',handleLogin);
    }

    if(signupForm){
        signupForm.addEventListener('submit',handleSignup);
    }
});

function handleLogin(e){
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u=>u.email===email && u.password === password );

    if(user){
        localStorage.setItem('currentUser', JSON.stringify(user));
        alert('Login Successful!');
        window.location.href='dashboard.html';
    } else {
        alert('Invalid email or password');
    }
}

function handleSignup(e){
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const initialBalance = parseFloat(document.getElementById('initialBalance').value);

    if (initialBalance < 5000) {
        alert('Initial balance must be at least ₹5,000');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(u => u.email === email)) {
        alert('Email already exists');
        return;
    }

    const newUser = { name, email, password, balance: initialBalance };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));

    alert('Signup successful!');
    window.location.href = 'dashboard.html';
}

function checkBalance() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.balance < 5000) {
        alert('Your balance is low. Please add funds to your wallet.');
    }
}

// Call this function when the dashboard page loads
function initDashboard() {
    checkBalance();
    // Other dashboard initialization code...
}


