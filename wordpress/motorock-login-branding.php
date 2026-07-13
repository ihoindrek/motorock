<?php
/**
 * Plugin Name: Motorock Login Branding
 * Description: Custom logo and styling on wp-login.php for shop.motorock.eu.
 * Version: 1.1.0
 *
 * Install: copy to wp-content/mu-plugins/motorock-login-branding.php
 */

defined( 'ABSPATH' ) || exit;

function motorock_login_storefront_url() {
	if ( function_exists( 'motorock_get_storefront_url' ) ) {
		return motorock_get_storefront_url();
	}

	if ( defined( 'MOTOROCK_STOREFRONT_URL' ) && MOTOROCK_STOREFRONT_URL ) {
		return rtrim( MOTOROCK_STOREFRONT_URL, '/' );
	}

	$env = getenv( 'MOTOROCK_STOREFRONT_URL' );
	if ( $env ) {
		return rtrim( $env, '/' );
	}

	return 'https://motorock.eu';
}

function motorock_login_logo_url() {
	return motorock_login_storefront_url() . '/logo.png';
}

add_action(
	'login_enqueue_scripts',
	function () {
		wp_enqueue_style(
			'motorock-login-fonts',
			'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Racing+Sans+One&display=swap',
			array(),
			null
		);

		$logo_url = esc_url( motorock_login_logo_url() );
		?>
		<style>
			:root {
				--motorock-ink: #0b0b0b;
				--motorock-paper: #faf8f6;
				--motorock-surface: #f0ece6;
				--motorock-accent: #ff6813;
				--motorock-accent-hover: #e65e12;
				--motorock-ink-10: rgb(11 11 11 / 0.1);
				--motorock-ink-15: rgb(11 11 11 / 0.15);
				--motorock-ink-60: rgb(11 11 11 / 0.6);
			}

			body.login {
				position: relative;
				min-height: 100vh;
				background: var(--motorock-paper);
				color: var(--motorock-ink);
				font-family: "Plus Jakarta Sans", system-ui, sans-serif;
				-webkit-font-smoothing: antialiased;
				-moz-osx-font-smoothing: grayscale;
			}

			body.login::before {
				content: "";
				position: fixed;
				inset: 0;
				z-index: 0;
				pointer-events: none;
				opacity: 0.045;
				mix-blend-mode: multiply;
				background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
				background-repeat: repeat;
				background-size: 160px 160px;
			}

			body.login::after {
				content: "";
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				height: 3px;
				z-index: 2;
				background: var(--motorock-accent);
			}

			body.login #login,
			body.login #language-switcher {
				position: relative;
				z-index: 1;
			}

			#login {
				width: min(100%, 26rem);
				padding: 6vh 1.25rem 2rem;
				margin: 0 auto;
			}

			#login h1 {
				margin-bottom: 1.75rem;
			}

			#login h1 a {
				background-image: url('<?php echo $logo_url; ?>');
				background-size: contain;
				background-position: center;
				background-repeat: no-repeat;
				width: 260px;
				height: 81px;
				margin: 0 auto;
				transition: opacity 0.2s ease;
			}

			#login h1 a:hover,
			#login h1 a:focus {
				opacity: 0.85;
				box-shadow: none;
			}

			.login form {
				margin-top: 0;
				padding: 1.75rem 1.5rem 1.5rem;
				border: 1px solid var(--motorock-ink-10);
				border-top: 3px solid var(--motorock-accent);
				border-radius: 0;
				background: #fff;
				box-shadow: 0 18px 48px rgb(11 11 11 / 0.08);
			}

			.login form::before {
				content: "Shop admin";
				display: block;
				margin-bottom: 1.25rem;
				font-family: "Plus Jakarta Sans", system-ui, sans-serif;
				font-size: 0.6875rem;
				font-weight: 700;
				letter-spacing: 0.08em;
				line-height: 1;
				text-transform: uppercase;
				color: var(--motorock-accent);
			}

			.login label {
				font-size: 0.6875rem;
				font-weight: 700;
				letter-spacing: 0.08em;
				text-transform: uppercase;
				color: var(--motorock-ink-60);
			}

			.login form .input,
			.login input[type="text"],
			.login input[type="password"],
			.login input[type="email"] {
				margin-top: 0.35rem;
				margin-bottom: 1rem;
				padding: 0.8rem 1rem;
				border: 1px solid var(--motorock-ink-15);
				border-radius: 0;
				background: var(--motorock-paper);
				color: var(--motorock-ink);
				font-family: inherit;
				font-size: 1rem;
				line-height: 1.4;
				box-shadow: none;
				transition: border-color 0.2s ease, background-color 0.2s ease;
			}

			.login form .input:focus,
			.login input[type="text"]:focus,
			.login input[type="password"]:focus,
			.login input[type="email"]:focus {
				border-color: var(--motorock-accent);
				background: #fff;
				box-shadow: none;
				outline: 2px solid rgb(255 104 19 / 0.2);
				outline-offset: 0;
			}

			.login .button.wp-hide-pw {
				border: 0;
				border-radius: 0;
				background: transparent;
				color: var(--motorock-ink-60);
				box-shadow: none;
			}

			.login .button.wp-hide-pw:hover,
			.login .button.wp-hide-pw:focus {
				color: var(--motorock-accent);
				background: transparent;
				box-shadow: none;
			}

			.login .forgetmenot {
				margin-bottom: 0.75rem;
			}

			.login .forgetmenot label {
				font-size: 0.8125rem;
				font-weight: 600;
				letter-spacing: 0;
				text-transform: none;
				color: var(--motorock-ink-60);
			}

			.login input[type="checkbox"] {
				accent-color: var(--motorock-accent);
			}

			.login .submit .button.button-primary,
			.login .submit .button.button-primary:hover,
			.login .submit .button.button-primary:focus,
			.login .submit .button.button-primary:active {
				float: none;
				width: 100%;
				height: auto;
				margin-top: 0.25rem;
				padding: 0.9rem 1.5rem;
				border: 0;
				border-radius: 0;
				background: var(--motorock-accent);
				color: var(--motorock-paper);
				font-family: inherit;
				font-size: 0.6875rem;
				font-weight: 700;
				letter-spacing: 0.08em;
				line-height: 1;
				text-transform: uppercase;
				text-shadow: none;
				box-shadow: none;
				transition: background-color 0.2s ease, transform 0.15s ease;
			}

			.login .submit .button.button-primary:hover,
			.login .submit .button.button-primary:focus {
				background: var(--motorock-accent-hover);
				border-color: transparent;
			}

			.login .submit .button.button-primary:active {
				transform: scale(0.98);
			}

			.login .submit {
				margin-top: 0.5rem;
			}

			.login #nav,
			.login #backtoblog {
				padding: 0;
				margin: 1rem 0 0;
				text-align: center;
			}

			.login #nav a,
			.login #backtoblog a,
			.login .privacy-policy-page-link a,
			#language-switcher a {
				color: var(--motorock-ink-60);
				font-size: 0.8125rem;
				font-weight: 600;
				text-decoration: none;
				transition: color 0.2s ease;
			}

			.login #nav a:hover,
			.login #nav a:focus,
			.login #backtoblog a:hover,
			.login #backtoblog a:focus,
			.login .privacy-policy-page-link a:hover,
			.login .privacy-policy-page-link a:focus,
			#language-switcher a:hover,
			#language-switcher a:focus {
				color: var(--motorock-accent);
			}

			.login .message,
			.login .success,
			.login #login_error {
				margin-bottom: 1rem;
				padding: 0.9rem 1rem;
				border-left: 3px solid var(--motorock-accent);
				border-radius: 0;
				background: #fff;
				box-shadow: 0 8px 24px rgb(11 11 11 / 0.06);
				font-size: 0.875rem;
			}

			.login #login_error {
				border-left-color: #c0392b;
			}

			.login .privacy-policy-page-link {
				margin: 0.75rem 0 0;
				text-align: center;
			}

			#language-switcher {
				margin-top: 1.25rem;
				text-align: center;
			}

			#language-switcher form {
				display: inline-flex;
				align-items: center;
				gap: 0.5rem;
				padding: 0;
				border: 0;
				background: transparent;
				box-shadow: none;
			}

			#language-switcher form::before {
				content: none;
			}

			#language-switcher select {
				padding: 0.45rem 0.65rem;
				border: 1px solid var(--motorock-ink-15);
				border-radius: 0;
				background: #fff;
				color: var(--motorock-ink);
				font-family: inherit;
				font-size: 0.8125rem;
			}

			#language-switcher .button {
				padding: 0.45rem 0.9rem;
				border: 1px solid var(--motorock-ink-15);
				border-radius: 0;
				background: transparent;
				color: var(--motorock-ink);
				font-family: inherit;
				font-size: 0.6875rem;
				font-weight: 700;
				letter-spacing: 0.08em;
				text-transform: uppercase;
				box-shadow: none;
			}

			#language-switcher .button:hover,
			#language-switcher .button:focus {
				border-color: var(--motorock-accent);
				color: var(--motorock-accent);
				background: transparent;
			}

			.login .g-recaptcha,
			.login .gglcptch,
			.login [class*="captcha"],
			.login [class*="recaptcha"] {
				margin: 0.5rem 0 1rem;
			}

			@media (max-width: 480px) {
				#login {
					padding-top: 4.5vh;
				}

				#login h1 a {
					width: 220px;
					height: 68px;
				}

				.login form {
					padding: 1.35rem 1.1rem 1.2rem;
				}
			}
		</style>
		<?php
	}
);

add_filter(
	'login_headerurl',
	function () {
		return motorock_login_storefront_url();
	}
);

add_filter(
	'login_headertext',
	function () {
		return 'Motorock.eu';
	}
);
