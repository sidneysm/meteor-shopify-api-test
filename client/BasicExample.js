import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './BasicExample.html';

Template.BasicExample.helpers({
    error: function() {
        var error = Session.get("error");
        return error ? "Error: " + error : "";
    },

    orderCount: function() {
        var count = Session.get("orderCount");
        if (typeof count === "number") {
            return "Found " + count + " orders.";
        }

        return "";
    },
    best_selling: function() {
        var products = Session.get('rank');
        console.log(products);
        return products
    }
});

Template.BasicExample.events({
    "click #login": function(e, t) {
        var shop = $("#shop").val();

        // Your App has a keyset and a secret.  The client only knows the
        // api_key.  Using Shopify's OAuth, the PublicAppOAuthAuthenticator
        // opens a new tab where the user can login and grant your app access
        // to his/her data.
        var authenticator = new Shopify.PublicAppOAuthAuthenticator({
            // "my-shop" in my-shop.myshopify.com
            shop: shop,

            // Your shop's api_key taken from settings.json
            api_key: Meteor.settings.public.api_key,

            // This keyset is defined in BasicExample/server/startup.js.  This
            // is required so that your app's secret can be used during auth.
            keyset: "auth",

            // This indicates that your app will use all the permissions shopify gives.
            scopes: "all",

            // After successful authentication, the server-side onAuth will be
            // called first (see server/startup.js).  Then the callback you
            // specify here will be called.
            onAuth: makeAPI,
        });

        // Start the auth flow.
        authenticator.openAuthTab();
    },
    "click .botton": function(e, t){
        var shop = $("#shop").val();

        // The keyset for this shop is created in BasicExample/server/startup.js in
        // the Shopify.onAuth.  In other words, a keyset with the name of the shop
        // is created each time a shop authenticates.
        //
        // This isn't actually secure!  One solution would be to have user accounts
        // and store the name of the keyset (which should be a UUID) in the user's
        // profile.
        var keyset = shop;

        // The API object allows you to access shop data.
        console.log("Creating API...");
        var api = new Shopify.API({
            shop: shop,
            keyset: keyset,
        });

        // Shopify.API#countOrders counts the number of open orders for the
        // authenticated shop.
        console.log("Counting orders...");
        api.countOrders(function(err, count) {
            if (err) {
                console.error("countOrders failed:", err);
            } else {
                console.log("Found " + count + " orders.");
                console.log("ops");
            }
            Session.set("error", err || "");
            Session.set("orderCount", count || "");
        });
    },
});

Template.BasicExample.onRendered(function() {
    Session.set("error", "");
    Session.set("orderCount", "");
});

function makeAPI() {
    var shop = $("#shop").val();

    // The keyset for this shop is created in BasicExample/server/startup.js in
    // the Shopify.onAuth.  In other words, a keyset with the name of the shop
    // is created each time a shop authenticates.
    //
    // This isn't actually secure!  One solution would be to have user accounts
    // and store the name of the keyset (which should be a UUID) in the user's
    // profile.
    var keyset = shop;

    // The API object allows you to access shop data.
    console.log("Creating API...");
    var api = new Shopify.API({
        shop: shop,
        keyset: keyset,
    });


    //Getting Orders from the last delay
    //creat last day data-target
    y = new Date();
    y.setDate(y.getDate() - 2);
    const products = [];



    //Getting all Orders of the last day
    var orders = api.getAllOrders({ status: "any", processed_at_min: y, fields: "line_items" }, function(err, orders){
        if (err) {
            console.log("Errors: ", err);
        } else {
            console.log(orders);
            orders.map(function(order){
                //console.log(order.line_items);
                order.line_items.map(function(item){
                    let { name, product_id, quantity} = item;
                    let product = {name, product_id, quantity}
                    products.push(product)
                })
            })

            product_rank = [];
            product_copy = Object.assign([], products);

            products.map(function(prod_a, i){
                let add = true;
                products.map(function(prod_b, j){
                    if (prod_a.product_id === prod_b.product_id){
                        if (i !== j) {
                            console.log('diferents');
                            prod_a.quantity += prod_b.quantity;
                        }
                    }
                });
                product_rank.map(function(p){
                    if (prod_a.product_id === p.product_id ){
                        add = false
                    }
                })
                if (add){
                    product_rank.push(prod_a);
                }
            });
            product_rank.sort(function(a, b){
                if (a.quantity > b.quantity) {
                    return -1;
                }
                if (a.quantity < b.quantity) {
                    return +1;
                }
                // a must be equal to b
                return 0;
            })
            console.log(product_rank);
            if (product_rank.length > 10)
                Session.set('rank', product_rank.slice(0, 10))
            else{
                Session.set('rank', product_rank)
            }
        }
    });


    Session.set("orders", orders);


    // Shopify.API#countOrders counts the number of open orders for the
    // authenticated shop.
    //console.log("Counting orders...");
    api.countOrders(function(err, count) {
        if (err) {
        //    console.error("countOrders failed:", err);
        } else {
        //    console.log("Found " + count + " orders.");
        }
        Session.set("error", err || "");
        Session.set("orderCount", count || "");
    });
}
