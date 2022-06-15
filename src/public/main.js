// Variables for input and result
const query = document.querySelector( '.url-form' );
const shortened = document.querySelector( '.result-section' );

// Event Listener for submit button
query.addEventListener( 'submit', event => {
    event.preventDefault();

    const input = document.querySelector( '.user-input' );
    fetch( '/new', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( {
            url: input.value,
        } )
    } )

        .then( response => {
            if ( !response.ok ) {
                throw Error( response.statusText );
            }

            return response.json();
        })

        .then( data => {
            while ( shortened.hasChildNodes() ) {
                shortened.removeChild( shortened.lastChild );
            }

            // Short URL
            shortened.insertAdjacentHTML( 'afterbegin', `
                <div class="result">
                    <a target="_blank" class="short-url" rel="noopener" href="/${data.short_id}">
                        ${location.origin}/${data.short_id}
                    </a>
                </div>
            `)
        })
        .catch( console.error );
} );