hapi-lambda-proxy
-------------

Compatibility
Compatible with hapi.js version 17.x

This module will allow you to host your Hapi.js application on Amazon Lambda. **original [hapi-lambda](https://github.com/carbonrobot/hapi-lambda)**

## Usage

Your application should already be configured as [plugins](https://hapijs.com/tutorials/plugins?lang=en_US):

```
// api.js

exports.plugin = {
  name: 'lambda',
  version: '1.0.0',
  register: function (server, options) {

    server.route({
      method: 'GET',
      path: '/test',
      handler: function (request, h) {
        return 'hello, world';
      }
    });

  }
};
```

Your index.js file that you push to Lambda should look like the following:

```
// index.js

const hapiLambda = require('hapi-lambda-proxy');
const api = require('./api');

hapiLambda.configure([api]);
exports.handler = hapiLambda.handler;
```

## Deployment

Deployment is a much larger topic and not covered by this module, however I highly recommend deploying your Lambda application with [Serverless](https://serverless.com/).

```
// serverless.yml

service: serverless-hapi-lambda-proxy

provider:
  name: aws
  runtime: nodejs8.10

functions:
  api:
    handler: index.handler
    events:
      - http:
          path: "{proxy+}"
          method: any
          cors: true

```