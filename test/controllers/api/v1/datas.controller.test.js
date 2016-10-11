'use strict';

const testHelper = require('../../../test.helper.js'),
  TestHelper = new testHelper(),
  request = TestHelper.request,
  dataModel = require('../../../../models/v1/Data.model.js'),
  DataModel = new dataModel(TestHelper.getOptions());

const datadb = {
  my_data_id1: {field1: 'first string', field2: 'second string', field3: 12, field4: {'key': 'value'}, field5: 75},
  my_data_id2: {field1: 'second', field2: 'test1', field3: 1, field4: {'key': 'value'}, field5: 2},
  my_data_id3: {field1: 'third', field2: 'test2', field3: 70, field4: {'key': 'value'}, field5: 85},
  my_data_id4: {field1: 'fours', field2: 'test3', field3: 43, field4: {'key': 'value'}, field5: 35},
  my_data_id5: {field1: 'fives', field2: 'test4', field3: 80, field4: {'key': 'value'}, field5: 2},
  my_data_id6: {field1: 'sixs', field2: 'test5', field3: 125, field4: {'key': 'value'}, field5: 185}
};

const filterClassic = [
  { testname: "test AND", res:["my_data_id1"], filter : "filter[$and][data.field1]=first string&filter[$and][data.field3]=12&filter[$and][data.field5][$gt]=72&filter[$and][data.field5][$lt]=90"}, //my_data_id1
  { testname: "test OR", res:["my_data_id1", "my_data_id2", "my_data_id3", "my_data_id5", "my_data_id6"], filter : "filter[$or][data.field1]=second&filter[$or][data.field3]=12&filter[$or][data.field3]=12&filter[$or][data.field5]=85&filter[$or][data.field1]=sixs&filter[$or][data.field2]=test4"}, //my_data_id1 //my_data_id2 //my_data_id3 //my_data_id5 //my_data_id6
  { testname: "test inseption AND OR", res:["my_data_id2"], filter : "filter[$and][$or][data.field1]=second&filter[$and][$or][data.field1]=sixs&filter[$and][$or][data.field1]=fives&filter[$and][data.field3][$lt]=20"}, //my_data_id2
  { testname: "test multiple and inseption AND OR", res:["my_data_id2"], filter : "filter[$and][0][$or][data.field1]=second&filter[$and][0][$or][data.field1]=third&filter[$and][0][$or][data.field1]=fours&filter[$and][0][$or][data.field1]=fives&filter[$and][0][$or][data.field1]=sixs&filter[$and][1][$or][data.field3]=12&filter[$and][1][$or][data.field3]=1&filter[$and][1][$or][data.field3]=70&filter[$and][1][$or][data.field3]=125&filter[$and][2][$or][data.field5]=35&filter[$and][2][$or][data.field5]=2&filter[$and][2][$or][data.field5]=75"}, //my_data_id2
  { testname: "test $gt $lt $gte $lte", res:["my_data_id3", "my_data_id4"], filter : "filter[data.field3][$gt]=42&filter[data.field3][$lt]=71&filter[data.field5][$gte]=35&filter[data.field5][$lte]=85"}, //my_data_id3 //my_data_id4
  { testname: "test $eq -> $in", res:["my_data_id1", "my_data_id2", "my_data_id3" ], filter : "filter[data.field3][$eq]=12&filter[data.field3][$eq]=1&filter[data.field3][$eq]=70"},//my_data_id1 //my_data_id2 //my_data_id3
  { testname: "test $ne -> $nin", res:["my_data_id4", "my_data_id5", "my_data_id6"], filter : "filter[data.field3][$ne]=12&filter[data.field3][$ne]=1&filter[data.field3][$ne]=70"},//my_data_id4 //my_data_id5 //my_data_id6
  { testname: "test $in", res:["my_data_id1", "my_data_id2", "my_data_id3"], filter : "filter[data.field3][$in]=12&filter[data.field3][$in]=1&filter[data.field3][$in]=70"},//my_data_id1 //my_data_id2 //my_data_id3
  { testname: "test $nin", res:["my_data_id4", "my_data_id5", "my_data_id6"], filter : "filter[data.field3][$nin]=12&filter[data.field3][$nin]=1&filter[data.field3][$nin]=70"} //my_data_id4 //my_data_id5 //my_data_id6
]

