// dashboard.js

// dashboard.js

// ... (previous code remains the same)

function showItemDetails(item) {
    const modal = new bootstrap.Modal(document.getElementById('itemDetailsModal'));
    const modalTitle = document.getElementById('itemDetailsModalLabel');
    const modalBody = document.getElementById('itemDetailsBody');
    const editBtn = document.getElementById('editItemBtn');
    const deleteBtn = document.getElementById('deleteItemBtn');

    modalTitle.textContent = item.name || item.website;
    modalBody.innerHTML = '';

    for (const [key, value] of Object.entries(item)) {
        if (key !== 'userId' && key !== 'type' && key !== 'name') {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}`;
            modalBody.appendChild(p);
        }
    }

    editBtn.onclick = () => editItem(item);
    deleteBtn.onclick = () => deleteItem(item);

    modal.show();
}

function editItem(item) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('itemDetailsModal'));
    modal.hide();

    const addItemModal = new bootstrap.Modal(document.getElementById('addItemModal'));
    const addItemForm = document.getElementById('addItemForm');
    const itemTypeSelect = document.getElementById('itemType');

    itemTypeSelect.value = item.type;
    updateItemFields();

    // Populate form fields based on item type
    switch (item.type) {
        case 'card':
            document.getElementById('cardNumber').value = item.cardNumber;
            document.getElementById('expirationDate').value = item.expirationDate;
            document.getElementById('cvv').value = item.cvv;
            break;
        case 'ticket':
            document.getElementById('ticketType').value = item.ticketType;
            document.getElementById('ticketDate').value = item.date;
            document.getElementById('ticketTime').value = item.time;
            document.getElementById('ticketPlace').value = item.place;
            break;
        case 'password':
            document.getElementById('website').value = item.website;
            document.getElementById('username').value = item.username;
            document.getElementById('password').value = item.password;
            break;
    }

    addItemForm.onsubmit = (e) => {
        e.preventDefault();
        handleEditItem(item);
    };

    addItemModal.show();
}

function handleEditItem(oldItem) {
    const items = JSON.parse(localStorage.getItem('items')) || [];
    const index = items.findIndex(i => i.userId === oldItem.userId && i.name === oldItem.name);

    if (index !== -1) {
        const updatedItem = {
            type: document.getElementById('itemType').value,
            userId: currentUser.email
        };

        switch (updatedItem.type) {
            case 'card':
                updatedItem.cardNumber = document.getElementById('cardNumber').value;
                updatedItem.expirationDate = document.getElementById('expirationDate').value;
                updatedItem.cvv = document.getElementById('cvv').value;
                updatedItem.name = `Card ending in ${updatedItem.cardNumber.slice(-4)}`;
                break;
            case 'ticket':
                updatedItem.ticketType = document.getElementById('ticketType').value;
                updatedItem.date = document.getElementById('ticketDate').value;
                updatedItem.time = document.getElementById('ticketTime').value;
                updatedItem.place = document.getElementById('ticketPlace').value;
                updatedItem.name = `${updatedItem.ticketType} - ${updatedItem.date}`;
                break;
            case 'password':
                updatedItem.website = document.getElementById('website').value;
                updatedItem.username = document.getElementById('username').value;
                updatedItem.password = document.getElementById('password').value;
                updatedItem.name = updatedItem.website;
                break;
        }

        items[index] = updatedItem;
        localStorage.setItem('items', JSON.stringify(items));

        loadItems();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
        modal.hide();
    }
}

function deleteItem(item) {
    if (confirm('Are you sure you want to delete this item?')) {
        let items = JSON.parse(localStorage.getItem('items')) || [];
        items = items.filter(i => !(i.userId === item.userId && i.name === item.name));
        localStorage.setItem('items', JSON.stringify(items));

        loadItems();
        const modal = bootstrap.Modal.getInstance(document.getElementById('itemDetailsModal'));
        modal.hide();
    }
}

// ... (rest of the previous code remains the same)

let currentUser;

document.addEventListener('DOMContentLoaded', function() {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    initDashboard();
    setupEventListeners();
});

function initDashboard() {
    document.getElementById('userName').textContent = currentUser.name;
    updateBalance();
    loadItems();
}

function updateBalance() {
    const balanceElement = document.getElementById('currentBalance');
    balanceElement.textContent = currentUser.balance.toFixed(2);

    const lowBalanceAlert = document.getElementById('lowBalanceAlert');
    if (currentUser.balance < 5000) {
        lowBalanceAlert.classList.remove('d-none');
    } else {
        lowBalanceAlert.classList.add('d-none');
    }
}

function loadItems() {
    const items = JSON.parse(localStorage.getItem('items')) || [];
    const userItems = items.filter(item => item.userId === currentUser.email);

    const cardsList = document.getElementById('cardsList');
    const ticketsList = document.getElementById('ticketsList');
    const passwordsList = document.getElementById('passwordsList');

    cardsList.innerHTML = '';
    ticketsList.innerHTML = '';
    passwordsList.innerHTML = '';

    userItems.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        listItem.textContent = item.name || item.website;
        listItem.addEventListener('click', () => showItemDetails(item));

        switch (item.type) {
            case 'card':
                cardsList.appendChild(listItem);
                break;
            case 'ticket':
                ticketsList.appendChild(listItem);
                break;
            case 'password':
                passwordsList.appendChild(listItem);
                break;
        }
    });
}

function setupEventListeners() {
    const addItemBtn = document.getElementById('addItemBtn');
    const addItemForm = document.getElementById('addItemForm');
    const itemTypeSelect = document.getElementById('itemType');
    const logoutBtn = document.getElementById('logoutBtn');

    addItemBtn.addEventListener('click', showAddItemModal);
    addItemForm.addEventListener('submit', handleAddItem);
    itemTypeSelect.addEventListener('change', updateItemFields);
    logoutBtn.addEventListener('click', handleLogout);
}

function showAddItemModal() {
    const modal = new bootstrap.Modal(document.getElementById('addItemModal'));
    modal.show();
}

function updateItemFields() {
    const itemType = document.getElementById('itemType').value;
    const itemFields = document.getElementById('itemFields');
    itemFields.innerHTML = '';

    switch (itemType) {
        case 'card':
            itemFields.innerHTML = `
                <div class="mb-3">
                    <label for="cardNumber" class="form-label">Card Number</label>
                    <input type="text" class="form-control" id="cardNumber" required>
                </div>
                <div class="mb-3">
                    <label for="expirationDate" class="form-label">Expiration Date</label>
                    <input type="text" class="form-control" id="expirationDate" required>
                </div>
                <div class="mb-3">
                    <label for="cvv" class="form-label">CVV</label>
                    <input type="text" class="form-control" id="cvv" required>
                </div>
            `;
            break;
        case 'ticket':
            itemFields.innerHTML = `
                <div class="mb-3">
                    <label for="ticketType" class="form-label">Ticket Type</label>
                    <input type="text" class="form-control" id="ticketType" required>
                </div>
                <div class="mb-3">
                    <label for="ticketDate" class="form-label">Date</label>
                    <input type="date" class="form-control" id="ticketDate" required>
                </div>
                <div class="mb-3">
                    <label for="ticketTime" class="form-label">Time</label>
                    <input type="time" class="form-control" id="ticketTime" required>
                </div>
                <div class="mb-3">
                    <label for="ticketPlace" class="form-label">Place</label>
                    <input type="text" class="form-control" id="ticketPlace" required>
                </div>
            `;
            break;
        case 'password':
            itemFields.innerHTML = `
                <div class="mb-3">
                    <label for="website" class="form-label">Website</label>
                    <input type="text" class="form-control" id="website" required>
                </div>
                <div class="mb-3">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" class="form-control" id="username" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" class="form-control" id="password" required>
                </div>
            `;
            break;
    }
}

function handleAddItem(e) {
    e.preventDefault();
    const itemType = document.getElementById('itemType').value;
    let newItem = {
        type: itemType,
        userId: currentUser.email
    };

    switch (itemType) {
        case 'card':
            newItem.cardNumber = document.getElementById('cardNumber').value;
            newItem.expirationDate = document.getElementById('expirationDate').value;
            newItem.cvv = document.getElementById('cvv').value;
            newItem.name = `Card ending in ${newItem.cardNumber.slice(-4)}`;
            break;
        case 'ticket':
            newItem.ticketType = document.getElementById('ticketType').value;
            newItem.date = document.getElementById('ticketDate').value;
            newItem.time = document.getElementById('ticketTime').value;
            newItem.place = document.getElementById('ticketPlace').value;
            newItem.name = `${newItem.ticketType} - ${newItem.date}`;
            break;
        case 'password':
            newItem.website = document.getElementById('website').value;
            newItem.username = document.getElementById('username').value;
            newItem.password = document.getElementById('password').value;
            break;
    }

    const items = JSON.parse(localStorage.getItem('items')) || [];
    items.push(newItem);
    localStorage.setItem('items', JSON.stringify(items));

    loadItems();
    const modal = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
    modal.hide();
}

function showItemDetails(item) {
    // Implement item details display logic here
    console.log('Show details for:', item);
    // You can create a new modal or page to display item details
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}