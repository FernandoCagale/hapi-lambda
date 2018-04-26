/**
 * This module maps the Lambda proxy requests to the Hapijs router
 */
'use strict';

const Hapi = require('hapi');
let server;

// flag so plugsin dont get reconfigured
let loaded = false;

/**
 * Configures the lambda proxy to host hapi.js plugins
 * @param plugins An array of plugins to register
 */
exports.configure = function(plugins, options){
    if (!server) {
        server = new Hapi.Server(options);
    }

    if(!plugins) throw 'Plugins must be configured as an array';
    server.makeReady = async function(){
        if(!loaded){
            await server.register(plugins);
            loaded = true;
        }
    };
}

exports.handler = async (event) => {
    const err = await server.makeReady();

    if(err) throw err;

    // lambda removes query string params from the url and places them into
    // and object in event. Hapi expects them on the url path
    let path = event.path;
    if(event.queryStringParameters){
        const qs = Object.keys(event.queryStringParameters).map(key => { return key + '=' + event.queryStringParameters[key]; });
        if(qs.length > 0){
            path += '?' + qs.join('&');
        }
    }

    // map lambda event to hapi request
    const options = {
        method: event.httpMethod,
        url: path,
        payload: event.body,
        headers: event.headers,
        validate: false
    };

    const res = await server.inject(options);
    // some headers are rejected by lambda
    // ref: http://stackoverflow.com/questions/37942119/rust-aws-api-gateway-service-proxy-to-s3-file-upload-using-raw-https-request/37950875#37950875
    // ref: https://github.com/awslabs/aws-serverless-express/issues/10
    delete res.headers['content-encoding'];
    delete res.headers['transfer-encoding'];

    // handle cors here b/c api gateway does half of it for us
    // these options must match the serverless.yaml options
    res.headers['Access-Control-Allow-Origin'] = '*';
    res.headers['Access-Control-Allow-Credentials'] = true;

    const response = {
        statusCode: res.statusCode,
        headers: res.headers,
        body: typeof res.result === 'string' ? res.result : JSON.stringify(res.result)
    };

    return response;
};