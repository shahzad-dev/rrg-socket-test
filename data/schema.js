/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
  fromGlobalId,
  globalIdField,
  mutationWithClientMutationId,
  nodeDefinitions,
} from 'graphql-relay';

import {
  // Import methods that your schema can use to interact with your database
  User,
  Widget,
  getUser,
  getViewer,
  getWidget,
  getWidgets,
} from './database';

/**
 * We get the node interface and field from the Relay library.
 *
 * The first method defines the way we resolve an ID to its object.
 * The second defines the way we resolve an object to its GraphQL type.
 */
var {nodeInterface, nodeField} = nodeDefinitions(
  (globalId) => {
    var {type, id} = fromGlobalId(globalId);
    if (type === 'User') {
      return getUser(id);
    } else if (type === 'Widget') {
      return getWidget(id);
    } else {
      return null;
    }
  },
  (obj) => {
    if (obj instanceof User) {
      return userType;
    } else if (obj instanceof Widget)  {
      return widgetType;
    } else if (obj instanceof Address)  {
      return addressType;
    } else {
      return null;
    }
  }
);

/**
 * Define your own types here
 */
var faction = {
    addresses: [{
            address_1: '123 Blah Street',
            address_2: '',
            city: 'Toronto',
            postal_code: 'M1X B1Z',
        },{
            address_1: '345 Blah Street',
            address_2: '',
            city: 'Houston',
            postal_code: '233441',
        }
    ],
    hobbies: [
      { id:"1", title:"Cricket" },
      { id:"2", title: "Reading" },
      { id:"3", title: "Traveling" }
    ]
}

/**
*  Types
*/

var widgetType = new GraphQLObjectType({
  name: 'Widget',
  description: 'A shiny widget',
  fields: () => ({
    id: globalIdField('Widget'),
    name: {
      type: GraphQLString,
      description: 'The name of the widget',
    },
  }),
  interfaces: [nodeInterface],
});

var addressType = new GraphQLObjectType({
  name: 'Address',
  description: 'A user address',
  fields: () => ({
    id: globalIdField('Widget'),
    address_1: {
      type: GraphQLString,
      description: 'Street Address 1',
    },
    address_2: {
      type: GraphQLString,
      description: 'Street Address 2',
    },
    city: {
      type: GraphQLString,
      description: 'City',
    },
    postal_code: {
      type: GraphQLString,
      description: 'Postal Code',
    },
  }),
  interfaces: [nodeInterface],
});

var hobbyType = new GraphQLObjectType({
  name: 'Hobbies',
  description: 'A user hobbies',
  fields: () => ({
    id: globalIdField('Widget'),
    title: {
      type: GraphQLString,
      description: 'Hobby Type',
    },
  }),
  interfaces: [nodeInterface],
});


/**
 * Define your own connection types here
 */

var {connectionType: addressConnection} =
   connectionDefinitions({name: 'Address', nodeType: addressType});

var {connectionType: widgetConnection} =
  connectionDefinitions({name: 'Widget', nodeType: widgetType});

var {connectionType: hobbyConnection} =
  connectionDefinitions({name: 'Hobby', nodeType: hobbyType});


var userType = new GraphQLObjectType({
  name: 'User',
  description: 'A person who uses our app',
  fields: () => ({
    id: globalIdField('User'),
    widgets: {
      type: widgetConnection,
      description: 'A person\'s collection of widgets',
      args: connectionArgs,
      resolve: (_, args) => connectionFromArray(getWidgets(), args),
    },
    addresses: {
        type: addressConnection,
        description: 'A person\'s addresses',
        args: connectionArgs,
        resolve: (_, args) => connectionFromArray(
            faction.addresses.map((address) => address),
            args
        ),
    },
    hobbies: {
        type: hobbyConnection,
        description: 'A person\'s hobbies',
        args: {
          status: {
            type: GraphQLString,
            defaultValue: 'any',
          },
          ...connectionArgs,
        },
        resolve: (obj,
            {status, ...args},
            context,
            {rootValue: objectManager}
          ) => {
              //console.log( "Root", obj, "Status", status, "Args", args, "Context", context);
              return connectionFromArray(
                  faction.hobbies.map((hobby) => hobby),
                  args
              )
            },
      }
  }),
  interfaces: [nodeInterface],
});


/**
 * This is the type that will be the root of our query,
 * and the entry point into our schema.
 */
var queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    node: nodeField,
    // Add your own root fields here
    viewer: {
      type: userType,
      resolve: () => getViewer(),
    },
  }),
});

/**
 * This is the type that will be the root of our mutations,
 * and the entry point into performing writes in our schema.
 */

 /**
 * This will return a GraphQLFieldConfig for our ship
 * mutation.
 *
 * It creates these two types implicitly:
 *   input IntroduceShipInput {
 *     clientMutationId: string
 *     shipName: string!
 *     factionId: ID!
 *   }
 *
 *   type IntroduceShipPayload {
 *     clientMutationId: string
 *     ship: Ship
 *     faction: Faction
 *   }
 */
 function createAddress(values){
     var addressId = faction.addresses.push(values)  - 1;
     return { addressId };
 }

const addressAddMutation = mutationWithClientMutationId({
  name: 'InsertAddress',
  inputFields: {
    address_1: {
      type: new GraphQLNonNull(GraphQLString)
    },
    address_2: {
      type: new GraphQLNonNull(GraphQLString)
    },
    city: {
      type: new GraphQLNonNull(GraphQLString)
    },
    postal_code: {
      type: new GraphQLNonNull(GraphQLString)
    },
  },
  outputFields: {
    address: {
      type: addressType,
      resolve: payload => faction.addresses[payload.addressId],
    }
  },
  mutateAndGetPayload: (args) => {
    return createAddress(args);
  }
});

function addHobby(values){
    var hobbyId = faction.hobbies.push(values)  - 1;
    return { hobbyId };
}
const hobbyAddMutation = mutationWithClientMutationId({
  name: 'InsertHobby',
  inputFields: {
    id: {
        type: new GraphQLNonNull(GraphQLInt)
    },
    title: {
      type: new GraphQLNonNull(GraphQLString)
    },
  },
  outputFields: {
    hobby: {
      type: hobbyType,
      resolve: ({hobbyId}) => {
        var hobby = faction.hobbies[payload.hobbyId];
        return {
          cursor: cursorForObjectInConnection(faction.hobbies, hobby),
          node: hobby,
        };
      },
    },
    viewer: {
      type: userType,
      resolve: () => getUser('1') //VERY IMPORTANT OTHERWISE FRONTEND Component WILL NOT REFRESH
    }
  },
  mutateAndGetPayload: (args) => {
    return addHobby(args);
  }
});

var mutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    insertAddress: addressAddMutation,
    insertHobby: hobbyAddMutation,
  })
});

/**
 * Finally, we construct our schema (whose starting query type is the query
 * type we defined above) and export it.
 */
export var Schema = new GraphQLSchema({
  query: queryType,
  // Uncomment the following after adding some mutation fields:
  mutation: mutationType
});
