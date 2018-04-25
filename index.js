const requestPromise = require('request-promise');
const request = require('request');
const repl = require('repl');
const fs = require('fs')
const baseUrl = 'http://localhost:3000/'; // Change Me.

let options = (uri, baseUrl = client.getBaseUrl()) => {
  return {
    method: 'GET',
    uri: baseUrl + uri,
    resolveWithFullResponse: true
  };
};

var replServer = repl.start({
    prompt: 'CMS Client > '
});

let client = {
  setBaseUrl: (url) => {
    baseUrl = url;
  },

  checkJobStatus: (response, acoId) => {
    if(response.statusCode === 202){
      let body = JSON.parse(response.body);
      setTimeout(() => {
        requestPromise(options(`beneficiary/${acoId}/$export/${body.jobId}`))
          .then(function (response) {
            return client.checkJobStatus(response, acoId);
          })
          .catch(function (err) {
            console.log(err)
          });
      }, body["retry"]);
    }else if(response.statusCode === 200){
      client.downloadRequest(response);
    }
  },

  downloadRequest: (response) => {
    let body = JSON.parse(response.body);

    request(body.url).pipe(fs.createWriteStream("RESULT")) // "RESULT" needs to be changed to the name and format of the file returned. (e.g. aco-result.json)
  },

  getBulkRequest: (acoId = '') => {
    requestPromise(options(`beneficiary/${acoId}/$export`))
      .then(function (response) {
        return client.checkJobStatus(response, acoId);
      })
      .catch(function (err) {
        console.log(err)
      });
  },

  getBaseUrl: () => {return baseUrl}
};

replServer.context.client = client;
