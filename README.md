# ProbitSocketSDK-node

## Installation

```bash
npm install ProBitSDK
```

## How to Use

1. Enter your API ID and Secret values ​​as shown below.
```bash
API_CLIENT_ID = '12345678'
API_CLIENT_SECRET = '1a2b3c4d5e6f7g8h'
```

2. Call the constructor of ProbitSDK.
```bash
const sdk: ProBitSDK = new ProBitSDK(API_CLIENT_ID, API_CLIENT_SECRET);
```

3. You can call the functions below. More will be added if needed
```bash
await sdk.connectMyOrderBook(filter, market_id);
await sdk.connectMyBalance();
await sdk.connectOpenOrder();
```
In the case of filter, you can set it as follows.
- order_books_l0
- order_books_l1
- order_books_l2
- order_books_l3
- order_books_l4
- ticker
- recent_trades

For market_id, an example would look like this: (ex, BTC-USDT)

See test/test.ts for a detailed example.

