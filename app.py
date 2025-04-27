from flask import request, render_template, jsonify, Flask
import yfinance as yf

app = Flask(__name__, template_folder='templates')

# Fixed USD to INR exchange rate (replace with live rates if necessary)
USD_TO_INR_RATE = 82.50

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_stock_data', methods=['POST'])
def get_stock_data():
    try:
        ticker = request.get_json().get('ticker')
        if not ticker:
            return jsonify({'error': 'Ticker symbol is required'}), 400

        data = yf.Ticker(ticker).history(period='1y')
        if data.empty:
            return jsonify({'error': f"No data found for ticker {ticker}"}), 

        current_price_usd = data.iloc[-1].Close
        open_price_usd = data.iloc[-1].Open

        # Convert to INR
        current_price_inr = current_price_usd * USD_TO_INR_RATE
        open_price_inr = open_price_usd * USD_TO_INR_RATE

        return jsonify({
            'currentPriceUSD': current_price_usd,
            'currentPriceINR': current_price_inr,
            'openPriceUSD': open_price_usd,
            'openPriceINR': open_price_inr
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
