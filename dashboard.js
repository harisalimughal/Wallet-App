
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
    const addFundsBtn = document.getElementById('addFundsBtn');
    const addFundsForm = document.getElementById('addFundsForm');
    const searchInput = document.getElementById('searchInput');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    exportPdfBtn.addEventListener('click', exportToPdf);
    const extractInfoBtn = document.getElementById('extractInfoBtn');
    extractInfoBtn.addEventListener('click', extractInformation);

    addFundsBtn.addEventListener('click', showAddFundsModal);
    addFundsForm.addEventListener('submit', handleAddFunds);
    searchInput.addEventListener('input', handleSearch);

    addItemBtn.addEventListener('click', showAddItemModal);
    addItemForm.addEventListener('submit', handleAddItem);
    itemTypeSelect.addEventListener('change', updateItemFields);
    logoutBtn.addEventListener('click', handleLogout);
}



async function extractInformation() {
    const fileInput = document.getElementById('itemImage');
    const file = fileInput.files[0];
    
    if (!file) {
        showError('Please select an image file.');
        return;
    }

    try {
        const result = await Tesseract.recognize(file, 'eng', { logger: m => console.log(m),
            tessedit_char_whitelist: '0123456789/'
         });
        let extractedText = result.data.text;

        // Clean and normalize the extracted text
        extractedText = cleanExtractedText(extractedText);
        console.log('Cleaned Extracted Text:', extractedText);

        // Categorize and extract relevant information
        const itemType = categorizeItem(extractedText);
        const extractedInfo = extractCardInfo(extractedText);
        showVerificationModal(extractedInfo);


    } catch (error) {
        showError('An error occurred during text extraction. Please try again.');
        console.error('OCR Error:', error);
    }
}


function extractCardInfo(text) {
    const info = {};

    // Extract card number
    const cardNumberMatch = text.match(/\b(?:\d{4}[-\s]?){3}\d{4}\b/);
    info.cardNumber = cardNumberMatch ? cardNumberMatch[0].replace(/\D/g, '') : '';
    console.log("Card Number:", cardNumberMatch);

    // Extract expiration date (format MM/YY)
    const expirationMatch = text.match(/\b(0[1-9]|1[0-2])\s?\/\s?\d{2}\b/);
    info.expirationDate = expirationMatch ? expirationMatch[0].replace(/\s/g, '') : ''; // Remove spaces, if any
    console.log("Expiry Date:", expirationMatch);

    // Extract CVV (3-4 digits, usually found after the word CVV or CVC)
    const cvvMatch = text.match(/\b(?:CVV|CVC):?\s*(\d{3,4})\b/i);
    info.cvv = cvvMatch ? cvvMatch[1] : '';
    console.log("CVV:", cvvMatch);

    // Extract cardholder name (more flexible regex to capture full name)
    const nameMatch = text.match(/[A-Z][a-z]+\s[A-Za-z]+(?:\s[A-Za-z]+)?/);
    info.cardholderName = nameMatch ? nameMatch[0].trim() : '';
    console.log("Name:", nameMatch);

    return info;
}



function showVerificationModal(extractedInfo) {
    const modal = new bootstrap.Modal(document.getElementById('ocrVerificationModal'));
    
    document.getElementById('verifyCardNumber').value = extractedInfo.cardNumber;
    document.getElementById('verifyExpirationDate').value = extractedInfo.expirationDate;
    document.getElementById('verifyCardholderName').value = extractedInfo.cardholderName;
    document.getElementById('verifycvv').value = extractedInfo.cvv;

    const confirmBtn = document.getElementById('confirmOcrBtn');
    confirmBtn.onclick = () => {
        const verifiedInfo = {
            cardNumber: document.getElementById('verifyCardNumber').value,
            expirationDate: document.getElementById('verifyExpirationDate').value,
            cardholderName: document.getElementById('verifyCardholderName').value,
            cvv: document.getElementById('verifycvv').value,

        };
        populateAddItemForm('card', verifiedInfo);
        modal.hide();
    };

    modal.show();
}

function cleanExtractedText(text) {
    // Remove unwanted characters and normalize text
    return text
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .replace(/[^\w\s\/:]/g, '') // Remove special characters except slashes for expiration date
        .trim(); // Trim leading and trailing spaces
}

function categorizeItem(text) {
    const lowercaseText = text.toLowerCase();
    if (lowercaseText.includes('card number') || lowercaseText.includes('expiration date') || lowercaseText.includes('cvv')) {
        return 'card';
    } else if (lowercaseText.includes('ticket') || lowercaseText.includes('event') || lowercaseText.includes('date') && lowercaseText.includes('time')) {
        return 'ticket';
    } else {
        return 'unknown';
    }
}

