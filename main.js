"use strict";
const ccxt = require("ccxt");
const fs = require("fs");

let bitfinex = new ccxt.bitfinex({
  apiKey: process.env.API_KEY,
  secret: process.env.SECRET,
});

let orderType = "buy";

var cron = require("node-cron");

cron.schedule("*/30 * * * *", () => {
  bitfinex.fetchOpenOrders().then((orders) => {
    if (orders.length == 0) {
      createOrder();
    }
  });
});

function createOrder() {
  let usd = 0;
  let amp = 0;

  bitfinex
    .fetchBalance()
    .then((value) => {
      value.info.forEach((balance) => {
        if (balance.currency == "usd") {
          usd = balance.available;
          var d = new Date();
          var datetime =
            ("0" + d.getDate()).slice(-2) +
            "/" +
            ("0" + (d.getMonth() + 1)).slice(-2) +
            "/" +
            d.getFullYear();

          fs.appendFile(
            "log.txt",
            "Sum is $" + usd + " in " + datetime,
            function (err) {
              if (err) throw err;
            }
          );
        }
        if (balance.currency == "amp") {
          amp = balance.available;
        }
      });
    })
    .finally(() => {
      if (orderType == "buy") {
        bitfinex
          .createLimitBuyOrder("AMPL/USD", (usd / 0.85).toFixed(3), 0.85)
          .then(() => {
            orderType = "sell";
          });
      }

      if (orderType == "sell") {
        bitfinex.createLimitSellOrder("AMPL/USD", amp, 1.0).then(() => {
          orderType = "buy";
        });
      }
    });
}
