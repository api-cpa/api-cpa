'use strict';

const _ = require('lodash');

module.exports = ServicesController;

function ServicesController(options) {
  options = options || {};
  const logger = options.logger;
  const ServiceModel = options.models.ServiceModel;
  const RouteModel = options.models.RouteModel;

  this.getServices = function(req, res, next) {
    var services = [];
    var included = [];
    const query = {
      '$or': [
        {public: true},
        {clientId: res._service.clientId}
      ]
    };
    const options = {
      sort: {name: 1},
      populate: {path: 'routes', model: RouteModel.io}
    };
    ServiceModel
      .io
      .paginate(query, options)
      .then(function(result) {
        result.docs.forEach(function(service) {
          services.push(service.getResourceObject(res._apiuri, {include: res._include}));
          included = _.union(included, service.getIncludedObjects(res._apiuri, {include: res._include}));
        });
        return next({code: 200, data: services, included: included});
      })
      .catch(function(err) {
        return next({code: 500, messages: [err]});
      });
  };

  this.get = function(req, res, next) {
    return next({code: 200, data: req.data.service.getResourceObject(res._apiuri)});
  };

  this.getServiceData = function(req, res, next) {
    ServiceModel.io.findOne({
      $and: [
        {
          $or: [
            {public: true},
            {clientId: res._service.clientId}
          ]
        },
        {
          $or: [
            {nameNormalized: req.params.serviceId},
            {clientId: req.params.serviceId}
          ]
        }
      ]
    }, function(err, service) {
      if (err)
        return next({code: 500, messages: err});
      if (!service)
        return next({code: 404, messages: ['not_found', 'Service non trouvé']});
      req.data = req.data || {};
      req.data.service = service;
      return next();
    });
  };
};
