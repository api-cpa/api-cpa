'use strict';

const _ = require('lodash'),
  franceConnectHelper = require('../../../helpers/fc.helper.js'),
  filterservice = require('../../../services/filter.service.js'),
  sortservice = require('../../../services/sort.service.js'),
  convertService = require('../../../services/convert.service.js'),
  CONFIG = require('../../../config/app.js');

module.exports = ServicesController;

function ServicesController(options) {
  options = options || {};
  const logger = options.logger;
  const ServiceModel = options.models.ServiceModel;
  const RouteModel = options.models.RouteModel;
  const FieldModel = options.models.FieldModel;
  const DataModel = options.models.DataModel;
  const FranceConnectHelper = new franceConnectHelper(options);
  const FilterService = new filterservice(options);
  const SortService = new sortservice(options);
  const ConvertService = new convertService(options);

  this.get = function (req, res, next) {
    return next({code: 200, data: req.data.data.getResourceObject(res._apiuri, {include: res._request.params.include})});
  };

  this.getDataData = function (req, res, next) {
    let condition = {
      service: req.data.service._id,
      route: req.data.route._id
    };
    if (req.data.route.fcRestricted || (req.data.route.fcRequired && req.data.fcIdentity))
      condition.dataId = FranceConnectHelper.generateHash(req.data.fcIdentity);
    else
      condition.dataId = req.params.dataId;
    DataModel.io
      .findOne(condition)
      .populate([{
        path: 'service',
        model: ServiceModel.io,
        options: {limit: CONFIG.api.pagination.limit}
      },{
        path: 'route',
        model: RouteModel.io,
        options: {limit: CONFIG.api.pagination.limit}
      }])
      .exec(function (err, data) {
        if (err)
          return next({code: 500});
        if (!data)
          return next({code: 404, messages: ['not_found', '"' + condition.dataId + '" is invalid']});
        req.data = req.data || {};
        req.data.data = data;
        next();
      });
  };

  this.destroy = function (req, res, next) {
    req.data.data.remove(function (err) {
      if (err)
        return next({code: 500});
      return next({code: 200});
    });
  };

  this.fcAuthorize = function (req, res, next) {
    if (req.data.route.fcRestricted || (req.data.route.fcRequired && (req.data.route.service != res._service._id.toString() || res._request.params.fc_token))) {
      FranceConnectHelper
        .checkToken(res._request.params.fc_token, '')
        .then(function (fcIdentity) {
          req.data.fcIdentity = fcIdentity;
          next();
        })
        .catch(function (err) {
          next(err);
        });
    }
    else
      next();
  };

  this.processRequest = function (req, res, next) {
    if (req.data.route.method == 'GET' && req.method != 'GET')
      return next({code: 404, messages: ['Méthode "' + req.method + '" non reconnue sur cette collection']});
    if (req.method == 'GET') {
      if (req.data.route.fcRestricted || (req.data.route.fcRequired && (req.data.route.service != res._service._id.toString() || res._request.params.fc_token))) {
        req.params.dataId = FranceConnectHelper.generateHash(req.data.fcIdentity);
        return DataModel.io
          .findOne({
            service: req.data.service._id,
            route: req.data.route._id,
            dataId: req.params.dataId
          }, function (err, data) {
            if (err)
              return next({code: 500});
            if (data)
              return next({code: 200, data: data.getResourceObject(res._apiuri)});
            return next({code: 404, messages: ['not_found', '"' + req.params.dataId + '" is invalid']});
          });
      }
      return requestGet(req, res, next);
    }
    if (req.method == 'POST')
      return requestPost(req, res, next);
    return next({code: 500, messages: ['not_implemented']});
  };

  function requestGet(req, res, next) {
    var dataResult = [];
    var query = {};
    query["route"] = req.data.route._id;
    var whitelistedFields = [];
    FieldModel.io
      .find({
        route: req.data.route._id
      })
      .exec(function (err, fields) {
        if (err)
          return next({code: 500});

        fields.forEach(function (field) {
          whitelistedFields.push({"name": "data." + field.nameNormalized, "key": field.type });
        });
        if (typeof res._request !== 'undefined' && res._request.params !== 'undefined') {
          query = FilterService.buildMongoQuery(query, res._request.params.filter, 'Data', whitelistedFields);
        }
        if (query["ERRORS"] !== undefined && query["ERRORS"].length > 0)
          return next({code: 400, messages: query["ERRORS"]});
        var queryOptions = {
          populate: []
        };
        queryOptions = SortService.buildMongoSortOption(queryOptions, res._request.params.sort, 'Data', whitelistedFields);
        if (queryOptions["ERRORS"] !== undefined && queryOptions["ERRORS"].length > 0)
          return next({code: 400, messages: queryOptions["ERRORS"]});
        if (Array.isArray(res._request.params.include) === true) {
          if (res._request.params.include.indexOf(CONFIG.api.v1.resources.Service.type) != -1) {
            queryOptions.populate.push({
              path: 'service',
              model: ServiceModel.io,
              options: {limit: CONFIG.api.pagination.limit}
            });
          }
          if (res._request.params.include.indexOf(CONFIG.api.v1.resources.Route.type) != -1) {
            queryOptions.populate.push({
              path: 'route',
              model: RouteModel.io,
              options: {limit: CONFIG.api.pagination.limit}
            });
          }
        }
        _.merge(queryOptions, res._paginate);
        DataModel
          .io
          .paginate(query, queryOptions)
          .then(function (results) {
            next({code: 200, results: results});
          })
          .catch(function (err) {
            logger.warn(JSON.stringify(err));
            next({code: 500});
          })
      });

  };

  function requestPost(req, res, next) {
    if (!res._request.params.data)
      return next({code: 400, messages: ['missing_parameter', '"data" is required']});
    if ((req.data.route.fcRestricted || (req.data.route.fcRequired && req.data.fcIdentity)) && Array.isArray(res._request.params.data))
      return next({
        code: 400,
        messages: ['invalid_format', 'cannot update multiple objects when specifying "fc_token"']
      });
    if (!Array.isArray(res._request.params.data))
      res._request.params.data = [res._request.params.data];

    const length = res._request.params.data.length;
    var objects = [];
    var createdCount = 0;

    var whitelistedFields = [];
    FieldModel.io
      .find({
        route: req.data.route._id
      })
      .exec(function (err, fields) {
        if (err)
          return next({code: 500});

        fields.forEach(function (field) {
          whitelistedFields.push(field.nameNormalized);
        });

        let errors = [];
        res._request.params.data.forEach(function (data, i) {
          if (typeof data != 'object')
            errors.push('invalid_format', '"data" must be a JSON object or a collection of JSON objects', 'error on index: ');
          if (!data.type)
            errors.push('missing_parameter', '"type" is required', 'error on index: ' + i);
          if (data.type != 'donnees')
            errors.push('invalid_paramater', '"type" must be equal to "donnees"', 'error on index: ' + i);
          if (!data.attributes)
            errors.push('missing_parameter', '"attributes" is required', 'error on index: ' + i);
          if ((req.data.route.fcRestricted || req.data.route.fcRequired) && !req.data.fcIdentity && !data.id)
            errors.push('missing_parameter', 'context: "fc_token" not specified', '"id" is required', 'error on index: ' + i);
          if ((req.data.route.fcRestricted || req.data.route.fcRequired) && req.data.fcIdentity && data.id)
            errors.push('unauthorized_parameter', 'context: "fc_token" specified', '"id" must be not specified', 'error on index: ' + i);
          if (!req.data.route.fcRestricted && !req.data.route.fcRequired && !data.id)
            errors.push('missing_parameter', '"id" is required', 'error on index: ' + i);

          if (req.data.route.isCollection) {
            if (!Array.isArray(data.attributes))
              errors.push('invalid_format', '"attributes" must be an array', 'error on index: ' + i);
          } else {
            if (Array.isArray(data.attributes))
              errors.push('invalid_format', '"attributes" cannot be an array', 'error on index: ' + i);
          }

          if (errors.length == 0) {
            var attributesToCheck = data.attributes;
            if (!Array.isArray(attributesToCheck))
              attributesToCheck = [attributesToCheck];
            attributesToCheck.forEach(function (attr) {
              if (typeof attr != 'object')
                errors.push('invalid_format', '"attributes" must be a JSON object', 'error on index: ' + i);

              fields.forEach(function (field) {
                if (field.required) {
                  if (typeof attr[field.nameNormalized] === 'undefined'
                    || ((field.type == 'ID' || field.type == 'STRING' || field.type == 'ENCODED') && attr[field.nameNormalized] === '')) {
                    errors.push('missing_parameter', '"' + field.nameNormalized + '" is required', 'error on index: ' + i);
                  }
                }
                if (typeof attr[field.nameNormalized] !== 'undefined') {
                  attr[field.nameNormalized] = ConvertService.convert(field.type, attr[field.nameNormalized]);
                  if (attr[field.nameNormalized] instanceof Error)
                    errors.push('invalid_format', '"' + field.nameNormalized + '" must be ' + field.type, 'error on index: ' + i);
                }
              });

              let unauthorizedFields = _.reduce(attr, function (result, val, key) {
                if (_.indexOf(whitelistedFields, key) == -1)
                  result.push(key);
                return result;
              }, []);
              if (unauthorizedFields.length > 0) {
                unauthorizedFields.forEach(function (name) {
                  errors.push('unauthorized_paramater', '"' + name + '" is not a valid parameter');
                });
              }
            });
          }

        });
        if (errors.length > 0) {
          return next({code: 400, messages: errors});
        }

        requestPostElement(0, fields);
      });

    function requestPostElement(i, fields) {
      if (i == length) {
        return next({
          code: createdCount > 0 ? 201 : 200,
          data: objects.length == 0 ? objects[0] : objects
        });
      }
      let condition = {
        service: req.data.service._id,
        route: req.data.route._id
      };
      if (req.data.route.fcRestricted || (req.data.route.fcRequired && req.data.fcIdentity))
        condition.dataId = FranceConnectHelper.generateHash(req.data.fcIdentity);
      else
        condition.dataId = res._request.params.data[i].id;
      DataModel.io.findOne(condition, function (err, data) {
        if (err)
          return next({code: 500});
        if (data) {
          data.data = res._request.params.data[i].attributes;
          data.save(function (err) {
            if (err)
              return next({code: 500});
            DataModel.io.findOne(condition, function (err, data) {
              if (err)
                return next({code: 500});
              objects.push(data.getResourceObject(res._apiuri));
              return requestPostElement(i + 1, fields);
            });
          });
        }
        else {
          DataModel.io.create({
            dataId: req.data.route.fcRestricted || (req.data.route.fcRequired && req.data.fcIdentity) ? FranceConnectHelper.generateHash(req.data.fcIdentity) : res._request.params.data[i].id || DataModel.generateId(),
            data: res._request.params.data[i].attributes,
            service: req.data.service._id,
            clientId: req.data.service.clientId,
            route: req.data.route._id,
            routeId: req.data.route.routeId,
            createdAt: new Date()
          }, function (err, data) {
            if (err)
              return next({code: 500, messages: err});
            objects.push(data.getResourceObject(res._apiuri));
            createdCount++;
            return requestPostElement(i + 1, fields);
          });
        }
      });
    };
  };

};
