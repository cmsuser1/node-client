const requestPromise = require('request-promise');
const request = require('request');
const repl = require('repl');
const fs = require('fs');
const simpleOAuth2 = require('simple-oauth2');
const uuid4 = require('uuid/v4');
const url = require('url');
const assert = require('assert');

let options = (uri, baseUrl = client.getBaseUrl(), authToken = client.getCurrentToken()) => {
  return {
    method: 'GET',
    uri: baseUrl + uri,
    resolveWithFullResponse: true,
    headers: {
      'Authorization': 'Bearer ' + authToken.token.access_token,
    },
  };
};

var replServer = repl.start({
    prompt: 'CMS Client > '
});

let client = {
  setBaseUrl: (url) => {
    baseUrl = url;
  },

  setAuth: (clientId, clientSecret, redirectUri) => {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.oauth2 = simpleOAuth2.create({
      client: {
        id: clientId,
        secret: clientSecret,
      },
      auth: {
        tokenHost: baseUrl,
      },
    });
  },

  getAuthUrl: () => {
    this.state = uuid4();
    let uri = this.oauth2.authorizationCode.authorizeURL({
      redirect_uri: this.redirectUri,
      scope: 'export',
      state: this.state,
    });
    return {
      'uri': uri,
      'state': this.state,
    };
  },

  fetchToken: (redirect) => {
    let respUrl = new URL(redirect);

    assert.strictEqual(respUrl.searchParams.get('state'), this.state,
      'Server redirect response state nonce did not match!');

    let authCode = respUrl.searchParams.get('code');

    this.oauth2.authorizationCode.getToken({
      code: authCode,
      redirect_uri: this.redirectUri,
      scope: 'export',
    }).then(
      tokenResult => {
        this.currentToken = this.oauth2.accessToken.create(tokenResult);
      },
      error => {
        console.log('Failed to retrieve access token', error.message);
      });
  },

  getCurrentToken: () => { return this.currentToken; },

  setCurrentToken: (authToken, expires='86400') => {
    this.token = this.oauth2.accessToken.create({
      'access_token': authToken,
      'refresh_token': '',
      'expires_in': expires,
    });
  },

  checkJobStatus: (response, acoId) => {
    if(response.statusCode === 202){
      let body = JSON.parse(response.body);
      setTimeout(() => {
        requestPromise(options(`beneficiary/${acoId}/export/${body.external_id}`))
          .then(function (response) {
            return client.checkJobStatus(response, acoId);
          })
          .catch(function (err) {
            console.log(err)
          });
      }, body["retry"]);
    }else if(response.statusCode === 200){
      console.log('Export finished: ' + response.body);
      client.downloadRequest(response);
    }
  },

  downloadRequest: (response) => {
    let body = JSON.parse(response.body);

    request(options(body.url)).pipe(fs.createWriteStream("RESULT")) // "RESULT" needs to be changed to the name and format of the file returned. (e.g. aco-result.json)
  },

  getBulkRequest: (acoId = '') => {
    requestPromise(options(`beneficiary/${acoId}/export`))
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
