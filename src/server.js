// For .env files
require( 'dotenv' ).config();

// Modules
const express = require( 'express' );
const path = require( 'path' )
const parser = require( 'body-parser' );
const dns = require( 'dns' );
const { MongoClient, ServerApiVersion } = require( 'mongodb' );
const { urlencoded } = require('body-parser');
const nanoid = require('nanoid');

const database_adress = process.env.DATABASE;

// Middleware
const app = express();
app.use( urlencoded( {extended: false } ) );
app.use( parser.json() );

app.use( express.static( path.join( __dirname, 'public' ) ) );

const client = new MongoClient( database_adress, { useNewUrlParser: true, useUnifiedTopology: true, 
                                                        serverApi: ServerApiVersion.v1 } );

client.connect().then( client => {
    app.locals.db = client.db( 'shortener' );

    client.close();
} )
.catch( () => console.error('Failed to connect to the database' ) );                                                     
     
// Function to shorten URL
const shorten = ( database, url ) => {
    const shortenedURLs = database.collection( 'shortenedURLs' );
    
    return shortenedURLs.findOneAndUpdate( { original_url: url } ),

        {
            $setOnInsert: {
                original_url: url,
                shortened: nanoid(7),
            },
        },
        {
            returnOriginal: false,
            upsert: true,
        }
};

// Function to check if URL is fine
const checkShorten = ( database, code ) => database.collection( 'shortenedURLs' )
    .findOne( {shortened: code } );

// Select frontend to use
app.get( '/', ( requirement, result ) => {
    const html_path = path.join( __dirname, 'public', 'index.html' );
    frontend.sendFile( html_path );
} );

// Shorten URL
app.post( '/new', ( requirement, answer ) => {
    let givenURL;

    try {
        givenURL = new URL( requirement.body.url );
    }
    catch ( error ) {
        return answer.status( 400 ).send( { error: 'invalid URL' } );
    }

    dns.lookup( givenURL.hostname, ( error ) => {
        if ( error ) {
            return answer.status( 400 ).send( { error: 'Address not found' } );
        };

        const { database } = requirement.app.locals;
        shorten( database, givenURL.href )
            .then( result => {
                const doc = result.value;
                answer.json( {
                    original_url: doc.original_url,
                    shortened: doc.shortened,
                })
            } )
            .catch( console.error );
    } );
} );

// Check if URL is fine
app.get( '/:shortened', ( requirement, result ) => {
    const shortID = requirement.params.shortened;

    const { database } = requirement.app.locals;

    checkShorten( database, shortID ).then( doc => {
        if ( doc === null ) return result.send( 'We could not find a link at that URL');

        result.redirect( doc.original_url );
    } )
    .catch( console.error );
} );

// Set port
app.set( 'port', process.env.PORT || 5500 );

const server = app.listen( app.get( 'port' ), () => {
    console.log( 'Express running on PORT ${server.adress().port}' );
} );

