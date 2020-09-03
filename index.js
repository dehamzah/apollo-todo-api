const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { combineResolvers } = require('graphql-resolvers');


const TODOS = require('./data/todos.json');
const CURRENT_USER = require('./data/current_user.json');
const isAuthenticated = require('./isAuthenticated');

const USER_DEMO = {
  phoneNumber: "089876554321",
  password: "321"
}
const TOKEN = '234';
 
// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    todoList: [Todo]!
  }

  type Todo {
    id: ID!
    title: String
    isDone: Boolean
  }

  type Mutation {
    login(
      phoneNumber: String!
      password: String!
    ): LoginResponse

    todoAdd(
      input: TodoInput!
    ): Todo

    todoUpdate(
      id: ID!
      input: TodoInput!
    ): Todo

    todoDelete(
      id: ID!
    ): Todo
  }

  input TodoInput {
    title: String!
    isDone: Boolean!
  }

  type LoginResponse {
    user: User
    token: String
  }

  type User {
    id: ID!
    firstName: String
    lastName: String
    phoneNumber: String
    status: String
  }
`;
 
// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    todoList: combineResolvers(
      isAuthenticated,
      () => {
        return TODOS;
      },
    )
  },
  Mutation: {
    login: (parent, args, context) => {
      if (args.password !== USER_DEMO.password) {
        throw new Error('Nomor telepon atau password salah');
      }

      return {
        user: CURRENT_USER,
        token: TOKEN
      }
    },
    todoAdd: combineResolvers(
      isAuthenticated,
      (parent, args, context) => {
        const {title, isDone} = args.input;

        const id = TODOS.length + 1;
        const newTodo = {id, title, isDone};
        

        TODOS.push(newTodo);
        
        return newTodo;
      }
    ),
    todoUpdate: combineResolvers(
      isAuthenticated,
      (parent, args, context) => {
        const id = args.id;
        const {title, isDone} = args.input;

        const todoIndex = TODOS.findIndex(todo => todo.id == id);

        TODOS.splice(todoIndex, 1);
       
        const newTodo = {id, title, isDone};
        TODOS.push(newTodo);
        
        return newTodo;
      }
    ),
    todoDelete: combineResolvers(
      isAuthenticated,
      (parent, args, context) => {
        const id = args.id;

        const todoIndex = TODOS.findIndex(todo => todo.id == id);
        if (todoIndex < 0) {
          throw new Error('Item tidak ditemukan');
        }

        const deletedTodo = JSON.parse(JSON.stringify(TODOS[todoIndex]));


        TODOS.splice(todoIndex, 1);
      
        
        return deletedTodo;
      }
    ),
  }
};
 
const server = new ApolloServer({ typeDefs, resolvers, context: async({req}) => {
  let currentUser = null;

  if (req.headers.authorization === TOKEN) {
    currentUser = USER_DEMO
  }

  return {
    currentUser
  }
}});
 
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

server.applyMiddleware({ app });
 
app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
