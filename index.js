import { gql, ApolloServer, UserInputError } from "apollo-server"
import { v1 as uuid } from 'uuid'
import axios from 'axios'

const typeDefs = gql`
    enum YesNo {
        YES
        NO
    }

    type Address {
        street: String!
        city: String!
    }

    type Person {
        name: String!
        phone: String
        address: Address!
        id: ID!
    }

    type Query {
        personCount: Int!
        allPersons(phone: YesNo): [Person]!
        findPersons(name: String!): Person
    }

    type Mutation {
        addPerson(
            name: String!
            phone: String
            street: String!
            city: String!
        ): Person
        editNumber(
            name: String!
            phone: String!
        ): Person
    }
`


const resolvers = {
    Query: {
        personCount: () => persons.length,
        allPersons: async (root, args) => {
            const { data: personsFromRestApi } =  await axios.get('http://localhost:3000/persons')
            console.log({personsFromRestApi})
            if (!args.phone) return persons

            const byPhone = person =>
                args.phone === "YES" ? person.phone : !person.phone

            return persons.filter(byPhone)
        },
        findPersons: (root, args) => {
            const { name } = args
            return persons.find((person) => person.name == name)
        },
    },
    Mutation: {
        addPerson: (root, args) => {
            if (persons.find(person => person.name === args.name)) {
                throw new UserInputError('Name must be unique', {
                    invalidArgs: args.name
                })
            }
            const person = {...args, id: uuid()}
            persons.push(person) // update database with new person
            return person
        },
        editNumber: (root, args) => {
            const personIndex = persons.findIndex(person => person.name === args.name)

            if (personIndex === -1) return null

            persons[personIndex] = { ...persons[personIndex], phone: args.phone }
            return persons[personIndex]
        }
    },
    Person: {
        address: (root) => ({
            street: root.street,
            city: root.city
        })
    }
}


const server = new ApolloServer({
    typeDefs,
    resolvers
})


server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
})