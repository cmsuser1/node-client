This is meant to be a spare framework to kick start ideas on how the Beneficiary API might be interacted with. This client code isn't meant for production.

We encourage this client to be molded, changed, or forked for the actual API implementation if changes are desired.

To use this client, first download and run `npm install`.

Next, run `npm start`

Then in the console, set the URL of the API `client.setBaseUrl(YOUR URL)`.

Kickstart the interaction, `client.getBulkRequest(ACO ID)`

There are assumptions with this default client. The client has a built-in workflow that can be changed if desired.