function extractRelevantInfo(text, itemType) {
    const info = {};
    
    if (itemType === 'card') {
        const cardNumberMatch = text.match(/\b(?:\d{4}[-\s]?){3}\d{4}\b/);
        let cardNumber = cardNumberMatch ? cardNumberMatch[0].replace(/\D/g, '') : '';
        if (isValidCardNumber(cardNumber)) {
            info.cardNumber = cardNumber;
        } else {
            alert('Invalid card number detected');
        }

        const expirationMatch = text.match(/\b(0[1-9]|1[0-2])\s?\/\s?\d{2}\b/);
        info.expirationDate = expirationMatch ? expirationMatch[0] : '';

        const cvvMatch = text.match(/\b(?:cvv|cvc):?\s*(\d{3,4})\b/i); // Normalize cvv variations
        info.cvv = cvvMatch ? cvvMatch[1] : '';

        // Optional: Extract cardholder name if necessary
        const cardholderMatch = text.match(/(?:name|cardholder):?\s*([\w\s]+)/i);
        info.cardholderName = cardholderMatch ? cardholderMatch[1].trim() : '';
    } else if (itemType === 'ticket') {
        // Similar logic for extracting ticket information can go here...
    }

    return info;
}






// Luhn Algorithm for card number validation
function isValidCardNumber(cardNumber) {
    let sum = 0;
    let shouldDouble = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i], 10);
        if (isNaN(digit)) {
            return false;
        }
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0;
}

// Auto-fill the form based on the extracted info
function populateAddItemForm(itemType, info) {
    const addItemModal = new bootstrap.Modal(document.getElementById('addItemModal'));
    const itemTypeSelect = document.getElementById('itemType');

    // Check if modal elements exist
    if (!itemTypeSelect) {
        console.error('Item type select element not found!');
        return;
    }

    itemTypeSelect.value = itemType;
    updateItemFields();

    if (itemType === 'card') {
        const cardNumberInput = document.getElementById('cardNumber').value = info.cardNumber || '';
        const expirationDateInput = document.getElementById('expirationDate').value = info.expirationDate || '';
        const cvvInput = document.getElementById('cvv').value = info.cvv || '';
        const cardHolderName= document.getElementById('cardHolderName').value = info.cardholderName || '';

        // Make sure inputs exist before assigning values
        if (cardNumberInput && expirationDateInput && cvvInput && cardHolderName) {
            cardHolderName.value =info.cardHolderName || '';
            cardNumberInput.value = info.cardNumber || '';
            expirationDateInput.value = info.expirationDate || '';
            cvvInput.value = info.cvv || '';
        } else {
            console.error('Card input fields not found in modal.');
        }
    } else if (itemType === 'ticket') {
        const ticketTypeInput = document.getElementById('ticketType');
        const ticketDateInput = document.getElementById('ticketDate');
        const ticketTimeInput = document.getElementById('ticketTime');
        const ticketPlaceInput = document.getElementById('ticketPlace');

        // Make sure inputs exist before assigning values
        if (ticketTypeInput && ticketDateInput && ticketTimeInput && ticketPlaceInput) {
            ticketTypeInput.value = info.ticketType || '';
            ticketDateInput.value = info.date || '';
            ticketTimeInput.value = info.time || '';
            ticketPlaceInput.value = info.place || '';
        } else {
            console.error('Ticket input fields not found in modal.');
        }
    }

    addItemModal.show();
}


// Function to update fields based on the selected item type
function updateItemFields() {
    const itemType = document.getElementById('itemType').value;
    document.querySelectorAll('.item-field').forEach(field => {
        field.style.display = 'none';
    });

    if (itemType === 'card') {
        document.getElementById('cardFields').style.display = 'block';
    } else if (itemType === 'ticket') {
        document.getElementById('ticketFields').style.display = 'block';
    }
}

function showError(message) {
    // A generic function to show error messages to the user
    alert(message);
    // Implement a modal or notification system to show the error
}

function showAddItemModal() {
    // Show add item modal logic here
}

function handleAddItem(event) {
    event.preventDefault();
    // Handle adding item logic here
}

function handleAddFunds(event) {
    event.preventDefault();
    // Handle adding funds logic here
}

