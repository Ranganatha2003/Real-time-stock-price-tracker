var ticker = JSON.parse(localStorage.getItem('ticker') || '[]'); // Stored tickers
var lastPrice = {}; // Stores the last price for each ticker
var counter = 10; // Countdown timer

function startUpdateCycle() {
    updatePrices();
    var countdown = setInterval(function () {
        counter--;
        $('#counter').text(counter);
        if (counter <= 0) {
            updatePrices();
            counter = 10; // Reset counter
        }
    }, 1000);
}

$(document).ready(function () {
    // Add existing tickers to the grid
    ticker.forEach(function (ticker) {
        addTickerToGrid(ticker);
    });

    updatePrices();

    // Handle adding a new ticker
    $('#add-ticker-form').submit(function (e) {
        e.preventDefault();
        var newTicker = $('#name-ticker').val().toUpperCase(); // Convert to uppercase
        if (!ticker.includes(newTicker)) {
            ticker.push(newTicker);
            localStorage.setItem('ticker', JSON.stringify(ticker));
            addTickerToGrid(newTicker);
        }
        $('#name-ticker').val(''); // Clear the input field
        updatePrices();
    });

    // Handle removing a ticker
    $('#ticker-grid').on('click', '.remove-btn', function () {
        var tickerToRemove = $(this).data('ticker');
        ticker = ticker.filter((t) => t !== tickerToRemove);
        localStorage.setItem('ticker', JSON.stringify(ticker));
        $('#' + tickerToRemove).remove(); // Remove the ticker box from the grid
    });

    startUpdateCycle();
});

function addTickerToGrid(ticker) {
    // Add a new ticker to the grid
    $('#ticker-grid').append(
        `<div id="${ticker}" class="stock-box">
            <h2>${ticker}</h2>
            <p id="${ticker}-price">$0.00 | ₹0.00</p> <!-- Price in USD and INR -->
            <p id="${ticker}-pct">0.00%</p> <!-- Percentage change -->
            <button class="remove-btn" data-ticker="${ticker}">Remove</button>
        </div>`
    );
}

function updatePrices() {
    ticker.forEach(function (ticker) {
        $.ajax({
            url: 'get_stock_data', // Backend endpoint
            type: 'POST',
            data: JSON.stringify({ ticker: ticker }),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function (data) {
                // Calculate percentage change (based on USD prices)
                var changePercent = ((data.currentPriceUSD - data.openPriceUSD) / data.openPriceUSD) * 100;

                // Determine the color class based on percentage change
                var colorClass;
                if (changePercent < -2) {
                    colorClass = 'dark-red';
                } else if (changePercent < 0) {
                    colorClass = 'red';
                } else if (changePercent === 0) {
                    colorClass = 'gray';
                } else if (changePercent <= 2) {
                    colorClass = 'green';
                } else {
                    colorClass = 'dark-green';
                }

                // Update the ticker box with new prices and percentage change
                $('#' + ticker + '-price').html(
                    `$${data.currentPriceUSD.toFixed(2)} | ₹${data.currentPriceINR.toFixed(2)}`
                );
                $('#' + ticker + '-pct').text(changePercent.toFixed(2) + '%');

                // Remove old color classes and add the new one
                $('#' + ticker + '-price').removeClass('dark-red red gray green dark-green').addClass(colorClass);
                $('#' + ticker + '-pct').removeClass('dark-red red gray green dark-green').addClass(colorClass);

                // Flashing effect based on price movement
                var flashClass;
                if (lastPrice[ticker] > data.currentPriceUSD) {
                    flashClass = 'red-flash'; // Price dropped
                } else if (lastPrice[ticker] < data.currentPriceUSD) {
                    flashClass = 'green-flash'; // Price increased
                } else {
                    flashClass = 'gray-flash'; // No change
                }
                lastPrice[ticker] = data.currentPriceUSD;

                // Apply and remove the flash class
                $('#' + ticker).addClass(flashClass);
                setTimeout(function () {
                    $('#' + ticker).removeClass(flashClass);
                }, 1000);
            },
            error: function () {
                console.error('Failed to fetch stock data for ' + ticker);
            },
        });
    });
}