const filter = [
  "",
  "filter[data.field1]=third",
  "filter[data.field3][$gt]=50",
  "filter[data.field3][$lt]=50",
  "filter[data.field3][$gte]=30&filter[data.field3][$lte]=80",
  "filter[$or][$and][0][$or][data.field1]=third&filter[$or][$and][0][$or][data.field2]=test3&filter[$or][$and][1][$or][data.field2]=test2&filter[$or][$and][2][data.field3][$gte]=56&filter[$or][$and][2][data.field3][$lte]=71",
  "filter[$or][data.field1]=third&filter[$or][data.field2]=test3&filter[$or][data.field3]=90",
  "filter[$or][data.field1]=third&filter[$or][data.field2]=test3&filter[$or][data.field2]=test2",
  "filter[$and][data.field1]=third&filter[$and][data.field2]=test2&filter[$and][data.field3]=70",
  "filter[$and][$or][data.field1]=third&filter[$and][$or][data.field2]=test3&filter[$and][data.field3]=90",
  "filter[$or][$and][0][$or][data.field1]=third&filter[$or][$and][0][$or][data.field2]=test3&filter[$or][$and][1][$or][data.field2]=test2&filter[$or][$and][2][data.field3][$gte]=23&filter[$or][$and][2][data.field3][$lte]=69"
]

