// purchase.js

let currentUser;
const products = [
    { id: 1, name: "T-shirt", price: 599 },
    { id: 2, name: "Jeans", price: 1299 },
    { id: 3, name: "Sneakers", price: 1999 },
    { id: 4, name: "Backpack", price: 899 },
    { id: 5, name: "Watch", price: 2499 },
    { id: 6, name: "Sunglasses", price: 799 }
];

document.addEventListener('DOMContentLoaded', function() {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    updateBalance();
    displayProducts();
    setupEventListeners();
});

function updateBalance() {
    const balanceElement = document.getElementById('currentBalance');
    balanceElement.textContent = currentUser.balance.toFixed(2);
}

function displayProducts() {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'col-md-4 mb-3';
        productCard.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text">Price: ₹${product.price}</p>
                    <button class="btn btn-primary buy-btn" data-id="${product.id}">Buy</button>
                </div>
            </div>
        `;
        productList.appendChild(productCard);
    });
}

function setupEventListeners() {
    document.getElementById('productList').addEventListener('click', handlePurchase);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

function handlePurchase(e) {
    if (e.target.classList.contains('buy-btn')) {
        const productId = parseInt(e.target.getAttribute('data-id'));
        const product = products.find(p => p.id === productId);

        if (product) {
            if (currentUser.balance >= product.price) {
                currentUser.balance -= product.price;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateBalance();
                alert(`You have successfully purchased ${product.name} for ₹${product.price}`);
            } else {
                alert('Insufficient balance. Please add funds to your wallet.');
            }
        }
    }
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}