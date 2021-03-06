require('dotenv').config()
const { env: { TEST_DB_URL} } = process
const { expect } = require('chai')
const retrieveComments = require('.')
const { random, floor } = Math
const { errors: { NotFoundError, ContentError} } = require('avarus-util')
const { ObjectId, database, models: { User, Company, Stock, Transaction, Comment } } = require('avarus-data')
const bcrypt = require('bcryptjs')

describe('logic - retrieve comments', () => {

    before(() => database.connect(TEST_DB_URL))

    let userId, companyId, stockId, operation, buyInTransactionId, quantity
    let userId1, email1, username1, password1, verifiedPassword1, budget1

    let email, username, password, verifiedPassword, budget
    let companyname, description, risk, market, category, dependency, stocks, image 

    let risks = ['adverse', 'neutral', 'seek']
    let markets = ['bear','bull', 'neutral']
    let categories = ['tech', 'food', 'banking', 'sports', 'gaming', 'fashion']
    let body = 'this is a comment'
    
    
        beforeEach(async () => {

            await Promise.all([User.deleteMany(), Company.deleteMany(), Stock.deleteMany(), Transaction.deleteMany()])

            email = `email-${random()}@mail.com`
            username = `username-${random()}`
            password = verifiedPassword = `password-${random()}`
            budget = 5000
            transactions = []

            const user = await User.create({  email, username, password: await bcrypt.hash(password, 10), verifiedPassword, budget, transactions})

            userId = user.id
            await user.save()

            email1 = `email1-${random()}@mail.com`
            username1 = `username1-${random()}`
            password1 = verifiedPassword1 = `password1-${random()}`
            budget1 = 5000
            transactions1 = []

            const user1 = await User.create({  email1, username1, password1: await bcrypt.hash(password1, 10), verifiedPassword1, budget1, transactions1})

            userId1 = user1.id
            await user1.save()

            companyname = `name-${random()}`
            description = `description-${random()}`
            risk = risks[floor(random() * risks.length)]
            market = markets[floor(random() * markets.length)]
            category = categories[floor(random() * categories.length)]        
            dependency = [`dependency ${random()}`]
            image = `image ${random()}`
            stocks = []
            const company = await Company.create({name: companyname, description, risk, market, category, dependency, image, stocks})
            companyId = company.id
            price = floor(random() *10)
            stockTime = new Date
            const stock = await Stock.create({price: price, time:stockTime})
            
            stockId = stock.id
            company.stocks.push(stock)
            await company.save()
            operation = 'buy-in'
            quantity = floor(random()*10) + 6
            amount = price * quantity
            transactionTime = new Date
        
            const transaction = await Transaction.create({company: companyId, stock:stockId, user:userId, operation, quantity, amount, time:transactionTime})

            buyInTransactionId = transaction.id

            await transaction.save()

            const comment = await Comment.create({user: userId, transaction: buyInTransactionId, body, date: new Date}) 
            await comment.save()

            const comment1 = await Comment.create({user: userId, transaction: buyInTransactionId, body, date: new Date}) 

            await comment1.save()

            const comment2 = await Comment.create({user: userId1, transaction: buyInTransactionId, body, date: new Date}) 

            await comment2.save()

        })
    
        it('should create successfully a comment with correct information', async () => {
            
            const newComments = await retrieveComments(userId, buyInTransactionId)
            
            expect(newComments).to.exist
            expect(newComments).to.be.a('array')

            newComments.forEach(newComment => {

                
                expect(newComment.user).to.be.a('object')
                expect(newComment.user.toString()).to.eql(userId)
                expect(newComment.transaction).to.be.a('object')
                expect(newComment.transaction.toString()).to.eql(buyInTransactionId)
                expect(newComment.body).to.be.a('string')
                expect(newComment.body).to.eql(body)
                expect(newComment.date).to.be.an.instanceOf(Date)

            })


        })

        it('should failed to create a new comment with wrong user id', async () => {

            const wrongUserId = ObjectId().toString()

            try {
                await retrieveComments(wrongUserId, buyInTransactionId)

                throw Error(`should not reach this point`)

            } catch(error){
                expect(error).to.exist
                expect(error.message).to.exist
                expect(typeof error.message).to.equal('string')
                expect(error.message.length).to.be.greaterThan(0)
                expect(error.message).to.equal(`user with id ${wrongUserId} does not exists`)
                expect(error).to.be.an.instanceOf(NotFoundError)

            }
        
        })


        it('should failed to create a new comment with wrong transaction id', async () => {

            const wrongBuyInTransactionId = ObjectId().toString()

            try {
                await retrieveComments(userId, wrongBuyInTransactionId)

                throw Error(`should not reach this point`)

            } catch(error){
                expect(error).to.exist
                expect(error.message).to.exist
                expect(typeof error.message).to.equal('string')
                expect(error.message.length).to.be.greaterThan(0)
                expect(error.message).to.equal(`transaction with id ${wrongBuyInTransactionId} does not exists`)
                expect(error).to.be.an.instanceOf(NotFoundError)

            }
        
        })

        
    it('should fail on incorrect userId, companyId, transactionId or expression type and content', () => {

        
        expect(() => retrieveComments(1)).to.throw(TypeError, '1 is not a string')
        expect(() => retrieveComments(true)).to.throw(TypeError, 'true is not a string')
        expect(() => retrieveComments([])).to.throw(TypeError, ' is not a string')
        expect(() => retrieveComments({})).to.throw(TypeError, '[object Object] is not a string')
        expect(() => retrieveComments(undefined)).to.throw(TypeError, 'undefined is not a string')
        expect(() => retrieveComments(null)).to.throw(TypeError, 'null is not a string')
        expect(() => retrieveComments('')).to.throw(ContentError, 'userId is empty or blank')
        expect(() => retrieveComments(' \t\r')).to.throw(ContentError, 'userId is empty or blank')

        expect(() => retrieveComments(userId, 1)).to.throw(TypeError, '1 is not a string')
        expect(() => retrieveComments(userId, true)).to.throw(TypeError, 'true is not a string')
        expect(() => retrieveComments(userId, [])).to.throw(TypeError, ' is not a string')
        expect(() => retrieveComments(userId, {})).to.throw(TypeError, '[object Object] is not a string')
        expect(() => retrieveComments(userId, undefined)).to.throw(TypeError, 'undefined is not a string')
        expect(() => retrieveComments(userId, null)).to.throw(TypeError, 'null is not a string')
        expect(() => retrieveComments(userId, '')).to.throw(ContentError, 'transactionId is empty or blank')
        expect(() => retrieveComments(userId, ' \t\r')).to.throw(ContentError, 'transactionId is empty or blank')

    })

        after(() => Promise.all([User.deleteMany(), Company.deleteMany(), Stock.deleteMany(), Transaction.deleteMany(), Comment.deleteMany()])
        .then(database.disconnect))
})