describe('Datas', function () {

  before(TestHelper.startServer);
  before(TestHelper.seedDb);
  after(TestHelper.stopServer);

  describe('Authenticated service', function () {

    before(TestHelper.authorize);
  
    it('show list of public data (through services route)', function (done) {
      request()
        .get('/api/v1/services/my_client_id/relationships/collections/my_route_id1/relationships/donnees')
        .query({access_token: TestHelper.getAccessToken()})
        .end(function (err, res) {
          TestHelper.checkResponse(res);
          res.body.data.should.have.lengthOf(6);
          res.body.data[5].id.should.eql('my_data_id1');
          res.body.data[5].type.should.eql('donnees');
          res.body.data[5].attributes.should.eql({
            field1: 'first string',
            field2: 'second string',
            field3: 12,
            field4: {'key' : 'value'},
            field5: 75
          });
          done();
        });
     });

    it('show list of public data (though collections route)', function (done) {
      request()
        .get('/api/v1/collections/my_route_id1/relationships/donnees')
        .query({access_token: TestHelper.getAccessToken()})
        .end(function (err, res) {
          TestHelper.checkResponse(res);
          res.body.data.should.have.lengthOf(6);
          res.body.data[5].id.should.eql('my_data_id1');
          res.body.data[5].type.should.eql('donnees');
          res.body.data[5].attributes.should.eql({
            field1: 'first string',
            field2: 'second string',
            field3: 12,
            field4: {'key' : 'value'},
            field5: 75
          });
          done();
        });
    });

    describe('Errors', function() {

      it('404', function (done) {
        request()
          .get('/api/v1/collections/my_route_id1/relationships/donnees/hkgdhjqsDGKSQGDKQDS')
          .query({access_token: TestHelper.getAccessToken()})
          .end(function (err, res) {
            TestHelper.checkResponse(res, {isSuccess: false, status: 404});
            done();
          });
      });

    });

    describe('Relationships', function() {

      describe('Collections', function() {

        it('includes route', function (done) {
          request()
            .get('/api/v1/collections/my_route_id1/relationships/donnees?include=collections')
            .query({access_token: TestHelper.getAccessToken()})
            .end(function (err, res) {
              TestHelper.checkResponse(res);
              res.body.data[0].relationships.should.have.property('collections');
              res.body.data[0].relationships.collections.should.eql({
                links: {self: 'http://localhost:3010/api/v1/collections/my_route_id1'},
                data: {
                  type: "collections",
                  id: "my_route_id1"
                }
              });
              done();
            });
        });

        it('includes service', function (done) {
          request()
            .get('/api/v1/collections/my_route_id1/relationships/donnees?include=services')
            .query({access_token: TestHelper.getAccessToken()})
            .end(function (err, res) {
              TestHelper.checkResponse(res);
              res.body.data[0].relationships.should.have.property('services');
              res.body.data[0].relationships.services.should.eql({
                links: {self: 'http://localhost:3010/api/v1/services/my_client_id'},
                data: {
                  type: "services",
                  id: "my_client_id"
                }
              });
              done();
            });
        });

        it('includes route & service', function (done) {
          request()
            .get('/api/v1/collections/my_route_id1/relationships/donnees?include=collections,services')
            .query({access_token: TestHelper.getAccessToken()})
            .end(function (err, res) {
              TestHelper.checkResponse(res);
              res.body.data[0].relationships.should.have.property('collections');
              res.body.data[0].relationships.collections.should.eql({
                links: {self: 'http://localhost:3010/api/v1/collections/my_route_id1'},
                data: {
                  type: "collections",
                  id: "my_route_id1"
                }
              });
              res.body.data[0].relationships.should.have.property('services');
              res.body.data[0].relationships.services.should.eql({
                links: {self: 'http://localhost:3010/api/v1/services/my_client_id'},
                data: {
                  type: "services",
                  id: "my_client_id"
                }
              });
              done();
            });
        });

      });

      describe('Resource', function() {

        it('includes route', function (done) {
          request()
            .get('/api/v1/collections/my_route_id1/relationships/donnees/my_data_id1?include=collections')
            .query({access_token: TestHelper.getAccessToken()})
            .end(function (err, res) {
              TestHelper.checkResponse(res, {isCollection: false});
              res.body.data.relationships.should.have.property('collections');
              res.body.data.relationships.collections.should.eql({
                links: {self: 'http://localhost:3010/api/v1/collections/my_route_id1'},
                data: {
                  type: "collections",
                  id: "my_route_id1"
                }
              });
              done();
            });
        });

        it('includes service', function (done) {
          request()
            .get('/api/v1/collections/my_route_id1/relationships/donnees/my_data_id1?include=services')
            .query({access_token: TestHelper.getAccessToken()})
            .end(function (err, res) {
              TestHelper.checkResponse(res, {isCollection: false});
              res.body.data.relationships.should.have.property('services');
              res.body.data.relationships.services.should.eql({
                links: {self: 'http://localhost:3010/api/v1/services/my_client_id'},
                data: {
                  type: "services",
                  id: "my_client_id"
                }
              });
              done();
            });
        });

        it('includes route & service', function (done) {
          request()
            .get('/api/v1/collections/my_route_id1/relationships/donnees/my_data_id1?include=collections,services')
            .query({access_token: TestHelper.getAccessToken()})
            .end(function (err, res) {
              TestHelper.checkResponse(res, {isCollection: false});
              res.body.data.relationships.should.have.property('collections');
              res.body.data.relationships.collections.should.eql({
                links: {self: 'http://localhost:3010/api/v1/collections/my_route_id1'},
                data: {
                  type: "collections",
                  id: "my_route_id1"
                }
              });
              res.body.data.relationships.should.have.property('services');
              res.body.data.relationships.services.should.eql({
                links: {self: 'http://localhost:3010/api/v1/services/my_client_id'},
                data: {
                  type: "services",
                  id: "my_client_id"
                }
              });
              done();
            });
        });

      });

    });
  
    describe('Filter service', function () {

      filterClassic.forEach(function(objfilterclassic) {
        it(objfilterclassic.testname, function (done) {
          request()
            .get('/api/v1/services/my_client_id/relationships/collections/my_route_id1/relationships/donnees?' + objfilterclassic.filter)
            .query({access_token: TestHelper.getAccessToken()})
            .end(function (err, res) {
              TestHelper.checkResponse(res);
              res.body.data.should.have.lengthOf(objfilterclassic.res.length);
              for (var j = 0; j < objfilterclassic.res.length; ++j) {
                let exists = false;
                res.body.data.forEach(function(data) {
                  if (data.id === objfilterclassic.res[j]) {
                    exists = true;
                    data.type.should.eql('donnees');
                    data.attributes.should.eql({
                      field1: datadb[objfilterclassic.res[j]].field1,
                      field2: datadb[objfilterclassic.res[j]].field2,
                      field3: datadb[objfilterclassic.res[j]].field3,
                      field4: datadb[objfilterclassic.res[j]].field4,
                      field5: datadb[objfilterclassic.res[j]].field5
                    });
                  }
                });
                if (!exists)
                  throw new Error('data not found');
              }
              done();
            });
        });
      });
      
      it('simple filter 1', function (done) {
        request()
          .get('/api/v1/services/my_client_id/relationships/collections/my_route_id1/relationships/donnees?'+filter[1])
          .query({access_token: TestHelper.getAccessToken()})
          .end(function (err, res) {
            TestHelper.checkResponse(res);
            res.body.data.should.have.lengthOf(1);
            res.body.data[0].id.should.eql('my_data_id3');
            res.body.data[0].type.should.eql('donnees');
            res.body.data[0].attributes.should.eql({
              field1: "third",
              field2: "test2",
              field3: 70,
              field4: {'key' : 'value'},
              field5: 85
            });
            done();
          });
      });

      it('simple filter 2', function (done) {
        request()
          .get('/api/v1/services/my_client_id/relationships/collections/my_route_id1/relationships/donnees?'+filter[2])
          .query({access_token: TestHelper.getAccessToken()})
          .end(function (err, res) {
            TestHelper.checkResponse(res);
            res.body.data.should.have.lengthOf(3);
            res.body.data[2].id.should.eql('my_data_id3');
            res.body.data[2].type.should.eql('donnees');
            res.body.data[2].attributes.should.eql({
              field1: "third",
              field2: "test2",
              field3: 70,
              field4: {'key' : 'value'},
              field5: 85
            });
            res.body.data[1].id.should.eql('my_data_id5');
            res.body.data[1].type.should.eql('donnees');
            res.body.data[1].attributes.should.eql({
              field1: "fives",
              field2: "test4",
              field3: 80,
              field4: {'key' : 'value'},
              field5: 2
            });
            res.body.data[0].id.should.eql('my_data_id6');
            res.body.data[0].type.should.eql('donnees');
            res.body.data[0].attributes.should.eql({
              field1: "sixs",
              field2: "test5",
              field3: 125,
              field4: {'key' : 'value'},
              field5: 185
            });
            done();
          });
      });

      it('simple filter 3', function (done) {
        request()
          .get('/api/v1/services/my_client_id/relationships/collections/my_route_id1/relationships/donnees?'+filter[3])
          .query({access_token: TestHelper.getAccessToken()})
          .end(function (err, res) {
            TestHelper.checkResponse(res);
            res.body.data.should.have.lengthOf(3);
            res.body.data[2].id.should.eql('my_data_id1');
            res.body.data[2].type.should.eql('donnees');
            res.body.data[2].attributes.should.eql({
              field1: 'first string',
              field2: 'second string',
              field3: 12,
              field4: {'key' : 'value'},
              field5: 75
            });
            res.body.data[1].id.should.eql('my_data_id2');
            res.body.data[1].type.should.eql('donnees');
            res.body.data[1].attributes.should.eql({
              field1: 'second',
              field2: 'test1',
              field3: 1,
              field4: {'key' : 'value'},
              field5: 2
            });
            res.body.data[0].id.should.eql('my_data_id4');
            res.body.data[0].type.should.eql('donnees');
            res.body.data[0].attributes.should.eql({
              field1: 'fours',
              field2: 'test3',
              field3: 43,
              field4: {'key' : 'value'},
              field5: 35
            });
            done();
          });
      });

      it('simple filter 4', function (done) {
        request()
          .get('/api/v1/services/my_client_id/relationships/collections/my_route_id1/relationships/donnees?'+filter[4])
          .query({access_token: TestHelper.getAccessToken()})
          .end(function (err, res) {
            TestHelper.checkResponse(res);
            res.body.data.should.have.lengthOf(3);
            res.body.data[2].id.should.eql('my_data_id3');
            res.body.data[2].type.should.eql('donnees');
            res.body.data[2].attributes.should.eql({
              field1: 'third',
              field2: 'test2',
              field3: 70,
              field4: {'key' : 'value'},
              field5: 85
            });
            res.body.data[1].id.should.eql('my_data_id4');
            res.body.data[1].type.should.eql('donnees');
            res.body.data[1].attributes.should.eql({
              field1: 'fours',
              field2: 'test3',
              field3: 43,
              field4: {'key' : 'value'},
              field5: 35
            });
            res.body.data[0].id.should.eql('my_data_id5');
            res.body.data[0].type.should.eql('donnees');
            res.body.data[0].attributes.should.eql({
              field1: 'fives',
              field2: 'test4',
              field3: 80,
              field4: {'key' : 'value'},
              field5: 2
            });
            done();
          });
      });

      it('simple filter 5', function (done) {
        request()
          .get('/api/v1/services/my_client_id/relationships/collections/my_route_id1/relationships/donnees?'+filter[5])
          .query({access_token: TestHelper.getAccessToken()})
          .end(function (err, res) {
            TestHelper.checkResponse(res);
            res.body.data.should.have.lengthOf(1);
            res.body.data[0].id.should.eql('my_data_id3');
            res.body.data[0].type.should.eql('donnees');
            res.body.data[0].attributes.should.eql({
              field1: 'third',
              field2: 'test2',
              field3: 70,
              field4: {'key' : 'value'},
              field5: 85
            });
            done();
          });
      });

      it('simple filter 6', function (done) {
        request()
          .get('/api/v1/services/my_client_id/relationships/collections/my_route_id1/relationships/donnees?'+filter[6])
          .query({access_token: TestHelper.getAccessToken()})
          .end(function (err, res) {
            TestHelper.checkResponse(res);
            res.body.data.should.have.lengthOf(2);
            res.body.data[1].id.should.eql('my_data_id3');
            res.body.data[1].type.should.eql('donnees');
            res.body.data[1].attributes.should.eql({
              field1: 'third',
              field2: 'test2',
              field3: 70,
              field4: {'key' : 'value'},
              field5: 85
            });
            res.body.data[0].id.should.eql('my_data_id4');
            res.body.data[0].type.should.eql('donnees');
            res.body.data[0].attributes.should.eql({
              field1: 'fours',
              field2: 'test3',
              field3: 43,
              field4: {'key' : 'value'},
              field5: 35
            });
            done();
          });
      });

      it('advanced filter 7', function (done) {
        request()
          .get('/api/v1/services/my_client_id/relationships/collections/my_route_id1/relationships/donnees?'+filter[7])
          .query({access_token: TestHelper.getAccessToken()})
          .end(function (err, res) {
            TestHelper.checkResponse(res);
            res.body.data.should.have.lengthOf(2);
            res.body.data[1].id.should.eql('my_data_id3');
            res.body.data[1].type.should.eql('donnees');
            res.body.data[1].attributes.should.eql({
              field1: 'third',
              field2: 'test2',
              field3: 70,
              field4: {'key' : 'value'},
              field5: 85
            });
            res.body.data[0].id.should.eql('my_data_id4');
            res.body.data[0].type.should.eql('donnees');
            res.body.data[0].attributes.should.eql({
              field1: 'fours',
              field2: 'test3',
              field3: 43,
              field4: {'key' : 'value'},
              field5: 35
            });
            done();
          });
      });

      it('advanced filter 8', function (done) {
        request()
          .get('/api/v1/services/my_client_id/relationships/collections/my_route_id1/relationships/donnees?'+filter[8])
          .query({access_token: TestHelper.getAccessToken()})
          .end(function (err, res) {
            TestHelper.checkResponse(res);
            res.body.data.should.have.lengthOf(1);
            res.body.data[0].id.should.eql('my_data_id3');
            res.body.data[0].type.should.eql('donnees');
            res.body.data[0].attributes.should.eql({
              field1: 'third',
              field2: 'test2',
              field3: 70,
              field4: {'key' : 'value'},
              field5: 85
            });
            done();
          });
      });

    });

    describe('POST data', function() {

      describe('errors management', function() {

        it('need "data" field to be set', function (done) {
          request()
            .post('/api/v1/collections/my_route_id1/relationships/donnees')
            .send({
              access_token: TestHelper.getAccessToken()
            })
            .end(function (err, res) {
              TestHelper.checkResponse(res, {isSuccess: false, status: 400});
              res.body.errors.should.include('missing_parameter');
              res.body.errors.should.include('"data" is required');
              done();
            });
        });

        it('need "type", "id" and "attributes" fields to be set', function (done) {
          request()
            .post('/api/v1/collections/my_route_id1/relationships/donnees')
            .send({
              access_token: TestHelper.getAccessToken(),
              data: {}
            })
            .end(function (err, res) {
              TestHelper.checkResponse(res, {isSuccess: false, status: 400});
              res.body.errors.should.include('missing_parameter');
              res.body.errors.should.include('"type" is required');
              res.body.errors.should.include('"id" is required');
              res.body.errors.should.include('"attributes" is required');
              done();
            });
        });

        it('need "type" to be equal to "donnees"', function (done) {
          request()
            .post('/api/v1/collections/my_route_id1/relationships/donnees')
            .send({
              access_token: TestHelper.getAccessToken(),
              data: {
                id: "hqgkvcbekhjfbld",
                type: "invalid_type",
                attributes: {}
              }
            })
            .end(function (err, res) {
              TestHelper.checkResponse(res, {isSuccess: false, status: 400});
              res.body.errors.should.include('invalid_paramater');
              res.body.errors.should.include('"type" must be equal to "donnees"');
              done();
            });
        });

        it('need required fields to be set (1)', function (done) {
          request()
            .post('/api/v1/collections/my_route_id1/relationships/donnees')
            .send({
              access_token: TestHelper.getAccessToken(),
              data: {
                id: "hqgkvcbekhjfbld",
                type: "donnees",
                attributes: {}
              }
            })
            .end(function (err, res) {
              TestHelper.checkResponse(res, {isSuccess: false, status: 400});
              res.body.errors.should.include('missing_parameter');
              res.body.errors.should.include('"field1" is required');
              res.body.errors.should.include('"field2" is required');
              res.body.errors.should.include('"field3" is required');
              res.body.errors.should.include('"field4" is required');
              res.body.errors.should.include('"field5" is required');
              done();
            });
        });

        it('need required fields to be set (2)', function (done) {
          request()
            .post('/api/v1/collections/my_route_id1/relationships/donnees')
            .send({
              access_token: TestHelper.getAccessToken(),
              data: {
                id: "hqgkvcbekhjfbld",
                type: "donnees",
                attributes: {
                  field1: "",
                  field2: ""
                }
              }
            })
            .end(function (err, res) {
              TestHelper.checkResponse(res, {isSuccess: false, status: 400});
              res.body.errors.should.include('missing_parameter');
              res.body.errors.should.include('"field1" is required');
              res.body.errors.should.include('"field2" is required');
              res.body.errors.should.include('"field3" is required');
              res.body.errors.should.include('"field4" is required');
              res.body.errors.should.include('"field5" is required');
              done();
            });
        });

        it('need required fields to be the same type', function (done) {
          request()
            .post('/api/v1/collections/my_route_id1/relationships/donnees')
            .send({
              access_token: TestHelper.getAccessToken(),
              data: {
                id: "hqgkvcbekhjfbld",
                type: "donnees",
                attributes: {
                  field1: "STRING",
                  field2: "STRING",
                  field3: "STRING",
                  field4: "STRING",
                  field5: "STRING"
                }
              }
            })
            .end(function (err, res) {
              TestHelper.checkResponse(res, {isSuccess: false, status: 400});
              res.body.errors.should.include('invalid_format');
              res.body.errors.should.include('"field3" must be NUMERIC');
              res.body.errors.should.include('"field4" must be JSON');
              res.body.errors.should.include('"field5" must be AMOUNT');
              done();
            });
        });

      });

      describe('Success create (201) and then update (200)', function() {

        it('save new data', function(done) {
          var attributes = {
            field1: "STRING",
            field2: "STRING",
            field3: 42,
            field4: {test: 'ok'},
            field5: 999.99
          };

          // post trough API
          request()
            .post('/api/v1/collections/my_route_id1/relationships/donnees')
            .send({
              access_token: TestHelper.getAccessToken(),
              data: {
                id: "hqgkvcbekhjfbld",
                type: "donnees",
                attributes: attributes
              }
            })
            .end(function (err, res) {
              if (err)
                return done(err);
              TestHelper.checkResponse(res, {status: 201});

              // get from database
              DataModel.io.findOne({dataId: "hqgkvcbekhjfbld"}, function(err, newObj) {
                if (err)
                  done(err);
                newObj.dataId.should.eq("hqgkvcbekhjfbld");
                newObj.data.should.eql(attributes);

                // update trough API
                attributes.field1 = "NEW STRING1";
                attributes.field2 = "NEW STRING2";
                attributes.field3 = -56;
                attributes.field4 = {};
                attributes.field5 = 12;
                request()
                  .post('/api/v1/collections/my_route_id1/relationships/donnees')
                  .send({
                    access_token: TestHelper.getAccessToken(),
                    data: {
                      id: "hqgkvcbekhjfbld",
                      type: "donnees",
                      attributes: attributes
                    }
                  })
                  .end(function (err, res) {
                    if (err)
                      return done(err);
                    TestHelper.checkResponse(res, {status: 200});

                    // get from database
                    DataModel.io.findOne({dataId: "hqgkvcbekhjfbld"}, function(err, newObj) {
                      if (err)
                        done(err);
                      newObj.dataId.should.eq("hqgkvcbekhjfbld");
                      newObj.data.should.eql(attributes);
                      done();
                    });
                  });
              });
            });
        });
      });


    });

  });
  
  

});
