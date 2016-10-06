'use strict';

const request = require('request'),
  tokenModel = require('../../models/v1/Token.model.js'),
  flashHelper = require('../../helpers/flash.helper.js'),
  paginationService = require('../../services/pagination.service.js'),
  _ = require('lodash');

module.exports = TokensController;

function TokensController(options) {
  options = options || {};
  const logger = options.logger;
  const TokenModel = new tokenModel(options);
  const FlashHelper = new flashHelper(options);
  const PaginationService = new paginationService(options);

  this.index = function(req, res, next) {
    var query = {service: req.data.service};
    var queryOptions = {
      sort: {createdAt: -1}
    };
    _.merge(queryOptions, res._paginate);
    TokenModel
      .io
      .paginate(query, queryOptions)
      .then(function(results) {
        return res.render('pages/dashboard/tokens/index', {
          page: 'pages/dashboard/tokens/index',
          csrfToken: req.csrfToken(),
          data: req.data,
          tokens: results.docs,
          now: new Date(),
          flash: res._flash,
          pagination: PaginationService.getDashboardPagination(res, results)
        });
      })
      .catch(function(err) {
        logger.warn(JSON.stringify(err));
        return next({code: 500});
      });
  };

  this.destroy = function(req, res) {
    req.data.token.remove(function(err) {
      if (err)
        return res.status(500).end();
      return res.redirect('back');
    });
  };

  this.revoke = function(req, res) {
    req.data.token.update({
      accessTokenExpiresOn: new Date()
    }, function(err) {
      if (err)
        return res.status(500).end();
      return res.redirect('back');
    });
  };

  this.generateTokenFromDashboard = function(req, res) {
    console.log(res._originalUrlObject);
    request
      .post({
          url: res._originalUrlObject.protocol + '://' + res._originalUrlObject.host + ':' + res._originalUrlObject.port + '/api/oauth/token',
          body: {
            client_secret: req.data.service.clientSecret,
            client_id: req.data.service.clientId
          },
          json: true,
          headers: {
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json'
          }
        },
        function (error, response, body) {
          if (response.statusCode == 200) {
            return FlashHelper.addSuccess(req.session, {title: 'Le jeton a bien été créé', messages: [body.data.attributes.access_token, 'Date d\'expiration: ' + body.data.attributes.expires_on]}, function (err) {
              if (err)
                return res.status(500).end();
              return res.redirect('/dashboard/services/' + req.data.service.nameNormalized + '/tokens');
            });
          }
          FlashHelper.addError(req.session, body.errors, function(err) {
            if (err)
              return res.status(500).end();
            return res.redirect('/dashboard/services/' + req.data.service.nameNormalized + '/tokens');
          });
        });
  };

  this.gotoIndex = function(req, res, next) {
    return res.redirect('/dashboard/services/' + req.data.service.nameNormalized + '/tokens');
  };

  this.getTokenData = function(req, res, next) {
    TokenModel.io.findOne({
      service: req.data.service,
      accessToken: req.params.accessToken
    }, function(err, token) {
      if (err)
        return res.status(500).end();
      if (!token)
        return res.status(401).end();
      req.data = req.data || {};
      req.data.token = token;
      return next();
    });
  };
};
