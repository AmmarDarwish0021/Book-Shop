document.addEventListener("DOMContentLoaded", function() {
    fetch("books.json")
        .then(response => response.json())
        .then(data => {
            bookData = data; // Store book data globally
            renderBookList(data);
            renderFilters(data);
        })
        .catch(error => console.error("Error fetching book data: ", error));
});

let cartTotal = 0;

function renderBookList(data, filters = {}) {
    let filteredBooks = [];

    // Apply filters
    Object.keys(data).forEach(category => {
        if (!filters.category || filters.category === "All Categories" || filters.category === category) {
            filteredBooks.push(...data[category]);
        }
    });
    
    if (filters.author) {
        filteredBooks = filteredBooks.filter(book => book.author === filters.author);
    }
    if (filters.minPrice !== undefined) {
        filteredBooks = filteredBooks.filter(book => book.price >= filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
        filteredBooks = filteredBooks.filter(book => book.price <= filters.maxPrice);
    }

    // Sorting
    if (filters.sortBy === "title") {
        filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
    } else if (filters.sortBy === "titleDesc") {
        filteredBooks.sort((a, b) => b.title.localeCompare(a.title));
    } else if (filters.sortBy === "price") {
        filteredBooks.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === "priceDesc") {
        filteredBooks.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === "author") {
        filteredBooks.sort((a, b) => a.author.localeCompare(b.author));
    } else if (filters.sortBy === "authorDesc") {
        filteredBooks.sort((a, b) => b.author.localeCompare(a.author));
    }

    const bookList = document.getElementById("book-list");
    bookList.innerHTML = ""; // Clear previous filters

    if (filteredBooks.length === 0) {
        const noResultsMessage = document.createElement("p");
        noResultsMessage.textContent = "No books found for the selected criteria.";
        bookList.appendChild(noResultsMessage);
        return;
    }

    filteredBooks.forEach(book => {
        const bookItem = document.createElement("div");
        bookItem.classList.add("book-item");

        const icon = document.createElement("img");
        icon.src = book.icon;
        icon.alt = book.title + " icon";
        bookItem.appendChild(icon);

        const bookInfo = document.createElement("div");
        bookInfo.classList.add("book-info");

        const title = document.createElement("h3");
        title.textContent = book.title;
        bookInfo.appendChild(title);

        const author = document.createElement("p");
        author.textContent = "Author: " + book.author;
        bookInfo.appendChild(author);

        const price = document.createElement("p");
        price.textContent = "Price: $" + book.price;
        bookInfo.appendChild(price);

        const buyButton = document.createElement("button");
        buyButton.textContent = "Buy";
        buyButton.classList.add("buy-button");
        buyButton.addEventListener("click", function() {
            event.stopPropagation(); //stop showing detailed view 
            addToCart(book);
        });

        bookInfo.appendChild(price);
        bookInfo.appendChild(buyButton);
        bookItem.appendChild(bookInfo);
        bookList.appendChild(bookItem);

        // Add click event listener to show detailed view
        bookItem.addEventListener("click", function() {
            showBookDetails(book);
        });
    });
}

function renderFilters(data) {
    const filtersContainer = document.getElementById("filters");
    filtersContainer.innerHTML = ""; // Clear 

    const categories = ["All Categories", ...Object.keys(data)];

    // Category filter
    const categoryFilter = document.createElement("select");
    categoryFilter.id = "categoryFilter";
    categoryFilter.addEventListener("change", applyFilters);
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    filtersContainer.appendChild(categoryFilter);

    // Author filter
    const authorFilter = document.createElement("select");
    authorFilter.id = "authorFilter";
    authorFilter.addEventListener("change", applyFilters);

    const allAuthorsOption = document.createElement("option");
    allAuthorsOption.value = "";
    allAuthorsOption.textContent = "All Authors";
    authorFilter.appendChild(allAuthorsOption);

    const authors = new Set();
    Object.values(data).flat().forEach(book => authors.add(book.author));
    authors.forEach(author => {
        const option = document.createElement("option");
        option.value = author;
        option.textContent = author;
        authorFilter.appendChild(option);
    });
    filtersContainer.appendChild(authorFilter);

    // Price filter
    const priceFilter = document.createElement("div");
    priceFilter.innerHTML = `
        <label for="minPrice">Min Price:</label>
        <input type="number" id="minPrice" name="minPrice" min="0" step="0.01">
        <label for="maxPrice">Max Price:</label>
        <input type="number" id="maxPrice" name="maxPrice" min="0" step="0.01">
        <button id="applyPriceFilter">Apply</button>
    `;
    const applyPriceFilterButton = priceFilter.querySelector("#applyPriceFilter");
    applyPriceFilterButton.addEventListener("click", applyFilters);
    filtersContainer.appendChild(priceFilter);

    // Sort filter
    const sortFilter = document.createElement("select");
    sortFilter.id = "sortBy";
    sortFilter.addEventListener("change", applyFilters);
    const sortOptions = [
        { value: "title", text: "Title (Ascending)" },
        { value: "titleDesc", text: "Title (Descending)" },
        { value: "price", text: "Price (Ascending)" },
        { value: "priceDesc", text: "Price (Descending)" },
        { value: "author", text: "Author (Ascending)" },
        { value: "authorDesc", text: "Author (Descending)" },
    ];
    sortOptions.forEach(option => {
        const sortOption = document.createElement("option");
        sortOption.value = option.value;
        sortOption.textContent = option.text;
        sortFilter.appendChild(sortOption);
    });
    filtersContainer.appendChild(sortFilter);

    // Clear filter button
    const clearFilterButton = document.createElement("button");
    clearFilterButton.textContent = "Clear Filter";
    clearFilterButton.addEventListener("click", function() {
        renderBookList(bookData); // Clearing the filter
        document.getElementById("categoryFilter").selectedIndex = 0;
        document.getElementById("authorFilter").selectedIndex = 0;
        document.getElementById("minPrice").value = "";
        document.getElementById("maxPrice").value = "";
        document.getElementById("sortBy").selectedIndex = 0;
    });
    filtersContainer.appendChild(clearFilterButton);
}

function applyFilters() {
    const category = document.getElementById("categoryFilter").value;
    const author = document.getElementById("authorFilter").value;
    const minPrice = parseFloat(document.getElementById("minPrice").value) || undefined;
    const maxPrice = parseFloat(document.getElementById("maxPrice").value) || undefined;
    const sortBy = document.getElementById("sortBy").value;

    renderBookList(bookData, { category, author, minPrice, maxPrice, sortBy });
}

function addToCart(book) {
    const cart = document.getElementById("cart");
    const cartItem = document.createElement("div");
    cartItem.classList.add("cart-item");
    cartItem.textContent = book.title + " - $" + book.price;

    const removeButton = document.createElement("button");
    removeButton.innerHTML = "&times;";
    removeButton.classList.add("remove-button");
    removeButton.addEventListener("click", function() {
        removeFromCart(book);
    });

    cartItem.appendChild(removeButton);
    cart.appendChild(cartItem);

    cartTotal += book.price;
    updateCartTotal(cartTotal);
    updateCartTotalDisplay();
}

function updateCartTotal(total) {
    const cartTotalElement = document.getElementById("cart-total");
    cartTotalElement.textContent = "$" + total.toFixed(2);
}

function toggleCartDrawer() {
    const cartDrawer = document.getElementById("cart");
    const cartTotalDisplay = document.getElementById("cart-total-display");
    cartDrawer.classList.toggle("open");
    if (cartDrawer.classList.contains("open")) {
        updateCartTotalDisplay();
    } else if (cartTotalDisplay) {
        cartTotalDisplay.remove();
    }
}

function updateCartTotalDisplay() {
    // Create or update cart total display
    let cartTotalDisplay = document.getElementById("cart-total-display");
    if (!cartTotalDisplay) {
        cartTotalDisplay = document.createElement("div");
        cartTotalDisplay.id = "cart-total-display";
        cartTotalDisplay.textContent = "Total: $" + cartTotal.toFixed(2);
        document.getElementById("cart").appendChild(cartTotalDisplay);
    } else {
        cartTotalDisplay.textContent = "Total: $" + cartTotal.toFixed(2);
    }
}

function removeFromCart(book) {
    const cart = document.getElementById("cart");
    const cartItems = cart.querySelectorAll(".cart-item");

    cartItems.forEach(cartItem => {
        if (cartItem.textContent.includes(book.title)) {
            cartTotal -= book.price;
            updateCartTotal(cartTotal);
            updateCartTotalDisplay();
            cartItem.remove();
        }
    });
}

function checkout() {
    // Payment
}

function showBookDetails(book) {
    const modal = document.getElementById("book-details-modal");
    const modalImg = document.getElementById("modal-img");
    const modalTitle = document.getElementById("modal-title");
    const modalAuthor = document.getElementById("modal-author");
    const modalPrice = document.getElementById("modal-price");
    const modalDescription = document.getElementById("modal-description");

    modalImg.src = book.icon; 
    modalImg.alt = book.title + " image"; 
    modalTitle.textContent = book.title;
    modalAuthor.textContent = "Author: " + book.author;
    modalPrice.textContent = "Price: $" + book.price;
    modalDescription.textContent = "Description: " + book.description;

    modal.style.display = "block";

    // Close the modal when the user clicks on the close button or outside the modal
    const closeModal = document.getElementsByClassName("close")[0];
    closeModal.onclick = function() {
        modal.style.display = "none";
    };

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}

