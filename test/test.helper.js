'use strict';

const chai = require('chai'),
  should = require('chai').should(),
  chaiHttp = require('chai-http'),
  Server = require('../server.js'),
  tokenModel = require('../models/v1/Token.model.js'),
  usersDb = require('./db/users.db.js'),
  servicesDb = require('./db/services.db.js');


chai.use(chaiHttp);

module.exports = ApiTester;

function ApiTester(options) {
  options = options || {};
  options.dbHost = options.dbHost || process.env.MONGODB_URI || 'mongodb://localhost:27017/api-cpa-test';
  options.expressSessionSecret = options.expressSessionSecret || 'test';
  options.host = options.host || 'http://localhost:3010';
  options.port = options.port || 3010;

  const server = new Server(options),
    TokenModel = new tokenModel(options),
    UsersDb = new usersDb(options),
    ServicesDb = new servicesDb(options);

  var users = [],
    services = [],
    accessToken;

  this.getAccessToken = function() {
    return accessToken;
  };

  this.getClientSecret = function(i) {
    i = i || 0;
    return services[i].clientSecret;
  };

  this.getClientId = function(i) {
    i = i || 0;
    return services[i].clientId;
  };

  this.authorize = function(done) {
    requestFn()
      .post('/api/v1/oauth/token')
      .send({client_id: services[0].clientId, client_secret: services[0].clientSecret})
      .end(function (err, res) {
        accessToken = res.body.data.attributes.access_token;
        done();
      });
  };

  this.expiredToken = function(done) {
    TokenModel.io.findOne({accessToken: accessToken}, function(err, token) {
      if (err)
        return done(err);
      token.accessTokenExpiresOn = new Date();
      token.save(function(err) {
        if (err)
          return done(err);
        done();
      });
    });
  };

  this.request = requestFn;

  this.before = function(done) {

    TokenModel.io.remove({}, function(err) {
      if (err)
        return done(err);

      UsersDb.drop()
        .then(ServicesDb.drop)
        .then(UsersDb.seed)
        .then(function(db) {
          users = db;
          return ServicesDb.seed(users);
        })
        .then(function(db) {
          services = db;
          server.start(function (err) {
            if (err)
              return done(err);
            done();
          });
        })
        .catch(function(err) {
          return done(err);
        });
    });
  };

  this.after = function(done) {
    server.stop(done);
  };

  function requestFn(host) {
    host = host || options.host;
    return chai.request(host);
  };

  this.checkResponse = function(res, opt) {
    opt = opt || {};
    const isSuccess = opt.isSuccess === undefined || opt.isSuccess;
    const isCollection = opt.isCollection === undefined || opt.isCollection;
    const status = opt.status || 200;
    res.body.should.be.a('object');
    res.body.should.have.property('jsonapi');
    res.body.jsonapi.should.have.property('version');
    res.should.have.status(status);
    if (isSuccess) {
      res.body.should.have.property('data');
      if (isCollection) {
        res.body.data.should.be.a('array');
      } else {
        res.body.data.should.be.a('object');
      }
    } else {
      res.should.not.have.status(200);
      res.should.not.have.status(201);
      res.body.should.have.property('errors');
      res.body.errors.should.be.a('array');
    }
  };

  this.now = function() {
    return new Date();
  };

};