var AWS = require("aws-sdk");

AWS.config.update({
    region: "us-east-1",
});
const tableName = "AnimalRequest";

var userDBRequest = function () { };
var docClient = new AWS.DynamoDB.DocumentClient();

userDBRequest.prototype.checkRequestName = (name) => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: tableName,
            KeyConditionExpression: "#name = :Request_Animal_Name",
            ExpressionAttributeNames: {
                "#name": "Request_Animal_Name"
            },
            ExpressionAttributeValues: {
                ":Request_Animal_Name": name
            }
        }
        docClient.query(params, (err, data) => {
            if (err) {
                console.error("Unable to scan item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            }
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)

        })
    });
}

userDBRequest.prototype.addRequest = (name) => {
    return new Promise((resolve, reject) => {
        const params = {
            TableName: tableName,
            Item: {
                'Request_Animal_Name': name,
            }
        };
        docClient.put(params, (err, data) => {
            if (err) {
                console.log("Unable to insert =>", JSON.stringify(err))
                return reject("Unable to insert");
            }
            console.log("Saved Data, ", JSON.stringify(data));
            resolve(data);
        });
    });
}



module.exports = new userDBRequest();