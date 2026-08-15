/**
 * Colossal Share Buttons — Copy to Clipboard
 */
( function () {
	'use strict';

	document.addEventListener( 'DOMContentLoaded', function () {
		var buttons = document.querySelectorAll( '.colossal-share-button__copy' );

		buttons.forEach( function ( button ) {
			button.addEventListener( 'click', function () {
				var url       = button.getAttribute( 'data-url' );
				var labelSpan = button.querySelector( '.colossal-share-button__label' );
				var labelCopied  = button.getAttribute( 'data-label-copied' );
				var labelDefault = button.getAttribute( 'data-label-default' );
				var ariaCopied   = button.getAttribute( 'data-aria-copied' );
				var ariaDefault  = button.getAttribute( 'data-aria-default' );

				if ( ! url || ! labelSpan ) {
					return;
				}

				function onSuccess() {
					labelSpan.textContent = labelCopied;
					button.setAttribute( 'aria-label', ariaCopied );
					button.classList.add( 'is-copied' );
					setTimeout( function () {
						labelSpan.textContent = labelDefault;
						button.setAttribute( 'aria-label', ariaDefault );
						button.classList.remove( 'is-copied' );
					}, 4000 );
				}

				function onFail() {
					// Silent fail — button just doesn't respond
					// rather than showing a broken state.
					console.warn( 'Colossal Share Buttons: clipboard write failed.' );
				}

				if ( navigator.clipboard && navigator.clipboard.writeText ) {
					navigator.clipboard.writeText( url ).then( onSuccess ).catch( function () {
						// Fallback for clipboard API permission denied.
						try {
							var temp = document.createElement( 'textarea' );
							temp.value = url;
							temp.setAttribute( 'readonly', '' );
							temp.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
							document.body.appendChild( temp );
							temp.focus();
							temp.select();
							document.execCommand( 'copy' );
							document.body.removeChild( temp );
							onSuccess();
						} catch ( e ) {
							onFail();
						}
					} );
				} else {
					// Fallback for browsers without clipboard API.
					try {
						var temp = document.createElement( 'textarea' );
						temp.value = url;
						temp.setAttribute( 'readonly', '' );
						temp.style.cssText = 'position:absolute;left:-9999px;top:-9999px';
						document.body.appendChild( temp );
						temp.focus();
						temp.select();
						document.execCommand( 'copy' );
						document.body.removeChild( temp );
						onSuccess();
					} catch ( e ) {
						onFail();
					}
				}
			} );
		} );
	} );
} )();