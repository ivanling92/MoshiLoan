$(document).ready(function () {

    // Load nem-browser library
    var nem = require("nem-sdk").default;

    // Create an NIS endpoint object
    var endpoint = nem.model.objects.create("endpoint")(nem.model.nodes.defaultTestnet, nem.model.nodes.defaultPort);

    // Create an empty un-prepared transfer transaction object
    var transferTransaction = nem.model.objects.get("transferTransaction");

    // Create an empty common object to hold pass and key
    var common = nem.model.objects.get("common");

    // Get a mosaicDefinitionMetaDataPair object with preloaded xem definition
    var mosaicDefinitionMetaDataPair = nem.model.objects.get("mosaicDefinitionMetaDataPair");


    // Set default amount. In case of mosaic transfer the XEM amount works as a multiplier. (2 XEM will multiply by 2 the quantity of the mosaics you send)
    $("#amount").val("1");
    $("#recipient").val("TAQLC2WUNAYC5WLTXJR52KT5I6M67VLSEQITFVMV");
    $("#namespaceId").val("lul_enterprise");
    $("#mosaicName").val("coconut");
    $("#privateKey").val("ABC");
	//2ed8463c4a1b899f1cad9fad145de8a1aec1300601091512c09f750ba5758e13
    mosaicAmount = 5;
	var hidebutt = document.getElementById("payment");
	hidebutt.setAttribute("style","visibility:hidden");
	/**
     * Function to update our fee in the view
     */
    function updateFee() {
        // Check for amount errors
        if (undefined === $("#amount").val() || !nem.utils.helpers.isTextAmountValid($("#amount").val())) return alert('Invalid amount !');

        // Set the cleaned amount into transfer transaction object
        transferTransaction.amount = nem.utils.helpers.cleanTextAmount($("#amount").val());

        // Set the message into transfer transaction object
        transferTransaction.message = $("#message").val();

        // Prepare the updated transfer transaction object
        var transactionEntity = nem.model.transactions.prepare("mosaicTransferTransaction")(common, transferTransaction, mosaicDefinitionMetaDataPair, nem.model.network.data.testnet.id);
        //console.log(mosaicDefinitionMetaDataPair);
        // Format fee returned in prepared object

        console.log(nem.utils.format.nemValue(transactionEntity.fee) + " helllllooooooe " + transactionEntity);
        var feeString = nem.utils.format.nemValue(transactionEntity.fee)[0] + "." + nem.utils.format.nemValue(transactionEntity.fee)[1];
        //Set fee in view
        //$("#fee").html(feeString);
    }

	/**
     * Build transaction from form data and send
     */

    function send() {
        // Check form for errors
        if (!transferTransaction.mosaics.length) return alert('You must attach at least one mosaic !');
        if (!$("#privateKey").val() || !$("#recipient").val()) return alert('Missing parameter !');

        if (undefined === $("#amount").val() || !nem.utils.helpers.isTextAmountValid($("#amount").val())) return alert('Invalid amount !');


        if (!nem.model.address.isValid(nem.model.address.clean($("#recipient").val()))) return alert('Invalid recipent address !');

        // Set the private key in common object
        common.privateKey = $("#privateKey").val();

        // Check private key for errors
        if (common.privateKey.length !== 64 && common.privateKey.length !== 66) return alert('Invalid private key, length must be 64 or 66 characters !');
        if (!nem.utils.helpers.isHexadecimal(common.privateKey)) return alert('Private key must be hexadecimal only !');

        // Set the cleaned amount into transfer transaction object
        transferTransaction.amount = nem.utils.helpers.cleanTextAmount($("#amount").val());

        // Recipient address must be clean (no hypens: "-")
        transferTransaction.recipient = nem.model.address.clean($("#recipient").val());

        // Set message
        transferTransaction.message = $("#message").val();
        // Prepare the updated transfer transaction object
        var transactionEntity = nem.model.transactions.prepare("mosaicTransferTransaction")(common, transferTransaction, mosaicDefinitionMetaDataPair, nem.model.network.data.testnet.id);
        console.log("GG.com", nem.utils.format.nemValue(transactionEntity.fee), nem.utils.format.nemValue(transactionEntity.data))
        // Serialize transfer transaction and announce


        if (mosaicAmount == 5) {
            transactionEntity.fee = 300000;
        }

        else if (mosaicAmount == 10) {
            transactionEntity.fee = 300000;
        }
        else {
            transactionEntity.fee = 300000;
        }
        console.log("GG", mosaicAmount);

        console.log("GG.com", nem.utils.format.nemValue(transactionEntity.fee), nem.utils.format.nemValue(transactionEntity.data))

        nem.model.transactions.send(common, transactionEntity, endpoint).then(function (res) {
            // If code >= 2, it's an error
            if (res.code >= 2) {
                alert(res.message);
            } else {
                alert(res.message);
            }
        }, function (err) {
            alert(err);
        });
    }

	/**
     * Function to attach a mosaic to the transferTransaction object
     */
    function attachMosaic() {
        console.log("yyy" + mosaicAmount);
        // Check for form errors
        if (undefined === mosaicAmount || !nem.utils.helpers.isTextAmountValid(mosaicAmount)) return alert('Invalid amount !');
        if (!$("#namespaceId").val() || !$("#mosaicName").val()) return alert('Missing parameter !');

        // If not XEM, fetch the mosaic definition from network
        if ($("#mosaicName").val() !== 'xem') {
            nem.com.requests.namespace.mosaicDefinitions(endpoint, $("#namespaceId").val()).then(function (res) {
                // Look for the mosaic definition(s) we want in the request response (Could use ["eur", "usd"] to return eur and usd mosaicDefinitionMetaDataPairs)
                var neededDefinition = nem.utils.helpers.searchMosaicDefinitionArray(res.data, [$("#mosaicName").val()]);

                // Get full name of mosaic to use as object key
                var fullMosaicName = $("#namespaceId").val() + ':' + $("#mosaicName").val();

                // Check if the mosaic was found
                if (undefined === neededDefinition[fullMosaicName]) return alert("Mosaic not found !");

                // Set mosaic definition into mosaicDefinitionMetaDataPair
                mosaicDefinitionMetaDataPair[fullMosaicName] = {};
                mosaicDefinitionMetaDataPair[fullMosaicName].mosaicDefinition = neededDefinition[fullMosaicName];

                // Now we have the definition we can calculate quantity out of user input
                var quantity = mosaicAmount * Math.pow(10, neededDefinition[fullMosaicName].properties[0].value);
                console.log(mosaicAmount);
                //var quantity = 2;			// Create a mosaic attachment
                var mosaicAttachment = nem.model.objects.create("mosaicAttachment")($("#namespaceId").val(), $("#mosaicName").val(), quantity);

                // Push attachment into transaction mosaics
                transferTransaction.mosaics.push(mosaicAttachment);

                // Calculate back the quantity to an amount to show in the view. It should be the same as user input but we double check to see if quantity is correct.
                var totalToShow = nem.utils.format.supply(quantity, { "namespaceId": $("#namespaceId").val(), "name": $("#mosaicName").val() }, mosaicDefinitionMetaDataPair)[0] + '.' + nem.utils.format.supply(quantity, { "namespaceId": $("#namespaceId").val(), "name": $("#mosaicName").val() }, mosaicDefinitionMetaDataPair)[1];

                // Push mosaic to the list in view
                $("#mosaicList").prepend('<li>' + totalToShow + ' <small><b>' + $("#namespaceId").val() + ':' + $("#mosaicName").val() + '</b></small> </li>');

                // Update the transaction fees in view
                updateFee();
            },
                function (err) {
                    alert(err);
                });
        } else {
            // Calculate quantity from user input, XEM divisibility is 6
            var quantity = nem.utils.helpers.cleanTextAmount(mosa) * Math.pow(10, 6);

            // Create a mosaic attachment
            var mosaicAttachment = nem.model.objects.create("mosaicAttachment")($("#namespaceId").val(), $("#mosaicName").val(), quantity);

            // Push attachment into transaction mosaics
            transferTransaction.mosaics.push(mosaicAttachment);

            // Calculate back the quantity to an amount to show in the view. It should be the same as user input but we double check to see if quantity is correct.
            var totalToShow = nem.utils.format.supply(quantity, { "namespaceId": $("#namespaceId").val(), "name": $("#mosaicName").val() }, mosaicDefinitionMetaDataPair)[0] + '.' + nem.utils.format.supply(quantity, { "namespaceId": $("#namespaceId").val(), "name": $("#mosaicName").val() }, mosaicDefinitionMetaDataPair)[1];

            // Push mosaic to the list in view
            $("#mosaicList").prepend('<li>' + totalToShow + ' <small><b>' + $("#namespaceId").val() + ':' + $("#mosaicName").val() + '</b></small> </li>');

            // Update the transaction fees in view
            updateFee();
        }
    }

    // On amount change we update fee in view
    $("#amount").on('change keyup paste', function () {
        updateFee();
    });

    // On message change we update fee in view
    $("#message").on('change keyup paste', function () {
        updateFee();
    });

    // Call send function when click on send button
    $("#send").click(function () {
        alert("NEM Transaction disabled until final version is released");
		alert("The next page will be a simulated certificated issuance");
		//send();
		myFunctionButt();
    });

    // Call attachMosaic function when click on attachMosaic button
    $("#attachMosaic").click(function () {
        attachMosaic();
    });

    // Initialization of fees in view
    updateFee();

});


function myFunction() {
    var checkBox = document.getElementById("myCheck");
    var checkBox1 = document.getElementById("myCheck1");
    var checkBox2 = document.getElementById("myCheck2");
    mosaicAmount = 5;
    console.log(mosaicAmount);
    checkBox2.checked = false;
    checkBox1.checked = false;
}

function myFunction1() {
    var checkBox = document.getElementById("myCheck");
    var checkBox1 = document.getElementById("myCheck1");
    var checkBox2 = document.getElementById("myCheck2");
    mosaicAmount = 10;
    console.log(mosaicAmount);
    checkBox2.checked = false;
    checkBox.checked = false;
}

function myFunction2() {
    var checkBox = document.getElementById("myCheck");
    var checkBox1 = document.getElementById("myCheck1");
    var checkBox2 = document.getElementById("myCheck2");
    mosaicAmount = 20;
    console.log(mosaicAmount);
    checkBox.checked = false;
    checkBox1.checked = false;
}

function myFunctionButt() {
	var hidenode = document.getElementById("transfer");
	var showbutt = document.getElementById("payment");
	hidenode.setAttribute("style","visibility:hidden");
	showbutt.setAttribute("style","visibility:visible");

}

