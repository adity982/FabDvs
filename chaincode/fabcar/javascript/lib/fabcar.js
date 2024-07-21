/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const { Contract } = require("fabric-contract-api");

class FabCar extends Contract {
    async initLedger(ctx) {
        console.info("============= START : Initialize Ledger ===========");
        // id, name of peer, name of org, credits

        const entities = [
            { id: 1, org_name: "PAN", credits: "10" },
            { id: 2, org_name: "CBSE", credits: "10" },
        ];

        for (let i = 0; i < entities.length; i++) {
            entities[i].docType = "entity";
            await ctx.stub.putState(
                "ENTITY" + entities[i].id,
                Buffer.from(JSON.stringify(entities[i]))
            );
            console.info("Added <--> ", entities[i]);
        }
        console.info("============= END : Initialize Ledger ===========");
    }

    async queryCar(ctx, carNumber) {
        const carAsBytes = await ctx.stub.getState(carNumber); // get the car from chaincode state
        if (!carAsBytes || carAsBytes.length === 0) {
            throw new Error(`${carNumber} does not exist`);
        }
        console.log(carAsBytes.toString());
        return carAsBytes.toString();
    }

    async createCar(ctx, carNumber, make, model, color, owner) {
        console.info("============= START : Create Car ===========");

        const car = {
            color,
            docType: "car",
            make,
            model,
            owner,
        };

        await ctx.stub.putState(carNumber, Buffer.from(JSON.stringify(car)));
        const eventPayload = JSON.stringify({
            event_type: "My_event_car_added",
            car: car,
        });
        ctx.stub.setEvent("car-added", Buffer.from(eventPayload));

        console.info("============= END : Create Car ===========");
    }

    async queryDocument(ctx, documentId) {
        // get the document from chaincode state
        const documentAsBytes = await ctx.stub.getState(documentId);
        if (!documentAsBytes || documentAsBytes.length === 0) {
            return {
                error: true,
                message: "Document does not exist",
            };
        } else {
            return documentAsBytes.toString();
        }
    }

    async createDocument(ctx, documentAsString) {
        // req document verification and add verified document
        const document = JSON.parse(documentAsString);
        let status = document.status;
        let docId = document.identifier + document.id + status;
        await ctx.stub.putState(docId, Buffer.from(JSON.stringify(document)));
        const eventPayload = JSON.stringify({
            document: document,
            status: status,
        });
        ctx.stub.setEvent("Document-added", Buffer.from(eventPayload));

        if (document.status === "verified" || document.status === "rejected") {
            // document.requestBy will give
            // document.identifier will take

            console.log("test........niket\n");

            const mp = new Map();

            mp.set("PAN", 1);
            mp.set("CBSE", 2);

            let giverId = "ENTITY" + mp.get(document.requestBy);
            let takerId = "ENTITY" + mp.get(document.identifier);

            console.log(document.requestBy);
            console.log(document.identifier);
            console.log(giverId);
            console.log(takerId);

            // console.info("============= START : changeCarOwner ===========");

            const giverAsBytes = await ctx.stub.getState(giverId); // get the car from chaincode state

            const giver = JSON.parse(giverAsBytes.toString());
            giver.credits = parseInt(giver.credits) - 1;
            // giver.credits = "9";

            await ctx.stub.putState(
                giverId,
                Buffer.from(JSON.stringify(giver))
            );

            const takerAsBytes = await ctx.stub.getState(takerId); // get the car from chaincode state

            const taker = JSON.parse(takerAsBytes.toString());
            taker.credits = parseInt(taker.credits) + 1;

            await ctx.stub.putState(
                takerId,
                Buffer.from(JSON.stringify(taker))
            );

            // console.info("============= END : changeCarOwner ===========");

            // print ledger

            const startKey = "";
            const endKey = "";
            const allResults = [];
            for await (const { key, value } of ctx.stub.getStateByRange(
                startKey,
                endKey
            )) {
                const strValue = Buffer.from(value).toString("utf8");
                let record;
                try {
                    record = JSON.parse(strValue);
                } catch (err) {
                    console.log(err);
                    record = strValue;
                }
                allResults.push({ Key: key, Record: record });
            }
            console.info(allResults);
        }
    }

    async queryAllCars(ctx) {
        const startKey = "";
        const endKey = "";
        const allResults = [];
        for await (const { key, value } of ctx.stub.getStateByRange(
            startKey,
            endKey
        )) {
            const strValue = Buffer.from(value).toString("utf8");
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    async changeCarOwner(ctx, carNumber, newOwner) {
        // change this to handlecredits req id and issuer id
        console.info("============= START : changeCarOwner ===========");

        const carAsBytes = await ctx.stub.getState(carNumber); // get the car from chaincode state
        if (!carAsBytes || carAsBytes.length === 0) {
            throw new Error(`${carNumber} does not exist`);
        }
        const car = JSON.parse(carAsBytes.toString());
        car.owner = newOwner;

        await ctx.stub.putState(carNumber, Buffer.from(JSON.stringify(car)));
        console.info("============= END : changeCarOwner ===========");
    }
}

module.exports = FabCar;