function handleLogout() {
    // Handle user logout logic here
}
function exportToPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const items = JSON.parse(localStorage.getItem('items')) || [];
    const userItems = items.filter(item => item.userId === currentUser.email);
    
    doc.setFontSize(18);
    doc.text('Digital Wallet Items Report', 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`User: ${currentUser.name}`, 14, 40);
    doc.text(`Current Balance: Rs.${currentUser.balance.toFixed(2)}`, 14, 50);
    
    let yPosition = 70;
    
    userItems.forEach((item, index) => {
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text(`Item ${index + 1}: ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`, 14, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        switch (item.type) {
            case 'card':
                doc.text(`Card Number: **** **** **** ${item.cardNumber.slice(-4)}`, 20, yPosition);
                yPosition += 10;
                doc.text(`Expiration Date: ${item.expirationDate}`, 20, yPosition);
                break;
            case 'ticket':
                doc.text(`Type: ${item.ticketType}`, 20, yPosition);
                yPosition += 10;
                doc.text(`Date: ${item.date}`, 20, yPosition);
                yPosition += 10;
                doc.text(`Time: ${item.time}`, 20, yPosition);
                yPosition += 10;
                doc.text(`Place: ${item.place}`, 20, yPosition);
                break;
            case 'password':
                doc.text(`Website: ${item.website}`, 20, yPosition);
                yPosition += 10;
                doc.text(`Username: ${item.username}`, 20, yPosition);
                break;
        }
        yPosition += 20;
    });
    
    doc.save('digital-wallet-report.pdf');
}

function showAddFundsModal() {
    const modal = new bootstrap.Modal(document.getElementById('addFundsModal'));
    modal.show();
}

function handleAddFunds(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    
    if (amount > 0) {
        currentUser.balance += amount;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateBalance();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addFundsModal'));
        modal.hide();
        
        alert(`₹${amount} has been added to your wallet.`);
    } else {
        alert('Please enter a valid amount.');
    }
}
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const items = JSON.parse(localStorage.getItem('items')) || [];
    const userItems = items.filter(item => item.userId === currentUser.email);

    // Early return if no items or search term is empty
    if (!userItems.length) {
        displayFilteredItems([]);
        return;
    }

    const filteredItems = userItems.filter(item => {
        switch (item.type) {
            case 'card':
                return (
                    (item.name && item.name.toLowerCase().includes(searchTerm)) ||
                    (item.cardNumber && item.cardNumber.includes(searchTerm)) ||
                    (item.cardHolderName && item.cardHolderName.toLowerCase().includes(searchTerm))
                );
            case 'ticket':
                return (
                    (item.name && item.name.toLowerCase().includes(searchTerm)) ||
                    (item.ticketType && item.ticketType.toLowerCase().includes(searchTerm)) ||
                    (item.place && item.place.toLowerCase().includes(searchTerm)) ||
                    (item.date && item.date.toLowerCase().includes(searchTerm))
                );
            case 'password':
                return (
                    (item.website && item.website.toLowerCase().includes(searchTerm)) ||
                    (item.username && item.username.toLowerCase().includes(searchTerm))
                );
            default:
                return false;
        }
    });

    displayFilteredItems(filteredItems);
}
function displayFilteredItems(filteredItems) {
    const cardsList = document.getElementById('cardsList');
    const ticketsList = document.getElementById('ticketsList');
    const passwordsList = document.getElementById('passwordsList');

    // Clear all lists
    cardsList.innerHTML = '';
    ticketsList.innerHTML = '';
    passwordsList.innerHTML = '';

    // If no items found, show "No items found" message in each section
    if (filteredItems.length === 0) {
        const noItemsMessage = document.createElement('li');
        noItemsMessage.className = 'list-group-item text-muted';
        noItemsMessage.textContent = 'No items found';
        
        cardsList.appendChild(noItemsMessage.cloneNode(true));
        ticketsList.appendChild(noItemsMessage.cloneNode(true));
        passwordsList.appendChild(noItemsMessage.cloneNode(true));
        return;
    }

    // Display filtered items
    filteredItems.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        
        // Set appropriate display text based on item type
        switch (item.type) {
            case 'card':
                listItem.textContent = `${item.name || 'Card ending in ' + item.cardNumber.slice(-4)}`;
                break;
            case 'ticket':
                listItem.textContent = `${item.ticketType} - ${item.date}`;
                break;
            case 'password':
                listItem.textContent = item.website;
                break;
        }

        // Add click event listener
        listItem.addEventListener('click', () => showItemDetails(item));

        // Add to appropriate list
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
                    <label for="cardHolderName" class="form-label">CardHolderName</label>
                    <input type="text" class="form-control" id="cardHolderName" required>
                </div>
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


function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}