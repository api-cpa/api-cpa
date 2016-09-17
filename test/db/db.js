'use strict';

module.exports = {
  USERS: [{
    firstname: 'Firstname',
    lastname: 'Lastname',
    email: 'apicpa@apicpa.apicpa',
    password: 'password10'
  },{
    firstname: 'secondaryFirstname',
    lastname: 'secondaryLastname',
    email: 'secondaryapicpa@apicpa.apicpa',
    password: 'secondarypassword10'
  }],
  SERVICES: [{
    CREATOR_INDEX: 0,
    USERS_INDEX: [0, 1],
    name: 'Test',
    nameNormalized: 'test',
    description: 'Description',
    public: true,
    users: [],
    clientSecret: 'my_client_secret',
    clientId: 'my_client_id',
    validated: true,
    ROUTES: [{
      name: 'Collection1',
      nameNormalized: 'collection1',
      description: 'description',
      routeId: 'my_route_id1',
      public: true,
      isIdentified: false,
      isCollection: false,
      FIELDS: [{
        name: 'Field1',
        nameNormalized: 'field1',
        required: true,
        fieldId: 'my_field_id1',
        type: 'STRING'
      }, {
        name: 'Field2',
        nameNormalized: 'field2',
        required: true,
        fieldId: 'my_field_id2',
        type: 'STRING'
      }],
      DATAS: [{
        dataId: 'my_data_id1',
        data: {
          field1: 'first string',
          field2: 'second string'
        }
      }]
    }]
  }]
}